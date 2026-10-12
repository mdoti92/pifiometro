-- Causa raiz de "new row violates row-level security policy for table groups"
-- al crear un grupo: el INSERT ... RETURNING (Prefer: return=representation,
-- que usa supabase-js con .select().single()) filtra la fila devuelta con la
-- policy de SELECT. groups_select_members solo permitia ver el grupo via
-- is_group_member(id), y la membresia del creador se agrega recien en el
-- trigger AFTER INSERT trg_groups_add_creator, asi que la fila recien creada
-- quedaba fuera del RETURNING y Postgres lo reporta con el mismo error 42501
-- que un fallo de WITH CHECK. Se agrega la condicion "o soy el creador" para
-- que el creador siempre pueda ver el grupo que acaba de crear.

drop policy if exists groups_select_members on pifiometro.groups;
create policy groups_select_members
  on pifiometro.groups
  for select
  to authenticated
  using (
    pifiometro.is_group_member(id)
    or created_by = (select auth.uid())
  );
