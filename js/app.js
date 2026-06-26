// ═══════════════════════
// CONFIG
// ═══════════════════════
const SUPABASE_URL='https://kszjhkygtuanotznaqjb.supabase.co';
const SUPABASE_KEY='sb_publishable_FzU-ZXAe7WybAaUyB6rcDQ_bUksmFNc';
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ANTHROPIC_KEY='TU_API_KEY_AQUI';
// La IA pasa por un proxy serverless (api/chat) con verificación de sesión + rate limit.
// Pon USE_AI_PROXY=true cuando hayas desplegado la función y la env var en Vercel.
const USE_AI_PROXY=true;
const AI_PROXY='/api/chat';
// Versión vigente de la Política de Privacidad y Términos de Uso.
// Si el documento legal cambia, sube esta versión: a todos los alumnos
// se les volverá a pedir aceptar (y queda un nuevo registro de respaldo).
const TERMS_VERSION='1.0-2026-06-25';
const TERMS_PROXY='/api/accept-terms';
// CDN de Bunny Stream por librería (cada librería tiene su propio hostname vz-xxxx.b-cdn.net).
// Para miniaturas automáticas de las lecciones. Agregar aquí nuevas librerías si se crean.
const BUNNY_HOSTS={'687163':'vz-b429cadd-24a.b-cdn.net'};
// Miniatura efectiva de una lección: portada manual (URL web válida) > miniatura del video de Bunny > vacío (fallback).
function lessonThumbUrl(l){
  if(!l)return '';
  // Solo acepta portada manual si es una URL web real (ignora rutas locales tipo file:///D:/...).
  if(l.thumbnail_url&&/^https?:\/\//i.test(l.thumbnail_url))return l.thumbnail_url;
  const host=BUNNY_HOSTS[l.bunny_library_id];
  if(l.bunny_video_id&&host)return `https://${host}/${l.bunny_video_id}/thumbnail.jpg`;
  return '';
}
async function askAI(maxTokens,extraSystem){
  let token=null;try{const{data}=await sb.auth.getSession();token=data?.session?.access_token||null;}catch(e){}
  const sys=(typeof SYSTEM_PROMPT!=='undefined'?SYSTEM_PROMPT:'')+(extraSystem?('\n\n'+extraSystem):'');
  const res=await fetch(AI_PROXY,{method:'POST',headers:{'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},
    body:JSON.stringify({system:sys,messages:chatHistory.slice(-12),max_tokens:maxTokens})});
  const d=await res.json().catch(()=>({}));
  if(res.status===429)return d.reply||'Has alcanzado el límite de mensajes por ahora. Intenta más tarde.';
  if(!res.ok)return 'Error. Intenta de nuevo.';
  return d.reply||'Error. Intenta de nuevo.';
}
// Cuenta fantasma del desarrollador: admin invisible + ve TODO el contenido de alumno desbloqueado
const SUPER_ADMIN_EMAIL='eduard1@gmail.com';
// ── Soporte (edita estos valores) ──
const SUPPORT_WHATSAPP='59177067322';            // número con código de país, SIN + ni espacios
const SUPPORT_WA_MSG='Hola, necesito ayuda con la plataforma Brain Master English';
const SUPPORT_WA_MSG_ZOOM='Hola, quiero unirme a las sesiones en vivo por Zoom de Brain Master English. ¿A qué grupo y horario pertenezco?';
const SUPPORT_HOURS=[
  {d:'Mañana', h:'09:00 – 10:00'},
  {d:'Tarde', h:'18:00 – 19:00'},
  {d:'Noche', h:'22:00 – 23:00'}
];
// Desglose por país (hora local equivalente a cada turno en Bolivia)
const SUPPORT_BY_COUNTRY=[
  {turno:'🌅 Mañana', bolivia:'09:00 – 10:00', paises:[
    {f:'🇲🇽', n:'México', h:'07:00 – 08:00'},
    {f:'🇸🇻', n:'El Salvador', h:'07:00 – 08:00'},
    {f:'🇨🇴', n:'Colombia', h:'08:00 – 09:00'},
    {f:'🇪🇨', n:'Ecuador', h:'08:00 – 09:00'},
    {f:'🇵🇦', n:'Panamá', h:'08:00 – 09:00'},
    {f:'🇵🇪', n:'Perú', h:'08:00 – 09:00'},
    {f:'🇨🇱', n:'Chile', h:'09:00 – 10:00'},
    {f:'🇩🇴', n:'R. Dominicana', h:'09:00 – 10:00'},
  ]},
  {turno:'☀️ Tarde', bolivia:'18:00 – 19:00', paises:[
    {f:'🇲🇽', n:'México', h:'16:00 – 17:00'},
    {f:'🇸🇻', n:'El Salvador', h:'16:00 – 17:00'},
    {f:'🇨🇴', n:'Colombia', h:'17:00 – 18:00'},
    {f:'🇪🇨', n:'Ecuador', h:'17:00 – 18:00'},
    {f:'🇵🇦', n:'Panamá', h:'17:00 – 18:00'},
    {f:'🇵🇪', n:'Perú', h:'17:00 – 18:00'},
    {f:'🇨🇱', n:'Chile', h:'18:00 – 19:00'},
    {f:'🇩🇴', n:'R. Dominicana', h:'18:00 – 19:00'},
  ]},
  {turno:'🌙 Noche', bolivia:'22:00 – 23:00', paises:[
    {f:'🇲🇽', n:'México', h:'20:00 – 21:00'},
    {f:'🇸🇻', n:'El Salvador', h:'20:00 – 21:00'},
    {f:'🇨🇴', n:'Colombia', h:'21:00 – 22:00'},
    {f:'🇪🇨', n:'Ecuador', h:'21:00 – 22:00'},
    {f:'🇵🇦', n:'Panamá', h:'21:00 – 22:00'},
    {f:'🇵🇪', n:'Perú', h:'21:00 – 22:00'},
    {f:'🇨🇱', n:'Chile', h:'22:00 – 23:00'},
    {f:'🇩🇴', n:'R. Dominicana', h:'22:00 – 23:00'},
  ]},
];
// ── Grupos: 1 al 50, formato "Grupo N vip" ──
const GROUPS=Array.from({length:50},(_,i)=>`Grupo ${i+1} vip`);
function groupOpts(sel){return GROUPS.map(g=>`<option value="${g}"${g===sel?' selected':''}>${g}</option>`).join('');}
// Multi-select "Dirigido a": sin selección = todos los del módulo. Guarda lista separada por comas.
function fillTargetGroup(id,sel){
  const e=document.getElementById(id);if(!e)return;
  const set=new Set(String(sel||'').split(',').map(x=>x.trim()).filter(Boolean));
  e.innerHTML=GROUPS.map(g=>`<option value="${g}"${set.has(g)?' selected':''}>${g}</option>`).join('');
}
function getSelectedGroups(id){const e=document.getElementById(id);return e?[...e.selectedOptions].map(o=>o.value).filter(Boolean).join(','):'';}
// ¿el contenido es visible para el alumno actual? tg vacío = todos; si hay grupos, su grupo debe estar en la lista
function targetGroupOk(tg){
  if(!tg)return true;
  const groups=String(tg).split(',').map(x=>x.trim()).filter(Boolean);
  return groups.length===0||groups.includes(currentUser&&currentUser.group);
}
// badges para mostrar a quién va dirigido (admin)
function groupBadges(tg){
  if(!tg)return '<span class="badge badge-muted">Todos</span>';
  return String(tg).split(',').map(x=>x.trim()).filter(Boolean).map(g=>`<span class="badge badge-blue">${esc(g)}</span>`).join(' ');
}
function populateGroupSelects(){
  const fg=document.getElementById('filter-group');if(fg)fg.innerHTML=`<option value="">Todos los grupos</option>`+groupOpts()+`<option value="Sin grupo">Sin grupo</option>`;
  const ng=document.getElementById('new-group');if(ng)ng.innerHTML=`<option value="">Sin grupo</option>`+groupOpts();
  const sg=document.getElementById('ses-group');if(sg)sg.innerHTML=groupOpts();
  const sp=document.getElementById('sp-group-select');if(sp)sp.innerHTML=`<option value="">Sin grupo</option>`+groupOpts();
}


// ═══════════════════════
// STATE
// ═══════════════════════
let currentUser=null,isAdmin=false,isSuper=false;
let allModules=[],allLessons=[],allExams=[],allQuestions=[];
let allMaterials=[],fcCards=[],fcIndex=0;
let allSessions=[];
let allExtra=[];let allExtraLinks=[];
let allAccessCache=[],allResultsCache=[];
let userAccess=[],allStudentsCache=[];
let completedLessons=new Set(); // IDs de lecciones vistas por el estudiante
// Escape HTML para evitar XSS al interpolar datos de usuario en innerHTML
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);}
let currentModuleId=null,currentExamId=null,examAnswers={};
let chatHistory=[],vocabItems=[];
let sessionMsgs=0,sessionWords=0,sessionStart=null,sessionTimer=null;
let isRecording=false,recognition=null;
let synth=window.speechSynthesis,activeSpeakBtn=null,voiceSpeakingSince=0;

// ═══════════════════════
// UTILS
// ═══════════════════════
function toast(msg,type='info'){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.style.borderColor=type==='error'?'rgba(255,69,96,.4)':type==='success'?'rgba(0,229,160,.4)':'var(--border2)';
  t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800);
}
function previewThumb(inputId,previewId){
  const url=document.getElementById(inputId).value.trim();
  const box=document.getElementById(previewId);
  box.innerHTML=url?`<img src="${url}" onerror="this.parentNode.innerHTML='<span class=\\'thumb-preview-empty\\'>URL inválida</span>'" style="width:100%;height:100%;object-fit:cover">`:'<span class="thumb-preview-empty">Vista previa</span>';
}

// ═══════════════════════
// LOGIN
// ═══════════════════════
document.getElementById('inp-pass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
document.getElementById('inp-email').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
function fillLogin(email,pass){document.getElementById('inp-email').value=email;document.getElementById('inp-pass').value=pass;}

async function forgotPassword(){
  const email=document.getElementById('inp-email').value.trim();
  if(!email){toast('Escribe tu correo arriba y vuelve a tocar el enlace','error');document.getElementById('inp-email').focus();return;}
  try{
    const{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
    if(error){toast('Error: '+error.message,'error');return;}
    toast('Te enviamos un correo para restablecer tu contraseña','success');
  }catch(e){toast('No se pudo enviar el correo','error');}
}

// Cuando el alumno vuelve desde el enlace de recuperación
sb.auth.onAuthStateChange(async (event,session)=>{
  if(event==='PASSWORD_RECOVERY'&&session){
    const prof=await getProfile(session.user.id);
    currentUser={id:session.user.id,email:session.user.email,name:prof?.full_name||session.user.email,group:prof?.group_name||'',plan30:!!prof?.plan30_access};
    isAdmin=prof?.role==='admin';
    document.getElementById('login-err').style.display='none';
    document.getElementById('change-pass-modal').classList.remove('hidden');
  }
});

async function doLogin(){
  const email=document.getElementById('inp-email').value.trim();
  const pass=document.getElementById('inp-pass').value;
  const errEl=document.getElementById('login-err');
  const btn=document.getElementById('login-btn');
  errEl.style.display='none';btn.textContent='Ingresando...';btn.disabled=true;

  const{data,error}=await sb.auth.signInWithPassword({email,password:pass});
  btn.textContent='Ingresar';btn.disabled=false;
  if(error){errEl.style.display='block';return;}
  const profile=await getProfile(data.user.id);
  currentUser={id:data.user.id,email:data.user.email,name:profile?.full_name||(email.split('@')[0].charAt(0).toUpperCase()+email.split('@')[0].slice(1)),group:profile?.group_name||'',plan30:!!profile?.plan30_access};
  isAdmin=profile?.role==='admin';
  isSuper=(data.user.email||'').toLowerCase()===SUPER_ADMIN_EMAIL.toLowerCase();
  if(isSuper)isAdmin=true;
  try{sb.from('profiles').update({last_access:new Date().toISOString()}).eq('id',data.user.id).then(()=>{},()=>{});}catch(e){}
  if(profile?.must_change_password){
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app').style.display='flex';
    resetNavTabs();
    document.getElementById('nav-av').textContent=(currentUser.name||'??').substring(0,2).toUpperCase();
    document.getElementById('nav-name').textContent=currentUser.name||'---';
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('change-pass-modal').classList.remove('hidden');
    return;
  }
  await gateTermsThenLaunch();
}
async function getProfile(uid){const{data}=await sb.from('profiles').select('*').eq('id',uid).single();return data;}

// ═══════════════════════
// TÉRMINOS Y CONDICIONES (aceptación legal con respaldo)
// ═══════════════════════
let _termsScrolled=false;
// Decide si mostrar el documento legal o entrar directo a la app.
async function gateTermsThenLaunch(){
  // Los administradores no requieren aceptar la política de datos del alumno.
  if(isAdmin){launchApp();return;}
  let accepted=false;
  try{
    const{data}=await sb.from('terms_acceptances').select('id').eq('user_id',currentUser.id).eq('terms_version',TERMS_VERSION).limit(1);
    accepted=!!(data&&data.length);
  }catch(e){accepted=false;}
  if(accepted){launchApp();return;}
  showTermsModal();
}
function showTermsModal(){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='none';
  const doc=document.getElementById('terms-doc');
  const cb=document.getElementById('terms-checkbox');
  document.getElementById('terms-err').style.display='none';
  if(cb)cb.checked=false;
  _termsScrolled=false;
  document.getElementById('terms-modal').classList.remove('hidden');
  if(doc)doc.scrollTop=0;
  // Si el documento entra completo sin scroll, se considera ya leído hasta el final.
  setTimeout(()=>{if(doc&&doc.scrollHeight<=doc.clientHeight+8)_termsScrolled=true;updateTermsBtn();},80);
  updateTermsBtn();
}
function onTermsScroll(el){
  if(el.scrollTop+el.clientHeight>=el.scrollHeight-40){_termsScrolled=true;updateTermsBtn();}
}
function updateTermsBtn(){
  const cb=document.getElementById('terms-checkbox');
  const btn=document.getElementById('terms-accept-btn');
  if(!cb||!btn)return;
  btn.disabled=!(cb.checked&&_termsScrolled);
}
async function acceptTerms(){
  const btn=document.getElementById('terms-accept-btn');
  const err=document.getElementById('terms-err');
  err.style.display='none';
  btn.disabled=true;btn.textContent='Registrando...';
  let ok=false;
  // 1) Vía preferida: endpoint serverless que captura la IP del lado servidor y escribe con service role.
  try{
    let token=null;try{const{data}=await sb.auth.getSession();token=data?.session?.access_token||null;}catch(e){}
    const res=await fetch(TERMS_PROXY,{method:'POST',headers:{'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},
      body:JSON.stringify({version:TERMS_VERSION,full_name:currentUser?.name||''})});
    ok=res.ok;
  }catch(e){ok=false;}
  // 2) Respaldo: si el endpoint no está disponible, registrar la aceptación desde el cliente.
  if(!ok){
    try{
      const{error}=await sb.from('terms_acceptances').insert({
        user_id:currentUser.id,email:currentUser.email,full_name:currentUser?.name||'',
        terms_version:TERMS_VERSION,user_agent:navigator.userAgent
      });
      ok=!error;
    }catch(e){ok=false;}
  }
  btn.textContent='Aceptar y continuar';
  if(!ok){err.style.display='block';btn.disabled=false;return;}
  document.getElementById('terms-modal').classList.add('hidden');
  launchApp();
}
async function declineTerms(){
  document.getElementById('terms-modal').classList.add('hidden');
  const cb=document.getElementById('terms-checkbox');if(cb)cb.checked=false;
  try{await sb.auth.signOut();}catch(e){}
  currentUser=null;isAdmin=false;isSuper=false;
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  const p=document.getElementById('inp-pass');if(p)p.value='';
  toast('Debes aceptar la política de privacidad para usar la plataforma','error');
}

function resetNavTabs(){
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active','hidden'));
  ['dashboard','admin-modules','admin-exams','admin-students','admin-add','admin-materials','admin-sessions'].forEach(v=>{const el=document.querySelector(`.nav-tab[data-view="${v}"]`);if(el)el.classList.add('hidden');});
  document.getElementById('admin-badge').classList.add('hidden');
}

// ── Fondo del sidebar: estrellas + estrellas fugaces (monocromático) ──
let _sidefx;
function initSidebarFx(){
  const cv=document.getElementById('sidebar-fx');const host=document.querySelector('.sidebar');
  if(!cv||!host)return;
  if(_sidefx)cancelAnimationFrame(_sidefx);
  const ctx=cv.getContext('2d');let W,H,dpr,stars,shoots,nextShoot;
  function size(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=host.clientWidth;H=host.clientHeight;
    cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const n=Math.round(W*H/3200);
    stars=[];for(let i=0;i<n;i++)stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.3+.4,a:Math.random()*.5+.3,tw:Math.random()*Math.PI*2,ts:.6+Math.random()*1.4,hue:200+Math.random()*100});
  }
  shoots=[];nextShoot=0;
  function spawn(t){
    const fromLeft=Math.random()<.5;
    const x=fromLeft?-20:Math.random()*W*.6;
    const y=Math.random()*H*.7;
    const ang=(Math.PI/4)+(Math.random()*.3-.15);
    const sp=2.2+Math.random()*1.8;
    shoots.push({x,y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,len:60+Math.random()*60,life:0,max:90+Math.random()*40,hue:200+Math.random()*100});
    nextShoot=t+1000+Math.random()*2000;
  }
  size();
  function frame(t){
    ctx.clearRect(0,0,W,H);
    // estrellas fijas con titileo + leve brillo
    ctx.shadowBlur=6;
    for(const s of stars){
      const a=s.a*(.55+.45*Math.sin(t*.001*s.ts+s.tw));
      ctx.shadowColor='hsla('+s.hue+',90%,60%,.8)';
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);
      ctx.fillStyle='hsla('+s.hue+',85%,72%,'+a.toFixed(3)+')';ctx.fill();
    }
    ctx.shadowBlur=0;
    // estrellas fugaces
    if(t>nextShoot)spawn(t);
    for(let i=shoots.length-1;i>=0;i--){
      const sh=shoots[i];sh.x+=sh.vx;sh.y+=sh.vy;sh.life++;
      const k=sh.life/sh.max;const fade=k<.15?k/.15:(1-k)/.85;
      const tx=sh.x-sh.vx/Math.hypot(sh.vx,sh.vy)*sh.len;
      const ty=sh.y-sh.vy/Math.hypot(sh.vx,sh.vy)*sh.len;
      const g=ctx.createLinearGradient(sh.x,sh.y,tx,ty);
      g.addColorStop(0,'hsla('+sh.hue+',90%,72%,'+(.85*fade).toFixed(3)+')');
      g.addColorStop(1,'hsla('+sh.hue+',90%,72%,0)');
      ctx.strokeStyle=g;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(sh.x,sh.y);ctx.lineTo(tx,ty);ctx.stroke();
      ctx.beginPath();ctx.arc(sh.x,sh.y,1.3,0,7);ctx.fillStyle='hsla('+sh.hue+',90%,75%,'+fade.toFixed(3)+')';ctx.fill();
      if(sh.life>=sh.max||sh.x>W+40||sh.y>H+40)shoots.splice(i,1);
    }
    _sidefx=requestAnimationFrame(frame);
  }
  window.removeEventListener('resize',size);window.addEventListener('resize',size);
  _sidefx=requestAnimationFrame(frame);
}
async function launchApp(){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('nav-av').textContent=(currentUser.name||'??').substring(0,2).toUpperCase();
  document.getElementById('nav-name').textContent=currentUser.name||'---';
  populateGroupSelects();
  initSidebarFx();
  resetNavTabs();
  if(isAdmin){
    // El super admin (desarrollador) ve TAMBIÉN las pestañas de alumno; el admin normal no.
    if(!isSuper){
      ['classes','assistant','progress','materials','exams','sessions','support'].forEach(v=>{const el=document.querySelector(`.nav-tab[data-view="${v}"]`);if(el)el.classList.add('hidden');});
    }
    ['dashboard','admin-modules','admin-exams','admin-students','admin-add','admin-materials','admin-sessions'].forEach(v=>{const el=document.querySelector(`.nav-tab[data-view="${v}"]`);if(el)el.classList.remove('hidden');});
    document.getElementById('admin-badge').classList.remove('hidden');
  }
  await loadStudyTime();initWeekBars();initChat();initSpeech();startSessionTimer();
  if(isAdmin){showView('dashboard');await loadAdminData();if(isSuper)await loadModules();}
  else{showView('classes');await loadModules();}
}

