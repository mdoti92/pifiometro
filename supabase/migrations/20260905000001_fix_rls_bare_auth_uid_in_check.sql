-- Envuelve auth.uid() en (select auth.uid()) dentro de WITH CHECK / USING.
-- Un auth.uid() sin envolver ahi es un comportamiento no confiable documentado
-- por Supabase para RLS con PostgREST; (select auth.uid()) fuerza su evaluacion
-- como sub-select estable.

-- groups
drop policy if exists groups_insert_any_authenticated on pifiometro.groups;
create policy groups_insert_any_authenticated
  on pifiometro.groups for insert to authenticated
  with check (created_by = (select auth.uid()));

-- notification_preferences
drop policy if exists notif_prefs_all_own on pifiometro.notification_preferences;
create policy notif_prefs_all_own
  on pifiometro.notification_preferences for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- predictions
drop policy if exists predictions_insert_before_kickoff on pifiometro.predictions;
create policy predictions_insert_before_kickoff
  on pifiometro.predictions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and pifiometro.is_group_member(group_id)
    and exists (select 1 from pifiometro.matches m where m.id = predictions.match_id and m.kickoff_at > now())
  );

drop policy if exists predictions_select on pifiometro.predictions;
create policy predictions_select
  on pifiometro.predictions for select to authenticated
  using (
    user_id = (select auth.uid())
    or (pifiometro.is_group_member(group_id) and exists (select 1 from pifiometro.matches m where m.id = predictions.match_id and m.kickoff_at <= now()))
  );

drop policy if exists predictions_update_before_kickoff on pifiometro.predictions;
create policy predictions_update_before_kickoff
  on pifiometro.predictions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from pifiometro.matches m where m.id = predictions.match_id and m.kickoff_at > now())
  );

-- profiles
drop policy if exists profiles_insert_own on pifiometro.profiles;
create policy profiles_insert_own
  on pifiometro.profiles for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists profiles_update_own on pifiometro.profiles;
create policy profiles_update_own
  on pifiometro.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- push_subscriptions
drop policy if exists push_subs_all_own on pifiometro.push_subscriptions;
create policy push_subs_all_own
  on pifiometro.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
