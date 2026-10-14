-- PIF-54: ranking global por juego. Un único registro por (usuario, juego) con
-- la mejor marca. Qué significa "mejor" (mayor puntaje, menor tiempo, partidos
-- ganados acumulados) lo define el catálogo de juegos en el cliente; la base
-- solo guarda el valor y cuándo se logró, que desempata a favor del primero.

create table pifiometro.game_scores (
  user_id uuid not null default auth.uid() references pifiometro.profiles (id) on delete cascade,
  game_key text not null check (game_key ~ '^[a-z0-9-]+$'),
  best_value integer not null check (best_value >= 0),
  achieved_at timestamptz not null default now(),
  primary key (user_id, game_key)
);

create index game_scores_game_key_idx on pifiometro.game_scores (game_key);

alter table pifiometro.game_scores enable row level security;

create policy game_scores_select
  on pifiometro.game_scores for select to authenticated
  using (true);

create policy game_scores_insert_own
  on pifiometro.game_scores for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy game_scores_update_own
  on pifiometro.game_scores for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on pifiometro.game_scores to authenticated;
