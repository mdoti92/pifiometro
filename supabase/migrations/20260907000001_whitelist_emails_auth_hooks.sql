-- PIF-29: restringe registro y login a una whitelist de emails, via los
-- Auth Hooks oficiales de Supabase (before-user-created + custom-access-token),
-- no un trigger casero sobre auth.users. La ACTIVACION de los hooks en el
-- Dashboard (Authentication -> Hooks) es un paso manual aparte -- ver
-- execution_summary del item PIF-29 en Nogrod.

create table pifiometro.allowed_emails (
  email text primary key,
  added_by uuid references pifiometro.profiles(id),
  created_at timestamptz not null default now()
);

alter table pifiometro.allowed_emails enable row level security;

create policy allowed_emails_select_superadmin
  on pifiometro.allowed_emails for select
  to authenticated
  using (pifiometro.is_superadmin());

create policy allowed_emails_insert_superadmin
  on pifiometro.allowed_emails for insert
  to authenticated
  with check (pifiometro.is_superadmin());

create policy allowed_emails_delete_superadmin
  on pifiometro.allowed_emails for delete
  to authenticated
  using (pifiometro.is_superadmin());

-- semilla: el superadmin actual no se puede auto-bloquear
insert into pifiometro.allowed_emails (email) values (lower(trim('mdoti92@gmail.com')));

-- supabase_auth_admin (el rol que ejecuta GoTrue) no tiene USAGE sobre el
-- schema pifiometro por defecto; lo necesita para poder llamar las funciones
-- de los hooks y, por las dudas (aunque SECURITY DEFINER ya deberia alcanzar),
-- para leer allowed_emails directamente -- patron recomendado en la doc de
-- Supabase para auth hooks que leen tablas custom.
grant usage on schema pifiometro to supabase_auth_admin;
grant select on pifiometro.allowed_emails to supabase_auth_admin;

-- Hook "Before User Created": bloquea el registro de un email fuera de la
-- whitelist. event->'user'->>'email' es donde GoTrue manda el email en este
-- hook (no event->>'email'). Exito: '{}'::jsonb (permite el alta tal cual).
-- Rechazo: {"error": {"http_code": 403, "message": ...}}.
-- https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook
create or replace function pifiometro.check_allowed_email_signup(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pifiometro, public
as $$
declare
  v_email text;
begin
  v_email := lower(trim(event->'user'->>'email'));

  if v_email is not null and exists (
    select 1 from pifiometro.allowed_emails where email = v_email
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Esta app es privada. Si crees que deberías tener acceso, escribile a Martin.'
    )
  );
end;
$$;

grant execute on function pifiometro.check_allowed_email_signup(jsonb) to supabase_auth_admin;
revoke execute on function pifiometro.check_allowed_email_signup(jsonb) from authenticated, anon, public;

-- Hook "Custom Access Token": corre en cada emision de token (login,
-- refresh), asi que tambien bloquea el login de una cuenta que YA EXISTIA
-- pero fue sacada de la whitelist despues del signup -- antes-de-user-created
-- por si solo no cubre ese caso. Confirmado en la doc: este hook SI soporta
-- el mismo patron {"error": {...}} para rechazar la emision del token, no
-- solo agregar claims. event->'claims'->>'email' es donde viene el email
-- aca (distinto del hook anterior). Exito: return event (el evento entero,
-- sin envolver en {"claims": ...}).
-- https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
create or replace function pifiometro.check_allowed_email_login(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pifiometro, public
as $$
declare
  v_email text;
begin
  v_email := lower(trim(event->'claims'->>'email'));

  if v_email is not null and exists (
    select 1 from pifiometro.allowed_emails where email = v_email
  ) then
    return event;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Esta app es privada. Si crees que deberías tener acceso, escribile a Martin.'
    )
  );
end;
$$;

grant execute on function pifiometro.check_allowed_email_login(jsonb) to supabase_auth_admin;
revoke execute on function pifiometro.check_allowed_email_login(jsonb) from authenticated, anon, public;
