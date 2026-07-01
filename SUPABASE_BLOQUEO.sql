-- ============================================================
--  Bloqueo de acceso de alumnos (Brain Master English)
--  Ejecutar UNA vez en el SQL editor de Supabase.
-- ============================================================
-- Bandera de bloqueo por alumno. Si es TRUE, al iniciar sesión
-- se le cierra la sesión y ve un aviso para contactar a Rubén.
alter table public.profiles
  add column if not exists blocked boolean not null default false;

-- (Las políticas RLS ya existentes permiten que el admin actualice
--  cualquier perfil y que el alumno lea el suyo, así que no hace falta
--  crear políticas nuevas para esta columna.)
