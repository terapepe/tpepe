-- Move the server-key check out of the public API schema (it was reachable as /rpc/tp_is_server).
create or replace function private.is_server() returns boolean
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
revoke all on function private.is_server() from public;
-- policies run as the caller, so the API roles may call the check but still cannot read private.server_keys
grant usage on schema private to anon, authenticated;
grant execute on function private.is_server() to anon, authenticated, service_role;

alter policy server_only on public.users
  using ((select private.is_server())) with check ((select private.is_server()));
alter policy server_only on public.auth_nonces
  using ((select private.is_server())) with check ((select private.is_server()));
alter policy server_only on public.campaigns
  using ((select private.is_server())) with check ((select private.is_server()));
alter policy server_only on public.referral_events
  using ((select private.is_server())) with check ((select private.is_server()));

drop function public.tp_is_server();
