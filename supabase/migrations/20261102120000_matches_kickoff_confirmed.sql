-- Horario confirmado vs tentativo.
--
-- Algunas fechas se cargan con un horario de relleno (ej. fechas 36/37 al
-- 10/10 y 17/10 a las 12:00) hasta que se publica el real. Con el cierre de
-- pronosticos al kickoff, un relleno vencido trababa la fecha entera.
--
-- matches.kickoff_confirmed distingue los dos casos:
--   true  -> horario real (lo publico tenfield a futuro, o lo cargo el admin
--            marcado como confirmado). Cierra los pronosticos al kickoff.
--   false -> horario tentativo. No cierra nada: se puede pronosticar hasta
--            que se confirme el horario real (o se cargue el resultado).
--
-- Quien lo escribe:
--   - tenfield-sync: true si el partido ya se jugo o si el horario publicado
--     es futuro. Un horario pasado sin resultado no toca la marca (puede ser
--     un partido en juego o un relleno vencido, no se distingue).
--   - matches-admin: checkbox "Horario confirmado" (por defecto, si).

alter table pifiometro.matches
  add column kickoff_confirmed boolean not null default true;

-- Backfill: los partidos sin resultado con horario de hace mas de 3 dias son
-- rellenos (nadie tarda 3 dias en cargar un resultado). Hoy: fechas 36 y 37.
update pifiometro.matches
   set kickoff_confirmed = false
 where status <> 'finished'
   and kickoff_at < now() - interval '3 days';

-- Cierre de pronosticos: solo con horario confirmado.
drop policy predictions_insert_before_kickoff on pifiometro.predictions;
create policy predictions_insert_before_kickoff
  on pifiometro.predictions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and pifiometro.is_group_member(group_id)
    and exists (
      select 1 from pifiometro.matches m
      where m.id = predictions.match_id
        and m.status <> 'finished'
        and (not m.kickoff_confirmed or m.kickoff_at > now())
    )
  );

drop policy predictions_update_before_kickoff on pifiometro.predictions;
create policy predictions_update_before_kickoff
  on pifiometro.predictions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from pifiometro.matches m
      where m.id = predictions.match_id
        and m.status <> 'finished'
        and (not m.kickoff_confirmed or m.kickoff_at > now())
    )
  );

-- Pronosticos ajenos: se ven recien cuando el pronostico propio ya no se
-- puede cambiar. Si no, con un horario tentativo vencido se podrian ver los
-- de los demas y despues editar el propio.
drop policy predictions_select on pifiometro.predictions;
create policy predictions_select
  on pifiometro.predictions for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      pifiometro.is_group_member(group_id)
      and exists (
        select 1 from pifiometro.matches m
        where m.id = predictions.match_id
          and (m.status = 'finished' or (m.kickoff_confirmed and m.kickoff_at <= now()))
      )
    )
  );

-- Recordatorios de pronosticos pendientes: no avisar por horarios tentativos.
create or replace function pifiometro.count_pending_predictions(p_user_id uuid, p_within_hours numeric)
 returns integer
 language sql
 stable security definer
 set search_path to 'pifiometro', 'public'
as $function$
  select count(*)::integer
  from pifiometro.matches m
  join pifiometro.group_tournaments gt on gt.tournament_id = m.tournament_id and gt.active = true
  join pifiometro.group_members gm on gm.group_id = gt.group_id and gm.user_id = p_user_id
  where m.kickoff_confirmed
    and m.kickoff_at > now()
    and m.kickoff_at <= now() + (p_within_hours || ' hours')::interval
    and not exists (
      select 1 from pifiometro.predictions p
      where p.match_id = m.id and p.group_id = gt.group_id and p.user_id = p_user_id
    );
$function$;
