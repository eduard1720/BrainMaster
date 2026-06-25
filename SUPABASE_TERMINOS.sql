-- ============================================================
--  Evidencia de aceptación de la Política de Privacidad y
--  Términos de Uso — Brain Master English.
--
--  Esta tabla es un registro APPEND-ONLY (solo se agregan filas):
--  cada vez que un alumno acepta el documento legal se guarda una
--  fila con la prueba de su consentimiento libre, expreso e informado.
--
--  Ejecutar una vez en el SQL Editor de Supabase.
-- ============================================================

create table if not exists public.terms_acceptances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  email         text,
  full_name     text,
  terms_version text not null,                 -- versión del documento aceptado
  ip            text,                          -- IP capturada del lado servidor
  user_agent    text,                          -- navegador/dispositivo
  accepted_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists terms_acceptances_user_idx    on public.terms_acceptances(user_id);
create index if not exists terms_acceptances_version_idx on public.terms_acceptances(terms_version);

-- ── RLS ──────────────────────────────────────────────────────
-- El alumno puede ver y registrar SOLO lo suyo (respaldo si el
-- endpoint serverless no estuviera disponible). El admin ve todo.
-- El endpoint serverless escribe con el service role, que ignora RLS.
alter table public.terms_acceptances enable row level security;

drop policy if exists terms_acceptances_select on public.terms_acceptances;
drop policy if exists terms_acceptances_insert on public.terms_acceptances;

-- Requiere la función public.is_admin() ya creada en SUPABASE_RLS.sql.
create policy terms_acceptances_select on public.terms_acceptances
  for select using (auth.uid() = user_id or public.is_admin());

create policy terms_acceptances_insert on public.terms_acceptances
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- LISTO. Verificar:
--   select email, terms_version, ip, accepted_at
--   from public.terms_acceptances order by accepted_at desc;
-- ============================================================
