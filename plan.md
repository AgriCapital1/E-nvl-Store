# E'nvlé — Plan backend complet (public + développeur)

> Phase 1 (plans, developer_profiles, subscriptions, developer_apps, transactions,
> wallet_ledger, withdrawals, payout_methods, user_roles, has_role,
> developer_balances) est **déjà appliquée manuellement**.
> Ce document contient **tout le reste du SQL** (catalogue public, storage, RPC
> financières, limites de plan, sécurité) + le plan des server functions, des
> routes et de l'UI.

---

## 1. Architecture générale

```
envle.app (public)                    dev.envle.app (développeur)
------------------                    ---------------------------
store_apps (lecture anon)             developer_profiles / subscriptions
store_app_versions                    developer_apps  -> publie -> store_apps
categories                            transactions / wallet_ledger / withdrawals
reviews (modérées)                    plans / payout_methods
user_profiles / favorites / installs  pwa_builds
```

Règle stricte : le public ne lit **jamais** `developer_*`, `transactions`,
`wallet_ledger`, `withdrawals`, `subscriptions`. Il lit uniquement les tables
`store_*`, `categories`, `reviews` (approuvées) et ses propres données
utilisateur.

Séparation frontend : `src/routes/*` = public, `src/routes/dev/*` +
`src/routes/_authenticated/dev/*` = développeur.

---

## 2. SQL — Migration 2 : catalogue public