async function doLogout(){
  await flushTodayStudy(); // guardar tiempo antes de cerrar sesión (mientras el JWT es válido)
  if(!isAdmin)await sb.auth.signOut();
  clearInterval(sessionTimer);
  if(synth)synth.cancel();
  if(recognition&&isRecording)recognition.stop();
  currentUser=null;isAdmin=false;isSuper=false;allModules=[];allLessons=[];allExams=[];allQuestions=[];userAccess=[];allStudentsCache=[];completedLessons=new Set();
  chatHistory=[];vocabItems=[];sessionMsgs=0;sessionWords=0;sessionStart=null;sessionTimer=null;
  isRecording=false;recognition=null;activeSpeakBtn=null;currentModuleId=null;examAnswers={};
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-classes').classList.add('active');
  resetNavTabs();
  document.querySelector('.nav-tab[data-view="classes"]').classList.add('active');
  document.getElementById('nav-av').textContent='--';
  document.getElementById('nav-name').textContent='---';
  document.querySelectorAll('.modal-bg').forEach(m=>m.classList.add('hidden'));
  document.getElementById('modules-grid').innerHTML='<div class="empty-state"><p class="fs-13 text-muted">Cargando módulos...</p></div>';
  document.getElementById('chat-msgs').innerHTML='';
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('inp-email').value='';
  document.getElementById('inp-pass').value='';
  document.getElementById('login-err').style.display='none';
}

// ═══════════════════════
// VIEWS
// ═══════════════════════
function toggleSidebar(open){
  const sb=document.querySelector('.sidebar');const ov=document.getElementById('sidebar-overlay');
  if(!sb)return;
  sb.classList.toggle('open',open);
  if(ov)ov.classList.toggle('show',open);
}
function showView(name){
  toggleSidebar(false);
  if(name !== 'player'){
    document.getElementById('video-wrap')
      .querySelectorAll('iframe,video')
      .forEach(e => e.remove());
    document.getElementById('no-video-msg').style.display = 'flex';
  }
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  const el=document.getElementById('view-'+name);if(el)el.classList.add('active');
  const tab=document.querySelector(`.nav-tab[data-view="${name}"]`);if(tab)tab.classList.add('active');
  if(name==='dashboard')loadAdminData();
  if(name==='admin-modules')loadAdminData();
  if(name==='admin-exams')loadAdminExams();
  if(name==='admin-students'){loadAdminData();renderGroupsView();}
  if(name==='admin-materials'){loadMaterials().then(renderAdminMaterials);}
  if(name==='materials'){loadMaterials().then(renderStudentMaterials);}
  if(name==='exams'){renderStudentExams();}
  if(name==='admin-sessions'){loadSessions().then(renderAdminSessions);}
  if(name==='sessions'){loadSessions().then(renderStudentSessions);}
  if(name==='support'){renderSupport();}
  if(name==='plan30'){loadExtra().then(()=>renderExtra('plan30'));}
  if(name==='godtalks'){loadExtra().then(()=>renderExtra('godtalks'));}
}

// ═══════════════════════
// LOAD DATA
// ═══════════════════════
async function loadModules(){
  const{data:mods}=await sb.from('modules').select('*').order('order_index');
  allModules=mods||[];
  const{data:lessons}=await sb.from('lessons').select('*').order('order_index');
  allLessons=lessons||[];
  const{data:exams}=await sb.from('exams').select('*');
  allExams=exams||[];
  if(!isAdmin){
    const{data:acc}=await sb.from('module_access').select('*').eq('student_id',currentUser.id);
    // Sin desbloqueos por defecto: el alumno solo ve los módulos que el admin
    // le haya habilitado explícitamente. Asignar un grupo NO desbloquea clases.
    userAccess=acc||[];
    // Cargar lecciones completadas
    try{
      const{data:lp}=await sb.from('lesson_progress').select('lesson_id').eq('student_id',currentUser.id);
      completedLessons=new Set((lp||[]).map(r=>r.lesson_id));
    }catch(e){completedLessons=new Set();}
  }
  renderModulesGrid();updateProgressStats();
}

async function loadAdminData(){
  const{data:mods}=await sb.from('modules').select('*').order('order_index');
  allModules=mods||[];
  const{data:lessons}=await sb.from('lessons').select('*').order('order_index');
  allLessons=lessons||[];
  const{data:exams}=await sb.from('exams').select('*');
  allExams=exams||[];
  const{data:questions}=await sb.from('exam_questions').select('*').order('order_index');
  allQuestions=questions||[];
  const{data:students}=await sb.from('profiles').select('*').neq('role','admin');
  allStudentsCache=students||[];
  // Datos reales para el dashboard
  try{const{data:acc}=await sb.from('module_access').select('*');allAccessCache=acc||[];}catch(e){allAccessCache=[];}
  try{const{data:res}=await sb.from('exam_results').select('*');allResultsCache=res||[];}catch(e){allResultsCache=[];}
  const pubIds=new Set(allModules.filter(m=>m.is_published).map(m=>m.id));
  allStudentsCache.forEach(st=>{
    const rows=allAccessCache.filter(a=>a.student_id===st.id&&a.unlocked&&pubIds.has(a.module_id));
    st.unlocked=rows.length;
    st.avgprog=rows.length?Math.round(rows.reduce((s,a)=>s+(a.progress||0),0)/rows.length):0;
  });
  document.getElementById('astat-students').textContent=allStudentsCache.length;
  document.getElementById('astat-modules').textContent=allModules.length;
  document.getElementById('astat-published').textContent=allModules.filter(m=>m.is_published).length;
  document.getElementById('astat-exams').textContent=allExams.length;
  renderAdminModules();renderDashboard();
}

// ═══════════════════════
// MATERIALES
// ═══════════════════════
async function loadMaterials(){
  try{const{data}=await sb.from('materials').select('*').order('order_index');allMaterials=data||[];}
  catch(e){allMaterials=[];}
}
function moduleName(id){const m=allModules.find(x=>x.id===id);return m?m.title:'Sin módulo';}

function renderAdminMaterials(){
  const tb=document.getElementById('materials-tbody');if(!tb)return;
  document.getElementById('materials-count-lbl').textContent=allMaterials.length+' materiales';
  if(!allMaterials.length){tb.innerHTML='<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted)">No hay materiales. Crea el primero.</td></tr>';return;}
  tb.innerHTML=allMaterials.map(m=>{
    const isFc=m.kind==='flashcards';const isLink=m.kind==='link';
    const tipo=isFc?'<span class="badge badge-accent">Notas</span>':isLink?'<span class="badge badge-blue">Enlace</span>':'<span class="badge badge-muted">'+((m.file_type||'archivo').toUpperCase())+'</span>';
    const cont=isFc?((m.cards?m.cards.length:0)+' notas'):(m.file_url?`<a href="${esc(m.file_url)}" target="_blank" class="text-accent">${isLink?'Abrir enlace':'Ver archivo'}</a>`:'—');
    return `<tr>
      <td><span class="fw-500">${esc(m.title)}</span>${m.description?`<div class="fs-11 text-muted">${esc(m.description)}</div>`:''}</td>
      <td>${tipo}</td>
      <td class="fs-12 text-muted">${moduleName(m.module_id)}${m.target_group?`<div style="margin-top:4px">${groupBadges(m.target_group)}</div>`:''}</td>
      <td class="fs-12 text-muted">${cont}</td>
      <td><div class="col-actions"><button class="btn btn-ghost btn-xs" onclick="editMaterial(${m.id})">Editar</button><button class="btn btn-danger btn-xs" onclick="deleteMaterial(${m.id})">Eliminar</button></div></td>
    </tr>`;
  }).join('');
}

function renderStudentMaterials(){
  const cont=document.getElementById('materials-student-content');if(!cont)return;
  const unlocked=new Set(userAccess.filter(a=>a.unlocked).map(a=>a.module_id));
  const visible=allMaterials.filter(m=>!m.lesson_id&&unlocked.has(m.module_id)&&targetGroupOk(m.target_group));
  if(!visible.length){cont.innerHTML='<div class="card"><p class="fs-13 text-muted">Aún no hay materiales disponibles para tus módulos.</p></div>';return;}
  let html='';
  allModules.forEach(mod=>{
    const mats=visible.filter(m=>m.module_id===mod.id);
    if(!mats.length)return;
    html+=`<div class="mat-group"><div class="mat-group-title">${esc(mod.title)}</div><div class="materials-grid">`;
    html+=mats.map(materialCardHtml).join('');
    html+='</div></div>';
  });
  cont.innerHTML=html;
}
function matIconPath(kind){
  if(kind==='flashcards')return '<path d="M4 7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><path d="M8 3h10a2 2 0 012 2v10"/>';
  if(kind==='link')return '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>';
  return '<path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z"/><path d="M14 2v5h5M9 13h6m-6 4h6"/>';
}
function materialCardHtml(m){
  const ic=matIconPath(m.kind);
  let action,meta;
  if(m.kind==='flashcards'){action=`<button class="btn btn-primary btn-sm w100" onclick="openFlashcards(${m.id})">Ver notas</button>`;meta=(m.cards?m.cards.length:0)+' notas';}
  else if(m.kind==='link'){action=`<a class="btn btn-primary btn-sm w100" href="${esc(m.file_url)}" target="_blank" rel="noopener" style="justify-content:center">Abrir enlace</a>`;meta='Enlace';}
  else{action=`<a class="btn btn-primary btn-sm w100" href="${esc(m.file_url)}" target="_blank" style="justify-content:center">Abrir documento</a>`;meta=esc(m.file_type||'documento');}
  return `<div class="material-card" data-mat-id="${m.id}">
    <div class="material-ic"><svg viewBox="0 0 24 24" stroke-width="1.5" fill="none">${ic}</svg></div>
    <div><div class="material-title">${esc(m.title)}</div>${m.description?`<div class="material-desc">${esc(m.description)}</div>`:''}</div>
    <div class="material-meta">${meta}</div>
    ${action}
  </div>`;
}
function renderModuleMaterials(moduleId){
  const sec=document.getElementById('materials-section');if(!sec)return;
  const mats=allMaterials.filter(m=>!m.lesson_id&&m.module_id===moduleId&&(isAdmin||targetGroupOk(m.target_group)));
  if(!mats.length){sec.innerHTML='';return;}
  sec.innerHTML=`<div class="lessons-section-title" style="margin-top:8px"><span>Materiales (${mats.length})</span></div>`
    +`<div class="mat-mini-list">${mats.map(m=>{
      const ic=matIconPath(m.kind);
      const tag=isAdmin&&m.target_group?`<span style="margin-right:6px">${groupBadges(m.target_group)}</span>`:'';
      return `<div class="mat-mini" onclick="goToMaterial(${m.id})">
        <div class="mat-mini-ic"><svg viewBox="0 0 24 24" stroke-width="1.5" fill="none">${ic}</svg></div>
        <div class="mat-mini-title">${esc(m.title)}</div>
        ${tag}
        <svg class="mat-mini-chev" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" width="14" height="14"><path d="M9 18l6-6-6-6"/></svg>
      </div>`;
    }).join('')}</div>`;
}
function renderStudentExams(){
  const cont=document.getElementById('exams-list-content');if(!cont)return;
  const unlocked=new Set(userAccess.filter(a=>a.unlocked).map(a=>a.module_id));
  const visible=allExams.filter(e=>e.is_published&&unlocked.has(e.module_id)&&targetGroupOk(e.target_group));
  if(!visible.length){cont.innerHTML='<div class="card"><p class="fs-13 text-muted">Aún no tienes exámenes disponibles. Se habilitan a medida que avanzas en los módulos.</p></div>';return;}
  const typeLabel={monthly:'Examen mensual',final:'Examen final'};
  let html='';
  allModules.forEach(mod=>{
    const exs=visible.filter(e=>e.module_id===mod.id);
    if(!exs.length)return;
    html+=`<div class="mat-group"><div class="mat-group-title">${esc(mod.title)}</div>`;
    html+=exs.map(ex=>`<div class="exam-row" onclick="openExam(${ex.id})">
      <div class="exam-icon"><svg viewBox="0 0 24 24" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg></div>
      <div class="exam-info"><div class="exam-title">${esc(ex.title)}</div><div class="exam-sub">${typeLabel[ex.exam_type]||'Examen'} · Mínimo ${ex.pass_score||70}% para aprobar</div></div>
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" width="16" height="16"><path d="M9 18l6-6-6-6"/></svg>
    </div>`).join('');
    html+='</div>';
  });
  cont.innerHTML=html;
}
function goToMaterial(id){
  showView('materials');
  setTimeout(()=>{
    const el=document.querySelector(`#view-materials [data-mat-id="${id}"]`);
    if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.add('mat-flash');setTimeout(()=>el.classList.remove('mat-flash'),1600);}
  },400);
}

