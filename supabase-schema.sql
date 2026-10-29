-- Rumbo: cuentas, ofertas, favoritos, visitas, valoraciones y selección.
-- Ejecuta este archivo completo en Supabase > SQL Editor > New query.
create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('candidato', 'empresa')),
  full_name text not null default '',
  contact_email text not null default '',
  phone text not null default '',
  city text not null default '',
  destination text not null default '',
  sector text not null default '',
  bio text not null default '',
  cv_summary text not null default '',
  cv_experience text not null default '',
  cv_education text not null default '',
  cv_skills text not null default '',
  cv_languages text not null default '',
  cv_path text not null default '',
  cv_name text not null default '',
  company_name text not null default '',
  tax_id text not null default '',
  company_country text not null default '',
  legal_form text not null default '',
  company_address text not null default '',
  company_phone text not null default '',
  website text not null default '',
  vacancy_count integer not null default 0 check (vacancy_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_public_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  full_name text not null default '',
  city text not null default '',
  sector text not null default '',
  destination text not null default '',
  bio text not null default '',
  avatar_path text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.job_offers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  title text not null,
  country text not null,
  location text not null default '',
  sector text not null,
  sector_label text not null,
  contract_type text not null check (contract_type in ('corta', 'larga')),
  duration_label text not null,
  vacancies integer not null default 1 check (vacancies > 0),
  salary text not null default '',
  housing text not null default '',
  deadline text not null default '',
  details text not null default '',
  application_email text not null default '',
  promotion_requested boolean not null default false,
  sponsored boolean not null default false,
  is_active boolean not null default true,
  views_count integer not null default 0 check (views_count >= 0),
  favorites_count integer not null default 0 check (favorites_count >= 0),
  average_rating numeric(3,2) not null default 0 check (average_rating between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.job_offers add column if not exists promotion_requested boolean not null default false;

create table if not exists public.offer_favorites (
  offer_id uuid not null references public.job_offers(id) on delete cascade,
  candidate_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (offer_id, candidate_id)
);

create table if not exists public.offer_views (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.job_offers(id) on delete cascade,
  candidate_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  session_id uuid not null,
  created_at timestamptz not null default now(),
  unique (offer_id, candidate_id, session_id)
);

create table if not exists public.offer_ratings (
  offer_id uuid not null references public.job_offers(id) on delete cascade,
  candidate_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (offer_id, candidate_id)
);

create table if not exists public.candidate_pipeline (
  offer_id uuid not null references public.job_offers(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  stage text not null check (stage in ('proceso', 'contratado')),
  updated_at timestamptz not null default now(),
  primary key (offer_id, candidate_id)
);

create table if not exists public.offer_applications (
  offer_id uuid not null references public.job_offers(id) on delete cascade,
  candidate_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  status text not null default 'recibida' check (status in ('recibida', 'proceso', 'contratada', 'descartada')),
  cover_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (offer_id, candidate_id)
);

alter table public.profiles add column if not exists contact_email text not null default '';
alter table public.candidate_public_profiles add column if not exists avatar_path text not null default '';
update public.profiles p set contact_email = u.email from auth.users u where p.id = u.id and p.contact_email = '';

create index if not exists job_offers_company_id_idx on public.job_offers(company_id);
create index if not exists job_offers_country_sector_idx on public.job_offers(country, sector);
create index if not exists offer_favorites_candidate_id_idx on public.offer_favorites(candidate_id);
create index if not exists offer_views_candidate_id_idx on public.offer_views(candidate_id);
create index if not exists candidate_pipeline_candidate_id_idx on public.candidate_pipeline(candidate_id);
create index if not exists offer_applications_candidate_id_idx on public.offer_applications(candidate_id);

create or replace function private.current_role()
returns text language sql stable security definer set search_path = ''
as $$ select p.role from public.profiles p where p.id = (select auth.uid()) $$;

create or replace function private.company_profile_complete()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'empresa'
      and length(trim(p.company_name)) > 0 and length(trim(p.tax_id)) >= 7
      and length(trim(p.company_country)) > 0 and length(trim(p.company_address)) > 0
      and length(trim(p.company_phone)) > 0
  )
$$;

create or replace function private.is_company_offer(target_offer uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.job_offers o
    where o.id = target_offer and o.company_id = (select auth.uid())
  )
$$;

create or replace function private.can_company_view_candidate(target_candidate uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.current_role() = 'empresa' and (
    exists (select 1 from public.offer_favorites f join public.job_offers o on o.id = f.offer_id where f.candidate_id = target_candidate and o.company_id = (select auth.uid()))
    or exists (select 1 from public.offer_views v join public.job_offers o on o.id = v.offer_id where v.candidate_id = target_candidate and o.company_id = (select auth.uid()))
    or exists (select 1 from public.candidate_pipeline p join public.job_offers o on o.id = p.offer_id where p.candidate_id = target_candidate and o.company_id = (select auth.uid()))
    or exists (select 1 from public.offer_applications a join public.job_offers o on o.id = a.offer_id where a.candidate_id = target_candidate and o.company_id = (select auth.uid()))
  )
$$;

create or replace function private.can_manage_candidate(target_offer uuid, target_candidate uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_company_offer(target_offer) and (
    exists (select 1 from public.offer_favorites f where f.offer_id = target_offer and f.candidate_id = target_candidate)
    or exists (select 1 from public.offer_views v where v.offer_id = target_offer and v.candidate_id = target_candidate)
    or exists (select 1 from public.candidate_pipeline p where p.offer_id = target_offer and p.candidate_id = target_candidate)
    or exists (select 1 from public.offer_applications a where a.offer_id = target_offer and a.candidate_id = target_candidate)
  )
$$;

create or replace function private.company_can_view_cv(target_candidate uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.current_role() = 'empresa' and exists (
    select 1 from public.candidate_pipeline p
    join public.job_offers o on o.id = p.offer_id
    where p.candidate_id = target_candidate and o.company_id = (select auth.uid())
      and p.stage in ('proceso', 'contratado')
  )
$$;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.company_profile_complete() to authenticated;
grant execute on function private.is_company_offer(uuid) to authenticated;
grant execute on function private.can_company_view_candidate(uuid) to authenticated;
grant execute on function private.can_manage_candidate(uuid, uuid) to authenticated;
grant execute on function private.company_can_view_cv(uuid) to authenticated;

create or replace function public.keep_profile_role()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'El tipo de cuenta no se puede cambiar después del registro.';
  end if;
  return new;
end
$$;
drop trigger if exists keep_profile_role_trigger on public.profiles;
create trigger keep_profile_role_trigger before update on public.profiles
for each row execute function public.keep_profile_role();

create or replace function public.protect_profile_fields_by_role()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if old.role = 'candidato' and (
    new.company_name is distinct from old.company_name or new.tax_id is distinct from old.tax_id or
    new.company_country is distinct from old.company_country or new.legal_form is distinct from old.legal_form or
    new.company_address is distinct from old.company_address or new.company_phone is distinct from old.company_phone or
    new.website is distinct from old.website or new.vacancy_count is distinct from old.vacancy_count
  ) then
    raise exception 'Una cuenta candidata no puede editar los datos de una empresa.';
  end if;
  if old.role = 'empresa' and (
    new.phone is distinct from old.phone or new.city is distinct from old.city or
    new.destination is distinct from old.destination or new.sector is distinct from old.sector or
    new.bio is distinct from old.bio or new.cv_summary is distinct from old.cv_summary or
    new.cv_experience is distinct from old.cv_experience or new.cv_education is distinct from old.cv_education or
    new.cv_skills is distinct from old.cv_skills or new.cv_languages is distinct from old.cv_languages or
    new.cv_path is distinct from old.cv_path or new.cv_name is distinct from old.cv_name
  ) then
    raise exception 'Una cuenta de empresa no puede editar los datos personales o el CV de una persona candidata.';
  end if;
  return new;
end
$$;
drop trigger if exists protect_profile_fields_by_role_trigger on public.profiles;
create trigger protect_profile_fields_by_role_trigger before update on public.profiles
for each row execute function public.protect_profile_fields_by_role();

create or replace function public.create_rumbo_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  declared_vacancies integer := 0;
begin
  if coalesce(meta->>'vacancy_count', '') ~ '^[0-9]{1,6}$' then
    declared_vacancies := least(999999, (meta->>'vacancy_count')::integer);
  end if;
  insert into public.profiles (
    id, role, full_name, contact_email, phone, city, destination, sector, bio,
    company_name, tax_id, company_country, legal_form, company_address,
    company_phone, website, vacancy_count
  ) values (
    new.id,
    case when meta->>'role' = 'empresa' then 'empresa' else 'candidato' end,
    coalesce(meta->>'full_name', ''), coalesce(new.email, ''), coalesce(meta->>'phone', ''),
    coalesce(meta->>'city', ''), coalesce(meta->>'destination', ''),
    coalesce(meta->>'sector', ''), coalesce(meta->>'bio', ''),
    coalesce(meta->>'company_name', ''), coalesce(meta->>'tax_id', ''),
    coalesce(meta->>'company_country', ''), coalesce(meta->>'legal_form', ''),
    coalesce(meta->>'company_address', ''), coalesce(meta->>'company_phone', ''),
    coalesce(meta->>'website', ''), declared_vacancies
  );
  if meta->>'role' = 'candidato' then
    insert into public.candidate_public_profiles (user_id, full_name, city, sector, destination, bio)
    values (new.id, coalesce(meta->>'full_name', ''), coalesce(meta->>'city', ''), coalesce(meta->>'sector', ''), coalesce(meta->>'destination', ''), coalesce(meta->>'bio', ''));
  end if;
  return new;
end
$$;
drop trigger if exists create_rumbo_profile_trigger on auth.users;
create trigger create_rumbo_profile_trigger after insert on auth.users
for each row execute function public.create_rumbo_profile();

create or replace function public.bump_offer_views()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin update public.job_offers set views_count = views_count + 1, updated_at = now() where id = new.offer_id; return new; end $$;
drop trigger if exists bump_offer_views_trigger on public.offer_views;
create trigger bump_offer_views_trigger after insert on public.offer_views for each row execute function public.bump_offer_views();

create or replace function public.bump_offer_favorites()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.job_offers set favorites_count = favorites_count + 1, updated_at = now() where id = new.offer_id;
    return new;
  end if;
  update public.job_offers set favorites_count = greatest(0, favorites_count - 1), updated_at = now() where id = old.offer_id;
  return old;
end
$$;
drop trigger if exists bump_offer_favorites_insert_trigger on public.offer_favorites;
drop trigger if exists bump_offer_favorites_delete_trigger on public.offer_favorites;
create trigger bump_offer_favorites_insert_trigger after insert on public.offer_favorites for each row execute function public.bump_offer_favorites();
create trigger bump_offer_favorites_delete_trigger after delete on public.offer_favorites for each row execute function public.bump_offer_favorites();

create or replace function public.refresh_offer_rating()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare target_offer uuid;
begin
  if tg_op = 'DELETE' then target_offer := old.offer_id; else target_offer := new.offer_id; end if;
  update public.job_offers o set
    average_rating = coalesce((select round(avg(r.stars)::numeric, 2) from public.offer_ratings r where r.offer_id = target_offer), 0),
    rating_count = (select count(*) from public.offer_ratings r where r.offer_id = target_offer),
    updated_at = now()
  where o.id = target_offer;
  if tg_op = 'DELETE' then return old; else return new; end if;
end
$$;
drop trigger if exists refresh_offer_rating_trigger on public.offer_ratings;
create trigger refresh_offer_rating_trigger after insert or update or delete on public.offer_ratings for each row execute function public.refresh_offer_rating();

alter table public.profiles enable row level security;
alter table public.candidate_public_profiles enable row level security;
alter table public.job_offers enable row level security;
alter table public.offer_favorites enable row level security;
alter table public.offer_views enable row level security;
alter table public.offer_ratings enable row level security;
alter table public.candidate_pipeline enable row level security;
alter table public.offer_applications enable row level security;

revoke all on public.profiles, public.candidate_public_profiles, public.job_offers, public.offer_favorites, public.offer_views, public.offer_ratings, public.candidate_pipeline, public.offer_applications from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, city, destination, sector, bio, cv_summary, cv_experience, cv_education, cv_skills, cv_languages, cv_path, cv_name, company_name, tax_id, company_country, legal_form, company_address, company_phone, website, vacancy_count) on public.profiles to authenticated;
grant select, insert, update on public.candidate_public_profiles to authenticated;
grant select on public.job_offers to anon, authenticated;
grant insert (company_id, company_name, title, country, location, sector, sector_label, contract_type, duration_label, vacancies, salary, housing, deadline, details, application_email, promotion_requested, is_active) on public.job_offers to authenticated;
grant update (company_name, title, country, location, sector, sector_label, contract_type, duration_label, vacancies, salary, housing, deadline, details, application_email, promotion_requested, is_active) on public.job_offers to authenticated;
grant delete on public.job_offers to authenticated;
grant select, insert, delete on public.offer_favorites to authenticated;
grant select, insert on public.offer_views to authenticated;
grant select, insert, update on public.offer_ratings to authenticated;
grant select, insert, update, delete on public.candidate_pipeline to authenticated;
grant select, insert, update, delete on public.offer_applications to authenticated;

drop policy if exists "profile owner reads own profile" on public.profiles;
create policy "profile owner reads own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "company reads selected candidate profile" on public.profiles;
create policy "company reads selected candidate profile" on public.profiles for select to authenticated using ((select private.company_can_view_cv(id)));
drop policy if exists "profile owner updates own profile" on public.profiles;
create policy "profile owner updates own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "candidate reads own or interested profile" on public.candidate_public_profiles;
create policy "candidate reads own or interested profile" on public.candidate_public_profiles for select to authenticated using (user_id = (select auth.uid()) or (select private.can_company_view_candidate(user_id)));
drop policy if exists "candidate creates own public profile" on public.candidate_public_profiles;
create policy "candidate creates own public profile" on public.candidate_public_profiles for insert to authenticated with check (user_id = (select auth.uid()) and (select private.current_role()) = 'candidato');
drop policy if exists "candidate updates own public profile" on public.candidate_public_profiles;
create policy "candidate updates own public profile" on public.candidate_public_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and (select private.current_role()) = 'candidato');

drop policy if exists "candidate or offer owner reads applications" on public.offer_applications;
create policy "candidate or offer owner reads applications" on public.offer_applications for select to authenticated using (candidate_id = (select auth.uid()) or (select private.is_company_offer(offer_id)));
drop policy if exists "candidate applies to active offer" on public.offer_applications;
create policy "candidate applies to active offer" on public.offer_applications for insert to authenticated with check (candidate_id = (select auth.uid()) and (select private.current_role()) = 'candidato' and exists (select 1 from public.job_offers o where o.id = offer_id and o.is_active));
drop policy if exists "company updates own offer applications" on public.offer_applications;
create policy "company updates own offer applications" on public.offer_applications for update to authenticated using ((select private.current_role()) = 'empresa' and (select private.is_company_offer(offer_id))) with check ((select private.current_role()) = 'empresa' and (select private.is_company_offer(offer_id)));
drop policy if exists "candidate withdraws own application" on public.offer_applications;
create policy "candidate withdraws own application" on public.offer_applications for delete to authenticated using (candidate_id = (select auth.uid()) and (select private.current_role()) = 'candidato');

drop policy if exists "active offers are public and owners see all" on public.job_offers;
create policy "active offers are public and owners see all" on public.job_offers for select to anon, authenticated using (is_active or company_id = (select auth.uid()));
drop policy if exists "companies publish own offers" on public.job_offers;
create policy "companies publish own offers" on public.job_offers for insert to authenticated with check (company_id = (select auth.uid()) and (select private.current_role()) = 'empresa' and (select private.company_profile_complete()));
drop policy if exists "companies update own offers" on public.job_offers;
create policy "companies update own offers" on public.job_offers for update to authenticated using (company_id = (select auth.uid()) and (select private.current_role()) = 'empresa') with check (company_id = (select auth.uid()) and (select private.current_role()) = 'empresa' and (select private.company_profile_complete()));
drop policy if exists "companies delete own offers" on public.job_offers;
create policy "companies delete own offers" on public.job_offers for delete to authenticated using (company_id = (select auth.uid()) and (select private.current_role()) = 'empresa');

drop policy if exists "candidate or offer owner reads favorites" on public.offer_favorites;
create policy "candidate or offer owner reads favorites" on public.offer_favorites for select to authenticated using (candidate_id = (select auth.uid()) or (select private.is_company_offer(offer_id)));
drop policy if exists "candidate favorites an offer" on public.offer_favorites;
create policy "candidate favorites an offer" on public.offer_favorites for insert to authenticated with check (candidate_id = (select auth.uid()) and (select private.current_role()) = 'candidato');
drop policy if exists "candidate removes own favorite" on public.offer_favorites;
create policy "candidate removes own favorite" on public.offer_favorites for delete to authenticated using (candidate_id = (select auth.uid()) and (select private.current_role()) = 'candidato');

drop policy if exists "candidate or offer owner reads views" on public.offer_views;
create policy "candidate or offer owner reads views" on public.offer_views for select to authenticated using (candidate_id = (select auth.uid()) or (select private.is_company_offer(offer_id)));
drop policy if exists "candidate records own view" on public.offer_views;
create policy "candidate records own view" on public.offer_views for insert to authenticated with check (candidate_id = (select auth.uid()) and (select private.current_role()) = 'candidato');

drop policy if exists "candidate or offer owner reads ratings" on public.offer_ratings;
create policy "candidate or offer owner reads ratings" on public.offer_ratings for select to authenticated using (candidate_id = (select auth.uid()) or (select private.is_company_offer(offer_id)));
drop policy if exists "candidate rates an offer" on public.offer_ratings;
create policy "candidate rates an offer" on public.offer_ratings for insert to authenticated with check (candidate_id = (select auth.uid()) and (select private.current_role()) = 'candidato');
drop policy if exists "candidate updates own rating" on public.offer_ratings;
create policy "candidate updates own rating" on public.offer_ratings for update to authenticated using (candidate_id = (select auth.uid()) and (select private.current_role()) = 'candidato') with check (candidate_id = (select auth.uid()) and (select private.current_role()) = 'candidato');

drop policy if exists "candidate or owner reads pipeline" on public.candidate_pipeline;
create policy "candidate or owner reads pipeline" on public.candidate_pipeline for select to authenticated using (candidate_id = (select auth.uid()) or (select private.is_company_offer(offer_id)));
drop policy if exists "company starts selection" on public.candidate_pipeline;
create policy "company starts selection" on public.candidate_pipeline for insert to authenticated with check ((select private.current_role()) = 'empresa' and (select private.can_manage_candidate(offer_id, candidate_id)));
drop policy if exists "company updates selection" on public.candidate_pipeline;
create policy "company updates selection" on public.candidate_pipeline for update to authenticated using ((select private.current_role()) = 'empresa' and (select private.is_company_offer(offer_id))) with check ((select private.current_role()) = 'empresa' and (select private.can_manage_candidate(offer_id, candidate_id)));
drop policy if exists "company removes selection" on public.candidate_pipeline;
create policy "company removes selection" on public.candidate_pipeline for delete to authenticated using ((select private.current_role()) = 'empresa' and (select private.is_company_offer(offer_id)));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rumbo-cvs', 'rumbo-cvs', false, 5000000, array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = 5000000;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rumbo-avatars', 'rumbo-avatars', false, 2000000, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 2000000;

drop policy if exists "candidate manages own avatar" on storage.objects;
create policy "candidate manages own avatar" on storage.objects for insert to authenticated with check (bucket_id = 'rumbo-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and (select private.current_role()) = 'candidato');
drop policy if exists "candidate updates own avatar" on storage.objects;
create policy "candidate updates own avatar" on storage.objects for update to authenticated using (bucket_id = 'rumbo-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and (select private.current_role()) = 'candidato') with check (bucket_id = 'rumbo-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and (select private.current_role()) = 'candidato');
drop policy if exists "interested company reads avatar" on storage.objects;
create policy "interested company reads avatar" on storage.objects for select to authenticated using (bucket_id = 'rumbo-avatars' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.can_company_view_candidate(((storage.foldername(name))[1])::uuid))));
drop policy if exists "candidate deletes own avatar" on storage.objects;
create policy "candidate deletes own avatar" on storage.objects for delete to authenticated using (bucket_id = 'rumbo-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and (select private.current_role()) = 'candidato');

drop policy if exists "candidate manages own cv" on storage.objects;
create policy "candidate manages own cv" on storage.objects for insert to authenticated with check (bucket_id = 'rumbo-cvs' and (storage.foldername(name))[1] = (select auth.uid())::text and (select private.current_role()) = 'candidato');
drop policy if exists "candidate updates own cv" on storage.objects;
create policy "candidate updates own cv" on storage.objects for update to authenticated using (bucket_id = 'rumbo-cvs' and (storage.foldername(name))[1] = (select auth.uid())::text and (select private.current_role()) = 'candidato') with check (bucket_id = 'rumbo-cvs' and (storage.foldername(name))[1] = (select auth.uid())::text and (select private.current_role()) = 'candidato');
drop policy if exists "candidate or employer in selection reads cv" on storage.objects;
create policy "candidate or employer in selection reads cv" on storage.objects for select to authenticated using (bucket_id = 'rumbo-cvs' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.company_can_view_cv(((storage.foldername(name))[1])::uuid))));
drop policy if exists "candidate deletes own cv" on storage.objects;
create policy "candidate deletes own cv" on storage.objects for delete to authenticated using (bucket_id = 'rumbo-cvs' and (storage.foldername(name))[1] = (select auth.uid())::text and (select private.current_role()) = 'candidato');

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'job_offers') then alter publication supabase_realtime add table public.job_offers; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'offer_favorites') then alter publication supabase_realtime add table public.offer_favorites; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'offer_views') then alter publication supabase_realtime add table public.offer_views; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'offer_ratings') then alter publication supabase_realtime add table public.offer_ratings; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'candidate_pipeline') then alter publication supabase_realtime add table public.candidate_pipeline; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'offer_applications') then alter publication supabase_realtime add table public.offer_applications; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'candidate_public_profiles') then alter publication supabase_realtime add table public.candidate_public_profiles; end if;
  end if;
end
$$;
