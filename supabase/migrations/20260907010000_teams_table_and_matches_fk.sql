-- PIF-30: tabla de equipos (nombre real + alias + slug + logo), reemplaza
-- el texto libre de matches.home_team/away_team.

create extension if not exists unaccent with schema extensions;

create or replace function pifiometro.slugify(input text)
returns text
language sql
immutable
set search_path = pifiometro, extensions
as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(input)), '[^a-z0-9]+', '-', 'g'));
$$;

create table pifiometro.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  alias text,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table pifiometro.teams enable row level security;

create policy teams_select_all
  on pifiometro.teams for select
  to authenticated
  using (true);

create policy teams_insert_superadmin
  on pifiometro.teams for insert
  to authenticated
  with check (pifiometro.is_superadmin());

create policy teams_update_superadmin
  on pifiometro.teams for update
  to authenticated
  using (pifiometro.is_superadmin())
  with check (pifiometro.is_superadmin());

create policy teams_delete_superadmin
  on pifiometro.teams for delete
  to authenticated
  using (pifiometro.is_superadmin());

-- Semilla: los 16 clubes cuyos logos ya estan en public/team-logos/ (Martin
-- los subio por fuera). El slug de cada uno matchea 1 a 1 el nombre de
-- archivo, tal como pidio el usuario -- no hace falta tocar los logos.
insert into pifiometro.teams (name, slug) values
  ('Albion', 'albion'),
  ('Boston River', 'boston-river'),
  ('Central Español', 'central-espanol'),
  ('Cerro Largo', 'cerro-largo'),
  ('Cerro', 'cerro'),
  ('Danubio', 'danubio'),
  ('Defensor Sporting', 'defensor'),
  ('Deportivo Maldonado', 'deportivo-maldonado'),
  ('Juventud', 'juventud'),
  ('Liverpool', 'liverpool'),
  ('Nacional', 'nacional'),
  ('Peñarol', 'penarol'),
  ('Progreso', 'progreso'),
  ('Racing', 'racing'),
  ('Torque', 'torque'),
  ('Wanderers', 'wanderers');

alter table pifiometro.matches
  add column home_team_id uuid references pifiometro.teams(id),
  add column away_team_id uuid references pifiometro.teams(id);

-- Backfill sin perdida de datos: por cada home_team/away_team de texto libre
-- que ya exista en matches, crea (o reusa por slug) la fila de teams
-- correspondiente y setea el *_id nuevo. No-op hoy (matches esta vacia en
-- produccion) pero es el camino correcto si en algun momento hay datos.
insert into pifiometro.teams (name, slug)
select distinct t.name, pifiometro.slugify(t.name)
from (
  select home_team as name from pifiometro.matches where home_team is not null
  union
  select away_team as name from pifiometro.matches where away_team is not null
) t
on conflict (slug) do nothing;

update pifiometro.matches m
set home_team_id = t.id
from pifiometro.teams t
where m.home_team is not null and t.slug = pifiometro.slugify(m.home_team) and m.home_team_id is null;

update pifiometro.matches m
set away_team_id = t.id
from pifiometro.teams t
where m.away_team is not null and t.slug = pifiometro.slugify(m.away_team) and m.away_team_id is null;

-- home_team/away_team quedan deprecated (se dropean en un item futuro, una
-- vez confirmado en produccion que el backfill no perdio nada). Se sacan de
-- NOT NULL porque de aca en mas se cargan partidos solo con *_team_id.
alter table pifiometro.matches alter column home_team drop not null;
alter table pifiometro.matches alter column away_team drop not null;
