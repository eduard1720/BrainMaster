// Registro de aceptación de la Política de Privacidad y Términos de Uso.
// - Verifica la sesión de Supabase del alumno (JWT).
// - Captura la dirección IP del lado servidor (no manipulable por el cliente).
// - Inserta la evidencia en la tabla terms_acceptances usando el service role.
//
// Variables de entorno requeridas en Vercel:
//   SUPABASE_URL              -> https://<proyecto>.supabase.co
//   SUPABASE_ANON_KEY         -> clave publishable/anon (para verificar el JWT)
//   SUPABASE_SERVICE_ROLE_KEY -> service role (para escribir terms_acceptances, salta RLS)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const SUPA = process.env.SUPABASE_URL;
  const ANON = process.env.SUPABASE_ANON_KEY;
  const SRK  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPA || !ANON || !SRK) return res.status(500).json({ error: 'server_not_configured' });

  // 1) Verificar el JWT del alumno y obtener su identidad de forma confiable.
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'no_auth' });
  const uRes = await fetch(`${SUPA}/auth/v1/user`, { headers: { apikey: ANON, Authorization: 'Bearer ' + token } });
  if (!uRes.ok) return res.status(401).json({ error: 'invalid_token' });
  const user = await uRes.json();
  const uid = user.id;
  if (!uid) return res.status(401).json({ error: 'invalid_token' });

  // 2) Datos del cuerpo + evidencia técnica capturada en el servidor.
  const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
  const version = (typeof body.version === 'string' && body.version) ? body.version : 'desconocida';
  const fullName = typeof body.full_name === 'string' ? body.full_name : null;
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || req.headers['x-real-ip'] || req.socket?.remoteAddress || null;
  const userAgent = req.headers['user-agent'] || null;

  // 3) Insertar la evidencia de aceptación (append-only) con service role.
  const ins = await fetch(`${SUPA}/rest/v1/terms_acceptances`, {
    method: 'POST',
    headers: {
      apikey: SRK, Authorization: 'Bearer ' + SRK,
      'Content-Type': 'application/json', Prefer: 'return=representation'
    },
    body: JSON.stringify({
      user_id: uid,
      email: user.email || null,
      full_name: fullName,
      terms_version: version,
      ip,
      user_agent: userAgent
    })
  });
  if (!ins.ok) {
    const detail = await ins.text().catch(() => '');
    return res.status(502).json({ error: 'db_error', detail });
  }
  const rows = await ins.json().catch(() => []);
  return res.status(200).json({ ok: true, accepted_at: rows?.[0]?.accepted_at || null });
}
