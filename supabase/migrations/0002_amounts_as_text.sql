-- Return the reward as text so API clients never round 18-decimal amounts through a float.
drop function public.record_referral(bigint, text, text, text, text, text, int, int);

create or replace function public.record_referral(
  p_campaign_id  bigint,
  p_kind         text,
  p_ref_code     text,
  p_visitor      text,
  p_ip_hash      text,
  p_device_hash  text,
  p_ip_limit     int,
  p_device_limit int
) returns table (status text, reward text)
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
    return query select 'bad_kind'::text, '0'::text; return;
  end if;

  select u.address into v_referrer from public.users u where u.ref_code = p_ref_code;
  if v_referrer is null then
    return query select 'bad_ref'::text, '0'::text; return;
  end if;
  if v_referrer = p_visitor then
    return query select 'self'::text, '0'::text; return;
  end if;

  -- serialize all counting for this campaign so the pool can never be overspent
  select * into v_c from public.campaigns c where c.id = p_campaign_id for update;
  if not found then
    return query select 'no_campaign'::text, '0'::text; return;
  end if;
  if v_c.closed or now() < v_c.starts_at or now() >= v_c.ends_at then
    return query select 'inactive'::text, '0'::text; return;
  end if;

  if exists (select 1 from public.referral_events e
             where e.campaign_id = p_campaign_id and e.kind = p_kind and e.visitor = p_visitor) then
    return query select 'duplicate'::text, '0'::text; return;
  end if;
  if (select count(*) from public.referral_events e
      where e.campaign_id = p_campaign_id and e.kind = p_kind and e.ip_hash = p_ip_hash) >= p_ip_limit then
    return query select 'ip_limit'::text, '0'::text; return;
  end if;
  if (select count(*) from public.referral_events e
      where e.campaign_id = p_campaign_id and e.kind = p_kind and e.device_hash = p_device_hash) >= p_device_limit then
    return query select 'device_limit'::text, '0'::text; return;
  end if;

  v_reward := case p_kind when 'visit' then v_c.reward_per_visit else v_c.reward_per_click end;
  if v_c.earned + v_reward > v_c.deposit then
    update public.campaigns set exhausted_at = coalesce(exhausted_at, now()) where id = p_campaign_id;
    return query select 'exhausted'::text, '0'::text; return;
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

  return query select 'ok'::text, v_reward::text;
end;
$$;

revoke all on function public.record_referral(bigint, text, text, text, text, text, int, int) from public, anon, authenticated;
grant execute on function public.record_referral(bigint, text, text, text, text, text, int, int) to service_role;
