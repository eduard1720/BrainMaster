-- ============================================================
--  RLS (Row Level Security) para Brain Master English
--  EJECUTAR SOLO cuando el usuario admin REAL de Rubén ya exista
--  y tenga profiles.role = 'admin' (de lo contrario el panel se bloquea).
-- ============================================================

-- 1) Función que dice si el usuario actual es admin (SECURITY DEFINER evita recursión de RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- 2) PERFILES (datos personales: nombre, email)  -> propio + admin
-- ============================================================
alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_delete on public.profiles;
create policy profiles_select on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id or public.is_admin());
create policy profiles_update on public.profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());
create policy profiles_delete on public.profiles for delete using (public.is_admin());

-- ============================================================
-- 3) TABLAS POR ALUMNO (cada alumno ve lo suyo; el admin ve todo)
-- ============================================================
-- module_access: el alumno lee lo suyo; el admin gestiona todo
alter table public.module_access enable row level security;
drop policy if exists module_access_select on public.module_access;
drop policy if exists module_access_write on public.module_access;
create policy module_access_select on public.module_access for select using (auth.uid() = student_id or public.is_admin());
create policy module_access_write  on public.module_access for all    using (public.is_admin()) with check (public.is_admin());

-- exam_results: el alumno crea/lee lo suyo; el admin lee y borra (permitir reintento)
alter table public.exam_results enable row level security;
drop policy if exists exam_results_select on public.exam_results;
drop policy if exists exam_results_insert on public.exam_results;
drop policy if exists exam_results_delete on public.exam_results;
create policy exam_results_select on public.exam_results for select using (auth.uid() = student_id or public.is_admin());
create policy exam_results_insert on public.exam_results for insert with check (auth.uid() = student_id);
create policy exam_results_delete on public.exam_results for delete using (public.is_admin());

-- lesson_progress: el alumno gestiona lo suyo; el admin lee todo
alter table public.lesson_progress enable row level security;
drop policy if exists lesson_progress_select_all on public.lesson_progress;
drop policy if exists lesson_progress_insert_own on public.lesson_progress;
drop policy if exists lesson_progress_update_own on public.lesson_progress;
drop policy if exists lesson_progress_select on public.lesson_progress;
create policy lesson_progress_select on public.lesson_progress for select using (auth.uid() = student_id or public.is_admin());
create policy lesson_progress_insert_own on public.lesson_progress for insert with check (auth.uid() = student_id);
create policy lesson_progress_update_own on public.lesson_progress for update using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- study_time: el alumno gestiona lo suyo; el admin lee todo
alter table public.study_time enable row level security;
drop policy if exists study_time_select_all on public.study_time;
drop policy if exists study_time_insert_own on public.study_time;
drop policy if exists study_time_update_own on public.study_time;
drop policy if exists study_time_select on public.study_time;
create policy study_time_select on public.study_time for select using (auth.uid() = student_id or public.is_admin());
create policy study_time_insert_own on public.study_time for insert with check (auth.uid() = student_id);
create policy study_time_update_own on public.study_time for update using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- ============================================================
-- 4) CONTENIDO (lectura para todos; solo el admin escribe)
--    No es sensible: módulos, lecciones, exámenes, materiales, etc.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['modules','lessons','exams','exam_questions','materials','live_sessions','extra_videos','extra_links']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_select on public.%I;', t, t);
    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format('create policy %I_select on public.%I for select using (true);', t, t);
    execute format('create policy %I_write on public.%I for all using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;

-- ============================================================
-- LISTO. Probar: (a) admin ve panel y alumnos, (b) alumno ve lo suyo,
-- (c) un alumno NO puede leer datos de otro.
-- ============================================================