```sql
-- ============================================================
-- 2.1 UTILITAIRES
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Développeur courant (évite la récursion RLS)
create or replace function public.current_developer_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.developer_profiles where user_id = auth.uid() limit 1
$$;
revoke execute on function public.current_developer_id() from public;
grant execute on function public.current_developer_id() to authenticated, service_role;

-- ============================================================
-- 2.2 CATEGORIES
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_fr text not null,
  name_en text not null,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories publiques" on public.categories
  for select to anon, authenticated using (is_active);
create policy "admins gerent categories" on public.categories
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
create trigger categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

insert into public.categories (slug,name_fr,name_en,sort_order) values
 ('jeux','Jeux','Games',1),
 ('productivite','Productivité','Productivity',2),
 ('education','Éducation','Education',3),
 ('finance','Finance','Finance',4),
 ('social','Social','Social',5),
 ('transport','Transport','Transport',6),
 ('sante','Santé','Health',7),
 ('divertissement','Divertissement','Entertainment',8);

-- ============================================================
-- 2.3 STORE_APPS : projection publique d'une developer_app publiée
-- ============================================================
create table public.store_apps (
  id uuid primary key default gen_random_uuid(),
  developer_app_id uuid not null unique
    references public.developer_apps(id) on delete cascade,
  developer_id uuid not null
    references public.developer_profiles(id) on delete cascade,
  slug text not null unique,
  name text not null,
  publisher_name text not null,
  category_slug text references public.categories(slug),
  short_description text,
  description text,
  icon_path text,
  screenshots jsonb not null default '[]'::jsonb,
  pricing_type text not null default 'free'
    check (pricing_type in ('free','paid')),
  price_fcfa integer not null default 0 check (price_fcfa >= 0),
  current_version text not null default '1.0.0',
  apk_size_bytes bigint not null default 0,
  min_android text,
  permissions jsonb not null default '[]'::jsonb,
  security_scan text not null default 'pending'
    check (security_scan in ('pending','verified','flagged')),
  status text not null default 'published'
    check (status in ('published','unlisted','suspended')),
  downloads integer not null default 0,
  downloads_24h integer not null default 0,
  rating_average numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  is_featured boolean not null default false,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index store_apps_category_idx on public.store_apps(category_slug);
create index store_apps_downloads_idx on public.store_apps(downloads desc);
create index store_apps_trending_idx on public.store_apps(downloads_24h desc);
create index store_apps_developer_idx on public.store_apps(developer_id);

grant select on public.store_apps to anon, authenticated;
grant all on public.store_apps to service_role;
alter table public.store_apps enable row level security;

-- Public : uniquement les apps publiées
create policy "apps publiees visibles" on public.store_apps
  for select to anon, authenticated using (status = 'published');
-- Le développeur voit aussi ses apps non listées / suspendues
create policy "dev voit ses apps store" on public.store_apps
  for select to authenticated
  using (developer_id = public.current_developer_id()
         or public.has_role(auth.uid(),'admin'));
create policy "admins gerent store_apps" on public.store_apps
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
create trigger store_apps_updated before update on public.store_apps
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2.4 VERSIONS / ARTEFACTS APK
-- ============================================================
create table public.app_versions (
  id uuid primary key default gen_random_uuid(),
  developer_app_id uuid not null
    references public.developer_apps(id) on delete cascade,
  version text not null,
  version_code integer not null default 1,
  release_notes_fr text,
  release_notes_en text,
  apk_path text,
  apk_size_bytes bigint not null default 0,
  checksum_sha256 text,
  scan_status text not null default 'pending'
    check (scan_status in ('pending','scanning','verified','flagged','failed')),
  scan_report jsonb,
  crash_rate numeric(5,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft','review','live','rolled_back','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (developer_app_id, version)
);
create index app_versions_app_idx on public.app_versions(developer_app_id, created_at desc);

grant select on public.app_versions to anon, authenticated;
grant insert, update on public.app_versions to authenticated;
grant all on public.app_versions to service_role;
alter table public.app_versions enable row level security;

-- Public : seules les versions live d'une app publiée
create policy "versions live publiques" on public.app_versions
  for select to anon, authenticated
  using (status = 'live' and exists (
    select 1 from public.store_apps sa
    where sa.developer_app_id = app_versions.developer_app_id
      and sa.status = 'published'));
create policy "dev lit ses versions" on public.app_versions
  for select to authenticated
  using (exists (select 1 from public.developer_apps da
                 where da.id = app_versions.developer_app_id
                   and da.developer_id = public.current_developer_id())
         or public.has_role(auth.uid(),'admin'));
create policy "dev cree ses versions" on public.app_versions
  for insert to authenticated
  with check (exists (select 1 from public.developer_apps da
                      where da.id = app_versions.developer_app_id
                        and da.developer_id = public.current_developer_id()));
create policy "dev modifie ses versions" on public.app_versions
  for update to authenticated
  using (exists (select 1 from public.developer_apps da
                 where da.id = app_versions.developer_app_id
                   and da.developer_id = public.current_developer_id()))
  with check (exists (select 1 from public.developer_apps da
                      where da.id = app_versions.developer_app_id
                        and da.developer_id = public.current_developer_id()));
create trigger app_versions_updated before update on public.app_versions
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2.5 UTILISATEURS PUBLICS
-- ============================================================
create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text not null default 'Utilisateur',
  avatar_path text,
  locale text not null default 'fr',
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.user_profiles to authenticated;
grant all on public.user_profiles to service_role;
alter table public.user_profiles enable row level security;
create policy "profil perso lisible" on public.user_profiles
  for select to authenticated using (user_id = auth.uid());
create policy "profil perso creable" on public.user_profiles
  for insert to authenticated with check (user_id = auth.uid());
create policy "profil perso modifiable" on public.user_profiles
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());
create trigger user_profiles_updated before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- Création automatique du profil utilisateur à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (user_id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Favoris
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  store_app_id uuid not null references public.store_apps(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, store_app_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "favoris perso" on public.favorites
  for select to authenticated using (user_id = auth.uid());
create policy "ajout favori" on public.favorites
  for insert to authenticated with check (user_id = auth.uid());
create policy "retrait favori" on public.favorites
  for delete to authenticated using (user_id = auth.uid());

-- Installations / téléchargements (analytics + droit d'accès aux apps payantes)
create table public.installs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  store_app_id uuid not null references public.store_apps(id) on delete cascade,
  version text,
  device_model text,
  status text not null default 'started'
    check (status in ('started','completed','failed')),
  created_at timestamptz not null default now()
);
create index installs_app_idx on public.installs(store_app_id, created_at desc);
grant select, insert on public.installs to authenticated;
grant all on public.installs to service_role;
alter table public.installs enable row level security;
create policy "installs perso" on public.installs
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "installs creables" on public.installs
  for insert to authenticated with check (user_id = auth.uid());

-- ============================================================
-- 2.6 AVIS
-- ============================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  store_app_id uuid not null references public.store_apps(id) on delete cascade,
  user_id uuid not null,
  author_name text not null default 'Utilisateur',
  rating smallint not null check (rating between 1 and 5),
  comment text,
  language text not null default 'fr',
  status text not null default 'approved'
    check (status in ('pending','approved','rejected')),
  helpful_count integer not null default 0,
  developer_reply text,
  developer_replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_app_id, user_id)
);
create index reviews_app_idx on public.reviews(store_app_id, created_at desc);
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "avis approuves publics" on public.reviews
  for select to anon, authenticated using (status = 'approved');
create policy "auteur lit son avis" on public.reviews
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "avis creable" on public.reviews
  for insert to authenticated with check (user_id = auth.uid());
create policy "avis modifiable par auteur" on public.reviews
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "avis supprimable par auteur" on public.reviews
  for delete to authenticated using (user_id = auth.uid());
create policy "admins moderent avis" on public.reviews
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
create trigger reviews_updated before update on public.reviews
  for each row execute function public.set_updated_at();

-- Recalcul de la note moyenne
create or replace function public.refresh_app_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare _app uuid := coalesce(new.store_app_id, old.store_app_id);
begin
  update public.store_apps sa set
    rating_average = coalesce((select round(avg(rating)::numeric,2) from public.reviews r
                               where r.store_app_id = _app and r.status='approved'),0),
    rating_count   = (select count(*) from public.reviews r
                      where r.store_app_id = _app and r.status='approved')
  where sa.id = _app;
  return null;
end; $$;
create trigger reviews_rating_refresh
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_app_rating();

-- Réponse développeur à un avis sur SON app
create policy "dev repond aux avis de ses apps" on public.reviews
  for update to authenticated
  using (exists (select 1 from public.store_apps sa
                 where sa.id = reviews.store_app_id
                   and sa.developer_id = public.current_developer_id()))
  with check (exists (select 1 from public.store_apps sa
                      where sa.id = reviews.store_app_id
                        and sa.developer_id = public.current_developer_id()));
```

