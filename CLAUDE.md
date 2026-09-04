# Pifiómetro — CLAUDE.md

## Qué es esto
PWA de pronósticos de fútbol uruguayo entre grupos de amigos. Multi-grupo, multi-torneo (arranca con la Liga AUF Uruguaya; a futuro Copa AUF y Libertadores). Proyecto bajo TD Forge.

## Stack
- React + Vite + TypeScript
- PWA vía `vite-plugin-pwa` (manifest + service worker)
- Supabase (Postgres + Auth + Edge Functions) — **ojo**: la base NO es un proyecto Supabase propio. Vive como schema `pifiometro` dentro del proyecto de **Nogrod** (`rkschpopukxdjsdpmqgi.supabase.co`), por el límite de 2 proyectos gratis por cuenta.
- Notificaciones: Web Push API (VAPID) + Service Worker
- Fixture/resultados: API-Football (`v3.football.api-sports.io`), plan free (100 req/día), con fallback de carga manual

## Backend ya armado — NO lo vuelvas a crear
El schema `pifiometro` ya existe, completo, con RLS activo:

Tablas: `profiles`, `notification_preferences`, `push_subscriptions`, `groups`, `group_members`, `tournaments`, `tournament_stages`, `group_tournaments`, `matches`, `predictions`.

Ya resuelto a nivel de base de datos (no reimplementar en el frontend/backend):
- Al crear un grupo (`groups`), un trigger arma automáticamente al creador como admin en `group_members` y genera el `invite_code`.
- RPC `pifiometro.join_group(invite_code text)` — único camino válido para sumarse a un grupo.
- RPC `pifiometro.regenerate_invite_code(group_id uuid)` — solo admin.
- Bloqueo de carga/edición de pronóstico una vez arrancó el partido: resuelto vía RLS (`WITH CHECK` contra `matches.kickoff_at`), no hace falta validarlo de nuevo en el cliente (aunque sí conviene deshabilitar el form en la UI para mejor UX).
- Cálculo automático de puntos (Exacto=3/Resultado=1/Pifiado=0): trigger `calculate_points()` que corre cuando un partido pasa a `status = 'finished'`.
- Regla de partidos de eliminación: `matches.home_goals`/`away_goals` SIEMPRE son el resultado reglamentario (90'). Si hubo penales, van aparte en `went_to_penalties` / `home_goals_penalties` / `away_goals_penalties`, y nunca se usan para el scoring.
- `matches` solo se escribe con la **service role key** (Edge Functions / job de sync), nunca desde el cliente.

Antes de escribir una migración nueva, mirá el schema actual (Supabase MCP o `supabase db dump --schema pifiometro`). Probablemente ya está lo que necesitás.

## Backlog: vive en Nogrod, no acá
Proyecto `Pifiometro` (prefijo `PIF`) dentro de Nogrod, mismo proyecto Supabase (`rkschpopukxdjsdpmqgi`), schema `public`.

### Cómo traer el próximo item a trabajar
```sql
select i.id, i.item_id, i.title, i.type, i.context, i.stack, i.scope_out,
       i.executable_prompt, i.story_points
from public.items i
where i.project_id = (select id from public.projects where name = 'Pifiometro')
  and i.status = 'backlog'
  and not exists (
    select 1 from public.dependencies d
    join public.items dep on dep.id = d.depends_on_id
    where d.item_id = i.id and dep.status <> 'done'
  )
order by i.sequential_id
limit 1;
```
Esto ya respeta las dependencias entre items — no trae un US si todavía le falta algo del que depende.

### Ciclo por item
1. Marcá el item `in_progress` (`update public.items set status = 'in_progress', started_at = now() where id = ...`).
2. Traé sus `acceptance_criteria` (tabla `public.acceptance_criteria`, ordenadas por `order_index`).
3. Implementá con **TDD**: test primero, después el código. Clean Code + SOLID.
4. Rama por item: `feature/PIF-N-slug`, contra `develop`. Nunca commitear directo a `main`.
5. Cuando los tests pasan y los criterios de aceptación están cubiertos: mergeá a `develop`, marcá el item `done` (`completed_at = now()`) y completá `execution_summary` con un resumen de qué se implementó y decisiones técnicas relevantes (para que el próximo item tenga contexto).
6. Seguí con el próximo item automáticamente — no esperes confirmación manual salvo que el item toque datos reales, secrets, o algo explícitamente marcado para revisar.

## Convenciones
- Story points en Fibonacci, tope 8 SP (ya vienen cargados en cada item de Nogrod).
- Nunca hardcodear la API key de API-Football ni las credenciales de Supabase — van en `.env`, y `.env`/`.env.local` van al `.gitignore` desde el primer commit.
- El cliente de Supabase debe apuntar al schema `pifiometro`, no al `public` (ese es el de Nogrod):
  ```ts
  createClient(url, anonKey, { db: { schema: 'pifiometro' } })
  ```

## Primer paso — el repo está vacío
Antes de tocar el primer item del backlog, hacé el scaffolding:
- Vite + React + TypeScript
- `vite-plugin-pwa` configurado (manifest básico + service worker, sin íconos definitivos todavía)
- Cliente de Supabase (`@supabase/supabase-js`) apuntando al proyecto de Nogrod, schema `pifiometro`
- Estructura de carpetas por dominio: `auth/`, `groups/`, `tournaments/`, `predictions/`, `standings/`, `notifications/`
- `.env.example` con las variables necesarias: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (las saco del dashboard de Nogrod en Supabase, Settings → API)
- Setup de testing (Vitest + Testing Library) antes de escribir el primer test real

Después del scaffolding, arrancá por **PIF-1** (Registrar e iniciar sesión) y seguí el ciclo de arriba.
