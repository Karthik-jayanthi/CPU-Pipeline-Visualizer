-- CPU Pipeline Visualizer — Supabase schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ─── Profiles ──────────────────────────────────────────────────────────────

create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  email        text not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── Simulations ───────────────────────────────────────────────────────────

create table public.simulations (
  id             uuid default uuid_generate_v4() primary key,
  user_id        uuid references auth.users on delete cascade not null,
  name           text not null,
  description    text,
  program_text   text not null default '',
  config         jsonb not null default '{
    "enableForwarding": true,
    "branchPrediction": "always-not-taken",
    "stallOnLoad": true
  }',
  result_summary jsonb,          -- { totalCycles, cpi, stallCycles }
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

alter table public.simulations enable row level security;

create policy "Users can manage their own simulations"
  on public.simulations for all
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger simulations_updated_at
  before update on public.simulations
  for each row execute procedure public.touch_updated_at();

-- Index for fast user lookups
create index simulations_user_id_idx on public.simulations (user_id, updated_at desc);


-- ─── Execution History ─────────────────────────────────────────────────────

create table public.execution_events (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  simulation_id uuid references public.simulations on delete cascade,
  program_hash  text,             -- SHA of program text for dedup
  total_cycles  int,
  total_instrs  int,
  cpi           numeric(6,3),
  stall_cycles  int,
  data_hazards  int,
  ctrl_hazards  int,
  forwarding_ct int,
  ran_at        timestamptz default now() not null
);

alter table public.execution_events enable row level security;

create policy "Users can view their own events"
  on public.execution_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own events"
  on public.execution_events for insert
  with check (auth.uid() = user_id);

create index exec_events_user_idx on public.execution_events (user_id, ran_at desc);