---

## 3. SQL — Migration 3 : storage (buckets + policies)

> Les buckets se créent avec l'outil storage (ou via le dashboard).
> Les policies ci-dessous se posent ensuite par migration.

Buckets :

| bucket | public | limite | contenu |
|---|---|---|---|
| `app-icons` | oui | 2 MB | icônes des apps |
| `app-screenshots` | oui | 5 MB | captures d'écran |
| `avatars` | oui | 2 MB | avatars utilisateurs |
| `apk-artifacts` | non | 500 MB | APK uploadés / générés (accès par URL signée) |
| `pwa-builds` | non | 500 MB | artefacts de conversion PWA → APK |

Convention de chemin : `{developer_id}/{app_id}/{fichier}` pour les buckets
développeur, `{user_id}/{fichier}` pour `avatars`.

```sql
-- Lecture publique des buckets publics
create policy "lecture publique assets" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('app-icons','app-screenshots','avatars'));

-- Le développeur gère les fichiers de son dossier
create policy "dev upload assets" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('app-icons','app-screenshots','apk-artifacts','pwa-builds')
    and (storage.foldername(name))[1] = public.current_developer_id()::text);

create policy "dev modifie assets" on storage.objects
  for update to authenticated
  using (bucket_id in ('app-icons','app-screenshots','apk-artifacts','pwa-builds')
    and (storage.foldername(name))[1] = public.current_developer_id()::text);

create policy "dev supprime assets" on storage.objects
  for delete to authenticated
  using (bucket_id in ('app-icons','app-screenshots','apk-artifacts','pwa-builds')
    and (storage.foldername(name))[1] = public.current_developer_id()::text);

create policy "dev lit ses artefacts prives" on storage.objects
  for select to authenticated
  using (bucket_id in ('apk-artifacts','pwa-builds')
    and ((storage.foldername(name))[1] = public.current_developer_id()::text
         or public.has_role(auth.uid(),'admin')));

-- Avatars : dossier = user_id
create policy "avatar perso ecrit" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar perso modifie" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar perso supprime" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text);
```

