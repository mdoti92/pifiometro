-- PIF-31: etapa activa del torneo. Mismo espiritu que group_tournaments.active,
-- pero a nivel de etapa dentro de un torneo, y con la garantia de unicidad
-- resuelta a nivel de DB (a lo sumo una etapa por torneo con is_current = true).
--
-- Decision documentada (el item pedia elegir entre rechazar el segundo intento
-- o desmarcar automaticamente la anterior): se elige DESMARCAR automaticamente
-- la etapa anterior. La gestion es 100% por SQL directo (sin UI, mismo patron
-- que allowed_emails/teams), asi que un simple
--   update tournament_stages set is_current = true where id = '...'
-- tiene que alcanzar sin que el superadmin tenga que acordarse de desmarcar la
-- etapa vieja en un paso aparte. Un rechazo (constraint/unique index) hubiera
-- obligado a un segundo UPDATE previo.

alter table pifiometro.tournament_stages add column is_current boolean not null default false;

create or replace function pifiometro.enforce_single_current_stage()
returns trigger
language plpgsql
security definer
set search_path = pifiometro, public
as $$
begin
  if new.is_current then
    update pifiometro.tournament_stages
    set is_current = false
    where tournament_id = new.tournament_id
      and id <> new.id
      and is_current = true;
  end if;
  return new;
end;
$$;

create trigger trg_tournament_stages_single_current
before insert or update of is_current on pifiometro.tournament_stages
for each row
execute function pifiometro.enforce_single_current_stage();
