-- Lets the website's server reach these tables with the publishable key plus a private server key
-- (sent as the x-tp-server-key header). Only the SHA-256 of that key is stored here.
-- Browsers and anyone else using the publishable key still see nothing.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.server_keys (
  key_hash   text primary key,
  created_at timestamptz not null default now()
);
revoke all on private.server_keys from public, anon, authenticated;

create or replace function public.tp_is_server() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.server_keys k
     where k.key_hash = encode(
       extensions.digest(coalesce(current_setting('request.headers', true)::json ->> 'x-tp-server-key', ''), 'sha256'),
       'hex')
  );
$$;
revoke all on function public.tp_is_server() from public;
grant execute on function public.tp_is_server() to anon, authenticated, service_role;

grant select, insert, update, delete on public.users, public.auth_nonces, public.campaigns, public.referral_events to anon;
grant usage, select on sequence public.referral_events_id_seq to anon;
grant select on public.referrer_earnings to anon;

create policy server_only on public.users for all to anon
  using ((select public.tp_is_server())) with check ((select public.tp_is_server()));
create policy server_only on public.auth_nonces for all to anon
  using ((select public.tp_is_server())) with check ((select public.tp_is_server()));
create policy server_only on public.campaigns for all to anon
  using ((select public.tp_is_server())) with check ((select public.tp_is_server()));
create policy server_only on public.referral_events for all to anon
  using ((select public.tp_is_server())) with check ((select public.tp_is_server()));

-- record_referral runs as the caller, so every row it reads or writes goes through the policies above:
-- without the server key it finds no ref code and changes nothing.
grant execute on function public.record_referral(bigint, text, text, text, text, text, int, int) to anon;