---

## 4. SQL — Migration 4 : PWA → APK (file d'attente)

```sql
create table public.pwa_builds (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default ('BLD-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  developer_id uuid not null references public.developer_profiles(id) on delete cascade,
  developer_app_id uuid references public.developer_apps(id) on delete set null,
  source_url text not null,
  app_name text not null,
  package_name text not null,
  theme_color text,
  icon_path text,
  options jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued','preparing','building','signing','uploading','succeeded','failed','cancelled')),
  progress smallint not null default 0 check (progress between 0 and 100),
  queue_position integer,
  artifact_path text,
  artifact_size_bytes bigint,
  error_code text,
  error_message text,
  worker_id text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pwa_builds_dev_idx on public.pwa_builds(developer_id, created_at desc);
grant select on public.pwa_builds to authenticated;
grant all on public.pwa_builds to service_role;
alter table public.pwa_builds enable row level security;
create policy "builds perso" on public.pwa_builds
  for select to authenticated
  using (developer_id = public.current_developer_id()
         or public.has_role(auth.uid(),'admin'));
create trigger pwa_builds_updated before update on public.pwa_builds
  for each row execute function public.set_updated_at();

alter publication supabase_realtime add table public.pwa_builds;
```

> Important : `status = 'succeeded'` n'est écrit **que** par le worker de build
> réel (service_role). Tant qu'aucun worker n'est branché, les demandes restent
> `queued` et l'UI affiche « infrastructure de build non encore connectée ».

---

## 5. SQL — Migration 5 : logique métier financière (RPC)

Toutes les fonctions sont `security definer`, vérifient l'appelant, et ne sont
exécutables que par `authenticated` / `service_role`.

