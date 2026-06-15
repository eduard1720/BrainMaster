# Configuración en Supabase para "Materiales"

La sección de Materiales ya está en el código. Solo falta crear **1 tabla** y **1 bucket** en tu
panel de Supabase. Hazlo una sola vez.

## 1) Crear la tabla `materials`
Ve a Supabase → **SQL Editor** → New query → pega esto y dale **Run**:

```sql
create table if not exists public.materials (
  id          bigint generated always as identity primary key,
  module_id   bigint references public.modules(id) on delete cascade,
  kind        text not null default 'file',   -- 'file' o 'flashcards'
  title       text not null,
  description text,
  file_url    text,
  file_name   text,
  file_type   text,
  cards       jsonb,                           -- [{front, back}, ...] para flashcards
  order_index int default 0,
  created_at  timestamptz default now()
);

-- Permisos (mismo modelo abierto que usa el resto de tu app con la clave publishable)
alter table public.materials enable row level security;
create policy "materials_all" on public.materials
  for all using (true) with check (true);
```

## 2) Crear el bucket de archivos `materials`
Opción A (panel): Supabase → **Storage** → **New bucket** → nombre `materials` → marca **Public bucket** → Create.

Luego, en **SQL Editor**, pega esto para permitir subir/leer (con la clave publishable):

```sql
-- Lectura pública
create policy "materials_read" on storage.objects
  for select using (bucket_id = 'materials');
-- Subir
create policy "materials_insert" on storage.objects
  for insert with check (bucket_id = 'materials');
-- Actualizar / sobreescribir
create policy "materials_update" on storage.objects
  for update using (bucket_id = 'materials');
-- Borrar
create policy "materials_delete" on storage.objects
  for delete using (bucket_id = 'materials');
```

## Nota de seguridad
Tu app valida al admin en el navegador (no hay sesión real de Supabase para el admin), por eso las
políticas son abiertas (igual que tus tablas actuales `modules`, `profiles`, etc.). Es funcional para
este modelo. Si más adelante quieres seguridad real, habría que mover la validación de admin a
Supabase Auth + Edge Functions. Lo dejamos anotado.

## Cómo se usa (ya implementado)
- **Admin** → pestaña "Materiales": botón "+ Nuevo material". Elige módulo, tipo:
  - **Documento / PDF**: sube un archivo (se guarda en Storage).
  - **Flashcards**: crea tarjetas anverso/reverso.
- **Alumno** → pestaña "Materiales": ve solo los materiales de sus **módulos desbloqueados**,
  agrupados por módulo. Abre documentos o estudia las flashcards (tarjeta que se voltea).

---

# Datos reales del Dashboard / Mi Progreso (fechas)

Para que las **barras de actividad** y "Últimos alumnos registrados" muestren fechas reales,
asegúrate de que estas columnas existan con fecha automática (no rompe nada si ya existen):

```sql
-- Fecha en que el alumno rindió el examen (para actividad semanal)
alter table public.exam_results
  add column if not exists completed_at timestamptz default now();

-- Fecha de alta del alumno (para "últimos registrados" y "altas de la semana")
alter table public.profiles
  add column if not exists created_at timestamptz default now();

-- Último acceso del alumno (se actualiza al iniciar sesión)
alter table public.profiles
  add column if not exists last_access timestamptz;
```

Si no las agregas, todo lo demás del dashboard sigue funcionando; solo esas dos cosas
(actividad por día y fecha de registro) se verían vacías.

---

# Configuración para "Sesiones en vivo"

Ejecuta esto en **SQL Editor** (una sola vez). No necesita Storage, solo una tabla:

```sql
create table if not exists public.live_sessions (
  id             bigint generated always as identity primary key,
  title          text not null,
  description    text,
  starts_at      timestamptz,
  duration       text,
  join_url       text,
  audience_type  text not null default 'all',   -- 'all' | 'group' | 'module'
  audience_group text,                           -- 'Grupo A' / 'B' / 'C' si audience_type='group'
  audience_module bigint references public.modules(id) on delete cascade, -- si audience_type='module'
  created_at     timestamptz default now()
);

alter table public.live_sessions enable row level security;
create policy "live_sessions_all" on public.live_sessions
  for all using (true) with check (true);
```

