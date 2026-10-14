-- PIF-45: paleta de colores elegida por cada usuario, para que lo acompañe en todos sus
-- dispositivos. La escritura queda cubierta por la policy existente profiles_update_own
-- (cada uno solo actualiza su propio perfil).

alter table pifiometro.profiles
  add column palette text not null default 'tierra-media'
  check (palette in ('tierra-media', 'celeste', 'noche', 'cancha'));
