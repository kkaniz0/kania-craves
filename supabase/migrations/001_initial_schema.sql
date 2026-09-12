-- Kania Craves initial schema + RLS
-- Apply in Supabase SQL editor when connecting a project.

create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  address text,
  area text,
  city text,
  country text default 'Indonesia',
  latitude double precision,
  longitude double precision,
  cuisine text,
  category text,
  price_level int check (price_level between 1 and 4),
  external_rating numeric(3,2),
  external_review_count int,
  opening_hours text,
  photo_url text,
  provider text default 'manual',
  provider_place_id text,
  is_demo boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restaurants_geo_idx on public.restaurants (latitude, longitude);
create index if not exists restaurants_name_idx on public.restaurants using gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(cuisine,'') || ' ' || coalesce(area,'')));

create table if not exists public.user_restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  status text not null check (status in ('wishlist','visited','favorite','want_to_try_again','not_recommended','discover')),
  personal_rating numeric(3,2),
  priority text default 'medium' check (priority in ('high','medium','low')),
  notes text default '',
  favorite boolean default false,
  recommended_menu text default '',
  tags text[] default '{}',
  source text default 'manual',
  would_visit_again boolean,
  date_added timestamptz not null default now(),
  last_visited timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);

create table if not exists public.restaurant_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  visit_date date not null default current_date,
  rating numeric(3,2),
  food_rating numeric(3,2),
  service_rating numeric(3,2),
  ambience_rating numeric(3,2),
  value_rating numeric(3,2),
  spending numeric(12,2),
  ordered_items text default '',
  notes text default '',
  would_return boolean,
  companion text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_restaurants (
  collection_id uuid not null references public.collections (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, restaurant_id)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cuisine_weights jsonb default '{}'::jsonb,
  price_preference int,
  save_location_history boolean not null default false,
  recommendation_weights jsonb default '{}'::jsonb,
  favorite_areas text[] default '{}',
  budget_preference text,
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_tags (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  tag text not null,
  unique (restaurant_id, user_id, tag)
);

create table if not exists public.restaurant_external_data (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  provider text not null,
  provider_place_id text not null,
  raw jsonb default '{}'::jsonb,
  synced_at timestamptz default now(),
  unique (provider, provider_place_id)
);

create table if not exists public.recommendation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  score numeric(5,2),
  reasons jsonb default '[]'::jsonb,
  feedback text check (feedback in ('up','down') or feedback is null),
  context jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.location_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  area text,
  city text,
  created_at timestamptz not null default now()
);

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.user_restaurants enable row level security;
alter table public.restaurant_visits enable row level security;
alter table public.collections enable row level security;
alter table public.collection_restaurants enable row level security;
alter table public.user_preferences enable row level security;
alter table public.restaurant_tags enable row level security;
alter table public.restaurant_external_data enable row level security;
alter table public.recommendation_history enable row level security;
alter table public.location_history enable row level security;

-- Profiles: own row only
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

-- Restaurants: readable by authenticated; insert/update by authenticated (shared place entities)
create policy restaurants_select_auth on public.restaurants for select to authenticated using (true);
create policy restaurants_insert_auth on public.restaurants for insert to authenticated with check (true);
create policy restaurants_update_auth on public.restaurants for update to authenticated using (true);

-- User-scoped tables
create policy ur_all_own on public.user_restaurants for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy visits_all_own on public.restaurant_visits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy collections_all_own on public.collections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy prefs_all_own on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tags_all_own on public.restaurant_tags for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rec_hist_all_own on public.recommendation_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy loc_hist_all_own on public.location_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy collection_rest_own on public.collection_restaurants for all using (
  exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
) with check (
  exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
);

create policy external_data_select on public.restaurant_external_data for select to authenticated using (true);
create policy external_data_insert on public.restaurant_external_data for insert to authenticated with check (true);

-- Haversine helper (meters) for nearby queries without PostGIS
create or replace function public.haversine_meters(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(
    sin(radians(lat2 - lat1)/2)^2 +
    cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lng2 - lng1)/2)^2
  ));
$$;
