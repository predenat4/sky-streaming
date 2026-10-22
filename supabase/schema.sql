-- SCHEMA
-- 1. Tables
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.inscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nom_complet text not null check (length(nom_complet) >= 2 and length(nom_complet) <= 120),
  plan text not null check (plan in ('standard', 'premium')),
  operateur_choisi text not null check (operateur_choisi in ('natcash', 'moncash')),
  numero_paiement text not null check (numero_paiement ~ '^[0-9]{8,15}$'),
  nom_profil text not null check (length(nom_profil) >= 2 and length(nom_profil) <= 60),
  codes_profil text check (length(codes_profil) <= 1000),
  whatsapp text not null check (whatsapp ~ '^[0-9]{8,15}$'),
  statut text not null default 'nouvelle' check (statut in ('nouvelle', 'en_discussion', 'paye', 'livre', 'annule')),
  note_admin text check (length(note_admin) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.paiements (
  id uuid primary key default gen_random_uuid(),
  inscription_id uuid not null references public.inscriptions(id) on delete cascade,
  operateur text not null check (operateur in ('natcash', 'moncash')),
  reference_transaction text not null unique check (length(reference_transaction) >= 3 and length(reference_transaction) <= 100),
  montant integer not null check (montant > 0),
  valide_par uuid references auth.users(id),
  validated_at timestamptz not null default now()
);

-- 2. Functions
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (select 1 from public.admins where user_id = auth.uid());
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. Triggers
create trigger set_updated_at_inscriptions
before update on public.inscriptions
for each row execute function public.set_updated_at();

-- 4. RLS
alter table public.admins enable row level security;
alter table public.inscriptions enable row level security;
alter table public.paiements enable row level security;

-- Policies admins
create policy "admins_select_own" on public.admins
for select using (user_id = auth.uid());

-- Policies inscriptions
create policy "inscriptions_insert_own" on public.inscriptions
for insert with check (user_id = auth.uid() and statut = 'nouvelle' and note_admin is null);

create policy "inscriptions_select_own_or_admin" on public.inscriptions
for select using (user_id = auth.uid() or public.is_admin());

create policy "inscriptions_update_admin" on public.inscriptions
for update using (public.is_admin()) with check (public.is_admin());

create policy "inscriptions_delete_admin" on public.inscriptions
for delete using (public.is_admin());

-- Policies paiements
create policy "paiements_admin_all" on public.paiements
for all using (public.is_admin()) with check (public.is_admin());
