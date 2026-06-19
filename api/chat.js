// Proxy serverless (Vercel) para el asistente de IA.
// - Verifica la sesión de Supabase del alumno (JWT).
// - Rate limiting por usuario con una tabla en Supabase (ai_usage).
// - Llama a OpenAI con la API key del servidor (nunca en el cliente).
//
// Variables de entorno requeridas en Vercel:
//   OPENAI_API_KEY            -> tu clave de OpenAI
//   SUPABASE_URL              -> https://<proyecto>.supabase.co
//   SUPABASE_ANON_KEY         -> clave publishable/anon (para verificar el JWT)
//   SUPABASE_SERVICE_ROLE_KEY -> service role (para leer/escribir ai_usage, salta RLS)
//
// Límite: AI_LIMIT mensajes por AI_WINDOW_MIN minutos por usuario.

const AI_LIMIT = 30;
const AI_WINDOW_MIN = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const SUPA = process.env.SUPABASE_URL;
  const ANON = process.env.SUPABASE_ANON_KEY;
  const SRK  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const AK   = process.env.OPENAI_API_KEY;
  if (!SUPA || !ANON || !SRK || !AK) return res.status(500).json({ error: 'server_not_configured' });

  // 1) Verificar el JWT del alumno
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'no_auth' });
  const uRes = await fetch(`${SUPA}/auth/v1/user`, { headers: { apikey: ANON, Authorization: 'Bearer ' + token } });
  if (!uRes.ok) return res.status(401).json({ error: 'invalid_token' });
  const user = await uRes.json();
  const uid = user.id;
  if (!uid) return res.status(401).json({ error: 'invalid_token' });

  // 2) Rate limiting: contar usos en la ventana
  const since = new Date(Date.now() - AI_WINDOW_MIN * 60000).toISOString();
  const cRes = await fetch(
    `${SUPA}/rest/v1/ai_usage?user_id=eq.${uid}&created_at=gte.${since}&select=id`,
    { headers: { apikey: SRK, Authorization: 'Bearer ' + SRK, Prefer: 'count=exact', Range: '0-0' } }
  );
  const used = parseInt((cRes.headers.get('content-range') || '*/0').split('/')[1] || '0', 10);
  if (used >= AI_LIMIT) {
    return res.status(429).json({ error: 'rate_limited', reply: 'Has alcanzado el límite de mensajes por ahora. Intenta más tarde.' });
  }

  // 3) Registrar el uso
  await fetch(`${SUPA}/rest/v1/ai_usage`, {
    method: 'POST',
    headers: { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: uid })
  }).catch(() => {});

  // 4) Llamar a OpenAI
  const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
  const messages = [];
  if (typeof body.system === 'string' && body.system) messages.push({ role: 'system', content: body.system });
  if (Array.isArray(body.messages)) messages.push(...body.messages.slice(-12));

  const aRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + AK, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: Math.min(parseInt(body.max_tokens, 10) || 800, 1500),
      messages
    })
  });
  const aData = await aRes.json().catch(() => ({}));
  if (!aRes.ok) return res.status(502).json({ error: 'ai_error', reply: 'Error. Intenta de nuevo.' });
  const reply = aData.choices?.[0]?.message?.content || 'Error. Intenta de nuevo.';
  return res.status(200).json({ reply });
}
