-- Ahora que los partidos tienen fecha y hora reales (sync con Tenfield +
-- carga manual con horario), kickoff_at vuelve a ser confiable: el
-- pronostico se cierra en cuanto arranca el partido, no recien cuando se
-- carga el resultado.
--
-- Se mantiene ademas status <> 'finished' como red de seguridad: un partido
-- con resultado cargado nunca se puede pronosticar, aunque su kickoff_at
-- haya quedado mal (en el futuro). Asi calculate_points() nunca queda
-- desactualizado por una edicion posterior.
--
-- Partidos sin horario real (placeholder en el pasado) quedan cerrados hasta
-- que se les cargue la hora real -- decision explicita del usuario.

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
        and m.kickoff_at > now()
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
        and m.kickoff_at > now()
    )
  );
