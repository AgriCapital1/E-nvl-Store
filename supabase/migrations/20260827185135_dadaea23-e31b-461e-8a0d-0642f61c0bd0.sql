-- 1. Colonnes manquantes
alter table public.developer_apps
  add column if not exists description text,
  add column if not exists icon_path text,
  add column if not exists screenshots jsonb not null default '[]'::jsonb,
  add column if not exists pwa_url text,
  add column if not exists rejection_reason text;

alter table public.app_versions
  add column if not exists pwa_build_id uuid references public.pwa_builds(id) on delete set null,
  add column if not exists rejection_reason text,
  add column if not exists min_android text,
  add column if not exists permissions jsonb not null default '[]'::jsonb;

alter table public.developer_apps drop constraint if exists developer_apps_status_check;
alter table public.developer_apps
  add constraint developer_apps_status_check
  check (status = any (array['draft','review','published','rejected','suspended','archived']));

-- 2. Soumission d'une version par le développeur
create or replace function public.submit_app_version(
  _developer_app_id uuid,
  _version text,
  _version_code integer,
  _apk_path text,
  _apk_size_bytes bigint,
  _release_notes_fr text default null,
  _checksum text default null,
  _pwa_build_id uuid default null,
  _permissions jsonb default '[]'::jsonb,
  _min_android text default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare _dev uuid := public.current_developer_id(); _vid uuid;
begin
  if _dev is null then raise exception 'NO_DEVELOPER_PROFILE'; end if;
  if not exists (select 1 from public.developer_apps
                 where id = _developer_app_id and developer_id = _dev) then
    return jsonb_build_object('ok', false, 'code', 'APP_NOT_OWNED');
  end if;
  if coalesce(btrim(_version),'') = '' then
    return jsonb_build_object('ok', false, 'code', 'VERSION_REQUIRED');
  end if;
  if coalesce(btrim(_apk_path),'') = '' then
    return jsonb_build_object('ok', false, 'code', 'APK_REQUIRED');
  end if;
  if exists (select 1 from public.app_versions
             where developer_app_id = _developer_app_id and version = btrim(_version)) then
    return jsonb_build_object('ok', false, 'code', 'VERSION_ALREADY_EXISTS');
  end if;

  insert into public.app_versions (developer_app_id, version, version_code, release_notes_fr,
    apk_path, apk_size_bytes, checksum_sha256, scan_status, status, pwa_build_id,
    permissions, min_android)
  values (_developer_app_id, btrim(_version), _version_code, _release_notes_fr,
    _apk_path, coalesce(_apk_size_bytes,0), _checksum, 'pending', 'review', _pwa_build_id,
    coalesce(_permissions,'[]'::jsonb), _min_android)
  returning id into _vid;

  update public.developer_apps
     set status = 'review', version = btrim(_version), rejection_reason = null,
         storage_bytes = storage_bytes + coalesce(_apk_size_bytes,0)
   where id = _developer_app_id;

  return jsonb_build_object('ok', true, 'version_id', _vid);
end; $$;

revoke all on function public.submit_app_version(uuid,text,integer,text,bigint,text,text,uuid,jsonb,text) from public, anon;
grant execute on function public.submit_app_version(uuid,text,integer,text,bigint,text,text,uuid,jsonb,text) to authenticated, service_role;

-- 3. Modération administrateur : publication ou refus
create or replace function public.admin_review_version(
  _version_id uuid,
  _approve boolean,
  _reason text default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare _v public.app_versions%rowtype;
        _a public.developer_apps%rowtype;
        _slug text; _store uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'FORBIDDEN'; end if;

  select * into _v from public.app_versions where id = _version_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'UNKNOWN_VERSION'); end if;
  select * into _a from public.developer_apps where id = _v.developer_app_id;

  if not _approve then
    update public.app_versions set status = 'archived', scan_status = 'flagged',
           rejection_reason = _reason where id = _v.id;
    update public.developer_apps set status = 'rejected', rejection_reason = _reason
     where id = _a.id;
    return jsonb_build_object('ok', true, 'status', 'rejected');
  end if;

  update public.app_versions set status = 'archived'
   where developer_app_id = _a.id and status = 'live';
  update public.app_versions set status = 'live', scan_status = 'verified',
         rejection_reason = null where id = _v.id;

  _slug := _a.slug;

  insert into public.store_apps (developer_app_id, developer_id, slug, name, publisher_name,
    category_slug, short_description, description, icon_path, screenshots, pricing_type,
    price_fcfa, current_version, apk_size_bytes, min_android, permissions, security_scan,
    status, published_at)
  select _a.id, _a.developer_id, _slug, _a.name,
         coalesce(dp.organization_name, dp.display_name),
         _a.category, _a.short_description, _a.description, _a.icon_path,
         coalesce(_a.screenshots, '[]'::jsonb), _a.pricing_type, _a.price_fcfa,
         _v.version, _v.apk_size_bytes, _v.min_android, coalesce(_v.permissions,'[]'::jsonb),
         'verified', 'published', now()
    from public.developer_profiles dp where dp.id = _a.developer_id
  on conflict (developer_app_id) do update set
    name = excluded.name,
    publisher_name = excluded.publisher_name,
    category_slug = excluded.category_slug,
    short_description = excluded.short_description,
    description = excluded.description,
    icon_path = excluded.icon_path,
    screenshots = excluded.screenshots,
    pricing_type = excluded.pricing_type,
    price_fcfa = excluded.price_fcfa,
    current_version = excluded.current_version,
    apk_size_bytes = excluded.apk_size_bytes,
    min_android = excluded.min_android,
    permissions = excluded.permissions,
    security_scan = 'verified',
    status = 'published',
    updated_at = now()
  returning id into _store;

  update public.developer_apps
     set status = 'published', version = _v.version, rejection_reason = null
   where id = _a.id;

  return jsonb_build_object('ok', true, 'status', 'published', 'store_app_id', _store);
end; $$;

revoke all on function public.admin_review_version(uuid,boolean,text) from public, anon;
grant execute on function public.admin_review_version(uuid,boolean,text) to authenticated, service_role;

-- index unique requis pour l'upsert ci-dessus
create unique index if not exists store_apps_developer_app_id_key
  on public.store_apps (developer_app_id);

-- 4. Enregistrement réel des installations
create or replace function public.record_install(
  _store_app_id uuid,
  _version text default null,
  _device_model text default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare _apk text; _dev_app uuid;
begin
  select sa.developer_app_id into _dev_app from public.store_apps sa
   where sa.id = _store_app_id and sa.status = 'published';
  if _dev_app is null then
    return jsonb_build_object('ok', false, 'code', 'APP_NOT_PUBLISHED');
  end if;

  select av.apk_path into _apk from public.app_versions av
   where av.developer_app_id = _dev_app and av.status = 'live'
   order by av.created_at desc limit 1;

  insert into public.installs (user_id, store_app_id, version, device_model, status)
  values (auth.uid(), _store_app_id, _version, _device_model, 'completed');

  update public.store_apps
     set downloads = downloads + 1, downloads_24h = downloads_24h + 1
   where id = _store_app_id;
  update public.developer_apps set downloads = downloads + 1 where id = _dev_app;

  return jsonb_build_object('ok', true, 'apk_path', _apk);
end; $$;

revoke all on function public.record_install(uuid,text,text) from public;
grant execute on function public.record_install(uuid,text,text) to anon, authenticated, service_role;

-- 5. Politiques de stockage
create policy "dev lit ses medias"
on storage.objects for select to authenticated
using (
  bucket_id = 'app-media'
  and ((storage.foldername(name))[1] = public.current_developer_id()::text
       or public.has_role(auth.uid(), 'admin'))
);

create policy "dev depose ses medias"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'app-media'
  and (storage.foldername(name))[1] = public.current_developer_id()::text
);

create policy "dev remplace ses medias"
on storage.objects for update to authenticated
using (bucket_id = 'app-media' and (storage.foldername(name))[1] = public.current_developer_id()::text)
with check (bucket_id = 'app-media' and (storage.foldername(name))[1] = public.current_developer_id()::text);

create policy "dev supprime ses medias"
on storage.objects for delete to authenticated
using (bucket_id = 'app-media' and (storage.foldername(name))[1] = public.current_developer_id()::text);

create policy "dev lit ses paquets"
on storage.objects for select to authenticated
using (
  bucket_id = 'app-packages'
  and ((storage.foldername(name))[1] = public.current_developer_id()::text
       or public.has_role(auth.uid(), 'admin'))
);

create policy "dev depose ses paquets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'app-packages'
  and (storage.foldername(name))[1] = public.current_developer_id()::text
);

create policy "dev supprime ses paquets"
on storage.objects for delete to authenticated
using (bucket_id = 'app-packages' and (storage.foldername(name))[1] = public.current_developer_id()::text);