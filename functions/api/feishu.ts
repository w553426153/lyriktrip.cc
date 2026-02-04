export interface Env {
  // Keep the full Feishu trigger-webhook URL in Cloudflare Pages env vars.
  // Example: https://www.feishu.cn/flow/api/trigger-webhook/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  FEISHU_WEBHOOK_URL: string;

  // Comma-separated list of allowed Origins (exact match), e.g.
  // https://your-domain.com,https://your-project.pages.dev,http://localhost:3000
  ALLOWED_ORIGINS?: string;
}

// Minimal context type so `tsc` works without Cloudflare-specific type deps.
type PagesContext<EnvT> = {
  request: Request;
  env: EnvT;
};

type OnRequest<EnvT> = (context: PagesContext<EnvT>) => Response | Promise<Response>;

type FeishuRequestBody = {
  email?: unknown;
  message?: unknown;
  wishlist?: unknown;
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { ...init, headers });
}

function getAllowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

type OriginCheck = { ok: true; origin: string } | { ok: false; response: Response };

function assertOriginAllowed(request: Request, env: Env): OriginCheck {
  // Some same-origin requests may omit `Origin`, so fall back to `Referer`.
  let origin = request.headers.get('Origin') || '';
  if (!origin) {
    const referer = request.headers.get('Referer') || '';
    try {
      if (referer) origin = new URL(referer).origin;
    } catch {
      // Ignore invalid/missing referer.
    }
  }
  const allowed = getAllowedOrigins(env);

  // Fail closed: forces you to explicitly configure allowed origins in Pages settings.
  if (allowed.length === 0) {
    return {
      ok: false,
      response: jsonResponse(
        { ok: false, error: 'Server misconfigured: ALLOWED_ORIGINS is not set.' },
        { status: 500 }
      ),
    };
  }

  if (!origin || !allowed.includes(origin)) {
    return {
      ok: false,
      response: jsonResponse(
        { ok: false, error: 'Forbidden origin.' },
        { status: 403 }
      ),
    };
  }

  return { ok: true, origin };
}

export const onRequestOptions: OnRequest<Env> = async (context) => {
  const check = assertOriginAllowed(context.request, context.env);
  if ('response' in check) {
    return check.response;
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders(check.origin),
  });
};

export const onRequestPost: OnRequest<Env> = async (context) => {
  const check = assertOriginAllowed(context.request, context.env);
  if ('response' in check) {
    return check.response;
  }

  if (!context.env.FEISHU_WEBHOOK_URL) {
    return jsonResponse({ ok: false, error: 'Server misconfigured: FEISHU_WEBHOOK_URL is not set.' }, { status: 500 });
  }

  let data: FeishuRequestBody;
  try {
    data = (await context.request.json()) as FeishuRequestBody;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, { status: 400, headers: corsHeaders(check.origin) });
  }

  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const wishlist = typeof data.wishlist === 'string' ? data.wishlist.trim() : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ ok: false, error: 'Invalid email.' }, { status: 400, headers: corsHeaders(check.origin) });
  }
  if (!message) {
    return jsonResponse({ ok: false, error: 'Message is required.' }, { status: 400, headers: corsHeaders(check.origin) });
  }

  // Basic size limits: avoid people using this endpoint to exfiltrate / spam large payloads.
  if (message.length > 5000 || wishlist.length > 5000) {
    return jsonResponse({ ok: false, error: 'Payload too large.' }, { status: 413, headers: corsHeaders(check.origin) });
  }

  const upstream = await fetch(context.env.FEISHU_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, email, wishlist }),
  });

  if (!upstream.ok) {
    return jsonResponse(
      { ok: false, error: 'Upstream webhook failed.', status: upstream.status },
      { status: 502, headers: corsHeaders(check.origin) }
    );
  }

  return jsonResponse({ ok: true }, { status: 200, headers: corsHeaders(check.origin) });
};
