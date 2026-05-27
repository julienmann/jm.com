/**
 * Strava OAuth + Anthropic AI proxy worker
 *
 * Keeps both the Strava Client Secret and Anthropic API key server-side.
 * CORS headers restrict browser access to ALLOWED_ORIGIN; the server-side
 * Origin check blocks non-browser callers that ignore CORS.
 *
 * Required secrets (set via `wrangler secret put`):
 *   STRAVA_CLIENT_ID     — numeric ID from strava.com/settings/api
 *   STRAVA_CLIENT_SECRET — 40-char hex secret from the same page
 *   ANTHROPIC_API_KEY    — sk-ant-… key from console.anthropic.com
 *
 * Required var (set in wrangler.toml [vars]):
 *   ALLOWED_ORIGIN — exact dashboard origin, e.g. https://julienmann.ca
 */

const STRAVA_TOKEN_URL  = 'https://www.strava.com/oauth/token';
const ANTHROPIC_URL     = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export default {
  async fetch(req, env) {
    // Guard: fail fast if secrets are missing
    if (!env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) {
      return json({ error: 'Worker not configured — set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET secrets' }, 503, env);
    }

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    // Server-side origin check — CORS headers alone don't stop non-browser callers
    const origin = req.headers.get('Origin') || req.headers.get('Referer') || '';
    const allowed = env.ALLOWED_ORIGIN || '';
    if (allowed && !origin.startsWith(allowed)) {
      return json({ error: 'Forbidden' }, 403, env);
    }

    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, env);
    }

    const url = new URL(req.url);
    if (url.pathname === '/ai') return handleAi(req, env);
    return handleStrava(req, env);
  },
};

// ── Strava token exchange ────────────────────────────────────────

async function handleStrava(req, env) {
  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400, env); }

  const { grant_type, code, refresh_token } = body;

  if (grant_type === 'authorization_code') {
    if (!code) return json({ error: 'Missing code' }, 400, env);
  } else if (grant_type === 'refresh_token') {
    if (!refresh_token) return json({ error: 'Missing refresh_token' }, 400, env);
  } else {
    return json({ error: 'Invalid grant_type' }, 400, env);
  }

  const payload = {
    client_id:     env.STRAVA_CLIENT_ID,
    client_secret: env.STRAVA_CLIENT_SECRET,
    grant_type,
    ...(grant_type === 'authorization_code' ? { code } : { refresh_token }),
  };

  let stravaRes;
  try {
    stravaRes = await fetch(STRAVA_TOKEN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch {
    return json({ error: 'Failed to reach Strava' }, 502, env);
  }

  const data = await stravaRes.json();
  if (!stravaRes.ok) {
    return json({ error: data.message || 'Strava rejected the request' }, stravaRes.status, env);
  }

  // Return only the fields the frontend needs
  return json({
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    data.expires_at,
  }, 200, env);
}

// ── Anthropic AI proxy ───────────────────────────────────────────

async function handleAi(req, env) {
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'AI not configured — set ANTHROPIC_API_KEY secret' }, 503, env);
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400, env); }

  let aiRes;
  try {
    aiRes = await fetch(ANTHROPIC_URL, {
      method:  'POST',
      headers: {
        'x-api-key':         env.ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type':      'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    return json({ error: 'Failed to reach Anthropic' }, 502, env);
  }

  const data = await aiRes.json();
  return json(data, aiRes.status, env);
}

// ── Helpers ──────────────────────────────────────────────────────

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin':  env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
  });
}