function populateMatModules(sel){
  const s=document.getElementById('mat-module');
  s.innerHTML=allModules.map(m=>`<option value="${m.id}">${esc(m.title)}</option>`).join('');
  if(sel)s.value=sel;
}
function openMaterialModal(mat=null,presetModuleId=null){
  if(!allModules.length){toast('Primero crea un módulo','error');return;}
  document.getElementById('material-modal-title').textContent=mat?'Editar material':'Nuevo material';
  document.getElementById('mat-editing-id').value=mat?.id||'';
  document.getElementById('mat-title').value=mat?.title||'';
  document.getElementById('mat-desc').value=mat?.description||'';
  document.getElementById('mat-kind').value=mat?.kind||'file';
  populateMatModules(mat?.module_id||presetModuleId);
  fillTargetGroup('mat-group',mat?.target_group);
  document.getElementById('mat-file').value='';
  document.getElementById('mat-link-url').value=(mat?.kind==='link'?mat?.file_url:'')||'';
  const cur=document.getElementById('mat-file-current');
  cur.textContent=mat?.file_name?('Archivo actual: '+mat.file_name):'';
  cur.dataset.url=mat?.file_url||'';cur.dataset.name=mat?.file_name||'';cur.dataset.ftype=mat?.file_type||'';
  const cb=document.getElementById('cards-builder');cb.innerHTML='';
  const cards=mat?.cards||[];
  if(cards.length)cards.forEach(c=>addCardRow(c));else{addCardRow();addCardRow();}
  document.getElementById('mat-status').textContent='';
  toggleMaterialKind();
  document.getElementById('material-modal').classList.remove('hidden');
}
function closeMaterialModal(){document.getElementById('material-modal').classList.add('hidden');}
function editMaterial(id){openMaterialModal(allMaterials.find(m=>m.id===id));}
function toggleMaterialKind(){
  const k=document.getElementById('mat-kind').value;
  document.getElementById('mat-file-section').style.display=k==='file'?'block':'none';
  document.getElementById('mat-cards-section').style.display=k==='flashcards'?'block':'none';
  document.getElementById('mat-link-section').style.display=k==='link'?'block':'none';
}
function addCardRow(card=null){
  const cb=document.getElementById('cards-builder');
  const div=document.createElement('div');div.className='card-builder-row';
  div.innerHTML=`<textarea class="input" placeholder="Escribe la nota..." rows="2" style="resize:vertical"></textarea>
    <button class="btn btn-danger btn-xs" onclick="this.closest('.card-builder-row').remove()">✕</button>`;
  div.querySelector('textarea').value=card?(card.text||card.front||''):'';
  cb.appendChild(div);
}
async function saveMaterial(){
  const id=document.getElementById('mat-editing-id').value;
  const kind=document.getElementById('mat-kind').value;
  const title=document.getElementById('mat-title').value.trim();
  const module_id=parseInt(document.getElementById('mat-module').value);
  if(!title){toast('El título es obligatorio','error');return;}
  if(!module_id){toast('Selecciona un módulo','error');return;}
  const btn=document.getElementById('mat-save-btn');const st=document.getElementById('mat-status');
  const payload={title,description:document.getElementById('mat-desc').value.trim(),module_id,kind,target_group:getSelectedGroups('mat-group')||null,order_index:allMaterials.length+1};
  if(kind==='flashcards'){
    const rows=document.querySelectorAll('#cards-builder .card-builder-row');
    const cards=[];rows.forEach(r=>{const t=r.querySelector('textarea').value.trim();if(t)cards.push({text:t});});
    if(!cards.length){toast('Agrega al menos una nota','error');return;}
    payload.cards=cards;payload.file_url=null;payload.file_name=null;payload.file_type=null;
  }else if(kind==='link'){
    let url=document.getElementById('mat-link-url').value.trim();
    if(!url){toast('Escribe la URL del enlace','error');return;}
    if(!/^https?:\/\//i.test(url))url='https://'+url;
    payload.file_url=url;payload.file_name=null;payload.file_type='link';payload.cards=null;
  }else{
    const file=document.getElementById('mat-file').files[0];
    const cur=document.getElementById('mat-file-current');
    if(file){
      btn.disabled=true;st.textContent='Subiendo archivo...';
      const path=Date.now()+'_'+file.name.replace(/[^\w.\-]/g,'_');
      const{error:upErr}=await sb.storage.from('materials').upload(path,file,{upsert:true});
      if(upErr){btn.disabled=false;st.textContent='';toast('Error al subir: '+upErr.message,'error');return;}
      const{data:pub}=sb.storage.from('materials').getPublicUrl(path);
      payload.file_url=pub.publicUrl;payload.file_name=file.name;payload.file_type=(file.name.split('.').pop()||'').toLowerCase();
    }else if(cur.dataset.url){
      payload.file_url=cur.dataset.url;payload.file_name=cur.dataset.name;payload.file_type=cur.dataset.ftype;
    }else{toast('Selecciona un archivo','error');return;}
    payload.cards=null;
  }
  let err;
  if(id){({error:err}=await sb.from('materials').update(payload).eq('id',id));}
  else{({error:err}=await sb.from('materials').insert(payload));}
  btn.disabled=false;st.textContent='';
  if(err){toast('Error: '+err.message,'error');return;}
  toast(id?'Material actualizado':'Material creado','success');
  closeMaterialModal();await loadMaterials();renderAdminMaterials();if(currentModuleId)renderModuleMaterials(currentModuleId);
}
async function deleteMaterial(id){
  if(!confirm('¿Eliminar este material?'))return;
  await sb.from('materials').delete().eq('id',id);
  toast('Material eliminado','success');await loadMaterials();renderAdminMaterials();if(currentModuleId)renderModuleMaterials(currentModuleId);
}
function openFlashcards(id){
  const m=allMaterials.find(x=>x.id===id);if(!m||!m.cards||!m.cards.length){toast('Sin tarjetas','error');return;}
  fcCards=m.cards;fcIndex=0;
  document.getElementById('fc-title').textContent=m.title;
  renderFC();
  document.getElementById('flashcards-modal').classList.remove('hidden');
}
function renderFC(){
  const c=fcCards[fcIndex]||{};
  document.getElementById('fc-note').textContent=c.text||c.front||'';
  document.getElementById('fc-counter').textContent=(fcIndex+1)+' / '+fcCards.length;
}
function nextCard(){if(fcIndex<fcCards.length-1){fcIndex++;renderFC();}}
function prevCard(){if(fcIndex>0){fcIndex--;renderFC();}}

// ═══════════════════════
// SESIONES EN VIVO
// ═══════════════════════
const MES_ABR=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
async function loadSessions(){
  try{const{data}=await sb.from('live_sessions').select('*').order('starts_at');allSessions=data||[];}
  catch(e){allSessions=[];}
}
function sesWhen(s){return s.starts_at?new Date(s.starts_at):null;}
function fmtSesFull(d){
  if(!d)return '—';
  return d.toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'})+' · '+d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
}
function sesAudience(s){
  if(s.audience_type==='group')return s.audience_group||'Grupo';
  if(s.audience_type==='module')return moduleName(s.audience_module);
  return 'Todos';
}
function renderAdminSessions(){
  const tb=document.getElementById('sessions-tbody');if(!tb)return;
  const sorted=[...allSessions].sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
  document.getElementById('sessions-count-lbl').textContent=allSessions.length+' sesiones';
  if(!sorted.length){tb.innerHTML='<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted)">No hay sesiones. Crea la primera.</td></tr>';return;}
  tb.innerHTML=sorted.map(s=>{
    const d=sesWhen(s);
    const aud=s.audience_type==='all'||!s.audience_type?'<span class="badge badge-muted">Todos</span>':`<span class="badge badge-accent">${sesAudience(s)}</span>`;
    return `<tr>
      <td><span class="fw-500">${esc(s.title)}</span>${s.description?`<div class="fs-11 text-muted">${esc(s.description)}</div>`:''}</td>
      <td class="fs-12 text-muted">${fmtSesFull(d)}</td>
      <td>${aud}</td>
      <td class="fs-12">${s.join_url?`<a href="${s.join_url}" target="_blank" class="text-accent">Enlace</a>`:'—'}</td>
      <td><div class="col-actions"><button class="btn btn-ghost btn-xs" onclick="editSession(${s.id})">Editar</button><button class="btn btn-danger btn-xs" onclick="deleteSession(${s.id})">Eliminar</button></div></td>
    </tr>`;
  }).join('');
}
function sessionVisibleForStudent(s){
  if(!s.audience_type||s.audience_type==='all')return true;
  if(s.audience_type==='group')return (currentUser.group||'')===s.audience_group;
  if(s.audience_type==='module')return userAccess.some(a=>a.unlocked&&a.module_id===s.audience_module);
  return false;
}
function renderStudentSessions(){
  const cont=document.getElementById('sessions-student-content');if(!cont)return;
  const waZoom='https://wa.me/'+SUPPORT_WHATSAPP.replace(/[^0-9]/g,'')+'?text='+encodeURIComponent(SUPPORT_WA_MSG_ZOOM);
  const cta=`<div class="support-card" style="margin-bottom:18px">
    <div class="support-ic"><svg viewBox="0 0 24 24" stroke-width="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg></div>
    <h3>Sesiones en vivo por WhatsApp</h3>
    <p>Las sesiones en vivo (Zoom) se coordinan por WhatsApp. Toca el botón y te diremos tu <b>grupo</b> y tu <b>horario</b>, y te agregaremos al grupo correspondiente.</p>
    <a class="btn btn-wa w100" href="${waZoom}" target="_blank" rel="noopener" style="justify-content:center">Unirme por WhatsApp</a>
  </div>`;
  const now=Date.now();
  let list=allSessions.filter(sessionVisibleForStudent).map(s=>({s,t:s.starts_at?new Date(s.starts_at).getTime():0}));
  list=list.filter(x=>x.t===0||x.t>now-3*3600*1000).sort((a,b)=>a.t-b.t);
  const listHtml=!list.length?'':list.map(({s,t})=>{
    const d=t?new Date(t):null;
    const live=t&&now>=t&&now<=t+2*3600*1000;
    const dd=d?d.getDate():'–';const mm=d?MES_ABR[d.getMonth()]:'';
    const meta=[];
    if(d)meta.push(d.toLocaleDateString('es-ES',{weekday:'long'})+' · '+d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}));
    meta.push('Dirigida a: '+sesAudience(s));
    const btn=s.join_url?`<a class="btn ${live?'btn-primary':'btn-ghost'} btn-sm" href="${s.join_url}" target="_blank" style="justify-content:center">${live?'Unirse ahora':'Unirse'}</a>`:'';
    return `<div class="ses-card">
      <div class="ses-date"><div class="d">${dd}</div><div class="m">${mm}</div></div>
      <div class="ses-info"><div class="ses-title">${esc(s.title)} ${live?'<span class="ses-live">En vivo</span>':''}</div>${s.description?`<div class="fs-12 text-muted" style="margin-top:2px">${esc(s.description)}</div>`:''}<div class="ses-meta">${meta.map(m=>`<span>${esc(m)}</span>`).join('')}</div></div>
      ${btn}
    </div>`;
  }).join('');
  cont.innerHTML=cta+listHtml;
}
function populateSesModules(sel){
  const s=document.getElementById('ses-module');
  s.innerHTML=allModules.map(m=>`<option value="${m.id}">${esc(m.title)}</option>`).join('');
  if(sel)s.value=sel;
}
function toggleSessionAudience(){
  const a=document.getElementById('ses-audience').value;
  document.getElementById('ses-group-field').style.display=a==='group'?'block':'none';
  document.getElementById('ses-module-field').style.display=a==='module'?'block':'none';
}
function openSessionModal(ses=null){
  document.getElementById('session-modal-title').textContent=ses?'Editar sesión':'Nueva sesión';
  document.getElementById('ses-editing-id').value=ses?.id||'';
  document.getElementById('ses-title').value=ses?.title||'';
  document.getElementById('ses-desc').value=ses?.description||'';
  document.getElementById('ses-url').value=ses?.join_url||'';
  let dv='',tv='';
  if(ses?.starts_at){const d=new Date(ses.starts_at);dv=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);tv=('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
  document.getElementById('ses-date').value=dv;
  document.getElementById('ses-time').value=tv;
  document.getElementById('ses-audience').value=ses?.audience_type||'all';
  populateSesModules(ses?.audience_module);
  document.getElementById('ses-group').value=ses?.audience_group||GROUPS[0];
  toggleSessionAudience();
  document.getElementById('session-modal').classList.remove('hidden');
}
function closeSessionModal(){document.getElementById('session-modal').classList.add('hidden');}
function editSession(id){openSessionModal(allSessions.find(s=>s.id===id));}
async function saveSession(){
  const id=document.getElementById('ses-editing-id').value;
  const title=document.getElementById('ses-title').value.trim();
  const date=document.getElementById('ses-date').value;
  const time=document.getElementById('ses-time').value||'00:00';
  if(!title){toast('El título es obligatorio','error');return;}
  if(!date){toast('Selecciona una fecha','error');return;}
  const aud=document.getElementById('ses-audience').value;
  const payload={
    title,description:document.getElementById('ses-desc').value.trim(),
    join_url:document.getElementById('ses-url').value.trim(),
    starts_at:new Date(date+'T'+time).toISOString(),
    audience_type:aud,
    audience_group:aud==='group'?document.getElementById('ses-group').value:null,
    audience_module:aud==='module'?parseInt(document.getElementById('ses-module').value):null
  };
  let err;
  if(id){({error:err}=await sb.from('live_sessions').update(payload).eq('id',id));}
  else{({error:err}=await sb.from('live_sessions').insert(payload));}
  if(err){toast('Error: '+err.message,'error');return;}
  toast(id?'Sesión actualizada':'Sesión creada','success');
  closeSessionModal();await loadSessions();renderAdminSessions();
}
async function deleteSession(id){
  if(!confirm('¿Eliminar esta sesión?'))return;
  await sb.from('live_sessions').delete().eq('id',id);
  toast('Sesión eliminada','success');await loadSessions();renderAdminSessions();
}

// ═══════════════════════
// SOPORTE (alumno)
// ═══════════════════════
function renderSupport(){
  const cont=document.getElementById('support-content');if(!cont)return;
  const wa='https://wa.me/'+SUPPORT_WHATSAPP.replace(/[^0-9]/g,'')+'?text='+encodeURIComponent(SUPPORT_WA_MSG);
  const hours=SUPPORT_HOURS.map(h=>`<li><span class="d">${h.d}</span><span class="h">${h.h}</span></li>`).join('');
  const byCountry=SUPPORT_BY_COUNTRY.map(t=>`
    <div style="margin-top:14px">
      <div style="font-size:13px;font-weight:700;color:var(--ink);margin-bottom:6px">${t.turno} <span style="color:var(--muted);font-weight:500">· Bolivia ${t.bolivia}</span></div>
      <ul class="support-hours">${t.paises.map(p=>`<li><span class="d">${p.f} ${p.n}</span><span class="h">${p.h}</span></li>`).join('')}</ul>
    </div>`).join('');
  cont.innerHTML=`<div class="support-grid">
    <div class="support-card">
      <div class="support-ic"><svg viewBox="0 0 24 24" stroke-width="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg></div>
      <h3>Contáctanos por WhatsApp</h3>
      <p>Escríbenos y te ayudaremos con cualquier duda sobre la plataforma, tus clases o tu cuenta.</p>
      <a class="btn btn-wa w100" href="${wa}" target="_blank" rel="noopener" style="justify-content:center">Abrir WhatsApp</a>
    </div>
    <div class="support-card">
      <div class="support-ic"><svg viewBox="0 0 24 24" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
      <h3>Horarios de atención</h3>
      <p style="margin-top:-6px">Lunes a viernes · Hora Bolivia (GMT-4)</p>
      <ul class="support-hours">${hours}</ul>
    </div>
  </div>
  <div class="support-card" style="margin-top:16px">
    <div class="support-ic"><svg viewBox="0 0 24 24" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/></svg></div>
    <h3>Horarios por país</h3>
    <p style="margin-top:-6px">Hora local equivalente a cada turno (lunes a viernes)</p>
    ${byCountry}
  </div>`;
}

async function loadAdminExams(){
  await loadAdminData();renderAdminExams();
}

// ═══════════════════════
// SVG ICONS FOR MODULES
// ═══════════════════════
const iconSvgs=[
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M4 6h16M4 12h16M4 18h7"/></svg>',
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M8 12h.01M12 12h.01M16 12h.01"/><path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13M12 6.253C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13"/></svg>',
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 3a4 4 0 014 4v4a4 4 0 01-8 0V7a4 4 0 014-4z"/></svg>',
];

// ═══════════════════════
// MODULES GRID
// ═══════════════════════
function renderModulesGrid(){
  const grid=document.getElementById('modules-grid');
  const published=allModules.filter(m=>m.is_published);
  if(!published.length){grid.innerHTML='<div class="empty-state"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg><p class="fs-13 text-muted">No hay módulos publicados aún</p></div>';return;}
  const lvMap={beginner:{label:'Básico',cls:'badge-green'},intermediate:{label:'Intermedio',cls:'badge-accent'},advanced:{label:'Avanzado',cls:'badge-blue'}};
  grid.innerHTML=published.map((m,i)=>{
    const access=isAdmin?true:userAccess.some(a=>a.module_id===m.id&&a.unlocked);
    const locked=!access;
    const acc=userAccess.find(a=>a.module_id===m.id);
    const prog=acc?.progress||0;
    const lv=lvMap[m.level]||lvMap.beginner;
    const lessonCount=allLessons.filter(l=>l.module_id===m.id).length;
    const thumbHtml=m.thumbnail_url
      ?`<img src="${m.thumbnail_url}" onerror="this.style.display='none';this.nextSibling.style.display='flex'" style="width:100%;height:100%;object-fit:cover"><div class="module-thumb-fallback" style="display:none"><div class="module-thumb-icon">${iconSvgs[i%iconSvgs.length]}</div></div>`
      :`<div class="module-thumb-fallback"><div class="module-thumb-icon">${iconSvgs[i%iconSvgs.length]}</div></div>`;
    return `<div class="module-card${locked?' locked':''}" onclick="${locked?"toast('Este módulo no está desbloqueado aún')":"openModuleDetail("+m.id+")"}">
      <div class="module-thumb">
        ${thumbHtml}
        ${locked?`<div class="module-lock-overlay"><div class="lock-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><span class="lock-text">Bloqueado</span></div>`:''}
        ${lessonCount>0?`<div class="module-lesson-count">${lessonCount} lección${lessonCount!==1?'es':''}</div>`:''}
      </div>
      <div class="module-body">
        <div class="module-num">Módulo ${m.order_index||i+1}</div>
        <div class="module-title">${esc(m.title)}</div>
        ${m.description?`<div class="module-desc">${esc(m.description)}</div>`:''}
        <div class="module-footer">
          <div class="prog-wrap"><div class="prog-fill" style="width:${prog}%"></div></div>
          <div class="prog-pct">${prog}%</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════
// MODULE DETAIL
// ═══════════════════════
async function openModuleDetail(moduleId){
  currentModuleId=moduleId;
  const m=allModules.find(x=>x.id===moduleId);if(!m)return;
  if(!allLessons.some(l=>l.module_id===moduleId)){
    const{data}=await sb.from('lessons').select('*').eq('module_id',moduleId).order('order_index');
    allLessons=[...allLessons.filter(l=>l.module_id!==moduleId),...(data||[])];
  }
  if(!allMaterials.length)await loadMaterials();
  const lessons=allLessons.filter(l=>l.module_id===moduleId);
  const lv={beginner:'Básico',intermediate:'Intermedio',advanced:'Avanzado'};
  const hero=document.getElementById('detail-hero');
  const fallback=document.getElementById('detail-hero-fallback');
  hero.querySelectorAll('img').forEach(e=>e.remove());
  if(m.thumbnail_url){
    const img=document.createElement('img');img.src=m.thumbnail_url;img.style.cssText='width:100%;height:100%;object-fit:cover';
    img.onerror=()=>{img.remove();fallback.style.display='flex';};fallback.style.display='none';hero.insertBefore(img,fallback);
  }else{fallback.style.display='flex';}
  document.getElementById('detail-title').textContent=m.title;
  document.getElementById('detail-desc').textContent=m.description||'';
  document.getElementById('detail-meta').innerHTML=`
    <div class="meta-item"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>${lessons.length} lección${lessons.length!==1?'es':''}</div>`;
  document.getElementById('lessons-count-label').textContent=`Lecciones (${lessons.length})`;
  document.getElementById('lessons-grid').innerHTML=lessons.length?lessons.map((l,i)=>{
    const thumbSrc=lessonThumbUrl(l);
    const thumbHtml=thumbSrc
      ?`<img src="${thumbSrc}" onerror="this.style.display='none';this.nextSibling.style.display='flex'" style="width:100%;height:100%;object-fit:cover"><div class="lesson-thumb-fallback" style="display:none"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg></div>`
      :`<div class="lesson-thumb-fallback"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg></div>`;
    return `<div class="lesson-row" onclick="openLesson(${l.id})">
      <div class="lesson-thumb">${thumbHtml}<div class="lesson-play-overlay"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div></div>
      <div class="lesson-info">
        <div class="lesson-num">Lección ${l.order_index||i+1}</div>
        <div class="lesson-title">${esc(l.title)}</div>
        ${l.description?`<div class="lesson-desc">${esc(l.description)}</div>`:''}
      </div>
      <div style="display:flex;align-items:center;flex-shrink:0">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" width="14" height="14"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>`;
  }).join(''):'<p class="fs-12 text-muted">Este módulo aún no tiene lecciones.</p>';
  renderModuleMaterials(moduleId);
  document.getElementById('module-sidebar-list').innerHTML=lessons.map((l,i)=>`
    <div class="sidebar-item" onclick="openLesson(${l.id})">
      <div class="sidebar-item-num">Lección ${l.order_index||i+1}</div>
      <div class="sidebar-item-title">${esc(l.title)}</div>
    </div>`).join('')||'<div style="padding:14px;font-size:12px;color:var(--muted)">Sin lecciones aún</div>';
  document.getElementById('player-back-btn').onclick=()=>showView('module-detail');
  showView('module-detail');
}

// ═══════════════════════
// LESSON PROGRESS
// ═══════════════════════
async function markLessonComplete(lessonId,moduleId){
  if(isAdmin||!currentUser||completedLessons.has(lessonId))return;
  completedLessons.add(lessonId);
  // Guardar en BD
  try{
    await sb.from('lesson_progress').upsert(
      {student_id:currentUser.id,lesson_id:lessonId,module_id:moduleId,completed_at:new Date().toISOString()},
      {onConflict:'student_id,lesson_id'}
    );
  }catch(e){}
  // Calcular nuevo progreso del módulo
  await recalcModuleProgress(moduleId);
  // Actualizar UI de la card sin re-renderizar todo
  refreshModuleCardProgress(moduleId);
}

async function recalcModuleProgress(moduleId){
  const moduleLessons=allLessons.filter(l=>l.module_id===moduleId);
  if(!moduleLessons.length)return;
  const done=moduleLessons.filter(l=>completedLessons.has(l.id)).length;
  const pct=Math.round((done/moduleLessons.length)*100);
  // Actualizar en memoria
  const acc=userAccess.find(a=>a.module_id===moduleId);
  if(acc){acc.progress=pct;}
  // Persistir en module_access
  try{
    const{data:ex}=await sb.from('module_access').select('id').eq('student_id',currentUser.id).eq('module_id',moduleId).limit(1);
    if(ex&&ex.length){
      await sb.from('module_access').update({progress:pct}).eq('id',ex[0].id);
    }else{
      await sb.from('module_access').insert({student_id:currentUser.id,module_id:moduleId,unlocked:true,progress:pct});
    }
  }catch(e){}
}

function refreshModuleCardProgress(moduleId){
  // Actualiza barra y % en la card correspondiente sin re-renderizar
  const acc=userAccess.find(a=>a.module_id===moduleId);
  const pct=acc?.progress||0;
  // Encontrar la card por su onclick
  const grid=document.getElementById('modules-grid');
  if(!grid)return;
  const cards=[...grid.querySelectorAll('.module-card')];
  cards.forEach(card=>{
    const onclick=card.getAttribute('onclick')||'';
    if(onclick.includes(`openModuleDetail(${moduleId})`)){
      const fill=card.querySelector('.prog-fill');
      const pctEl=card.querySelector('.prog-pct');
      if(fill)fill.style.width=pct+'%';
      if(pctEl)pctEl.textContent=pct+'%';
    }
  });
}

function openLesson(lessonId){
  const l=allLessons.find(x=>x.id===lessonId);if(!l)return;
  const m=allModules.find(x=>x.id===l.module_id);
  document.getElementById('player-title').textContent=l.title;
  const lv={beginner:'Básico',intermediate:'Intermedio',advanced:'Avanzado'};
  document.getElementById('player-level-badge').textContent=m?lv[m.level]||'Básico':'';
  document.getElementById('watermark-text').textContent=`Brain Master English — ${currentUser?.email||''}`;
  const wrap=document.getElementById('video-wrap');
  const noVid=document.getElementById('no-video-msg');
  wrap.querySelectorAll('iframe,video').forEach(e=>e.remove());
  if(l.bunny_video_id&&l.bunny_library_id){
    noVid.style.display='none';
    const iframe=document.createElement('iframe');
    iframe.src=`https://iframe.mediadelivery.net/embed/${l.bunny_library_id}/${l.bunny_video_id}?autoplay=false&responsive=true`;
    iframe.allow='accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture';
    iframe.allowFullscreen=true;iframe.style.cssText='width:100%;height:100%;border:none;';
    wrap.insertBefore(iframe,wrap.querySelector('.watermark-overlay'));
  }else{noVid.style.display='flex';}
  renderLessonExtras(l);
  const moduleLessons=allLessons.filter(ls=>ls.module_id===l.module_id);
  document.getElementById('player-sidebar-hdr').textContent=m?m.title:'Lecciones';
  document.getElementById('player-sidebar-list').innerHTML=moduleLessons.map((ls,i)=>{
    const done=completedLessons.has(ls.id);
    return `<div class="sidebar-item${ls.id===lessonId?' active':''}" onclick="openLesson(${ls.id})">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
        <div>
          <div class="sidebar-item-num">Lección ${ls.order_index||i+1}</div>
          <div class="sidebar-item-title">${ls.title}</div>
        </div>
        ${done?`<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--green)" stroke-width="2.5" style="flex-shrink:0"><path d="M20 6L9 17l-5-5"/></svg>`:''}
      </div>
    </div>`;
  }).join('');
  showView('player');
  // Marcar la lección como completada
  markLessonComplete(lessonId, l.module_id);
}

// ── Descripción y material debajo del video ──
function matExtOf(m){
  if(m.kind==='link')return 'link';
  const e=(m.file_name||'').split('.').pop().toLowerCase();
  return e&&e.length<=5?e:(m.file_type||'doc');
}
function matColorOf(ext){
  const c={pdf:'#e24b4a',doc:'#378add',docx:'#378add',xls:'#3ddc97',xlsx:'#3ddc97',csv:'#3ddc97',ppt:'#e89a3c',pptx:'#e89a3c',png:'#a78bfa',jpg:'#a78bfa',jpeg:'#a78bfa',gif:'#a78bfa',webp:'#a78bfa',zip:'#9aa0aa',rar:'#9aa0aa',link:'#3ddc97'};
  return c[ext]||'#6b7280';
}
function switchLessonTab(t){
  const d=t==='desc';
  document.getElementById('ltab-desc').classList.toggle('active',d);
  document.getElementById('ltab-mat').classList.toggle('active',!d);
  document.getElementById('lesson-desc-panel').style.display=d?'block':'none';
  document.getElementById('lesson-mat-panel').style.display=d?'none':'block';
}
async function renderLessonExtras(l){
  switchLessonTab('desc');
  const info=document.getElementById('lesson-info');
  const descText=document.getElementById('lesson-desc-text');
  const hasDesc=!!(l.description&&l.description.trim());
  descText.textContent=hasDesc?l.description:'';
  const matList=document.getElementById('lesson-mat-list');
  matList.innerHTML='';
  info.style.display='flex';
  let hasMat=false;
  try{
    const{data}=await sb.from('materials').select('*').eq('lesson_id',l.id).order('order_index');
    if(!data||!data.length){if(!hasDesc)info.style.display='none';return;}
    hasMat=true;
    matList.innerHTML=data.map(m=>{
      const ext=matExtOf(m);
      const badge=ext==='link'?'WEB':ext.toUpperCase().slice(0,4);
      const open=m.kind==='flashcards'?`onclick="openFlashcards(${m.id})"`:'';
      const tag=m.kind==='flashcards'?'div':'a';
      const href=m.kind==='flashcards'?'':`href="${esc(m.file_url||'#')}" target="_blank" rel="noopener"`;
      const meta=m.kind==='flashcards'?((m.cards?m.cards.length:0)+' notas'):(m.kind==='link'?'Enlace':badge);
      const dl=m.kind==='flashcards'
        ?'<svg class="lmat-dl" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>'
        :'<svg class="lmat-dl" viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/></svg>';
      return `<${tag} class="lmat-row clickable" ${href} ${open}>
        <span class="lmat-ext" style="background:${matColorOf(ext)}">${badge}</span>
        <span class="lmat-info"><span class="lmat-name">${esc(m.title||m.file_name||'Material')}</span><span class="lmat-meta">${meta}</span></span>
        ${dl}
      </${tag}>`;
    }).join('');
  }catch(e){if(!hasDesc&&!hasMat)info.style.display='none';}
}

// ═══════════════════════
// EXAM FLOW (estudiante)
// ═══════════════════════
function examWaLink(exam,score){
  const msg=`Hola, soy ${currentUser?.name||'un alumno'}. No aprobé el examen "${exam.title}" (nota ${score}%). Quisiera solicitar una segunda instancia para volver a rendirlo.`;
  return 'https://wa.me/'+SUPPORT_WHATSAPP.replace(/[^0-9]/g,'')+'?text='+encodeURIComponent(msg);
}
function renderExamBlocked(exam,prev){
  document.getElementById('exam-title-big').textContent=exam.title;
  document.getElementById('exam-sub-info').textContent='Examen ya realizado';
  document.getElementById('exam-questions-container').innerHTML='';
  document.getElementById('exam-submit-area').innerHTML='';
  document.getElementById('exam-back-btn').onclick=()=>showView('exams');
  const passed=prev.passed;
  document.getElementById('exam-results-container').innerHTML=`
    <div class="exam-results-card">
      <div style="font-size:64px;text-align:center;margin-bottom:8px">${passed?'✅':'🔒'}</div>
      <div class="exam-score-big" style="color:${passed?'var(--green)':'var(--red)'}">${prev.score}%</div>
      <div class="exam-result-msg" style="font-size:18px;font-weight:600;margin-bottom:6px">${passed?'Ya aprobaste este examen':'No alcanzaste la nota mínima'}</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:20px">Nota mínima requerida: ${exam.pass_score||70}%</div>
      ${passed?'':`<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r-sm);padding:14px 16px;font-size:13px;color:var(--ink2);text-align:center;margin-bottom:16px;line-height:1.6">Para volver a rendir este examen debes solicitar una <b>segunda instancia</b> al administrador.</div>
      <div style="display:flex;justify-content:center;margin-bottom:6px"><a class="btn btn-wa" href="${examWaLink(exam,prev.score)}" target="_blank" rel="noopener">Solicitar por WhatsApp</a></div>`}
      <div style="display:flex;gap:10px;justify-content:center;margin-top:12px"><button class="btn btn-ghost" onclick="showView('exams')">Volver a Exámenes</button></div>
    </div>`;
  showView('exam');
}
async function openExam(examId){
  currentExamId=examId;examAnswers={};
  const exam=allExams.find(e=>e.id===examId);if(!exam)return;
  if(!isAdmin&&!exam.is_published){toast('Este examen aún no está disponible','error');return;}
  if(!isAdmin&&!targetGroupOk(exam.target_group)){toast('Este examen no está dirigido a tu grupo','error');return;}
  if(!isAdmin){
    try{
      const{data:prevArr}=await sb.from('exam_results').select('score,passed').eq('exam_id',examId).eq('student_id',currentUser.id).limit(1);
      const prev=prevArr&&prevArr.length?prevArr[0]:null;
      if(prev){renderExamBlocked(exam,prev);return;}
    }catch(e){}
  }
  let questions=allQuestions.filter(q=>q.exam_id===examId);
  if(!questions.length){
    const{data}=await sb.from('exam_questions').select('*').eq('exam_id',examId).order('order_index');
    questions=data||[];
    allQuestions=[...allQuestions.filter(q=>q.exam_id!==examId),...questions];
  }
  const secOrder={listening:0,grammar:1,reading:2,vocabulary:3};
  questions=[...questions].sort((a,b)=>{const sa=secOrder[a.section]??9,sb2=secOrder[b.section]??9;return sa!==sb2?sa-sb2:(a.order_index||0)-(b.order_index||0);});
  const typeLabel={monthly:'Examen mensual',final:'Examen final'};
  document.getElementById('exam-title-big').textContent=exam.title;
  document.getElementById('exam-sub-info').textContent=`${typeLabel[exam.exam_type]||'Examen'} · ${questions.length} pregunta${questions.length!==1?'s':''} · Mínimo ${exam.pass_score||70}% para aprobar`;
  document.getElementById('exam-results-container').innerHTML='';
  document.getElementById('exam-back-btn').onclick=()=>showView('exams');
  let html='',lastSec=null,num=0;
  questions.forEach(q=>{
    const sec=q.section||'grammar';
    if(sec!==lastSec){html+=`<div class="exam-section-title">${SECTION_LABEL[sec]||sec}</div>`;lastSec=sec;}
    num++;html+=renderExamQuestion(q,num);
  });
  document.getElementById('exam-questions-container').innerHTML=html;
  document.getElementById('exam-submit-area').innerHTML=`<button class="btn btn-primary" style="width:100%;padding:14px" onclick="submitExam()">Enviar examen</button>`;
  showView('exam');
}
function renderExamQuestion(q,num){
  const at=q.answer_type||'multiple';
  const letters=['A','B','C','D'];
  const audio=q.audio_url?`<audio class="exam-audio" controls preload="none" src="${esc(q.audio_url)}"></audio>`:'';
  const ctx=q.context?`<div class="exam-context">${esc(q.context).replace(/\n/g,'<br>')}</div>`:'';
  let ans='';
  if(at==='multiple'){
    ans=`<div class="answer-options">${[q.option_a,q.option_b,q.option_c,q.option_d].filter(Boolean).map((opt,oi)=>`<div class="answer-opt" data-val="${esc(opt)}" onclick="selectOpt(${q.id},this)"><span class="answer-letter">${letters[oi]}</span><span>${esc(opt)}</span></div>`).join('')}</div>`;
  }else if(at==='truefalse'){
    ans=`<div class="answer-options">${['Verdadero','Falso'].map(v=>`<div class="answer-opt" data-val="${v}" onclick="selectOpt(${q.id},this)"><span>${v}</span></div>`).join('')}</div>`;
  }else if(at==='short'){
    ans=`<input class="input exam-short" placeholder="Escribe tu respuesta" oninput="examAnswers[${q.id}]=this.value">`;
  }else{
    ans=`<textarea class="input exam-open" placeholder="Escribe tu respuesta" style="min-height:90px" oninput="examAnswers[${q.id}]=this.value"></textarea>`;
  }
  return `<div class="question-card" id="qcard-${q.id}" data-atype="${at}">
    <div class="question-num">Pregunta ${num}${at==='open'?' · respuesta abierta':''}</div>
    ${audio}${ctx}
    <div class="question-text">${esc(q.question)}</div>
    ${ans}
  </div>`;
}
function selectOpt(qId,el){
  examAnswers[qId]=el.dataset.val;
  el.closest('.answer-options').querySelectorAll('.answer-opt').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
}
async function submitExam(){
  const exam=allExams.find(e=>e.id===currentExamId);
  const questions=allQuestions.filter(q=>q.exam_id===currentExamId);
  const unanswered=questions.filter(q=>{const v=examAnswers[q.id];return v===undefined||v===null||(''+v).trim()==='';});
  if(unanswered.length){toast('Responde todas las preguntas antes de enviar','error');return;}
  if(!confirm('¿Estás seguro de que deseas enviar el examen? No podrás volver a realizarlo.'))return;
  const norm=s=>(''+(s||'')).trim().toLowerCase().replace(/\s+/g,' ');
  let auto=0,correct=0,hasOpen=false;
  questions.forEach(q=>{
    const at=q.answer_type||'multiple';
    const ans=examAnswers[q.id];
    const card=document.getElementById('qcard-'+q.id);
    if(at==='open'){hasOpen=true;return;}
    auto++;
    let ok;
    if(at==='short'){const accepted=(''+(q.correct_answer||'')).split(/[;\n]/).map(norm).filter(Boolean);ok=accepted.includes(norm(ans));}
    else{ok=(ans===q.correct_answer);}
    if(ok)correct++;
    if(card){
      if(at==='multiple'||at==='truefalse'){
        card.querySelectorAll('.answer-opt').forEach(o=>{o.classList.remove('selected');if(o.dataset.val===q.correct_answer)o.classList.add('correct');else if(o.dataset.val===ans)o.classList.add('wrong');});
      }else if(at==='short'){
        const inp=card.querySelector('.exam-short');if(inp){inp.style.borderColor=ok?'var(--green)':'var(--red)';inp.disabled=true;if(!ok)inp.value=ans+'   (correcta: '+(''+(q.correct_answer||'')).split(';').join(' / ')+')';}
      }
    }
  });
  const score=auto?Math.round(correct/auto*100):0;
  const passed=score>=(exam.pass_score||70);
  document.getElementById('exam-submit-area').innerHTML='';
  if(!isAdmin){try{await sb.from('exam_results').insert({exam_id:currentExamId,student_id:currentUser.id,score,passed});}catch(e){}}
  document.getElementById('exam-results-container').innerHTML=`
    <div class="exam-results-card">
      <div style="font-size:64px;text-align:center;margin-bottom:8px">${passed?'🎉':'😔'}</div>
      <div class="exam-score-big" style="color:${passed?'var(--green)':'var(--red)'}">${score}%</div>
      <div class="exam-result-msg" style="font-size:18px;font-weight:600;margin-bottom:6px">${passed?'¡Felicitaciones, aprobaste!':'No alcanzaste la nota mínima.'}</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:20px">Nota mínima: ${exam.pass_score||70}% · calificado sobre ${auto} pregunta${auto!==1?'s':''}</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:20px">
        <div style="background:var(--bg2);border-radius:var(--r-sm);padding:12px 24px;text-align:center"><div style="font-size:24px;font-weight:700;color:var(--green)">${correct}</div><div style="font-size:11px;color:var(--muted)">Correctas</div></div>
        <div style="background:var(--bg2);border-radius:var(--r-sm);padding:12px 24px;text-align:center"><div style="font-size:24px;font-weight:700;color:var(--red)">${auto-correct}</div><div style="font-size:11px;color:var(--muted)">Incorrectas</div></div>
        <div style="background:var(--bg2);border-radius:var(--r-sm);padding:12px 24px;text-align:center"><div style="font-size:24px;font-weight:700;color:var(--accent)">${questions.length}</div><div style="font-size:11px;color:var(--muted)">Total</div></div>
      </div>
      ${hasOpen?`<div style="background:var(--warn-soft);border:1px solid var(--border2);border-radius:var(--r-sm);padding:10px 16px;font-size:12px;color:var(--ink2);text-align:center;margin-bottom:14px">Tienes respuestas abiertas que tu profesor revisará manualmente.</div>`:''}
      ${!passed?`<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r-sm);padding:14px 16px;font-size:13px;color:var(--ink2);text-align:center;margin-bottom:14px;line-height:1.6">Para una <b>segunda instancia</b> de este examen, contacta al administrador.</div>
      <div style="display:flex;justify-content:center;margin-bottom:18px"><a class="btn btn-wa" href="${examWaLink(exam,score)}" target="_blank" rel="noopener">Solicitar segunda instancia</a></div>`:`<div style="background:var(--bg2);border-radius:var(--r-sm);padding:10px 16px;font-size:12px;color:var(--muted);text-align:center;margin-bottom:20px">Este examen ha sido enviado y no puede realizarse nuevamente.</div>`}
      <div style="display:flex;gap:10px;justify-content:center"><button class="btn btn-primary" onclick="showView('exams')">Volver a Exámenes</button></div>
    </div>`;
  window.scrollTo(0,0);
}

// ═══════════════════════
// ADMIN MODULE CRUD
// ═══════════════════════
function openModuleModal(mod=null){
  document.getElementById('module-modal-title').textContent=mod?'Editar módulo':'Nuevo módulo';
  document.getElementById('mod-title').value=mod?.title||'';
  document.getElementById('mod-desc').value=mod?.description||'';
  document.getElementById('mod-thumb').value=mod?.thumbnail_url||'';
  document.getElementById('mod-level').value=mod?.level||'beginner';
  document.getElementById('mod-published').checked=mod?.is_published||false;
  document.getElementById('mod-order').value=mod?.order_index||(allModules.length+1);
  document.getElementById('mod-editing-id').value=mod?.id||'';
  previewThumb('mod-thumb','mod-thumb-preview');
  const lessons=mod?allLessons.filter(l=>l.module_id===mod.id):[];
  const builder=document.getElementById('lessons-builder');builder.innerHTML='';
  if(lessons.length)lessons.forEach(l=>addLessonRow(l));else addLessonRow();
  document.getElementById('module-modal').classList.remove('hidden');
}
function closeModuleModal(){document.getElementById('module-modal').classList.add('hidden');}
function editModule(id){openModuleModal(allModules.find(m=>m.id===id));}

function addLessonRow(lesson=null){
  const builder=document.getElementById('lessons-builder');
  const div=document.createElement('div');div.className='question-builder-item';
  div.innerHTML=`
    <div class="question-builder-hdr">
      <span class="question-builder-num">Lección ${builder.children.length+1}</span>
      <button class="btn btn-danger btn-xs" onclick="this.closest('.question-builder-item').remove()">Eliminar</button>
    </div>
    <div class="flex col gap8">
      <div class="field f1"><input class="input" placeholder="Título de la lección" value="${lesson?.title||''}"></div>
      <div class="field"><input class="input" placeholder="Descripción (opcional)" value="${lesson?.description||''}"></div>
      <div class="field"><input class="input" placeholder="URL miniatura (opcional)" value="${lesson?.thumbnail_url||''}"></div>
      <div class="field"><input class="input" placeholder="Bunny Library ID" value="${lesson?.bunny_library_id||''}"></div>
      <div class="field"><input class="input" placeholder="Bunny Video ID" value="${lesson?.bunny_video_id||''}"></div>
    </div>
    <div style="margin-top:8px">
      <button class="btn btn-ghost btn-xs" onclick="openLessonMatModal(${lesson?.id||'null'},${lesson?.module_id||'null'})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13" style="margin-right:5px;vertical-align:-2px"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>Material${lesson?.id?'':' (guarda primero)'}</button>
    </div>
    <input type="hidden" value="${lesson?.id||''}">`;
  builder.appendChild(div);
}

async function saveModule(){
  const editId=document.getElementById('mod-editing-id').value;
  const payload={
    title:document.getElementById('mod-title').value.trim(),
    description:document.getElementById('mod-desc').value.trim(),
    thumbnail_url:document.getElementById('mod-thumb').value.trim(),
    level:document.getElementById('mod-level').value,
    order_index:parseInt(document.getElementById('mod-order').value)||1,
    is_published:document.getElementById('mod-published').checked,
  };
  if(!payload.title){toast('El título es obligatorio','error');return;}
  let moduleId=editId;
  if(editId){const{error}=await sb.from('modules').update(payload).eq('id',editId);if(error){toast('Error: '+error.message,'error');return;}}
  else{const{data,error}=await sb.from('modules').insert(payload).select().single();if(error){toast('Error: '+error.message,'error');return;}moduleId=data.id;}
  const lessonRows=document.getElementById('lessons-builder').querySelectorAll('.question-builder-item');
  for(let i=0;i<lessonRows.length;i++){
    const row=lessonRows[i];
    const inputs=row.querySelectorAll('input.input');
    const lessonId=row.querySelector('input[type=hidden]').value;
    const lPayload={module_id:parseInt(moduleId),title:inputs[0].value.trim(),description:inputs[1].value.trim(),thumbnail_url:inputs[2].value.trim(),bunny_library_id:inputs[3].value.trim(),bunny_video_id:inputs[4].value.trim(),order_index:i+1};
    if(!lPayload.title)continue;
    if(lessonId)await sb.from('lessons').update(lPayload).eq('id',lessonId);
    else await sb.from('lessons').insert(lPayload);
  }
  toast(editId?'Módulo actualizado':'Módulo creado','success');
  closeModuleModal();await loadAdminData();
}

async function deleteModule(id){
  if(!confirm('¿Eliminar este módulo y todas sus lecciones?'))return;
  await sb.from('lessons').delete().eq('module_id',id);
  await sb.from('module_access').delete().eq('module_id',id);
  await sb.from('modules').delete().eq('id',id);
  toast('Módulo eliminado','success');await loadAdminData();
}

async function togglePublish(id,current){
  await sb.from('modules').update({is_published:!current}).eq('id',id);
  toast(current?'Módulo despublicado':'Módulo publicado','success');await loadAdminData();
}

// ── Material por lección (admin) ──
let _lmLessonId=null,_lmModuleId=null;
async function openLessonMatModal(lessonId,moduleId){
  if(!lessonId){toast('Guarda el módulo primero para añadir material a esta lección','error');return;}
  _lmLessonId=lessonId;_lmModuleId=moduleId;
  document.getElementById('lm-lesson-id').value=lessonId;
  document.getElementById('lm-module-id').value=moduleId||'';
  document.getElementById('lm-kind').value='file';
  document.getElementById('lm-title').value='';
  document.getElementById('lm-file').value='';
  document.getElementById('lm-link-url').value='';
  document.getElementById('lm-status').textContent='';
  toggleLessonMatKind();
  await renderLessonMatList(lessonId);
  document.getElementById('lesson-mat-modal').classList.remove('hidden');
}
function closeLessonMatModal(){document.getElementById('lesson-mat-modal').classList.add('hidden');}
function toggleLessonMatKind(){
  const k=document.getElementById('lm-kind').value;
  document.getElementById('lm-file-section').style.display=k==='file'?'block':'none';
  document.getElementById('lm-link-section').style.display=k==='link'?'block':'none';
}
async function renderLessonMatList(lessonId){
  const cont=document.getElementById('lm-current-list');
  cont.innerHTML='<div class="fs-13 text-muted">Cargando…</div>';
  const{data}=await sb.from('materials').select('*').eq('lesson_id',lessonId).order('order_index');
  if(!data||!data.length){cont.innerHTML='<div class="fs-13 text-muted">Aún no hay material en esta lección.</div>';return;}
  cont.innerHTML=data.map(m=>{
    const ext=matExtOf(m);
    const badge=ext==='link'?'WEB':ext.toUpperCase().slice(0,4);
    return `<div class="lmat-row">
      <span class="lmat-ext" style="background:${matColorOf(ext)}">${badge}</span>
      <span class="lmat-info"><span class="lmat-name">${esc(m.title||m.file_name||'Material')}</span><span class="lmat-meta">${m.kind==='link'?'Enlace':badge}</span></span>
      <button class="btn btn-danger btn-xs" onclick="deleteLessonMat(${m.id})">Eliminar</button>
    </div>`;
  }).join('');
}
async function addLessonMat(){
  const lessonId=_lmLessonId,moduleId=_lmModuleId;
  if(!lessonId)return;
  const kind=document.getElementById('lm-kind').value;
  const btn=document.getElementById('lm-add-btn');const st=document.getElementById('lm-status');
  const payload={lesson_id:parseInt(lessonId),module_id:moduleId?parseInt(moduleId):null,kind,description:'',target_group:null,cards:null,order_index:Date.now()};
  if(kind==='link'){
    let url=document.getElementById('lm-link-url').value.trim();
    if(!url){toast('Escribe la URL del enlace','error');return;}
    if(!/^https?:\/\//i.test(url))url='https://'+url;
    payload.file_url=url;payload.file_name=null;payload.file_type='link';
    payload.title=document.getElementById('lm-title').value.trim()||url;
  }else{
    const file=document.getElementById('lm-file').files[0];
    if(!file){toast('Selecciona un archivo','error');return;}
    btn.disabled=true;st.textContent='Subiendo archivo...';
    const path=Date.now()+'_'+file.name.replace(/[^\w.\-]/g,'_');
    const{error:upErr}=await sb.storage.from('materials').upload(path,file,{upsert:true});
    if(upErr){btn.disabled=false;st.textContent='';toast('Error al subir: '+upErr.message,'error');return;}
    const{data:pub}=sb.storage.from('materials').getPublicUrl(path);
    payload.file_url=pub.publicUrl;payload.file_name=file.name;payload.file_type=(file.name.split('.').pop()||'').toLowerCase();
    payload.title=document.getElementById('lm-title').value.trim()||file.name;
  }
  const{error}=await sb.from('materials').insert(payload);
  btn.disabled=false;st.textContent='';
  if(error){toast('Error: '+error.message,'error');return;}
  toast('Material añadido','success');
  document.getElementById('lm-title').value='';
  document.getElementById('lm-file').value='';
  document.getElementById('lm-link-url').value='';
  await renderLessonMatList(lessonId);
  loadMaterials();
}
async function deleteLessonMat(id){
  if(!confirm('¿Eliminar este material?'))return;
  await sb.from('materials').delete().eq('id',id);
  toast('Material eliminado','success');
  await renderLessonMatList(_lmLessonId);
  loadMaterials();
}

function renderAdminModules(){
  const tbody=document.getElementById('modules-tbody');
  if(!allModules.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted)">No hay módulos. Crea el primero.</td></tr>';return;}
  const lvMap={beginner:'<span class="badge badge-green">Básico</span>',intermediate:'<span class="badge badge-accent">Intermedio</span>',advanced:'<span class="badge badge-blue">Avanzado</span>'};
  tbody.innerHTML=allModules.map(m=>{
    const lc=allLessons.filter(l=>l.module_id===m.id).length;
    const th=m.thumbnail_url?`<img src="${m.thumbnail_url}" style="width:48px;height:32px;object-fit:cover;border-radius:4px;border:0.5px solid var(--border)">`:`<div style="width:48px;height:32px;background:var(--bg2);border-radius:4px;border:0.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--muted)">Sin img</div>`;
    return `<tr>
      <td class="text-muted">${m.order_index}</td><td>${th}</td><td class="fw-500">${esc(m.title)}</td>
      <td>${lvMap[m.level]||lvMap.beginner}</td>
      <td><span class="badge badge-muted">${lc} lección${lc!==1?'es':''}</span></td>
      <td>${m.is_published?'<span class="badge badge-accent">Publicado</span>':'<span class="badge badge-muted">Borrador</span>'}</td>
      <td><div class="col-actions">
        <button class="btn btn-ghost btn-xs" onclick="openMaterialModal(null,${m.id})">+ Material</button>
        <button class="btn btn-ghost btn-xs" onclick="togglePublish(${m.id},${m.is_published})">${m.is_published?'Despublicar':'Publicar'}</button>
        <button class="btn btn-ghost btn-xs" onclick="editModule(${m.id})">Editar</button>
        <button class="btn btn-danger btn-xs" onclick="deleteModule(${m.id})">Eliminar</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ═══════════════════════
// ADMIN EXAM CRUD
// ═══════════════════════
const EXAM_SECTIONS=[['listening','Listening'],['grammar','Grammar / Use of English']];
const SECTION_LABEL={listening:'Listening',grammar:'Grammar / Use of English'};
const ATYPES=[['multiple','Opción múltiple'],['truefalse','Verdadero / Falso'],['short','Respuesta corta']];
const ATYPE_LABEL={multiple:'Opción múltiple',truefalse:'Verdadero / Falso',short:'Respuesta corta'};

function openExamModal(exam=null){
  document.getElementById('exam-modal-title').textContent=exam?'Editar examen':'Nuevo examen';
  document.getElementById('exam-title').value=exam?.title||'';
  document.getElementById('exam-desc').value=exam?.description||'';
  document.getElementById('exam-pass-score').value=exam?.pass_score||70;
  document.getElementById('exam-type').value=exam?.exam_type||'monthly';
  /* Columnas Supabase requeridas — ver SUPABASE_MATERIALES.md (sección Exámenes) */
  document.getElementById('exam-editing-id').value=exam?.id||'';
  const sel=document.getElementById('exam-module-select');
  sel.innerHTML=allModules.map(m=>`<option value="${m.id}"${exam?.module_id===m.id?' selected':''}>${esc(m.title)}</option>`).join('');
  fillTargetGroup('exam-group',exam?.target_group);
  const qBuilder=document.getElementById('questions-builder');qBuilder.innerHTML='';
  if(exam){const qs=allQuestions.filter(q=>q.exam_id===exam.id);if(qs.length)qs.forEach(q=>addQuestionRow(q));else addQuestionRow();}
  else addQuestionRow();
  document.getElementById('exam-modal').classList.remove('hidden');
}
function closeExamModal(){document.getElementById('exam-modal').classList.add('hidden');}
function editExam(id){openExamModal(allExams.find(e=>e.id===id));}

function addQuestionRow(q=null){
  const builder=document.getElementById('questions-builder');
  const div=document.createElement('div');div.className='question-builder-item';
  const sectionOpts=EXAM_SECTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  const typeOpts=ATYPES.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  div.innerHTML=`
    <div class="question-builder-hdr">
      <span class="question-builder-num">Pregunta ${builder.children.length+1}</span>
      <button class="btn btn-danger btn-xs" onclick="this.closest('.question-builder-item').remove()">Eliminar</button>
    </div>
    <div class="flex gap8" style="margin-bottom:8px">
      <div class="field f1"><label class="label" style="font-size:10px">Sección</label><select class="input q-section" onchange="toggleQAudio(this)">${sectionOpts}</select></div>
      <div class="field f1"><label class="label" style="font-size:10px">Método de respuesta</label><select class="input q-atype" onchange="toggleQType(this)">${typeOpts}</select></div>
    </div>
    <div class="field q-audio-field" style="display:none;margin-bottom:8px"><label class="label" style="font-size:10px">Audio MP3 (Listening)</label><input class="input q-audio" type="file" accept="audio/*"><div class="fs-11 text-muted q-audio-cur" style="margin-top:4px"></div></div>
    <div class="field" style="margin-bottom:8px"><input class="input q-question" placeholder="Texto de la pregunta"></div>
    <div class="q-ans q-ans-multiple">
      <div class="options-grid">
        ${['A','B','C','D'].map(l=>`<div class="field"><label class="label" style="font-size:10px">Opción ${l}</label><input class="input q-opt" placeholder="Opción ${l}"></div>`).join('')}
      </div>
      <div class="field" style="margin-top:8px"><label class="label">Respuesta correcta</label>
        <select class="input q-correct-mult" style="background:rgba(61,220,151,.06);border-color:rgba(61,220,151,.3)">${['A','B','C','D'].map((l,i)=>`<option value="${i}">Opción ${l}</option>`).join('')}</select>
      </div>
    </div>
    <div class="q-ans q-ans-truefalse" style="display:none">
      <div class="field"><label class="label">Respuesta correcta</label><select class="input q-correct-tf" style="background:rgba(61,220,151,.06);border-color:rgba(61,220,151,.3)"><option value="Verdadero">Verdadero</option><option value="Falso">Falso</option></select></div>
    </div>
    <div class="q-ans q-ans-short" style="display:none">
      <div class="field"><label class="label">Respuestas válidas (una por línea)</label><textarea class="input q-correct-short" placeholder="have been&#10;has been&#10;havebeen" style="min-height:64px"></textarea></div>
      <div class="fs-11 text-muted" style="margin-top:4px">El alumno escribe libremente; se acepta si coincide con cualquiera de estas (sin distinguir mayúsculas ni espacios extra).</div>
    </div>
    <input type="hidden" class="q-id" value="${q?.id||''}">
    <input type="hidden" class="q-audio-url" value="${q?.audio_url||''}">`;
  builder.appendChild(div);
  toggleQAudio(div.querySelector('.q-section'));
  if(q){
    div.querySelector('.q-section').value=q.section||'grammar';
    div.querySelector('.q-atype').value=q.answer_type||'multiple';
    div.querySelector('.q-question').value=q.question||'';
    if(q.audio_url)div.querySelector('.q-audio-cur').textContent='Audio actual cargado ✓';
    const at=q.answer_type||'multiple';
    if(at==='multiple'){
      const opts=[q.option_a,q.option_b,q.option_c,q.option_d];
      const inputs=div.querySelectorAll('.q-opt');
      opts.forEach((o,i)=>{if(inputs[i])inputs[i].value=o||'';});
      const idx=opts.findIndex(o=>o&&o===q.correct_answer);
      if(idx>=0)div.querySelector('.q-correct-mult').value=idx;
    }else if(at==='truefalse'){div.querySelector('.q-correct-tf').value=q.correct_answer||'Verdadero';}
    else if(at==='short'){div.querySelector('.q-correct-short').value=(''+(q.correct_answer||'')).split(/[;\n]/).map(s=>s.trim()).filter(Boolean).join('\n');}
    toggleQType(div.querySelector('.q-atype'));
    toggleQAudio(div.querySelector('.q-section'));
  }
}
function toggleQType(sel){
  const item=sel.closest('.question-builder-item');
  item.querySelectorAll('.q-ans').forEach(a=>a.style.display='none');
  const show=item.querySelector('.q-ans-'+sel.value);if(show)show.style.display='block';
}
function toggleQAudio(sel){
  const item=sel.closest('.question-builder-item');
  const f=item.querySelector('.q-audio-field');
  if(f)f.style.display=sel.value==='listening'?'block':'none';
}

async function saveExam(){
  const editId=document.getElementById('exam-editing-id').value;
  const payload={
    title:document.getElementById('exam-title').value.trim(),
    description:document.getElementById('exam-desc').value.trim(),
    module_id:parseInt(document.getElementById('exam-module-select').value),
    pass_score:parseInt(document.getElementById('exam-pass-score').value)||70,
    exam_type:document.getElementById('exam-type').value,
    target_group:getSelectedGroups('exam-group')||null,
  };
  if(!payload.title){toast('El título es obligatorio','error');return;}
  let examId=editId;
  if(editId){await sb.from('exams').update(payload).eq('id',editId);}
  else{const{data,error}=await sb.from('exams').insert(payload).select().single();if(error){toast('Error: '+error.message,'error');return;}examId=data.id;}
  if(editId)await sb.from('exam_questions').delete().eq('exam_id',editId);
  const rows=document.querySelectorAll('#questions-builder .question-builder-item');
  for(let i=0;i<rows.length;i++){
    const row=rows[i];
    const question=row.querySelector('.q-question').value.trim();
    if(!question)continue;
    const section=row.querySelector('.q-section').value;
    const atype=row.querySelector('.q-atype').value;
    let audio_url=row.querySelector('.q-audio-url').value||null;
    const file=row.querySelector('.q-audio').files[0];
    if(file){
      const path='exam-audio/'+Date.now()+'_'+file.name.replace(/[^\w.\-]/g,'_');
      const{error:upErr}=await sb.storage.from('materials').upload(path,file,{upsert:true});
      if(!upErr){const{data:pub}=sb.storage.from('materials').getPublicUrl(path);audio_url=pub.publicUrl;}
      else toast('Audio P'+(i+1)+': '+upErr.message,'error');
    }
    const qp={exam_id:parseInt(examId),question,section,answer_type:atype,audio_url,context:null,order_index:i+1,option_a:'',option_b:'',option_c:'',option_d:'',correct_answer:''};
    if(atype==='multiple'){
      const opts=[...row.querySelectorAll('.q-opt')].map(x=>x.value.trim());
      qp.option_a=opts[0]||'';qp.option_b=opts[1]||'';qp.option_c=opts[2]||'';qp.option_d=opts[3]||'';
      const ci=parseInt(row.querySelector('.q-correct-mult').value)||0;
      qp.correct_answer=opts[ci]||opts[0]||'';
    }else if(atype==='truefalse'){qp.correct_answer=row.querySelector('.q-correct-tf').value;}
    else if(atype==='short'){qp.correct_answer=row.querySelector('.q-correct-short').value.split(/\n/).map(s=>s.trim()).filter(Boolean).join(';');}
    await sb.from('exam_questions').insert(qp);
  }
  toast(editId?'Examen actualizado':'Examen creado','success');
  closeExamModal();await loadAdminData();renderAdminExams();
}

async function toggleExamPublish(id,current){
  await sb.from('exams').update({is_published:!current}).eq('id',id);
  toast(current?'Examen bloqueado':'Examen publicado','success');
  await loadAdminData();renderAdminExams();
}
async function openExamResults(examId){
  const ex=allExams.find(e=>e.id===examId);if(!ex)return;
  document.getElementById('results-modal-title').textContent='Resultados — '+ex.title;
  const body=document.getElementById('results-body');
  body.innerHTML='<p class="fs-12 text-muted">Cargando...</p>';
  document.getElementById('results-modal').classList.remove('hidden');
  let res=[];try{const r=await sb.from('exam_results').select('*').eq('exam_id',examId);res=r.data||[];}catch(e){}
  if(!res.length){body.innerHTML='<p class="fs-13 text-muted">Ningún alumno ha rendido este examen todavía.</p>';return;}
  const total=res.length,passed=res.filter(r=>r.passed).length,avg=Math.round(res.reduce((s,r)=>s+(r.score||0),0)/total);
  const nameOf=id=>{const s=allStudentsCache.find(x=>x.id===id);return s?(s.full_name||s.email):'Alumno';};
  const rows=[...res].sort((a,b)=>(b.score||0)-(a.score||0)).map(r=>`
    <div class="result-row">
      <div class="result-info"><div class="result-name">${nameOf(r.student_id)}</div><div class="result-sub">${r.completed_at?new Date(r.completed_at).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}):''}</div></div>
      <span class="badge ${r.passed?'badge-green':'badge-red'}">${r.score}%</span>
      <button class="btn btn-ghost btn-xs" onclick="retakeFromResults('${r.student_id}',${examId})">Permitir reintento</button>
    </div>`).join('');
  body.innerHTML=`<div class="results-summary">
      <div class="rs-cell"><div class="rs-val">${total}</div><div class="rs-lbl">Rendidos</div></div>
      <div class="rs-cell"><div class="rs-val">${passed}</div><div class="rs-lbl">Aprobados</div></div>
      <div class="rs-cell"><div class="rs-val">${avg}%</div><div class="rs-lbl">Promedio</div></div>
    </div>${rows}`;
}
async function retakeFromResults(studentId,examId){
  if(!confirm('¿Permitir reintento? Se borrará el resultado del alumno.'))return;
  await sb.from('exam_results').delete().eq('student_id',studentId).eq('exam_id',examId);
  toast('Reintento habilitado','success');
  openExamResults(examId);
}
async function deleteExam(id){
  if(!confirm('¿Eliminar este examen y sus preguntas?'))return;
  await sb.from('exam_questions').delete().eq('exam_id',id);
  await sb.from('exam_results').delete().eq('exam_id',id);
  await sb.from('exams').delete().eq('id',id);
  toast('Examen eliminado','success');await loadAdminExams();
}

function renderAdminExams(){
  const tbody=document.getElementById('exams-tbody');
  if(!allExams.length){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted)">No hay exámenes. Crea el primero.</td></tr>';return;}
  tbody.innerHTML=allExams.map(ex=>{
    const mod=allModules.find(m=>m.id===ex.module_id);
    const qc=allQuestions.filter(q=>q.exam_id===ex.id).length;
    const tName=ex.exam_type==='final'?'<span class="badge badge-warn">Final</span>':'<span class="badge badge-muted">Mensual</span>';
    const status=ex.is_published?'<span class="badge badge-green">Visible</span>':'<span class="badge badge-muted">Bloqueado</span>';
    const grp=groupBadges(ex.target_group);
    return `<tr>
      <td class="fw-500">${esc(ex.title)} ${tName} ${status} ${grp}</td>
      <td class="text-muted">${mod?.title||'—'}</td>
      <td><span class="badge badge-accent">${qc} preguntas</span></td>
      <td><span class="badge badge-green">${ex.pass_score||70}%</span></td>
      <td><div class="col-actions">
        <button class="btn btn-ghost btn-xs" onclick="openExamResults(${ex.id})">Resultados</button>
        <button class="btn ${ex.is_published?'btn-warn':'btn-success'} btn-xs" onclick="toggleExamPublish(${ex.id},${!!ex.is_published})">${ex.is_published?'Bloquear':'Publicar'}</button>
        <button class="btn btn-ghost btn-xs" onclick="editExam(${ex.id})">Editar</button>
        <button class="btn btn-danger btn-xs" onclick="deleteExam(${ex.id})">Eliminar</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ═══════════════════════
// STUDENT ACCESS
// ═══════════════════════
async function toggleAccess(studentId,moduleId,currentState){
  let ex=null;
  try{const res=await sb.from('module_access').select('id').eq('student_id',studentId).eq('module_id',moduleId).limit(1);ex=res.data?.length?res.data[0]:null;}catch(e){}
  if(ex)await sb.from('module_access').update({unlocked:!currentState}).eq('id',ex.id);
  else await sb.from('module_access').insert({student_id:studentId,module_id:moduleId,unlocked:true,progress:0});
  toast(!currentState?'Módulo desbloqueado':'Módulo bloqueado','success');
  await loadAdminData();
}

async function openAccessModal(studentId,studentName){
  document.getElementById('access-modal-title').textContent=`Acceso de ${studentName}`;
  const{data:accList}=await sb.from('module_access').select('*').eq('student_id',studentId);
  const published=allModules.filter(m=>m.is_published);
  document.getElementById('access-grid').innerHTML=published.map(m=>{
    const acc=(accList||[]).find(a=>a.module_id===m.id);const on=acc?.unlocked||false;
    return `<div class="flex ai-center jc-between" style="padding:10px 14px;background:var(--bg2);border-radius:var(--r-sm);border:0.5px solid var(--border)">
      <div><div class="fs-13 fw-500">${esc(m.title)}</div><div class="fs-11 text-muted">Módulo ${m.order_index}</div></div>
      <button class="btn ${on?'btn-success':'btn-ghost'} btn-sm" onclick="toggleAccess('${studentId}',${m.id},${on});openAccessModal('${studentId}','${studentName}')">${on?'Desbloqueado':'Bloqueado'}</button>
    </div>`;
  }).join('')||'<p class="fs-13 text-muted">No hay módulos publicados.</p>';
  document.getElementById('access-modal').classList.remove('hidden');
}

// ═══════════════════════
// SECCIONES DE VIDEO (Plan 30 días / Dios quiere hablarte)
// ═══════════════════════
async function loadExtra(){
  try{const{data}=await sb.from('extra_videos').select('*').order('order_index');allExtra=data||[];}
  catch(e){allExtra=[];}
  try{const{data}=await sb.from('extra_links').select('*').order('order_index');allExtraLinks=data||[];}
  catch(e){allExtraLinks=[];}
}
function embedUrl(url){
  if(!url)return '';
  let m=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if(m)return 'https://www.youtube.com/embed/'+m[1];
  m=url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if(m)return 'https://player.vimeo.com/video/'+m[1];
  return url;
}
function renderExtra(cat){
  const cont=document.getElementById('extra-content-'+cat);if(!cont)return;
  if(cat==='plan30'&&!isAdmin&&!(currentUser&&currentUser.plan30)){
    const msg='Hola, me interesa el "Plan de 30 días" (sección premium). ¿Me podrías dar más información?';
    const wa='https://wa.me/'+SUPPORT_WHATSAPP.replace(/[^0-9]/g,'')+'?text='+encodeURIComponent(msg);
    cont.innerHTML=`<div class="card" style="max-width:520px;text-align:center;padding:34px 28px;margin:0 auto">
      <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.08);border:1.5px solid var(--border2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px"><svg viewBox="0 0 24 24" fill="none" stroke="#e8eaed" stroke-width="1.8" width="28" height="28"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
      <div style="font-family:'Fraunces',serif;font-size:21px;color:var(--ink);margin-bottom:8px">Sección premium</div>
      <p class="fs-13 text-muted" style="margin-bottom:22px;line-height:1.6">El <b style="color:var(--ink2)">Plan de 30 días</b> es un contenido exclusivo. Solicita acceso y te damos toda la información.</p>
      <a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener" style="justify-content:center">Más información por WhatsApp</a>
    </div>`;
    return;
  }
  const items=allExtra.filter(v=>v.category===cat);
  const head=isAdmin?`<div style="margin-bottom:16px"><button class="btn btn-primary" onclick="openExtraModal('${cat}')">+ Añadir video</button></div>`:'';
  const videosHtml=items.length
    ?'<div class="materials-grid">'+items.map(v=>`
    <div class="material-card">
      <div class="material-ic"><svg viewBox="0 0 24 24" stroke-width="1.5" fill="none"><path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg></div>
      <div><div class="material-title">${esc(v.title)}</div>${v.description?`<div class="material-desc">${esc(v.description)}</div>`:''}</div>
      <button class="btn btn-primary btn-sm w100" onclick="playVideo(${v.id})">Ver video</button>
      ${isAdmin?`<div class="flex gap6"><button class="btn btn-ghost btn-xs f1" onclick="editExtra(${v.id})">Editar</button><button class="btn btn-danger btn-xs f1" onclick="deleteExtra(${v.id})">Eliminar</button></div>`:''}
    </div>`).join('')+'</div>'
    :'<div class="card"><p class="fs-13 text-muted">Aún no hay videos en esta sección.</p></div>';
  cont.innerHTML=head+videosHtml+renderExtraLinks(cat);
}
function renderExtraLinks(cat){
  const links=allExtraLinks.filter(l=>l.category===cat);
  const addBtn=isAdmin?`<button class="btn btn-ghost btn-sm" onclick="openLinkModal('${cat}')">+ Añadir enlace</button>`:'';
  if(!links.length&&!isAdmin)return '';
  const cards=links.length
    ?'<div class="materials-grid">'+links.map(l=>`
    <div class="material-card">
      <div class="material-ic"><svg viewBox="0 0 24 24" stroke-width="1.5" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
      <div><div class="material-title">${esc(l.title)}</div>${l.description?`<div class="material-desc">${esc(l.description)}</div>`:''}</div>
      <a class="btn btn-primary btn-sm w100" href="${esc(l.url)}" target="_blank" rel="noopener" style="justify-content:center">Abrir enlace</a>
      ${isAdmin?`<div class="flex gap6"><button class="btn btn-ghost btn-xs f1" onclick="editLink(${l.id})">Editar</button><button class="btn btn-danger btn-xs f1" onclick="deleteLink(${l.id})">Eliminar</button></div>`:''}
    </div>`).join('')+'</div>'
    :'<p class="fs-13 text-muted">Aún no hay enlaces en esta sección.</p>';
  return `<div class="mat-group" style="margin-top:28px">
    <div class="mat-group-title flex jc-between ai-center"><span>Enlaces</span>${addBtn}</div>
    ${cards}
  </div>`;
}
function openLinkModal(cat,l=null){
  document.getElementById('link-modal-title').textContent=l?'Editar enlace':'Añadir enlace';
  document.getElementById('link-editing-id').value=l?.id||'';
  document.getElementById('link-cat').value=l?l.category:cat;
  document.getElementById('link-title').value=l?.title||'';
  document.getElementById('link-desc').value=l?.description||'';
  document.getElementById('link-url').value=l?.url||'';
  document.getElementById('link-modal').classList.remove('hidden');
}
function editLink(id){const l=allExtraLinks.find(x=>x.id===id);if(l)openLinkModal(l.category,l);}
async function saveLink(){
  const id=document.getElementById('link-editing-id').value;
  const cat=document.getElementById('link-cat').value;
  let url=document.getElementById('link-url').value.trim();
  const payload={category:cat,title:document.getElementById('link-title').value.trim(),description:document.getElementById('link-desc').value.trim(),url,order_index:allExtraLinks.length+1};
  if(!payload.title){toast('El título es obligatorio','error');return;}
  if(!payload.url){toast('La URL es obligatoria','error');return;}
  if(!/^https?:\/\//i.test(payload.url))payload.url='https://'+payload.url;
  let err;
  if(id){({error:err}=await sb.from('extra_links').update(payload).eq('id',id));}
  else{({error:err}=await sb.from('extra_links').insert(payload));}
  if(err){toast('Error: '+err.message,'error');return;}
  toast(id?'Enlace actualizado':'Enlace añadido','success');
  document.getElementById('link-modal').classList.add('hidden');
  await loadExtra();renderExtra(cat);
}
async function deleteLink(id){
  if(!confirm('¿Eliminar este enlace?'))return;
  const l=allExtraLinks.find(x=>x.id===id);
  await sb.from('extra_links').delete().eq('id',id);
  toast('Enlace eliminado','success');await loadExtra();renderExtra(l?l.category:'plan30');
}
function playVideo(id){
  const v=allExtra.find(x=>x.id===id);if(!v)return;
  if(!v.bunny_library_id||!v.bunny_video_id){toast('Video no disponible','error');return;}
  document.getElementById('vm-title').textContent=v.title;
  document.getElementById('vm-frame').innerHTML=`<iframe src="https://iframe.mediadelivery.net/embed/${v.bunny_library_id}/${v.bunny_video_id}?autoplay=true&responsive=true" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>`;
  document.getElementById('video-modal').classList.remove('hidden');
}
function closeVideoModal(){document.getElementById('vm-frame').innerHTML='';document.getElementById('video-modal').classList.add('hidden');}
function openExtraModal(cat,v=null){
  document.getElementById('extra-modal-title').textContent=v?'Editar video':'Añadir video';
  document.getElementById('extra-editing-id').value=v?.id||'';
  document.getElementById('extra-cat').value=v?v.category:cat;
  document.getElementById('extra-title').value=v?.title||'';
  document.getElementById('extra-title').placeholder=(v?v.category:cat)==='godtalks'?'Ej: Semana 1 — Dios tiene un plan para ti':'Ej: Clase 1 — Introducción al marketing';
  document.getElementById('extra-desc').value=v?.description||'';
  document.getElementById('extra-lib').value=v?.bunny_library_id||'';
  document.getElementById('extra-vid').value=v?.bunny_video_id||'';
  document.getElementById('extra-modal').classList.remove('hidden');
}
function editExtra(id){const v=allExtra.find(x=>x.id===id);if(v)openExtraModal(v.category,v);}
async function saveExtra(){
  const id=document.getElementById('extra-editing-id').value;
  const cat=document.getElementById('extra-cat').value;
  const payload={category:cat,title:document.getElementById('extra-title').value.trim(),description:document.getElementById('extra-desc').value.trim(),bunny_library_id:document.getElementById('extra-lib').value.trim(),bunny_video_id:document.getElementById('extra-vid').value.trim(),order_index:allExtra.length+1};
  if(!payload.title){toast('El título es obligatorio','error');return;}
  if(!payload.bunny_library_id||!payload.bunny_video_id){toast('Completa los IDs de Bunny','error');return;}
  let err;
  if(id){({error:err}=await sb.from('extra_videos').update(payload).eq('id',id));}
  else{({error:err}=await sb.from('extra_videos').insert(payload));}
  if(err){toast('Error: '+err.message,'error');return;}
  toast(id?'Video actualizado':'Video añadido','success');
  document.getElementById('extra-modal').classList.add('hidden');
  await loadExtra();renderExtra(cat);
}
async function deleteExtra(id){
  if(!confirm('¿Eliminar este video?'))return;
  const v=allExtra.find(x=>x.id===id);
  await sb.from('extra_videos').delete().eq('id',id);
  toast('Video eliminado','success');await loadExtra();renderExtra(v?v.category:'plan30');
}

// ═══════════════════════
// STUDENTS VIEW
// ═══════════════════════
let studentsSelectedGroup=null;
// módulo actual del alumno = el de mayor order_index que tiene desbloqueado
function studentCurrentModule(s,pub){
  const ids=new Set(allAccessCache.filter(a=>a.student_id===s.id&&a.unlocked).map(a=>a.module_id));
  let best=null;pub.forEach(m=>{if(ids.has(m.id))best=m;});return best;
}
function studentRow(s,published){
  const pct=published>0?Math.round((s.unlocked||0)/published*100):0;
  const gbcls=(!s.group_name||s.group_name==='Sin grupo')?'badge-muted':'badge-accent';
  const initials=esc((s.full_name||s.email||'?').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase());
  return `<tr>
      <td><div class="flex ai-center gap8"><div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#3a3a42,#17171c);border:1px solid rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff;flex-shrink:0">${initials}</div><span class="fw-500">${esc(s.full_name||'—')}</span></div></td>
      <td class="text-muted fs-12">${esc(s.email)}</td>
      <td><span class="badge ${gbcls}">${esc(s.group_name||'Sin grupo')}</span></td>
      <td><div class="flex ai-center gap8"><div style="flex:1;height:6px;background:rgba(255,255,255,.08);border-radius:3px;min-width:60px;overflow:hidden"><div style="height:100%;border-radius:3px;background:linear-gradient(90deg,#e8eaed,#9ca3af);width:${pct}%"></div></div><span class="fs-11 text-muted">${s.unlocked||0}/${published}</span></div></td>
      <td class="fs-12 text-muted">${s.last_access?new Date(s.last_access).toLocaleDateString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</td>
      <td><div class="col-actions"><button class="btn btn-ghost btn-xs" onclick="openStudentProfile('${s.id}')">Ver perfil</button></div></td>
    </tr>`;
}
function openStudentGroup(g){studentsSelectedGroup=g||null;const sel=document.getElementById('filter-group');if(sel)sel.value=g||'';renderGroupsView(document.getElementById('search-student')?.value||'');}
function renderGroupsView(filter=''){
  const students=allStudentsCache;
  const pub=allModules.filter(m=>m.is_published).sort((a,b)=>(a.order_index||0)-(b.order_index||0));
  const published=pub.length;
  // Tarjetas de grupo (clicables); solo grupos con alumnos (+ "Sin grupo")
  const cnt={};students.forEach(s=>{const g=s.group_name||'Sin grupo';cnt[g]=(cnt[g]||0)+1;});
  const groups=GROUPS.filter(g=>cnt[g]);if(cnt['Sin grupo'])groups.push('Sin grupo');
  document.getElementById('group-cards').innerHTML=groups.length?groups.map(g=>{
    const c=g==='Sin grupo'?'#4a7090':'#e8eaed';const sel=studentsSelectedGroup===g?' sel':'';
    return `<div class="group-card clk${sel}" onclick="openStudentGroup('${g}')"><div class="group-card-name"><div class="group-dot" style="background:${c}"></div>${g}</div>
    <div class="group-card-count" style="color:${c}">${cnt[g]}</div>
    <div class="group-card-lbl">alumnos</div></div>`;}).join('')
    :'<div class="group-card"><div class="group-card-lbl">Aún no hay alumnos en ningún grupo.</div></div>';
  const tbody=document.getElementById('groups-tbody');
  const lbl=document.getElementById('groups-count-lbl');
  const hdr=document.querySelector('#view-admin-students .table-hdr-title');
  const term=(filter||'').trim().toLowerCase();
  // 1) Búsqueda global (en todos los grupos)
  if(term){
    const matches=students.filter(s=>(s.full_name||'').toLowerCase().includes(term)||(s.email||'').toLowerCase().includes(term));
    if(hdr)hdr.textContent='Resultados de búsqueda';
    lbl.textContent=`${matches.length} coincidencia${matches.length!==1?'s':''}`;
    tbody.innerHTML=matches.length?matches.map(s=>studentRow(s,published)).join(''):'<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">Sin coincidencias.</td></tr>';
    return;
  }
  // 2) Grupo seleccionado → alumnos agrupados por el módulo en que van
  if(studentsSelectedGroup){
    const g=studentsSelectedGroup;
    const list=students.filter(s=>(s.group_name||'Sin grupo')===g);
    if(hdr)hdr.innerHTML=`<button class="btn btn-ghost btn-xs" onclick="openStudentGroup(null)" style="margin-right:8px">← Grupos</button>${g}`;
    lbl.textContent=`${list.length} alumno${list.length!==1?'s':''}`;
    const buckets=new Map();
    list.forEach(s=>{const m=studentCurrentModule(s,pub);const k=m?m.id:'none';if(!buckets.has(k))buckets.set(k,{mod:m,arr:[]});buckets.get(k).arr.push(s);});
    const ordered=[...buckets.values()].sort((a,b)=>{if(!a.mod)return 1;if(!b.mod)return -1;return (a.mod.order_index||0)-(b.mod.order_index||0);});
    let html='';
    ordered.forEach(bk=>{
      const title=bk.mod?`Módulo ${bk.mod.order_index||''} — ${bk.mod.title}`:'Sin módulo iniciado';
      html+=`<tr><td colspan="6" style="background:var(--bg2);font-weight:600;color:var(--ink2);font-size:12px;padding:8px 14px">${title} <span class="text-muted" style="font-weight:400">· ${bk.arr.length}</span></td></tr>`;
      html+=bk.arr.map(s=>studentRow(s,published)).join('');
    });
    tbody.innerHTML=html||'<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">Este grupo no tiene alumnos.</td></tr>';
    return;
  }
  // 3) Sin grupo seleccionado → invitar a elegir
  if(hdr)hdr.textContent='Lista de alumnos';
  lbl.textContent=`${students.length} alumno${students.length!==1?'s':''} en total`;
  tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--muted)">Elige un grupo arriba para ver sus alumnos, o usa el buscador.</td></tr>';
}
function filterStudents(search){renderGroupsView(search);}

async function openStudentProfile(studentId){
  let students=allStudentsCache;
  let s=students.find(x=>x.id===studentId);
  if(!s){
  let data=null;
try{const res=await sb.from('profiles').select('*').eq('id',studentId).single();data=res.data;}catch(e){}
    if(!data)return;
    s=data;
    allStudentsCache.push(s);
  }
  const published=allModules.filter(m=>m.is_published);
  document.getElementById('sp-avatar').textContent=(s.full_name||s.email).substring(0,2).toUpperCase();
  document.getElementById('sp-modal-title').textContent=s.full_name||s.email;
  document.getElementById('sp-name').textContent=s.full_name||'—';
  document.getElementById('sp-email').textContent=s.email;
  document.getElementById('sp-group-select').value=s.group_name||'';
  const gbcls=(!s.group_name||s.group_name==='Sin grupo')?'badge-muted':'badge-accent';
  document.getElementById('sp-group-badge').innerHTML=`<span class="badge ${gbcls}">${esc(s.group_name||'Sin grupo')}</span>`;
  let accList=[];
try{const res=await sb.from('module_access').select('*').eq('student_id',studentId);accList=res.data||[];}catch(e){}
  document.getElementById('sp-modules').innerHTML=published.map(m=>{
    const acc=(accList||[]).find(a=>a.module_id===m.id);const on=acc?.unlocked||false;
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg2);border-radius:var(--r-sm);border:0.5px solid var(--border)">
      <div><div class="fs-13 fw-500">${esc(m.title)}</div><div class="fs-11 text-muted">Módulo ${m.order_index}</div></div>
      <button class="btn ${on?'btn-success':'btn-ghost'} btn-sm" onclick="toggleAccessFromProfile('${studentId}',${m.id},${on},this)">${on?'Desbloqueado':'Bloqueado'}</button>
    </div>`;
  }).join('')||'<p class="fs-12 text-muted">Sin módulos publicados.</p>';
  renderProfileStudyTime(studentId);
  renderProfileExams(studentId);
  const p30=!!s.plan30_access;const pb=document.getElementById('sp-plan30-btn');
  pb.className='btn '+(p30?'btn-success':'btn-ghost')+' btn-sm';
  pb.textContent=p30?'Con acceso':'Sin acceso';
  pb.onclick=()=>togglePlan30(studentId,p30,pb);
  document.getElementById('sp-delete-btn').onclick=()=>deleteStudentFromProfile(studentId,s.full_name||s.email);
  document.getElementById('sp-save-group-btn').onclick=async()=>{
    const ng=document.getElementById('sp-group-select').value;
    await sb.from('profiles').update({group_name:ng}).eq('id',studentId);
    const st=allStudentsCache.find(x=>x.id===studentId);
    if(st)st.group_name=ng||'Sin grupo';
    toast('Grupo actualizado','success');
    document.getElementById('student-profile-modal').classList.add('hidden');
    renderGroupsView();
  };
  document.getElementById('student-profile-modal').classList.remove('hidden');
}

async function renderProfileStudyTime(studentId){
  const el=document.getElementById('sp-studytime');if(!el)return;
  el.textContent='⏱️ Tiempo estudiado: cargando…';
  let rows=[];
  try{const res=await sb.from('study_time').select('day,minutes').eq('student_id',studentId);rows=res.data||[];}catch(e){rows=[];}
  const total=rows.reduce((s,r)=>s+(Number(r.minutes)||0),0);
  // Esta semana (desde el lunes)
  const now=new Date();const ws=new Date(now);ws.setDate(now.getDate()-((now.getDay()+6)%7));ws.setHours(0,0,0,0);
  const week=rows.reduce((s,r)=>{const d=new Date(r.day+'T00:00:00');return d>=ws?s+(Number(r.minutes)||0):s;},0);
  el.innerHTML=`⏱️ <b style="color:var(--ink)">Tiempo estudiado:</b> ${fmtStudy(total)} en total · ${fmtStudy(week)} esta semana`;
}
async function renderProfileExams(studentId){
  const cont=document.getElementById('sp-exams');if(!cont)return;
  cont.innerHTML='<p class="fs-12 text-muted">Cargando...</p>';
  let results=[];
  try{const res=await sb.from('exam_results').select('*').eq('student_id',studentId);results=res.data||[];}catch(e){results=[];}
  if(!results.length){cont.innerHTML='<p class="fs-12 text-muted">El alumno aún no ha rendido exámenes.</p>';return;}
  cont.innerHTML=results.map(r=>{
    const ex=allExams.find(e=>e.id===r.exam_id);
    const title=ex?ex.title:'Examen #'+r.exam_id;
    const badge=r.passed?'<span class="badge badge-green">Aprobado</span>':'<span class="badge badge-red">Reprobado</span>';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg2);border-radius:var(--r-sm);border:0.5px solid var(--border)">
      <div><div class="fs-13 fw-500">${title}</div><div class="fs-11 text-muted">Nota: ${r.score}% · ${badge}</div></div>
      <button class="btn btn-warn btn-sm" onclick="allowRetake('${studentId}',${r.exam_id},this)">Permitir reintento</button>
    </div>`;
  }).join('');
}
async function allowRetake(studentId,examId,btn){
  if(!confirm('¿Permitir que el alumno vuelva a rendir este examen? Se borrará su resultado actual.'))return;
  btn.disabled=true;btn.textContent='Habilitando...';
  const{error}=await sb.from('exam_results').delete().eq('student_id',studentId).eq('exam_id',examId);
  if(error){btn.disabled=false;btn.textContent='Permitir reintento';toast('Error: '+error.message,'error');return;}
  toast('Reintento habilitado','success');
  renderProfileExams(studentId);
}
async function togglePlan30(studentId,current,btn){
  const nv=!current;
  const{error}=await sb.from('profiles').update({plan30_access:nv}).eq('id',studentId);
  if(error){toast('Error: '+error.message,'error');return;}
  const st=allStudentsCache.find(x=>x.id===studentId);if(st)st.plan30_access=nv;
  btn.className='btn '+(nv?'btn-success':'btn-ghost')+' btn-sm';
  btn.textContent=nv?'Con acceso':'Sin acceso';
  btn.onclick=()=>togglePlan30(studentId,nv,btn);
  toast(nv?'Acceso premium concedido':'Acceso premium retirado','success');
}
async function toggleAccessFromProfile(studentId,moduleId,currentState,btn){
  let ex=null;
  try{const res=await sb.from('module_access').select('id').eq('student_id',studentId).eq('module_id',moduleId).limit(1);ex=res.data?.length?res.data[0]:null;}catch(e){}
  if(ex)await sb.from('module_access').update({unlocked:!currentState}).eq('id',ex.id);
  else await sb.from('module_access').insert({student_id:studentId,module_id:moduleId,unlocked:true,progress:0});
  const on=!currentState;
  btn.className=`btn ${on?'btn-success':'btn-ghost'} btn-sm`;
  btn.textContent=on?'Desbloqueado':'Bloqueado';
  toast(on?'Módulo desbloqueado':'Módulo bloqueado','success');
}

async function deleteStudentFromProfile(id,name){
  if(!confirm(`¿Eliminar a ${name}?`))return;
  if(!id)return;
  try{await sb.from('module_access').delete().eq('student_id',id);}catch(e){}
  try{await sb.from('profiles').delete().eq('id',id);}catch(e){}
  allStudentsCache=[];
  document.getElementById('student-profile-modal').classList.add('hidden');
  toast(`${name} eliminado`,'success');
  renderGroupsView();loadAdminData();
}

async function createStudent(){
  const name=document.getElementById('new-name').value.trim();
  const email=document.getElementById('new-email').value.trim();
  const pass=document.getElementById('new-pass').value;
  const group=document.getElementById('new-group')?.value||'';
  if(!name||!email||!pass){toast('Completa todos los campos','error');return;}
  if(pass.length<6){toast('Contraseña mínimo 6 caracteres','error');return;}
  const{data,error}=await sb.auth.signUp({email,password:pass,options:{emailRedirectTo:window.location.origin,data:{full_name:name}}});
  if(error){toast('Error: '+error.message,'error');return;}
  if(data.user)await sb.from('profiles').insert({id:data.user.id,email,full_name:name,role:'student',group_name:group||null,must_change_password:true});
  toast(`Alumno ${name} creado. Se le envió un correo de confirmación.`,'success');
  document.getElementById('new-name').value='';document.getElementById('new-email').value='';document.getElementById('new-pass').value='';
  if(document.getElementById('new-group'))document.getElementById('new-group').value='';
  await loadAdminData();
}

async function submitNewPassword(){
  const p1=document.getElementById('new-pass-1').value;
  const p2=document.getElementById('new-pass-2').value;
  const err=document.getElementById('pass-change-err');err.style.display='none';
  if(p1.length<6||p1!==p2){err.style.display='block';return;}
  const{error}=await sb.auth.updateUser({password:p1});
  if(error){err.textContent='Error: '+error.message;err.style.display='block';return;}
  await sb.from('profiles').update({must_change_password:false}).eq('id',currentUser.id);
  document.getElementById('change-pass-modal').classList.add('hidden');
  toast('Contraseña establecida correctamente','success');
  await gateTermsThenLaunch();
}

// ═══════════════════════
// DASHBOARD
// ═══════════════════════
function renderDashboard(){
  const students=allStudentsCache;
  const mods=allModules;
  const published=mods.filter(m=>m.is_published);
  // Inicio de semana (lunes)
  const now=new Date();const ws=new Date(now);ws.setDate(now.getDate()-((now.getDay()+6)%7));ws.setHours(0,0,0,0);
  const newWk=students.filter(s=>s.created_at&&new Date(s.created_at)>=ws).length;
  const avgProgress=students.length?Math.round(students.reduce((s,st)=>s+(st.avgprog||0),0)/students.length):0;
  const ic=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">'+p+'</svg>';
  const kpis=[
    {label:'Alumnos totales',val:students.length,delta:newWk?`+${newWk} esta semana`:'Sin altas esta semana',icon:ic('<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>')},
    {label:'Módulos publicados',val:published.length+'/'+mods.length,delta:'De '+mods.length+' totales',icon:ic('<path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>')},
    {label:'Progreso promedio',val:avgProgress+'%',delta:'De los alumnos con acceso',icon:ic('<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10"/>')},
    {label:'Exámenes creados',val:allExams.length,delta:'En todos los módulos',icon:ic('<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>')},
  ];
  document.getElementById('dash-kpis').innerHTML=kpis.map(k=>`
    <div class="dash-kpi"><div class="dash-kpi-icon">${k.icon}</div>
    <div class="dash-kpi-val">${k.val}</div>
    <div class="dash-kpi-lbl">${k.label}</div>
    <div class="dash-kpi-delta">${k.delta}</div></div>`).join('');
  // Actividad semanal real = exámenes rendidos por día (todos los alumnos)
  const days=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const activity=days.map((_,i)=>{const d=new Date(ws);d.setDate(ws.getDate()+i);const n=new Date(d);n.setDate(d.getDate()+1);return allResultsCache.filter(r=>{const t=r.completed_at?new Date(r.completed_at):null;return t&&t>=d&&t<n;}).length;});
  const maxA=Math.max(...activity,1);
  document.getElementById('dash-bars').innerHTML=activity.map(v=>`
    <div class="dash-bar-col" style="flex:1"><div class="dash-bar-fill" style="height:${Math.max(4,(v/maxA)*72)}px;opacity:${v?1:.25}"><div class="dash-bar-tooltip">${v} examen${v!==1?'es':''}</div></div></div>`).join('');
  document.getElementById('dash-bar-labels').innerHTML=days.map(d=>`<div style="flex:1;text-align:center;font-size:9px;color:var(--muted)">${d}</div>`).join('');
  // Módulos con más alumnos con acceso (real)
  const topMods=published.map(m=>({name:m.title,count:allAccessCache.filter(a=>a.module_id===m.id&&a.unlocked).length})).sort((a,b)=>b.count-a.count).slice(0,5);
  const maxC=topMods[0]?.count||1;
  document.getElementById('dash-top-modules').innerHTML=topMods.length?topMods.map((m,i)=>`
    <div class="top-module-row"><span class="top-module-rank">${i+1}</span>
    <span class="top-module-name" title="${esc(m.name)}">${esc(m.name.length>26?m.name.substring(0,24)+'…':m.name)}</span>
    <div class="top-module-bar-wrap"><div class="top-module-bar" style="width:${(m.count/maxC)*100}%"></div></div>
    <span class="top-module-count">${m.count}</span></div>`).join(''):'<p class="fs-12 text-muted">Sin módulos publicados</p>';
  // Últimos alumnos registrados (real, por fecha de alta)
  const recent=[...students].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)).slice(0,5);
  document.getElementById('dash-recent-students').innerHTML=recent.length?recent.map(s=>{
    const when=s.created_at?new Date(s.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'}):'—';
    return `<div class="recent-student-row">
      <div class="recent-av">${(s.full_name||s.email).substring(0,2).toUpperCase()}</div>
      <div class="recent-info"><div class="recent-name">${esc(s.full_name||s.email)}</div><div class="recent-time">Registrado: ${when}</div></div>
      <span class="badge badge-muted recent-badge">${esc(s.group_name||'Sin grupo')}</span>
    </div>`;}).join(''):'<p class="fs-12 text-muted">Sin alumnos aún</p>';
}

// ═══════════════════════
// PROGRESS & WEEK BARS
// ═══════════════════════
async function updateProgressStats(){
  const published=allModules.filter(m=>m.is_published).length;
  const unlocked=isAdmin?published:userAccess.filter(a=>a.unlocked).length;
  document.getElementById('prog-modules').textContent=`${unlocked}/${published}`;

  if(isAdmin||!currentUser?.id)return;

  // Examenes completados y promedio de notas
  try{
    const{data:results}=await sb.from('exam_results').select('score,passed,completed_at').eq('student_id',currentUser.id);
    const total=results?.length||0;
    const passed=results?.filter(r=>r.passed).length||0;
    const avg=total?Math.round(results.reduce((s,r)=>s+r.score,0)/total):0;

    const elExams=document.getElementById('prog-exams');
    const elAvg=document.getElementById('prog-avg');
    const elPassed=document.getElementById('prog-passed');
    if(elExams)elExams.textContent=`${passed}/${total}`;
    if(elAvg)elAvg.textContent=avg+'%';
    if(elPassed)elPassed.textContent=passed;

    // Barras semanales basadas en el tiempo de actividad real
    initWeekBars();
  }catch(e){}
}

// ── Tiempo estudiado (persistente en Supabase, con caché local) ──
let studyDays={}; // { 'YYYY-MM-DD': minutos } del alumno actual
function studyCacheKey(){return 'bm_studydays_'+(currentUser?.id||'anon');}
function dayKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function fmtStudy(m){m=Math.max(0,Math.round(m));if(m<60)return m+' min';const h=Math.floor(m/60),mm=m%60;return mm?h+'h '+mm+'m':h+'h';}
function saveStudyLocal(){try{localStorage.setItem(studyCacheKey(),JSON.stringify(studyDays));}catch(e){}}
async function loadStudyTime(){
  // 1) Caché local primero (instantáneo / offline)
  try{studyDays=JSON.parse(localStorage.getItem(studyCacheKey())||'{}')||{};}catch(e){studyDays={};}
  // 2) Supabase como fuente de verdad (solo alumnos con sesión real)
  if(!isAdmin&&currentUser?.id){
    try{
      const{data}=await sb.from('study_time').select('day,minutes').eq('student_id',currentUser.id);
      if(data){const m={};data.forEach(r=>{m[r.day]=Number(r.minutes)||0;});studyDays=m;saveStudyLocal();}
    }catch(e){}
  }
}
async function flushTodayStudy(){
  if(isAdmin||!currentUser?.id)return;
  const tk=dayKey(new Date());
  const minutes=Math.round((studyDays[tk]||0)*100)/100;
  try{await sb.from('study_time').upsert({student_id:currentUser.id,day:tk,minutes,updated_at:new Date().toISOString()},{onConflict:'student_id,day'});}catch(e){}
}

function initWeekBars(){
  const el=document.getElementById('week-bars');if(!el)return;
  const days=['Lu','Ma','Mi','Ju','Vi','Sa','Do'];
  const now=new Date();
  const weekStart=new Date(now);
  weekStart.setDate(now.getDate()-((now.getDay()+6)%7)); // lunes de esta semana
  weekStart.setHours(0,0,0,0);
  const data=days.map((_,i)=>{const day=new Date(weekStart);day.setDate(weekStart.getDate()+i);return Math.round(studyDays[dayKey(day)]||0);});
  const max=Math.max(...data,1);
  el.innerHTML=days.map((d,i)=>`
    <div class="bar-col"><div class="bar-fill" style="height:${data[i]?Math.max(3,(data[i]/max)*64):3}px;opacity:${data[i]?1:.2}"><div class="bar-tooltip">${data[i]?fmtStudy(data[i]):'Sin actividad'}</div></div><div class="bar-lbl">${d}</div></div>`).join('');
}
function startSessionTimer(){
  sessionStart=Date.now();
  let last=Date.now(),ticks=0;
  const tick=()=>{
    const now=Date.now();
    const tk=dayKey(new Date());
    studyDays[tk]=(studyDays[tk]||0)+(now-last)/60000; // suma los minutos reales transcurridos a HOY
    last=now;
    saveStudyLocal();
    const sessionMin=Math.floor((now-sessionStart)/60000);
    const st=document.getElementById('stat-time');if(st)st.textContent=sessionMin+'m';
    const total=Object.values(studyDays).reduce((s,v)=>s+v,0); // tiempo total acumulado
    const pt=document.getElementById('prog-time');if(pt)pt.textContent=fmtStudy(total);
    initWeekBars();
    if(++ticks%4===0)flushTodayStudy(); // guarda en Supabase cada ~60s
  };
  tick();
  sessionTimer=setInterval(tick,15000);
  // Guardar también al ocultar la pestaña o cerrar (mejor esfuerzo)
  if(!window._studyVisBound){window._studyVisBound=true;
    document.addEventListener('visibilitychange',()=>{if(document.hidden)flushTodayStudy();});
    window.addEventListener('beforeunload',()=>{try{flushTodayStudy();}catch(e){}});
  }
}

// ═══════════════════════
// CHAT / ASSISTANT
// ═══════════════════════
const SYSTEM_PROMPT=`Eres Alex, tutor de inglés. El alumno escribe en español o inglés.
Palabra con varios sentidos -> usa:
[MULTIWORD:palabra]
Significado 1: desc — ejemplo
Significado 2: desc — ejemplo
[/MULTIWORD]
Al final de respuestas educativas añade: [VOCAB:palabra|tipo|definición ES] (tipos: n, v, adj, adv, expr, multi).
Sé muy breve y claro: máx 2 párrafos cortos. No repitas la pregunta.`;

function initChat(){
  document.getElementById('chat-msgs').innerHTML='';
  chatHistory=[];
  addMsg('ai','¡Hola! 👋 Soy **Alex**, tu tutor personal de inglés. Estoy aquí para ayudarte a aprender a tu ritmo, sin presiones.\n\nEsto es lo que podemos hacer juntos:\n• 📖 Traducir y explicar palabras con todos sus significados\n• 💬 Conversar en inglés para que practiques de verdad\n• ✍️ Corregir tu gramática con ejemplos claros\n\nPuedes **escribirme** o tocar **Hablar** para conversar por voz. 🎙️\n\n¿Empezamos? Prueba con **"What does set mean?"** o simplemente cuéntame qué te gustaría aprender hoy.');
}
function clearChat(){initChat();toast('Nueva sesión iniciada');}

function addMsg(role,content){
  const container=document.getElementById('chat-msgs');
  const isAI=role==='ai';
  const div=document.createElement('div');div.className='msg '+(isAI?'ai':'user');
  const processed=processContent(content);
  if(!isAI)processed.vocab=[];
  const speakBtn=isAI?`<button class="speak-btn" onclick="speakBubble(this)"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M9 9a3 3 0 000 6"/><circle cx="6" cy="12" r="2" fill="currentColor" stroke="none"/></svg></button>`:'';
  div.innerHTML=`
    <div class="msg-av ${isAI?'ai-msg':'usr-msg'}">${isAI?'AI':(currentUser?.name||'U').substring(0,2).toUpperCase()}</div>
    <div class="msg-content">
      <div class="bubble" data-plain="${encodeURIComponent(processed.plain)}" data-raw="${encodeURIComponent(content)}">${processed.html}</div>
      <div class="msg-meta">${speakBtn}<span class="msg-time">${new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})}</span></div>
    </div>`;
  container.appendChild(div);container.scrollTop=container.scrollHeight;
  processed.vocab.forEach(addVocab);
}

function processContent(text){
  let vocab=[];let html=esc(text);
  html=html.replace(/\[VOCAB:([^\]]+)\]/g,(_,c)=>{const[w,t,d]=c.split('|');if(w&&t&&d)vocab.push({word:w,type:t,def:d});return '';});
  html=html.replace(/\[MULTIWORD:([^\]]+)\]([\s\S]*?)\[\/MULTIWORD\]/g,(_,word,body)=>{
    vocab.push({word,type:'multi',def:'múltiples significados'});
    const lines=body.trim().split('\n').filter(l=>l.trim());
    const opts=lines.map(line=>{
      const clean=line.trim().replace(/^Significado \d+:\s*/,'');
      const parts=clean.split('—');
      return `<button class="disambig-opt" onclick="explainMeaning('${word}','${clean.replace(/'/g,"\\'")}')"><strong>${(parts[0]||clean).trim()}</strong><span>${clean}</span></button>`;
    }).join('');
    return `<div class="disambig-card"><div class="disambig-lbl">"${word}" tiene varios significados</div><div class="disambig-opts">${opts}</div></div>`;
  });
  html=html.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  html=html.replace(/^• (.+)$/gm,'<li style="margin-left:12px;margin-bottom:3px">$1</li>');
  html=html.replace(/\n/g,'<br>');
  const tmp=document.createElement('div');tmp.innerHTML=html;
  return{html,vocab,plain:tmp.textContent||''};
}

function explainMeaning(word,meaning){sendMsg(`Explícame "${word}" cuando se usa como: ${meaning}. Dame 2 ejemplos.`);}

async function sendMsg(preset=null){
  const input=document.getElementById('chat-input');
  const text=preset||input.value.trim();if(!text)return;
  if(synth)synth.cancel();
  input.value='';autoResize(input);
  addMsg('user',text);
  chatHistory.push({role:'user',content:text});
  sessionMsgs++;sessionWords+=text.split(/\s+/).length;
  updateSessionStats();showTyping();
  try{
    let reply;
    if(USE_AI_PROXY){reply=await askAI(1000);}
    else{reply=getDemoReply(text);}
    hideTyping();addMsg('ai',reply);
    chatHistory.push({role:'assistant',content:reply});
    sessionMsgs++;updateSessionStats();
  }catch{hideTyping();addMsg('ai','Error de conexión.');}
}

function getDemoReply(t){
  const q=t.toLowerCase();
  if(q.includes('set'))return `**"Set"** es una de las palabras con más significados en inglés.\n\n[MULTIWORD:set]\nSignificado 1: Colocar — Put it on the table\nSignificado 2: Ajustar — Set the alarm\nSignificado 3: Conjunto — A set of tools\nSignificado 4: Ponerse (sol) — The sun sets at 7pm\n[/MULTIWORD]\n\n[VOCAB:set|multi|colocar / ajustar / conjunto / ponerse]`;
  if(q.includes('since')||q.includes(' for'))return `**SINCE** — desde un punto específico: *I've lived here since 2020*\n**FOR** — durante un período: *I've lived here for 4 years*\n\nTruco: si puedes decir "durante X tiempo" usa FOR. Si es "desde ese momento" usa SINCE.\n\n[VOCAB:since|expr|desde (un momento específico)]\n[VOCAB:for|expr|durante (un período de tiempo)]`;
  if(q.includes('travel')||q.includes('viaj'))return `Great topic! Let's talk about travel.\n\n**What's your favorite place you've visited?** Try answering in English!\n\n• **Itinerary** = plan de viaje\n• **Layover** = escala de vuelo\n• **Wanderlust** = deseo de explorar\n\n[VOCAB:itinerary|n|plan detallado del viaje]\n[VOCAB:wanderlust|n|deseo de viajar]`;
  if(q.includes('goed')||q.includes('corrig'))return `*"I **went** to the store"* — **Go** es irregular, su pasado es **went**.\n\nOtros irregulares:\n• go → **went** • see → **saw** • eat → **ate** • buy → **bought**\n\n[VOCAB:went|v|pasado irregular de "go"]`;
  return `Estoy en **modo demo** sin API key configurada.\n\nPrueba:\n• "What does 'set' mean?"\n• "since vs for"\n• "Let's talk about travel"\n• "Corrige: I goed to the store"\n\n[VOCAB:demo|n|modo de demostración]`;
}

let typingEl=null;
function showTyping(){
  const c=document.getElementById('chat-msgs');
  typingEl=document.createElement('div');typingEl.className='msg ai';typingEl.id='typing-el';
  typingEl.innerHTML=`<div class="msg-av ai-msg">AI</div><div class="msg-content"><div class="bubble"><div class="typing-bubble"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div></div>`;
  c.appendChild(typingEl);c.scrollTop=c.scrollHeight;
}
function hideTyping(){document.getElementById('typing-el')?.remove();}

function addVocab({word,type,def}){
  if(vocabItems.find(v=>v.word===word))return;
  vocabItems.unshift({word,type,def});
  const pvc=document.getElementById('prog-vocab-count');if(pvc)pvc.textContent=vocabItems.length;
}

function updateSessionStats(){}

// ═══════════════════════
// SPEECH
// ═══════════════════════
// Limpia el texto crudo del mensaje para que la voz suene igual en botón y en llamada.
function cleanForSpeech(text){
  return (text||'').replace(/\[[^\]]*\]/g,' ').replace(/\*\*/g,'').replace(/[#>*_`]/g,'').replace(/\n+/g,'. ').replace(/\s+/g,' ').trim();
}
function speakBubble(btn){
  if(synth)synth.cancel();
  if(activeSpeakBtn)activeSpeakBtn.classList.remove('playing');
  if(activeSpeakBtn===btn){activeSpeakBtn=null;return;}
  const bubble=btn.closest('.msg-content').querySelector('.bubble');
  const raw=decodeURIComponent(bubble.dataset.raw||'');
  const spoken=cleanForSpeech(raw)||decodeURIComponent(bubble.dataset.plain||'');
  if(!spoken)return;
  activeSpeakBtn=btn;btn.classList.add('playing');
  document.getElementById('speaking-bars').classList.add('on');
  speakText(spoken,()=>{btn.classList.remove('playing');activeSpeakBtn=null;document.getElementById('speaking-bars').classList.remove('on');});
}

function speakText(text,onEnd,lang){
  if(!synth||!text)return;synth.cancel();
  voiceSpeakingSince=Date.now();
  // Conserva letras (incl. acentos y ñ) y números; solo limpia símbolos sueltos. No partir palabras acentuadas.
  const clean=text.replace(/[^\p{L}\p{N}\s.,!?'-]/gu,' ').replace(/\s+/g,' ').trim().substring(0,1500);
  if(!clean.trim())return;
  const u=new SpeechSynthesisUtterance(clean);
  const isEs=(lang||'en')==='es';
  u.lang=isEs?'es-ES':'en-US';u.rate=1.0;u.pitch=1.0;u.volume=1;
  const preferred=pickVoice(isEs?'es':'en');
  if(preferred)u.voice=preferred;
  u.onend=()=>{document.getElementById('speaking-bars').classList.remove('on');if(onEnd)onEnd();};
  u.onerror=()=>{document.getElementById('speaking-bars').classList.remove('on');if(onEnd)onEnd();};
  synth.speak(u);
}
// ===== Selección de voz (la elige el alumno; se recuerda por idioma) =====
function voicesFor(lang){
  if(!synth)return [];
  const pre=lang==='es'?'es':'en';
  return synth.getVoices().filter(v=>v.lang&&v.lang.toLowerCase().startsWith(pre));
}
function savedVoiceName(lang){try{return localStorage.getItem('alexVoice_'+lang)||'';}catch(e){return '';}}
function pickVoice(lang){
  const list=voicesFor(lang);if(!list.length)return null;
  const saved=savedVoiceName(lang);
  if(saved){const v=list.find(v=>v.name===saved);if(v)return v;}
  // Sin elección del alumno: mejor voz neuronal/online por defecto.
  const names=lang==='es'?['Google','Microsoft','Helena','Sabina','Mónica','Paulina','Laura']:['Google US English','Microsoft Aria','Microsoft Jenny','Samantha','Google UK English Female'];
  for(const n of names){const v=list.find(v=>v.name.includes(n));if(v)return v;}
  return list.find(v=>!v.localService)||list[0];
}
// Acorta nombres largos del SO para que la lista se lea limpia.
function voiceLabel(v){
  return v.name.replace(/^(Microsoft|Google)\s+/,'').replace(/\s*-\s*(Spanish|English).*$/i,'').replace(/\s*\([^)]*\)\s*$/,'').trim()||v.name;
}
let voicePickerOpen=false;
function toggleVoicePicker(){voicePickerOpen?closeVoicePicker():openVoicePicker();}
function openVoicePicker(){
  voicePickerOpen=true;
  renderVoicePicker();
  document.getElementById('voice-picker').classList.add('show');
}
function closeVoicePicker(){
  voicePickerOpen=false;
  document.getElementById('voice-picker').classList.remove('show');
}
function renderVoicePicker(){
  const lang=(typeof voiceLang!=='undefined'?voiceLang:'en');
  const head=document.getElementById('voice-picker-head');
  if(head)head.textContent=lang==='es'?'Voz de Alex · Español':'Voz de Alex · Inglés';
  const list=document.getElementById('voice-picker-list');if(!list)return;
  const voices=voicesFor(lang);
  if(!voices.length){
    list.innerHTML='<div class="vp-empty">Tu dispositivo no tiene voces para este idioma. Prueba en otro navegador (Chrome) o instala voces en la configuración del sistema.</div>';
    return;
  }
  const current=(pickVoice(lang)||{}).name;
  const check='<svg class="vp-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const play='<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  list.innerHTML=voices.map(v=>`<div class="vp-item${v.name===current?' sel':''}" data-name="${v.name.replace(/"/g,'&quot;')}">
      ${check}<span class="vp-name">${voiceLabel(v)}</span>
      <span class="vp-play" data-play="1" title="Escuchar">${play}</span>
    </div>`).join('');
  list.querySelectorAll('.vp-item').forEach(el=>{
    el.onclick=ev=>{
      const name=el.dataset.name;
      if(ev.target.closest('[data-play]')){previewVoice(name);return;}
      selectVoice(name);
    };
  });
}
function selectVoice(name){
  const lang=(typeof voiceLang!=='undefined'?voiceLang:'en');
  try{localStorage.setItem('alexVoice_'+lang,name);}catch(e){}
  renderVoicePicker();
  previewVoice(name);
}
function previewVoice(name){
  if(!synth)return;
  const lang=(typeof voiceLang!=='undefined'?voiceLang:'en');
  const v=synth.getVoices().find(v=>v.name===name);
  synth.cancel();
  const u=new SpeechSynthesisUtterance(lang==='es'?'Hola, soy Alex. Así sueno.':"Hi, I'm Alex. This is how I sound.");
  u.lang=lang==='es'?'es-ES':'en-US';if(v)u.voice=v;u.rate=1.0;u.pitch=1.0;
  synth.speak(u);
}
if(synth)synth.onvoiceschanged=()=>{synth.getVoices();if(voicePickerOpen)renderVoicePicker();};

function initSpeech(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
  recognition=new SR();recognition.continuous=false;recognition.interimResults=true;recognition.lang='en-US';
  recognition.onresult=e=>{
    let final='',interim='';
    for(let i=e.resultIndex;i<e.results.length;i++)e.results[i].isFinal?final+=e.results[i][0].transcript:interim+=e.results[i][0].transcript;
    document.getElementById('transcript-txt').textContent=final||interim||'...';
    if(final)document.getElementById('chat-input').value=final;
  };
  recognition.onend=()=>{setRecState(false);const v=document.getElementById('chat-input').value.trim();if(v)setTimeout(()=>sendMsg(),300);};
  recognition.onerror=()=>setRecState(false);
}

function toggleMic(){
  if(!recognition){toast('Tu navegador no soporta reconocimiento de voz');return;}
  if(isRecording){recognition.stop();setRecState(false);}
  else{if(synth)synth.cancel();recognition.start();setRecState(true);}
}

function setRecState(on){
  isRecording=on;
  document.getElementById('mic-btn').classList.toggle('recording',on);
  document.getElementById('rec-dot').classList.toggle('on',on);
  document.getElementById('wm').classList.toggle('on',on);
  if(!on&&!document.getElementById('chat-input').value)document.getElementById('transcript-txt').textContent='Presiona el micrófono o escribe...';
  else if(on)document.getElementById('transcript-txt').textContent='Escuchando... habla en inglés';
}

function handleKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}
function autoResize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,96)+'px';}
function setSuggest(t){showView('assistant');document.getElementById('chat-input').value=t;document.getElementById('chat-input').focus();}

// ═══════════════════════
// MODO VOZ (Alex)
// ═══════════════════════
let voiceRec=null,voiceActive=false,voiceState='idle',voiceLang='en',voicePaused=false;
function setVoiceUI(state,text){
  voiceState=state;
  const orb=document.getElementById('voice-orb');if(orb)orb.className='voice-orb '+(state==='idle'?'':state);
  if(text!==undefined)document.getElementById('voice-status').textContent=text;
  const mic=document.getElementById('voice-mic-btn');if(mic)mic.classList.toggle('active',state==='listening');
}
function openVoiceMode(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){toast('Tu navegador no soporta reconocimiento de voz','error');return;}
  // Desbloquear la voz del navegador dentro del gesto del usuario (necesario en móvil)
  try{if(synth){synth.cancel();const u0=new SpeechSynthesisUtterance(' ');u0.volume=0;synth.speak(u0);}}catch(e){}
  document.getElementById('voice-screen').classList.add('show');
  voiceActive=true;voicePaused=false;
  if(!voiceRec){
    // Reconocimiento CONTINUO: sigue escuchando incluso mientras Alex habla (para poder interrumpirla).
    voiceRec=new SR();voiceRec.continuous=true;voiceRec.interimResults=true;
    voiceRec.onresult=e=>{
      let final='',interim='';
      for(let i=e.resultIndex;i<e.results.length;i++)e.results[i].isFinal?final+=e.results[i][0].transcript:interim+=e.results[i][0].transcript;
      const heard=(final||interim).trim();
      if(!heard||voiceState==='thinking')return;
      // INTERRUPCIÓN: si el alumno habla mientras Alex habla, callarla y empezar a escuchar lo nuevo.
      if(voiceState==='speaking'){
        if(Date.now()-voiceSpeakingSince<500||heard.split(/\s+/).length<2)return; // evita el eco de su propia voz
        if(synth)synth.cancel();setVoiceUI('listening','Escuchando...');
      }
      document.getElementById('voice-status').textContent=heard;
      if(final)voiceRec._final=(voiceRec._final||'')+final+' ';
      // Procesa cuando el alumno hace una pausa (silencio).
      clearTimeout(voiceRec._silence);
      voiceRec._silence=setTimeout(()=>{const t=(voiceRec._final||'').trim();voiceRec._final='';if(t&&voiceActive&&!voicePaused)voiceProcess(t);},1300);
    };
    voiceRec.onend=()=>{if(voiceActive&&!voicePaused){try{voiceRec.start();}catch(e){}}};
    voiceRec.onerror=ev=>{if(voiceActive&&!voicePaused&&ev.error!=='aborted')setTimeout(()=>{try{voiceRec.start();}catch(e){}},500);};
  }
  voiceRec.lang=voiceLang==='es'?'es-ES':'en-US';voiceRec._final='';
  try{voiceRec.start();}catch(e){}
  // Saludo inicial hablado (en el idioma elegido)
  setVoiceUI('speaking','Alex está hablando…');
  const greet=voiceLang==='es'?'¡Hola! Soy Alex, tu tutor. ¿De qué te gustaría hablar?':"Hi! I'm Alex, your English tutor. What would you like to talk about?";
  speakText(greet,()=>{if(voiceActive)voiceListen();},voiceLang);
}
function voiceListen(){
  if(!voiceActive||voicePaused)return;
  setVoiceUI('listening','Escuchando...');
  try{voiceRec.start();}catch(e){}
}
async function voiceProcess(text){
  setVoiceUI('thinking','Pensando...');
  if(synth)synth.cancel();
  try{addMsg('user',text);}catch(e){}
  chatHistory.push({role:'user',content:text});
  const langInstr=voiceLang==='es'
    ?'CONVERSACIÓN HABLADA en ESPAÑOL: responde SIEMPRE en español, en 1-3 frases cortas y naturales, sin listas ni marcadores entre corchetes.'
    :'SPOKEN conversation in ENGLISH: always reply in English, in 1-3 short natural sentences, no lists or bracket markers.';
  let reply;
  try{
    if(USE_AI_PROXY){reply=await askAI(200,langInstr);}
    else{reply=getDemoReply(text);}
  }catch(e){reply=voiceLang==='es'?'Perdona, hubo un error de conexión.':'Sorry, there was a connection error.';}
  try{addMsg('ai',reply);}catch(e){}
  chatHistory.push({role:'assistant',content:reply});
  if(!voiceActive)return;
  const spoken=cleanForSpeech(reply);
  setVoiceUI('speaking','Alex está hablando…');
  speakText(spoken,()=>{ if(voiceActive)voiceListen(); },voiceLang);
}
function toggleVoiceMic(){
  if(!voiceActive)return;
  if(!voicePaused){
    voicePaused=true;if(synth)synth.cancel();try{voiceRec.stop();}catch(e){}
    setVoiceUI('idle','Pausado · toca el micrófono');
  }else{
    voicePaused=false;voiceListen();
  }
}
function toggleVoiceLang(){
  voiceLang=voiceLang==='en'?'es':'en';
  const b=document.getElementById('voice-lang-btn');if(b)b.textContent=voiceLang.toUpperCase();
  if(voiceRec){try{voiceRec.lang=voiceLang==='es'?'es-ES':'en-US';}catch(e){}}
  if(voicePickerOpen)renderVoicePicker();
  if(synth)synth.cancel();
  if(voiceActive){voicePaused=false;try{voiceRec.stop();}catch(e){}setVoiceUI('listening',voiceLang==='es'?'Escuchando… (Español)':'Escuchando… (Inglés)');}
  toast(voiceLang==='es'?'Modo español: háblale en español':'English mode: speak in English');
}
function closeVoiceMode(){
  voiceActive=false;voicePaused=false;
  try{voiceRec&&voiceRec.stop();}catch(e){}
  if(voiceRec)clearTimeout(voiceRec._silence);
  if(synth)synth.cancel();
  closeVoicePicker();
  setVoiceUI('idle','');
  document.getElementById('voice-screen').classList.remove('show');
}
