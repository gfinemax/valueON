create table if not exists public.valueon_projects (
  id text primary key,
  data jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.valueon_projects enable row level security;

drop policy if exists "valueon_projects_public_select" on public.valueon_projects;
drop policy if exists "valueon_projects_public_insert" on public.valueon_projects;
drop policy if exists "valueon_projects_public_update" on public.valueon_projects;

create policy "valueon_projects_public_select"
on public.valueon_projects
for select
to anon
using (true);

create policy "valueon_projects_public_insert"
on public.valueon_projects
for insert
to anon
with check (true);

create policy "valueon_projects_public_update"
on public.valueon_projects
for update
to anon
using (true)
with check (true);

create or replace function public.set_valueon_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_valueon_projects_updated_at on public.valueon_projects;

create trigger set_valueon_projects_updated_at
before update on public.valueon_projects
for each row
execute function public.set_valueon_projects_updated_at();
