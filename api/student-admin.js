// Acciones administrativas sobre alumnos que requieren service role.
// Por ahora: "reenviar acceso" -> restablece la contraseña del alumno a
// estudio123 y le envía un correo (vía Brevo) avisándole, SIN incluir la
// contraseña en el mensaje.
//
// Seguridad: verifica el JWT de quien llama y exige que sea admin
// (profiles.role = 'admin' o el super admin) antes de tocar nada.
//
// Variables de entorno requeridas en Vercel:
//   SUPABASE_URL              -> https://<proyecto>.supabase.co
//   SUPABASE_ANON_KEY         -> clave anon (para verificar el JWT del admin)
//   SUPABASE_SERVICE_ROLE_KEY -> service role (admin API + saltar RLS)
// Opcionales (para el correo; si faltan, se resetea la clave igual):
//   BREVO_API_KEY             -> clave de la API transaccional de Brevo
//   BREVO_SENDER_EMAIL        -> remitente verificado en Brevo
//   BREVO_SENDER_NAME         -> nombre del remitente (por defecto Brain Master English)

const DEFAULT_PASSWORD = 'estudio123';
const SUPER_ADMIN_EMAIL = 'eduard1@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const SUPA = process.env.SUPABASE_URL;
  const ANON = process.env.SUPABASE_ANON_KEY;
  const SRK  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPA || !ANON || !SRK) return res.status(500).json({ error: 'server_not_configured' });

  // 1) Verificar el JWT de quien llama
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'no_auth' });
  const uRes = await fetch(`${SUPA}/auth/v1/user`, { headers: { apikey: ANON, Authorization: 'Bearer ' + token } });
  if (!uRes.ok) return res.status(401).json({ error: 'invalid_token' });
  const caller = await uRes.json();
  if (!caller?.id) return res.status(401).json({ error: 'invalid_token' });

  // 2) Exigir que quien llama sea admin
  const isSuper = (caller.email || '').toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  if (!isSuper) {
    const pRes = await fetch(
      `${SUPA}/rest/v1/profiles?id=eq.${caller.id}&select=role`,
      { headers: { apikey: SRK, Authorization: 'Bearer ' + SRK } }
    );
    const prof = pRes.ok ? await pRes.json().catch(() => []) : [];
    if (!(prof?.[0]?.role === 'admin')) return res.status(403).json({ error: 'forbidden' });
  }

  // 3) Cuerpo
  const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
  const action = body.action;
  const studentId = body.student_id;
  if (!studentId) return res.status(400).json({ error: 'missing_student_id' });

  if (action !== 'reset') return res.status(400).json({ error: 'unknown_action' });

  // 4) Restablecer la contraseña del alumno a estudio123 (admin API)
  const setRes = await fetch(`${SUPA}/auth/v1/admin/users/${studentId}`, {
    method: 'PUT',
    headers: { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: DEFAULT_PASSWORD, email_confirm: true })
  });
  if (!setRes.ok) {
    const detail = await setRes.text().catch(() => '');
    return res.status(502).json({ error: 'reset_failed', detail });
  }
  const updated = await setRes.json().catch(() => ({}));
  const email = updated?.email || null;
  const fullName = updated?.user_metadata?.full_name || null;

  // 5) Enviar el correo por Brevo (mejor esfuerzo; no incluye la contraseña)
  let emailSent = false;
  const BREVO = process.env.BREVO_API_KEY;
  const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
  const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Brain Master English';
  const appUrl = req.headers.origin || (req.headers.host ? 'https://' + req.headers.host : '');
  if (BREVO && SENDER_EMAIL && email) {
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6">
        <h2 style="margin:0 0 12px">Tu acceso fue restablecido</h2>
        <p>Hola${fullName ? ' ' + fullName : ''},</p>
        <p>Restablecimos el acceso a tu cuenta de <b>Brain Master English</b>.</p>
        <p>Ingresa con tu correo <b>${email}</b>${appUrl ? ` en <a href="${appUrl}">${appUrl}</a>` : ''}.</p>
        <p>Por seguridad no incluimos tu contraseña en este correo. Si no la recuerdas,
           comunícate con tu asesor y con gusto te la indicará.</p>
        <p style="color:#64748b;font-size:13px;margin-top:24px">Academia Brain Master English</p>
      </div>`;
    try {
      const bRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: { email: SENDER_EMAIL, name: SENDER_NAME },
          to: [{ email, name: fullName || email }],
          subject: 'Tu acceso a Brain Master English fue restablecido',
          htmlContent: html
        })
      });
      emailSent = bRes.ok;
    } catch (e) { emailSent = false; }
  }

  return res.status(200).json({ ok: true, email, emailSent });
}
