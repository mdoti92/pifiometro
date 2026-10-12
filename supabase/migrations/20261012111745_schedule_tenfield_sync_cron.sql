-- Cron de tenfield-sync. Horarios en UTC (Uruguay es UTC-3 todo el ano, sin horario de verano):
-- lunes a jueves 23:50 local -> 02:50 UTC del dia siguiente, todos los dias (por eso "* * *").
-- viernes a domingo tambien 12:00, 17:00 y 19:00 local -> 15:00, 20:00 y 22:00 UTC el mismo dia
-- (dia de semana en UTC: 5=viernes, 6=sabado, 0=domingo).
--
-- El Authorization usa el anon key (publico por diseno, no requiere Vault): verify_jwt de la
-- Edge Function solo exige un JWT firmado valido del proyecto, y la funcion igualmente usa
-- SUPABASE_SERVICE_ROLE_KEY desde sus propias env vars (inyectadas automaticamente por Supabase)
-- para escribir en la base, sin depender de que key uso el caller.
select cron.schedule(
  'tenfield-sync-daily-2350-local',
  '50 2 * * *',
  $$
  select net.http_post(
    url := 'https://rkschpopukxdjsdpmqgi.supabase.co/functions/v1/tenfield-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrc2NocG9wdWt4ZGpzZHBtcWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTY2NDQsImV4cCI6MjA5NzQzMjY0NH0.WI-JdyPEs8S-nClFH8GBpPT2Dq0lZPjyPNwgGLOvwhg'
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'tenfield-sync-weekend-extra',
  '0 15,20,22 * * 5,6,0',
  $$
  select net.http_post(
    url := 'https://rkschpopukxdjsdpmqgi.supabase.co/functions/v1/tenfield-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrc2NocG9wdWt4ZGpzZHBtcWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTY2NDQsImV4cCI6MjA5NzQzMjY0NH0.WI-JdyPEs8S-nClFH8GBpPT2Dq0lZPjyPNwgGLOvwhg'
    ),
    body := '{}'::jsonb
  );
  $$
);
