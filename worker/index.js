/**
 * sezginmesut.com Worker
 *
 * - /auth ve /callback: Admin paneli (Sveltia CMS) için GitHub ile giriş.
 *   sveltia/sveltia-cms-auth projesinin yalnızca GitHub için sadeleştirilmiş hâlidir.
 * - Diğer tüm istekler: Eleventy'nin ürettiği statik site (_site klasörü).
 *
 * Gerekli ayarlar:
 *   GITHUB_CLIENT_ID      (wrangler.jsonc -> vars)
 *   ALLOWED_DOMAINS       (wrangler.jsonc -> vars)
 *   GITHUB_CLIENT_SECRET  (Cloudflare panelinde "Secret" olarak, asla depoya yazılmaz)
 */

const SCOPES = { default: 'repo,user', allowed: ['repo', 'public_repo', 'user', 'read:user', 'user:email'] };

const getScope = (requested) => {
  const scopes = (requested ?? '').split(/[\s,]+/).filter(Boolean);
  if (scopes.length && scopes.every((scope) => SCOPES.allowed.includes(scope))) {
    return scopes.join(',');
  }
  return SCOPES.default;
};

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getDomainPatterns = (allowedDomains) =>
  (allowedDomains ?? '')
    .split(',')
    .map((str) => str.trim())
    .filter(Boolean)
    .map((str) => `^${escapeRegExp(str).replaceAll('\\*', '.+')}$`);

const serialize = (value) => JSON.stringify(value ?? null).replaceAll('<', '\\u003c');

/** Giriş penceresini açan CMS sekmesine sonucu ileten sayfa. */
const outputHTML = ({ token, error, errorCode, env }) => {
  const state = error ? 'error' : 'success';
  const content = error ? { provider: 'github', error, errorCode } : { provider: 'github', token };

  return new Response(
    `<!doctype html><html><body><script>
      (() => {
        const trustedPatterns = ${serialize(getDomainPatterns(env.ALLOWED_DOMAINS))};
        const hasToken = ${serialize(!!token)};
        const isTrusted = (origin) => {
          try {
            const { hostname } = new URL(origin);
            return trustedPatterns.some((pattern) => new RegExp(pattern).test(hostname));
          } catch {
            return false;
          }
        };
        window.addEventListener('message', ({ data, origin }) => {
          if (data !== 'authorizing:github') return;
          if (hasToken && trustedPatterns.length && !isTrusted(origin)) return;
          window.opener?.postMessage(
            'authorization:github:${state}:' + ${serialize(JSON.stringify(content))},
            origin
          );
        });
        window.opener?.postMessage('authorizing:github', '*');
      })();
    </script></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': 'csrf-token=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure',
      },
    },
  );
};

const handleAuth = (request, env) => {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const domain = searchParams.get('site_id') ?? '';

  if (provider !== 'github') {
    return outputHTML({ env, error: 'Sadece GitHub ile giriş desteklenir.', errorCode: 'UNSUPPORTED_BACKEND' });
  }

  const domainPatterns = getDomainPatterns(env.ALLOWED_DOMAINS);
  if (domainPatterns.length && !domainPatterns.some((pattern) => new RegExp(pattern).test(domain))) {
    return outputHTML({ env, error: 'Bu alan adı girişe yetkili değil.', errorCode: 'UNSUPPORTED_DOMAIN' });
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return outputHTML({ env, error: 'GitHub OAuth ayarları eksik.', errorCode: 'MISCONFIGURED_CLIENT' });
  }

  const csrfToken = crypto.randomUUID().replaceAll('-', '');
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    scope: getScope(searchParams.get('scope')),
    state: csrfToken,
  });

  return new Response('', {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params}`,
      'Set-Cookie': `csrf-token=github_${csrfToken}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`,
    },
  });
};

const handleCallback = async (request, env) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const [, csrfToken] = request.headers.get('Cookie')?.match(/\bcsrf-token=github_([0-9a-f]{32})\b/) ?? [];

  if (!code || !state) {
    return outputHTML({ env, error: 'Yetkilendirme kodu alınamadı. Lütfen tekrar deneyin.', errorCode: 'AUTH_CODE_REQUEST_FAILED' });
  }
  if (!csrfToken || state !== csrfToken) {
    return outputHTML({ env, error: 'Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin.', errorCode: 'CSRF_DETECTED' });
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return outputHTML({ env, error: 'GitHub OAuth ayarları eksik.', errorCode: 'MISCONFIGURED_CLIENT' });
  }

  let data;
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET }),
    });
    data = await response.json();
  } catch {
    return outputHTML({ env, error: 'GitHub ile bağlantı kurulamadı. Lütfen tekrar deneyin.', errorCode: 'TOKEN_REQUEST_FAILED' });
  }

  return outputHTML({ env, token: data.access_token, error: data.error });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // www.sezginmesut.com -> sezginmesut.com (tek adres, kopya içerik olmasın)
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }

    if (request.method === 'GET' && pathname === '/auth') {
      return handleAuth(request, env);
    }
    if (request.method === 'GET' && pathname === '/callback') {
      return handleCallback(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
