-- PIF-66: Pifiómetro valida su propia whitelist después del login.
-- Los hooks de auth (PIF-29) son de todo el proyecto Supabase, que comparten Pifiómetro, Bree y Palantír. Con PAL-14
-- pasan a aceptar la whitelist de cualquiera de las apps, así que Pifiómetro no puede confiar solo en ellos:
--   1. pifiometro.is_allowed(): ¿el usuario logueado está en pifiometro.allowed_emails?
--   2. Una policy RESTRICTIVA por tabla con is_allowed(): se suma con AND a las policies existentes, que no cambian.
--   3. Las funciones security definer que puede llamar un usuario logueado (saltean RLS) también la chequean.
--      Si se recrean con create or replace, conservar el chequeo del principio.

create or replace function pifiometro.is_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from pifiometro.allowed_emails
    where email = lower(trim(auth.jwt() ->> 'email'))
  );
$$;

revoke all on function pifiometro.is_allowed() from public, anon;
grant execute on function pifiometro.is_allowed() to authenticated;

-- Whitelist en todas las tablas.
create policy allowed_emails_solo_whitelist on pifiometro.allowed_emails as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));
create policy game_scores_solo_whitelist on pifiometro.game_scores as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));
create policy group_members_solo_whitelist on pifiometro.group_members as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));
create policy group_tournaments_solo_whitelist on pifiometro.group_tournaments as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));
create policy groups_solo_whitelist on pifiometro.groups as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));
create policy matches_solo_whitelist on pifiometro.matches as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));
create policy notification_preferences_solo_whitelist on pifiometro.notification_preferences as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));
create policy predictions_solo_whitelist on pifiometro.predictions as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));
create policy profiles_solo_whitelist on pifiometro.profiles as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));
create policy push_subscriptions_solo_whitelist on pifiometro.push_subscriptions as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));
create policy teams_solo_whitelist on pifiometro.teams as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));
create policy tournament_stages_solo_whitelist on pifiometro.tournament_stages as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));
create policy tournaments_solo_whitelist on pifiometro.tournaments as restrictive for all to authenticated
  using ((select pifiometro.is_allowed())) with check ((select pifiometro.is_allowed()));

-- RPCs security definer que llama la app.
create or replace function pifiometro.join_group(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path to 'pifiometro', 'public'
as $function$
declare
  v_group_id uuid;
begin
  if not pifiometro.is_allowed() then
    raise exception 'Esta app es privada. Si crees que deberías tener acceso, escribile a Martin.';
  end if;
  select id into v_group_id from pifiometro.groups where invite_code = upper(p_invite_code);
  if v_group_id is null then
    raise exception 'Codigo de invitacion invalido';
  end if;
  insert into pifiometro.group_members (group_id, user_id, role)
  values (v_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;
  return v_group_id;
end;
$function$;

create or replace function pifiometro.regenerate_invite_code(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path to 'pifiometro', 'public'
as $function$
declare
  v_code text;
begin
  if not pifiometro.is_allowed() then
    raise exception 'Esta app es privada. Si crees que deberías tener acceso, escribile a Martin.';
  end if;
  if not pifiometro.is_group_admin(p_group_id) then
    raise exception 'Solo el admin del grupo puede regenerar el codigo';
  end if;
  v_code := pifiometro.generate_invite_code();
  update pifiometro.groups set invite_code = v_code where id = p_group_id;
  return v_code;
end;
$function$;

-- Solo la usa la Edge Function pending-reminders con la service role key: ningún usuario la tiene que poder llamar
-- (además permitía contar los pendientes de cualquier usuario).
revoke all on function pifiometro.count_pending_predictions(uuid, numeric) from public, anon, authenticated;
grant execute on function pifiometro.count_pending_predictions(uuid, numeric) to service_role;

notify pgrst, 'reload schema';
