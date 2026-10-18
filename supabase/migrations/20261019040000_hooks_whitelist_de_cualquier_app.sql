-- PAL-14: los hooks de auth son de todo el proyecto Supabase, que comparten Pifiómetro, Bree y Palantír. Dejan pasar
-- el alta y el login si el email está en la whitelist de CUALQUIERA de las apps; cada app valida la suya después del
-- login (pifiometro.is_allowed, bree.is_allowed, palantir.is_allowed: AccessGate + policies restrictivas).
-- Requiere PIF-66 y BREE-56 aplicadas: sin ellas, un usuario de otra app podría usar Pifiómetro o Bree.

-- supabase_auth_admin ejecuta los hooks y lee las whitelists (mismo patrón que PIF-29).
grant usage on schema palantir to supabase_auth_admin;
grant select on palantir.allowed_emails to supabase_auth_admin;

create or replace function pifiometro.is_email_in_any_whitelist(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from pifiometro.allowed_emails where email = p_email)
      or exists (select 1 from bree.allowed_emails where email = p_email)
      or exists (select 1 from palantir.allowed_emails where email = p_email);
$$;

revoke all on function pifiometro.is_email_in_any_whitelist(text) from public, anon, authenticated;
grant execute on function pifiometro.is_email_in_any_whitelist(text) to supabase_auth_admin;

create or replace function pifiometro.check_allowed_email_signup(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'pifiometro', 'public'
as $function$
declare
  v_email text;
begin
  v_email := lower(trim(event->'user'->>'email'));

  if v_email is not null and pifiometro.is_email_in_any_whitelist(v_email) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Esta app es privada. Si crees que deberías tener acceso, escribile a Martin.'
    )
  );
end;
$function$;

create or replace function pifiometro.check_allowed_email_login(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'pifiometro', 'public'
as $function$
declare
  v_email text;
begin
  v_email := lower(trim(event->'claims'->>'email'));

  if v_email is not null and pifiometro.is_email_in_any_whitelist(v_email) then
    return event;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Esta app es privada. Si crees que deberías tener acceso, escribile a Martin.'
    )
  );
end;
$function$;