## Cómo se usa (ya implementado)
- **Admin** → pestaña "Sesiones en vivo": "+ Nueva sesión". Define título, fecha, hora, duración,
  enlace (Zoom/Meet) y **a quién va dirigida**: Todos, un Grupo, o un Módulo.
- **Alumno** → pestaña "Sesiones en vivo": ve las próximas que le correspondan según ese criterio,
  ordenadas por fecha, con botón "Unirse" (marca "En vivo" cuando está en curso).

---

# Reestructuración de "Exámenes" (tipos, secciones, audio)

Ejecuta esto en **SQL Editor** (una sola vez). Añade columnas a tus tablas existentes:

```sql
-- Tipo de examen: mensual (1 módulo) o final (cada 3 módulos)
alter table public.exams
  add column if not exists exam_type text default 'monthly';

-- Candado: el alumno solo ve el examen si is_published = true
alter table public.exams
  add column if not exists is_published boolean default false;

-- Preguntas: sección, método de respuesta, audio y contexto
alter table public.exam_questions
  add column if not exists section     text default 'grammar',   -- listening | grammar | reading | vocabulary
  add column if not exists answer_type text default 'multiple',  -- multiple | truefalse | short | open
  add column if not exists audio_url   text,                     -- audio de Listening (Storage)
  add column if not exists context     text;                     -- texto de lectura / instrucción
```

Los **audios** se suben al mismo bucket `materials` (carpeta `exam-audio/`), así que **no necesitas
crear otro bucket**: con el que ya hiciste para Materiales basta.

---

# Secciones de video: "Plan de 30 días" y "Dios quiere hablarte"

Ejecuta esto en **SQL Editor** (una sola vez). Una tabla para ambas secciones (se distinguen por `category`):

```sql
create table if not exists public.extra_videos (
  id               bigint generated always as identity primary key,
  category         text not null,          -- 'plan30' (marketing) | 'godtalks'
  title            text not null,
  description      text,
  bunny_library_id text,                   -- mismos IDs de Bunny Stream que las lecciones
  bunny_video_id   text,
  order_index      int default 0,
  created_at       timestamptz default now()
);

-- Si ya creaste la tabla con video_url, añade las columnas Bunny:
alter table public.extra_videos
  add column if not exists bunny_library_id text,
  add column if not exists bunny_video_id   text;

alter table public.extra_videos enable row level security;
drop policy if exists "extra_videos_all" on public.extra_videos;
create policy "extra_videos_all" on public.extra_videos
  for all using (true) with check (true);
```

## Acceso premium a "Plan de 30 días"
"Plan de 30 días" es **premium**: bloqueado para todos por defecto. Añade la columna de permiso:

```sql
alter table public.profiles
  add column if not exists plan30_access boolean default false;
```

- **Admin** → Alumnos → Ver perfil → "Acceso premium": botón para **dar/quitar** acceso al Plan de 30 días.
- **Alumno sin acceso**: al abrir la sección ve un mensaje "Sección premium" con botón de **WhatsApp** (más información).
- **Alumno con acceso**: ve y reproduce los videos normalmente.

## Cómo se usa (ya implementado)
- **Admin** (en las pestañas "Plan de 30 días" y "Dios quiere hablarte"): botón "+ Añadir video".
  Pega el **Bunny Library ID** y el **Bunny Video ID** (igual que en las lecciones). Puede editar/eliminar.
- **Alumno**: ve las dos secciones en su menú y reproduce los videos en el reproductor de Bunny incrustado.
- Más seguro: el video va por Bunny Stream, no por enlace público.

---

# Reestructuración de "Exámenes" (tipos, secciones, audio)

(esta sección continúa abajo)

## Cómo se usa (ya implementado)
- **Admin** → "Exámenes" → "+ Nuevo examen":
  - Elige **tipo**: Mensual o Final.
  - Por cada pregunta elige **sección** (Listening / Grammar / Reading / Vocabulary) y
    **método de respuesta**: Opción múltiple, Verdadero/Falso, Respuesta corta o Respuesta abierta.
  - En Listening puede **subir un audio**; en Reading puede pegar un **texto** en el campo "contexto".
- **Alumno**: el examen se muestra **agrupado por secciones**, con reproductor de audio en Listening.
  Se califican automáticamente opción múltiple, V/F y respuesta corta; las **abiertas** quedan para
  revisión manual del profesor (no afectan la nota automática).
