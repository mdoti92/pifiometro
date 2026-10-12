-- La carga de partidos es 100% manual, sin sync con una fuente oficial de
-- fixture: kickoff_at no es confiable para decidir si un pronostico se puede
-- seguir cargando/editando (puede estar en el pasado sin resultado cargado,
-- o en el futuro con uno ya cargado). Se reemplaza el criterio de bloqueo de
-- "antes del kickoff" (m.kickoff_at > now()) a "mientras el partido no tenga
-- resultado real cargado" (m.status <> 'finished').
--
-- predictions_select (oculta pronosticos ajenos hasta el kickoff) queda fuera
-- de este cambio a proposito -- es un criterio distinto, no de bloqueo de
-- edicion, y no fue pedido.
--
-- Sin trigger nuevo para recalcular puntos: como la edicion se corta en
-- cuanto matches.status = 'finished', los puntos que ya calculo el trigger
-- calculate_points() (que corre sobre UPDATE de matches) nunca quedan
-- desactualizados por una edicion posterior del pronostico.

drop policy predictions_insert_before_kickoff on pifiometro.predictions;
create policy predictions_insert_before_kickoff
  on pifiometro.predictions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and pifiometro.is_group_member(group_id)
    and exists (select 1 from pifiometro.matches m where m.id = predictions.match_id and m.status <> 'finished')
  );

drop policy predictions_update_before_kickoff on pifiometro.predictions;
create policy predictions_update_before_kickoff
  on pifiometro.predictions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from pifiometro.matches m where m.id = predictions.match_id and m.status <> 'finished')
  );
