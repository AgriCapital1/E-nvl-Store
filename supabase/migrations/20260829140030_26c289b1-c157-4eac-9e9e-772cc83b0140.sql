CREATE OR REPLACE FUNCTION public.developer_balances(_developer_id uuid)
 RETURNS TABLE(pending bigint, available bigint, withdrawing bigint, withdrawn bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    coalesce(sum(amount_fcfa) filter (where bucket = 'pending'),0)::bigint,
    coalesce(sum(amount_fcfa) filter (where bucket = 'available'),0)::bigint,
    coalesce(sum(amount_fcfa) filter (where bucket = 'withdrawing'),0)::bigint,
    coalesce(sum(amount_fcfa) filter (where bucket = 'withdrawn'),0)::bigint
  from public.wallet_ledger
  where developer_id = _developer_id
    and (
      current_user in ('service_role','postgres','supabase_admin')
      or _developer_id = public.current_developer_id()
      or public.has_role(auth.uid(), 'admin')
    )
$function$;

CREATE OR REPLACE FUNCTION public.developer_usage(_developer_id uuid)
 RETURNS TABLE(plan_code text, app_count integer, app_limit integer, storage_used bigint, storage_limit bigint, commission_rate numeric, builds_this_month integer, build_limit integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select dp.plan_code,
         (select count(*)::int from public.developer_apps da
           where da.developer_id = dp.id and da.status <> 'archived'),
         p.app_limit,
         dp.storage_used_bytes,
         p.storage_limit_bytes,
         p.commission_rate,
         (select count(*)::int from public.pwa_builds b
           where b.developer_id = dp.id
             and b.created_at >= date_trunc('month', now())),
         p.pwa_build_limit_monthly
  from public.developer_profiles dp
  join public.plans p on p.code = dp.plan_code
  where dp.id = _developer_id
    and (
      current_user in ('service_role','postgres','supabase_admin')
      or dp.user_id = auth.uid()
      or public.has_role(auth.uid(), 'admin')
    )
$function$;
