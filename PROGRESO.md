# Progreso del rediseño — Brain Master English

Rediseño visual de `index.html` al estilo **JIFU** (limpio, corporativo) con paleta **negra**.
La funcionalidad NO se toca: solo CSS y estructura HTML.

## Reglas que seguimos
- **Conservar todos los IDs y clases que usa el JavaScript** (ej: `inp-email`, `login-btn`, `dash-kpis`, `nav-tab`, etc.).
- **No tocar la lógica** (Supabase, `doLogin`, `fillLogin`, `showView`, `renderDashboard`...).
- CSS nuevo **scoped por vista** (`#view-dashboard ...`) para no romper otras secciones.
- Verificar en navegador tras cada cambio (login admin: `rubenJ@gmail.com` / `ruben123`).

## CAMBIO DE DIRECCIÓN (estilo Dashify) — 2026
El cliente pidió estilo tipo "Dashify": **fondo negro**, **iconos/botones gris o blanco** (monocromático),
y **menú de navegación en sidebar IZQUIERDO**. Sin añadir funciones ni botones.
- Navegación: de `.topnav` (superior) → `.sidebar` (izquierda). Item activo = pill blanco (#e8eaed) con texto oscuro.
- Tema global cambiado en `:root` (ver Paleta nueva abajo). Esto recolorea casi todo.
- Azules eliminados con replace_all: `0,200,255`→`255,255,255`, `#00c8ff`→`#e8eaed`, `#0066ff`→`#9ca3af`, `0,102,255`→`255,255,255`.
- Dashboard y Alumnos: REHECHAS de claro a oscuro (usan var(--surface)).

## Paleta NUEVA (negra/Dashify) en :root
- --bg #0a0a0d · --bg2 #121217 · --surface #16161c
- --border rgba(255,255,255,.08) · --border2 rgba(255,255,255,.14)
- --ink #f3f4f6 · --ink2 #b9bcc4 · --muted #71757f
- --accent #e8eaed (blanco/plomo) · --accent-soft rgba(255,255,255,.08)
- Avatares/marcas: gradiente #3a3a42 → #17171c con borde
- Sidebar bg: #0c0c10

## Paleta ANTERIOR (JIFU claro — descartada)
- Negro base: `#0a0a0a` / `#0f0f0f` / `#111`
- Carbón degradado: `#1c1c1e → #000`
- Fondo claro (vistas): `#f4f4f5`
- Tarjetas: `#fff`, borde `#ececec`, sombra `0 8px 24px -18px rgba(0,0,0,.18)`
- Acento ámbar (marca): `#f5a623` → `#e8590c`
- Texto: títulos `#0f0f0f`, secundario `#6b7280` / `#9ca3af`

## Estado
- [x] Imágenes base64 extraídas a `/img` (HTML de 2.3MB → 142KB). Backup en `index.html.bak`.
- [x] **Sidebar izquierdo** (`.sidebar`) — reemplaza topnav. Oscuro, activo en pill blanco.
- [x] **Dashboard** (`#view-dashboard`) — oscuro monocromático.
- [x] **Alumnos** (`#view-admin-students`) — oscuro. JS: avatar y barra de progreso en gris/blanco.
- [x] **Mi Progreso** (`#view-progress`) — oscuro monocromático (override pstat-num/icon).
- [x] **Asistente IA** (`#view-assistant`) — oscuro (override stat-val).
- [~] **Login** — AÚN en tema claro/ámbar anterior. Falta pasar a negro.
- [~] **Clases** (`#view-classes`) — funciona en oscuro pero mantiene foto de fondo (decidir si suavizar).
- [ ] **Módulos** (`#view-admin-modules`)
- [ ] **Mi Progreso** (`#view-progress`)
- [ ] **Asistente IA** (`#view-assistant`)
- [ ] **Clases** (`#view-classes`)
- [ ] **Exámenes admin** (`#view-admin-exams`) y **Añadir alumno** (`#view-admin-add`)
- [ ] **Modales** (`.modal-bg`, `.modal-box`)

## Sección MATERIALES (nueva, funcional)
- Nuevo apartado en sidebar para alumno (`materials`) y admin (`admin-materials`).
- Admin sube PDFs/documentos (Supabase Storage, bucket `materials`) o crea flashcards (anverso/reverso).
- Cada material se asocia a un módulo; el alumno solo ve los de sus módulos desbloqueados.
- Requiere setup en Supabase: ver `SUPABASE_MATERIALES.md` (tabla `materials` + bucket `materials`).
- Funciones: loadMaterials, renderAdminMaterials, renderStudentMaterials, openMaterialModal, saveMaterial (sube a Storage), deleteMaterial, openFlashcards/flipCard/next/prevCard.
- Visor flashcards: tarjeta 3D que se voltea (#flashcards-modal).

## Sección SESIONES EN VIVO (nueva, funcional)
- Sidebar: `sessions` (alumno) y `admin-sessions` (admin).
- Admin crea sesiones (título, fecha/hora, duración, enlace Zoom/Meet) y elige **audiencia**: Todos / Grupo / Módulo.
- Alumno ve lista de próximas según su grupo/módulos desbloqueados; marca "En vivo" cuando está en curso.
- Tabla Supabase: `live_sessions` (ver SUPABASE_MATERIALES.md). currentUser.group se guarda al login.
- Funciones: loadSessions, renderAdminSessions, renderStudentSessions, sessionVisibleForStudent, openSessionModal, saveSession, deleteSession.

## EXÁMENES reestructurados
- Tipos: Mensual (1 módulo) y Final (cada 3 módulos) → columna `exams.exam_type`.
- Secciones por pregunta: Listening/Grammar/Reading/Vocabulary → `exam_questions.section`.
- Método de respuesta por pregunta: multiple / truefalse / short / open → `exam_questions.answer_type`.
- Audio (Listening) subido al bucket `materials` carpeta `exam-audio/` → `exam_questions.audio_url`.
- Contexto/lectura → `exam_questions.context`.
- Calificación: auto para multiple/truefalse/short; open queda para revisión manual (no cuenta en nota auto).
- SQL de columnas en SUPABASE_MATERIALES.md (sección Exámenes). Alumno ve examen agrupado por secciones.
- Funciones clave: addQuestionRow/toggleQType, saveExam, openExam/renderExamQuestion/selectOpt, submitExam.

## Secciones de VIDEO (Plan 30 días / Dios quiere hablarte)
- Tabla `extra_videos` (category: plan30 | godtalks). SQL en SUPABASE_MATERIALES.md.
- Visibles para alumno y admin; admin añade/edita/elimina videos por enlace (YouTube/Vimeo/embed).
- Visor incrustado (#video-modal). Funciones: loadExtra, renderExtra, playVideo, openExtraModal, saveExtra, deleteExtra, embedUrl.
- WhatsApp soporte + 2da instancia = +591 65884652 (SUPPORT_WHATSAPP='59165884652').
- Quitado de las cards/detalle: duración y nivel.
- Segunda instancia: alumno reprueba → botón WhatsApp; admin habilita reintento desde perfil del alumno (renderProfileExams/allowRetake).

## Cómo retomar
Decir: "seguimos rediseñando en negro/JIFU, sigue la vista X". Leer `index.html` (fuente de verdad) y continuar.
Preview: servidor estático `python -m http.server 5050` (config en `.claude/launch.json`).