```sql
-- ============================================================
-- 5.1 QUOTAS / LIMITES DE PLAN
-- ============================================================
create or replace function public.developer_usage(_developer_id uuid)
returns table (plan_code text, app_count integer, app_limit integer,
               storage_used bigint, storage_limit bigint,
               commission_rate numeric, builds_this_month integer, build_limit integer)
language sql stable security definer set search_path = public as $$
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
$$;
revoke execute on function public.developer_usage(uuid) from public;
grant execute on function public.developer_usage(uuid) to authenticated, service_role;

-- Blocage à la création d'app : limite du plan vérifiée côté base
create or replace function public.enforce_app_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare _limit int; _count int;
begin
  select p.app_limit into _limit
  from public.developer_profiles dp join public.plans p on p.code = dp.plan_code
  where dp.id = new.developer_id;

  select count(*) into _count from public.developer_apps
  where developer_id = new.developer_id and status <> 'archived';

  if _count >= _limit then
    raise exception 'PLAN_APP_LIMIT_REACHED:%', _limit
      using errcode = 'check_violation';
  end if;
  return new;
end; $$;
create trigger developer_apps_limit
  before insert on public.developer_apps
  for each row execute function public.enforce_app_limit();

-- Changement de formule (upgrade / downgrade contrôlé)
create or replace function public.change_plan(_plan_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _dev uuid := public.current_developer_id();
        _plan public.plans%rowtype; _apps int; _storage bigint;
begin
  if _dev is null then raise exception 'NO_DEVELOPER_PROFILE'; end if;
  select * into _plan from public.plans where code = _plan_code and is_active;
  if not found then raise exception 'UNKNOWN_PLAN'; end if;

  select count(*) , coalesce(max(dp.storage_used_bytes),0)
    into _apps, _storage
  from public.developer_apps da
  right join public.developer_profiles dp on dp.id = _dev
  where da.developer_id = _dev and da.status <> 'archived';

  if _apps > _plan.app_limit then
    return jsonb_build_object('ok', false, 'code','TOO_MANY_APPS',
      'current', _apps, 'limit', _plan.app_limit);
  end if;
  if _storage > _plan.storage_limit_bytes then
    return jsonb_build_object('ok', false, 'code','STORAGE_EXCEEDED',
      'current', _storage, 'limit', _plan.storage_limit_bytes);
  end if;

  update public.subscriptions set status='cancelled', updated_at=now()
   where developer_id=_dev and status='active';

  insert into public.subscriptions (developer_id, plan_code, status, started_at,
    current_period_end, auto_renew, amount_fcfa, provider)
  values (_dev, _plan.code,
    case when _plan.price_fcfa = 0 then 'active' else 'pending_payment' end,
    now(),
    case when _plan.price_fcfa = 0 then null else now() + interval '30 days' end,
    _plan.price_fcfa > 0, _plan.price_fcfa,
    case when _plan.price_fcfa = 0 then 'none' else 'unconfigured' end);

  -- Un plan payant ne devient actif qu'après confirmation de paiement réelle
  if _plan.price_fcfa = 0 then
    update public.developer_profiles set plan_code=_plan.code where id=_dev;
    return jsonb_build_object('ok', true, 'status','active','plan',_plan.code);
  end if;

  return jsonb_build_object('ok', true, 'status','pending_payment','plan',_plan.code,
    'amount_fcfa', _plan.price_fcfa);
end; $$;
revoke execute on function public.change_plan(text) from public;
grant execute on function public.change_plan(text) to authenticated;

-- ============================================================
-- 5.2 ENREGISTREMENT D'UNE VENTE (service_role uniquement)
--     appelée par le webhook du prestataire de paiement
-- ============================================================
create or replace function public.record_sale(
  _developer_app_id uuid, _gross_amount integer, _provider_fee integer,
  _external_reference text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare _dev uuid; _plan text; _rate numeric; _commission int; _net int; _trx uuid;
begin
  select da.developer_id, dp.plan_code, p.commission_rate
    into _dev, _plan, _rate
  from public.developer_apps da
  join public.developer_profiles dp on dp.id = da.developer_id
  join public.plans p on p.code = dp.plan_code
  where da.id = _developer_app_id;
  if _dev is null then raise exception 'UNKNOWN_APP'; end if;

  _commission := round(_gross_amount * _rate);
  _net := _gross_amount - _commission - coalesce(_provider_fee,0);
  if _net < 0 then _net := 0; end if;

  insert into public.transactions (developer_id, app_id, type, gross_amount_fcfa,
    plan_snapshot, commission_rate, commission_amount_fcfa, provider_fee_fcfa,
    net_amount_fcfa, status)
  values (_dev, _developer_app_id, 'sale', _gross_amount, _plan, _rate,
    _commission, coalesce(_provider_fee,0), _net, 'pending')
  returning id into _trx;

  insert into public.wallet_ledger (developer_id, bucket, amount_fcfa, entry_type,
    transaction_id, description)
  values (_dev, 'pending', _net, 'sale', _trx, 'Vente en attente de validation');

  return _trx;
end; $$;
revoke execute on function public.record_sale(uuid,integer,integer,text) from public, authenticated;
grant execute on function public.record_sale(uuid,integer,integer,text) to service_role;

-- Validation d'une vente : pending -> available
create or replace function public.settle_transaction(_transaction_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _t public.transactions%rowtype;
begin
  select * into _t from public.transactions where id=_transaction_id for update;
  if not found then raise exception 'UNKNOWN_TRANSACTION'; end if;
  if _t.status <> 'pending' then raise exception 'ALREADY_SETTLED'; end if;

  update public.transactions set status='available' where id=_t.id;
  insert into public.wallet_ledger (developer_id,bucket,amount_fcfa,entry_type,transaction_id,description)
  values (_t.developer_id,'pending', -_t.net_amount_fcfa,'settlement',_t.id,'Sortie du solde en attente'),
         (_t.developer_id,'available', _t.net_amount_fcfa,'settlement',_t.id,'Revenu disponible');
end; $$;
revoke execute on function public.settle_transaction(uuid) from public, authenticated;
grant execute on function public.settle_transaction(uuid) to service_role;

-- Remboursement
create or replace function public.refund_transaction(_transaction_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _t public.transactions%rowtype;
begin
  select * into _t from public.transactions where id=_transaction_id for update;
  if not found then raise exception 'UNKNOWN_TRANSACTION'; end if;
  if _t.status = 'refunded' then raise exception 'ALREADY_REFUNDED'; end if;

  update public.transactions set status='refunded' where id=_t.id;
  insert into public.wallet_ledger (developer_id,bucket,amount_fcfa,entry_type,transaction_id,description)
  values (_t.developer_id,
          case when _t.status='pending' then 'pending' else 'available' end,
          -_t.net_amount_fcfa,'refund',_t.id,'Remboursement');
end; $$;
revoke execute on function public.refund_transaction(uuid) from public, authenticated;
grant execute on function public.refund_transaction(uuid) to service_role;

-- ============================================================
-- 5.3 RETRAITS — anti double-retrait
-- ============================================================
create or replace function public.request_withdrawal(
  _amount integer, _payout_method_code text, _destination text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _dev uuid := public.current_developer_id();
        _m public.payout_methods%rowtype;
        _available bigint; _fee int; _net int; _wid uuid; _ref text;
begin
  if _dev is null then raise exception 'NO_DEVELOPER_PROFILE'; end if;

  -- verrou par développeur : empêche deux demandes concurrentes
  perform pg_advisory_xact_lock(hashtext('withdrawal:' || _dev::text));

  select * into _m from public.payout_methods
   where code=_payout_method_code and is_active;
  if not found then raise exception 'UNKNOWN_PAYOUT_METHOD'; end if;

  if exists (select 1 from public.withdrawals
             where developer_id=_dev and status in ('pending','processing')) then
    return jsonb_build_object('ok',false,'code','WITHDRAWAL_ALREADY_PENDING');
  end if;

  if _amount < greatest(_m.min_amount_fcfa, 5000) then
    return jsonb_build_object('ok',false,'code','AMOUNT_BELOW_MINIMUM',
      'minimum', greatest(_m.min_amount_fcfa,5000));
  end if;

  select available into _available from public.developer_balances(_dev);
  if _amount > _available then
    return jsonb_build_object('ok',false,'code','INSUFFICIENT_BALANCE','available',_available);
  end if;

  _fee := round(_amount * _m.fee_percent) + _m.fee_fixed_fcfa;
  _net := _amount - _fee;
  if _net <= 0 then
    return jsonb_build_object('ok',false,'code','FEES_EXCEED_AMOUNT');
  end if;

  insert into public.withdrawals (developer_id,payout_method_code,destination,
    amount_fcfa,fee_fcfa,net_amount_fcfa,status)
  values (_dev,_payout_method_code,_destination,_amount,_fee,_net,'pending')
  returning id, reference into _wid, _ref;

  -- réservation immédiate du montant
  insert into public.wallet_ledger (developer_id,bucket,amount_fcfa,entry_type,withdrawal_id,description)
  values (_dev,'available', -_amount,'withdrawal_request',_wid,'Montant réservé pour retrait'),
         (_dev,'withdrawing', _amount,'withdrawal_request',_wid,'Retrait en cours');

  return jsonb_build_object('ok',true,'withdrawal_id',_wid,'reference',_ref,
    'amount',_amount,'fee',_fee,'net',_net,
    'provider_live', _m.is_live);
end; $$;
revoke execute on function public.request_withdrawal(integer,text,text) from public;
grant execute on function public.request_withdrawal(integer,text,text) to authenticated;

-- Finalisation d'un retrait (worker / admin uniquement)
create or replace function public.complete_withdrawal(
  _withdrawal_id uuid, _external_reference text)
returns void language plpgsql security definer set search_path = public as $$
declare _w public.withdrawals%rowtype;
begin
  select * into _w from public.withdrawals where id=_withdrawal_id for update;
  if not found then raise exception 'UNKNOWN_WITHDRAWAL'; end if;
  if _w.status in ('completed','failed','cancelled') then raise exception 'ALREADY_FINALIZED'; end if;

  update public.withdrawals set status='completed', external_reference=_external_reference,
         processed_at=now() where id=_w.id;
  insert into public.wallet_ledger (developer_id,bucket,amount_fcfa,entry_type,withdrawal_id,description)
  values (_w.developer_id,'withdrawing', -_w.amount_fcfa,'withdrawal_completed',_w.id,'Retrait envoyé'),
         (_w.developer_id,'withdrawn',   _w.amount_fcfa,'withdrawal_completed',_w.id,'Retrait finalisé');
end; $$;
revoke execute on function public.complete_withdrawal(uuid,text) from public, authenticated;
grant execute on function public.complete_withdrawal(uuid,text) to service_role;

-- Échec / annulation : le montant réservé revient au solde disponible
create or replace function public.fail_withdrawal(_withdrawal_id uuid, _reason text)
returns void language plpgsql security definer set search_path = public as $$
declare _w public.withdrawals%rowtype;
begin
  select * into _w from public.withdrawals where id=_withdrawal_id for update;
  if not found then raise exception 'UNKNOWN_WITHDRAWAL'; end if;
  if _w.status in ('completed','failed','cancelled') then raise exception 'ALREADY_FINALIZED'; end if;

  update public.withdrawals set status='failed', failure_reason=_reason, processed_at=now()
   where id=_w.id;
  insert into public.wallet_ledger (developer_id,bucket,amount_fcfa,entry_type,withdrawal_id,description)
  values (_w.developer_id,'withdrawing', -_w.amount_fcfa,'withdrawal_failed',_w.id,'Retrait échoué'),
         (_w.developer_id,'available',    _w.amount_fcfa,'withdrawal_failed',_w.id,'Montant restitué');
end; $$;
revoke execute on function public.fail_withdrawal(uuid,text) from public, authenticated;
grant execute on function public.fail_withdrawal(uuid,text) to service_role;

-- Garde-fou global : aucun solde négatif
create or replace function public.assert_no_negative_balance()
returns trigger language plpgsql security definer set search_path = public as $$
declare _b record;
begin
  select * into _b from public.developer_balances(new.developer_id);
  if _b.pending < 0 or _b.available < 0 or _b.withdrawing < 0 then
    raise exception 'NEGATIVE_BALANCE';
  end if;
  return null;
end; $$;
create constraint trigger wallet_ledger_no_negative
  after insert on public.wallet_ledger
  deferrable initially deferred
  for each row execute function public.assert_no_negative_balance();
```

