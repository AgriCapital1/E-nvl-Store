-- 1) Annulation d'un retrait par son propriétaire (statut pending uniquement)
CREATE OR REPLACE FUNCTION public.cancel_withdrawal(_withdrawal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare _dev uuid := public.current_developer_id();
        _w public.withdrawals%rowtype;
begin
  if _dev is null then raise exception 'NO_DEVELOPER_PROFILE'; end if;

  perform pg_advisory_xact_lock(hashtext('withdrawal:' || _dev::text));

  select * into _w from public.withdrawals
   where id = _withdrawal_id and developer_id = _dev
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'WITHDRAWAL_NOT_FOUND');
  end if;

  if _w.status <> 'pending' then
    return jsonb_build_object('ok', false, 'code', 'WITHDRAWAL_NOT_CANCELLABLE', 'status', _w.status);
  end if;

  update public.withdrawals
     set status = 'cancelled', failure_reason = 'Annulé par le développeur', updated_at = now()
   where id = _w.id;

  insert into public.wallet_ledger (developer_id, bucket, amount_fcfa, entry_type, withdrawal_id, description)
  values (_dev, 'withdrawing', -_w.amount_fcfa, 'withdrawal_cancelled', _w.id, 'Retrait annulé'),
         (_dev, 'available', _w.amount_fcfa, 'withdrawal_cancelled', _w.id, 'Montant remis à disposition');

  return jsonb_build_object('ok', true, 'withdrawal_id', _w.id, 'status', 'cancelled');
end; $$;

REVOKE ALL ON FUNCTION public.cancel_withdrawal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_withdrawal(uuid) TO authenticated;

-- 2) Demande de build PWA -> APK
CREATE OR REPLACE FUNCTION public.request_pwa_build(
  _source_url text,
  _app_name text,
  _package_name text,
  _theme_color text DEFAULT NULL,
  _developer_app_id uuid DEFAULT NULL,
  _options jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare _dev uuid := public.current_developer_id();
        _used int; _limit int; _id uuid; _ref text; _queue int;
begin
  if _dev is null then raise exception 'NO_DEVELOPER_PROFILE'; end if;

  if _source_url is null or _source_url !~* '^https://' then
    return jsonb_build_object('ok', false, 'code', 'SOURCE_URL_NOT_HTTPS');
  end if;
  if coalesce(btrim(_app_name), '') = '' then
    return jsonb_build_object('ok', false, 'code', 'APP_NAME_REQUIRED');
  end if;
  if _package_name !~ '^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_PACKAGE_NAME');
  end if;

  if _developer_app_id is not null
     and not exists (select 1 from public.developer_apps
                      where id = _developer_app_id and developer_id = _dev) then
    return jsonb_build_object('ok', false, 'code', 'APP_NOT_OWNED');
  end if;

  select builds_this_month, build_limit into _used, _limit
    from public.developer_usage(_dev);

  if _limit is not null and _limit >= 0 and _used >= _limit then
    return jsonb_build_object('ok', false, 'code', 'BUILD_LIMIT_REACHED',
      'used', _used, 'limit', _limit);
  end if;

  if exists (select 1 from public.pwa_builds
             where developer_id = _dev
               and status in ('queued','preparing','building','signing','uploading')) then
    return jsonb_build_object('ok', false, 'code', 'BUILD_ALREADY_RUNNING');
  end if;

  select count(*)::int + 1 into _queue from public.pwa_builds where status = 'queued';

  insert into public.pwa_builds (developer_id, developer_app_id, source_url, app_name,
    package_name, theme_color, options, status, progress, queue_position)
  values (_dev, _developer_app_id, _source_url, btrim(_app_name), _package_name,
    _theme_color, coalesce(_options, '{}'::jsonb), 'queued', 0, _queue)
  returning id, reference into _id, _ref;

  return jsonb_build_object('ok', true, 'build_id', _id, 'reference', _ref,
    'queue_position', _queue, 'builds_used', _used + 1, 'build_limit', _limit);
end; $$;

REVOKE ALL ON FUNCTION public.request_pwa_build(text, text, text, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_pwa_build(text, text, text, text, uuid, jsonb) TO authenticated;

-- 3) Mise à jour d'état d'un build (usage interne / worker via service_role)
CREATE OR REPLACE FUNCTION public.update_pwa_build_status(
  _build_id uuid,
  _status text,
  _progress smallint DEFAULT NULL,
  _artifact_path text DEFAULT NULL,
  _artifact_size_bytes bigint DEFAULT NULL,
  _error_code text DEFAULT NULL,
  _error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if _status not in ('queued','preparing','building','signing','uploading','succeeded','failed','cancelled') then
    raise exception 'INVALID_BUILD_STATUS';
  end if;

  update public.pwa_builds
     set status = _status,
         progress = coalesce(_progress, progress),
         artifact_path = coalesce(_artifact_path, artifact_path),
         artifact_size_bytes = coalesce(_artifact_size_bytes, artifact_size_bytes),
         error_code = coalesce(_error_code, error_code),
         error_message = coalesce(_error_message, error_message),
         started_at = case when _status = 'preparing' and started_at is null then now() else started_at end,
         finished_at = case when _status in ('succeeded','failed','cancelled') then now() else finished_at end,
         updated_at = now()
   where id = _build_id;
end; $$;

REVOKE ALL ON FUNCTION public.update_pwa_build_status(uuid, text, smallint, text, bigint, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_pwa_build_status(uuid, text, smallint, text, bigint, text, text) TO service_role;