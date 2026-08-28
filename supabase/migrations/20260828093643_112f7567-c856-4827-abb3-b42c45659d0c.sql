-- 1) Retirer tout EXECUTE implicite (PUBLIC) sur toutes les fonctions SECURITY DEFINER du schéma public
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;

-- 2) Fonctions internes / privilégiées : service_role uniquement
grant execute on function public.record_sale(uuid, integer, integer, text) to service_role;
grant execute on function public.settle_transaction(uuid) to service_role;
grant execute on function public.refund_transaction(uuid) to service_role;
grant execute on function public.complete_withdrawal(uuid, text) to service_role;
grant execute on function public.fail_withdrawal(uuid, text) to service_role;
grant execute on function public.update_pwa_build_status(uuid, text, smallint, text, bigint, text, text) to service_role;

-- 3) Fonctions utilisées par les politiques RLS : indispensables aux rôles clients
grant execute on function public.has_role(uuid, public.app_role) to authenticated, anon, service_role;
grant execute on function public.current_developer_id() to authenticated, service_role;

-- 4) RPC applicatives appelées par un utilisateur connecté (contrôles internes propriétaire/admin)
grant execute on function public.become_developer(text, text) to authenticated, service_role;
grant execute on function public.change_plan(text) to authenticated, service_role;
grant execute on function public.developer_balances(uuid) to authenticated, service_role;
grant execute on function public.developer_usage(uuid) to authenticated, service_role;
grant execute on function public.request_withdrawal(integer, text, text) to authenticated, service_role;
grant execute on function public.cancel_withdrawal(uuid) to authenticated, service_role;
grant execute on function public.request_pwa_build(text, text, text, text, uuid, jsonb) to authenticated, service_role;
grant execute on function public.submit_app_version(uuid, text, integer, text, bigint, text, text, uuid, jsonb, text) to authenticated, service_role;
grant execute on function public.admin_review_version(uuid, boolean, text) to authenticated, service_role;
grant execute on function public.record_install(uuid, text, text) to anon, authenticated, service_role;