---

## 6. SQL — Migration 6 : rôles & attribution développeur

```sql
-- Devenir développeur : crée le profil + le rôle + l'abonnement Starter
create or replace function public.become_developer(_display_name text, _country text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare _dev uuid;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;

  insert into public.developer_profiles (user_id, display_name, country, plan_code)
  values (auth.uid(), coalesce(_display_name,'Developpeur'), _country, 'starter')
  on conflict (user_id) do update set display_name = excluded.display_name
  returning id into _dev;

  insert into public.user_roles (user_id, role) values (auth.uid(),'developer')
  on conflict do nothing;

  insert into public.subscriptions (developer_id, plan_code, status, amount_fcfa, provider)
  select _dev,'starter','active',0,'none'
  where not exists (select 1 from public.subscriptions where developer_id=_dev and status='active');

  return _dev;
end; $$;
revoke execute on function public.become_developer(text,text) from public;
grant execute on function public.become_developer(text,text) to authenticated;

-- L'attribution du rôle admin reste manuelle (service_role / dashboard) :
-- insert into public.user_roles (user_id, role) values ('<uuid>','admin');
```

Politiques admin de supervision (à ajouter sur les tables financières déjà créées) :

```sql
create policy "admins gerent transactions" on public.transactions
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
create policy "admins gerent withdrawals" on public.withdrawals
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
create policy "admins lisent ledger" on public.wallet_ledger
  for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins gerent subscriptions" on public.subscriptions
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
```

