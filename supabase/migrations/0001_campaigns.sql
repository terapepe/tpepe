-- TeraPepe share campaigns. All access goes through the server (service role); RLS is on with no
-- policies so the public Data API cannot read or write these tables.

create table public.users (
  address     text primary key check (address = lower(address)),
  ref_code    text not null unique,
  created_at  timestamptz not null default now()
);

create table public.auth_nonces (
  nonce       text primary key,
  address     text not null check (address = lower(address)),
  expires_at  timestamptz not null,
  used_at     timestamptz
);
create index auth_nonces_expires_idx on public.auth_nonces (expires_at);

-- Mirrors TeraPepeCampaigns on Robinhood Chain. id is the on-chain campaign id.
-- Amounts are raw token units (wei).
create table public.campaigns (
  id                 bigint primary key,
  creator            text not null check (creator = lower(creator)),
  deposit            numeric(78, 0) not null check (deposit > 0),
  reward_per_visit   numeric(78, 0) not null check (reward_per_visit > 0),
  reward_per_click   numeric(78, 0) not null check (reward_per_click > 0),
  starts_at          timestamptz not null,
  ends_at            timestamptz not null,
  content            jsonb not null,
  content_hash       text not null,
  create_tx          text not null unique,
  earned             numeric(78, 0) not null default 0 check (earned >= 0 and earned <= deposit),
  exhausted_at       timestamptz,
  closed             boolean not null default false,
  close_tx           text,
  created_at         timestamptz not null default now()
);
create index campaigns_ends_idx on public.campaigns (ends_at) where not closed;

create table public.referral_events (
  id           bigserial primary key,
  campaign_id  bigint not null references public.campaigns (id),
  kind         text not null check (kind in ('visit', 'click')),
  referrer     text not null references public.users (address),
  visitor      text not null references public.users (address),
  ip_hash      text not null,
  device_hash  text not null,
  reward       numeric(78, 0) not null,
  created_at   timestamptz not null default now(),
  unique (campaign_id, kind, visitor),
  check (referrer <> visitor)
);
create index referral_events_referrer_idx on public.referral_events (campaign_id, referrer);
create index referral_events_ip_idx on public.referral_events (campaign_id, kind, ip_hash);
create index referral_events_device_idx on public.referral_events (campaign_id, kind, device_hash);

alter table public.users enable row level security;
alter table public.auth_nonces enable row level security;
alter table public.campaigns enable row level security;
alter table public.referral_events enable row level security;

-- Counts one referral visit or buy-link click, atomically against the campaign's remaining pool.
-- Returns 'ok' with the reward, or the reason it was not counted.
create or replace function public.record_referral(
  p_campaign_id  bigint,
  p_kind         text,
  p_ref_code     text,
  p_visitor      text,
  p_ip_hash      text,
  p_device_hash  text,
  p_ip_limit     int,
  p_device_limit int
) returns table (status text, reward numeric)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_referrer text;
  v_c        public.campaigns%rowtype;
  v_reward   numeric(78, 0);
begin
  if p_kind not in ('visit', 'click') then
    return query select 'bad_kind'::text, 0::numeric; return;
  end if;

  select u.address into v_referrer from public.users u where u.ref_code = p_ref_code;
  if v_referrer is null then
    return query select 'bad_ref'::text, 0::numeric; return;
  end if;
  if v_referrer = p_visitor then
    return query select 'self'::text, 0::numeric; return;
  end if;

  -- serialize all counting for this campaign so the pool can never be overspent
  select * into v_c from public.campaigns c where c.id = p_campaign_id for update;
  if not found then
    return query select 'no_campaign'::text, 0::numeric; return;
  end if;
  if v_c.closed or now() < v_c.starts_at or now() >= v_c.ends_at then
    return query select 'inactive'::text, 0::numeric; return;
  end if;

  if exists (select 1 from public.referral_events e
             where e.campaign_id = p_campaign_id and e.kind = p_kind and e.visitor = p_visitor) then
    return query select 'duplicate'::text, 0::numeric; return;
  end if;
  if (select count(*) from public.referral_events e
      where e.campaign_id = p_campaign_id and e.kind = p_kind and e.ip_hash = p_ip_hash) >= p_ip_limit then
    return query select 'ip_limit'::text, 0::numeric; return;
  end if;
  if (select count(*) from public.referral_events e
      where e.campaign_id = p_campaign_id and e.kind = p_kind and e.device_hash = p_device_hash) >= p_device_limit then
    return query select 'device_limit'::text, 0::numeric; return;
  end if;

  v_reward := case p_kind when 'visit' then v_c.reward_per_visit else v_c.reward_per_click end;
  if v_c.earned + v_reward > v_c.deposit then
    update public.campaigns set exhausted_at = coalesce(exhausted_at, now()) where id = p_campaign_id;
    return query select 'exhausted'::text, 0::numeric; return;
  end if;

  insert into public.referral_events (campaign_id, kind, referrer, visitor, ip_hash, device_hash, reward)
  values (p_campaign_id, p_kind, v_referrer, p_visitor, p_ip_hash, p_device_hash, v_reward);

  update public.campaigns
     set earned = earned + v_reward,
         -- once the pool can no longer pay even the smaller reward, mark it as used up
         exhausted_at = case
           when earned + v_reward + least(reward_per_visit, reward_per_click) > deposit then coalesce(exhausted_at, now())
           else exhausted_at end
   where id = p_campaign_id;

  return query select 'ok'::text, v_reward::numeric;
end;
$$;

-- What each sharer has earned per campaign (cumulative, used for claim vouchers).
create or replace view public.referrer_earnings with (security_invoker = true) as
  select campaign_id, referrer, sum(reward)::numeric(78, 0) as earned, count(*) as events
    from public.referral_events
   group by campaign_id, referrer;

revoke all on function public.record_referral(bigint, text, text, text, text, text, int, int) from public, anon, authenticated;
grant execute on function public.record_referral(bigint, text, text, text, text, text, int, int) to service_role;
revoke all on public.referrer_earnings from anon, authenticated;