---

## 7. Couche serveur (TanStack server functions)

Configuration centralisée : `src/lib/billing/plans.ts` (types + formatage +
calcul d'estimation côté client uniquement, la vérité vient du backend).

| Fichier | Fonctions | Protection |
|---|---|---|
| `src/lib/store.functions.ts` | `listStoreApps`, `getStoreApp`, `listCategories`, `listReviews` | public (clé publishable serveur) |
| `src/lib/account.functions.ts` | `getMyProfile`, `toggleFavorite`, `submitReview`, `recordInstall` | `requireSupabaseAuth` |
| `src/lib/dev/profile.functions.ts` | `getDeveloperOverview` (profil + usage + soldes), `becomeDeveloper` | `requireSupabaseAuth` |
| `src/lib/dev/apps.functions.ts` | `listMyApps`, `createApp` (retourne l'erreur métier `PLAN_APP_LIMIT_REACHED`), `updateApp`, `publishApp`, `createVersion` | `requireSupabaseAuth` |
| `src/lib/dev/billing.functions.ts` | `listPlans`, `getSubscription`, `changePlan` | `requireSupabaseAuth` |
| `src/lib/dev/wallet.functions.ts` | `getBalances`, `listTransactions`, `listWithdrawals`, `listPayoutMethods`, `quoteWithdrawal`, `requestWithdrawal` | `requireSupabaseAuth` |
| `src/lib/dev/builds.functions.ts` | `listBuilds`, `queueBuild` (contrôle du quota mensuel) | `requireSupabaseAuth` |

Routes HTTP :
- `src/routes/api/public/payments/webhook.ts` — vérifie la signature du
  prestataire puis appelle `record_sale` / `settle_transaction` / `refund_transaction`
  via `supabaseAdmin`. Tant qu'aucun prestataire n'est branché : renvoie 501.
- `src/routes/api/public/builds/callback.ts` — callback du worker de build
  (signature HMAC), met à jour `pwa_builds`.
- `src/routes/api/public/payouts/callback.ts` — callback du prestataire de
  retrait, appelle `complete_withdrawal` / `fail_withdrawal`.

Règles : aucun calcul financier définitif côté frontend ; le front n'affiche que
des estimations issues de `plans` et `payout_methods`.

---

## 8. Routes UI développeur (`/dev/*`, sous `_authenticated`)

- `/dev` — Vue d'ensemble : bonjour, apps actives, téléchargements, revenus du
  mois, solde disponible, bouton « Retirer mes revenus », carte « Ma formule »
  (usage apps/stockage, commission, bouton « Gérer mon abonnement »).
- `/dev/apps` — liste des applications + statut + version.
- `/dev/apps/new` — publication : type gratuite/payante, prix, calcul de
  répartition (brut / commission / frais / net), blocage clair si limite atteinte
  avec CTA d'évolution de formule.
- `/dev/revenus` — soldes (en attente, disponible, en cours de retrait, retiré),
  revenus du mois/total, nombre de ventes, commissions, frais.
- `/dev/transactions` — table filtrable (date, app, référence, type, brut,
  commission, frais, net, statut).
- `/dev/retraits` — demande + historique + statuts, minimum 5 000 FCFA,
  récapitulatif des frais avant confirmation, bandeau explicite quand le
  prestataire n'est pas encore en production.
- `/dev/pwa` — convertisseur, file d'attente, états persistants (`pwa_builds`),
  mention claire « build réel non connecté ».
- `/dev/abonnement` — formule actuelle, limites, usage, commission, comparatif
  Starter/Pro/Business, changement de formule avec contrôle de downgrade.
- `/dev/facturation` — historique des abonnements.
- `/dev/parametres` — profil développeur, moyens de retrait.
- `/auth` — connexion/inscription (public, hors gabarit store).

Le site public conserve `/`, `/categories`, `/app/$appId` et n'affiche aucune
référence développeur.

---

## 9. Ordre d'exécution recommandé

1. Migration 2 (catalogue public)
2. Création des 5 buckets, puis Migration 3 (policies storage)
3. Migration 4 (pwa_builds)
4. Migration 5 (RPC financières)
5. Migration 6 (rôles, become_developer, policies admin)
6. Génération des types, puis implémentation server functions + UI

## 10. Points de vigilance

- Aucune vente, aucun retrait, aucun abonnement payant, aucun APK ne doit être
  marqué « réussi » sans callback vérifié d'une infrastructure réelle.
- `payout_methods.is_live = false` partout aujourd'hui → l'UI doit l'afficher.
- Les transactions figent `plan_snapshot` et `commission_rate` : jamais de
  recalcul rétroactif après changement de formule.
- Tout accès financier passe par `current_developer_id()` ou `has_role`.
