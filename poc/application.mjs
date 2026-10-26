import { createAccessVerifier } from './access.mjs';
import { introduction, notConnected, denied, protectedPage } from './pages.mjs';

export function createRequestHandler({ access, stylesheet, logger = () => {}, jwksOptions }) {
  const verifyAccessToken = createAccessVerifier(access, jwksOptions);
  return async (request) => {
    const id = crypto.randomUUID();
    let route = 'unknown';
    const headers = {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      'X-Request-ID': id,
    };
    const send = (status, body, type = 'text/html; charset=utf-8') => {
      logger(JSON.stringify({ id, method: request.method, route, status }));
      return new Response(request.method === 'HEAD' ? null : body, {
        status, headers: { ...headers, 'Content-Type': type },
      });
    };
    try {
      const path = new URL(request.url).pathname;
      route = ['/', '/protected', '/healthz', '/style.css'].includes(path) ? path : 'unknown';
      if (!['GET', 'HEAD'].includes(request.method)) {
        headers.Allow = 'GET, HEAD';
        return send(405, 'Method not allowed.', 'text/plain; charset=utf-8');
      }
      if (path === '/healthz') return send(200, '{"status":"ok"}', 'application/json');
      if (path === '/style.css') return send(200, stylesheet, 'text/css; charset=utf-8');
      if (path === '/') return send(200, introduction(Boolean(access)));
      if (path !== '/protected') return send(404, 'Not found.', 'text/plain; charset=utf-8');
      if (!verifyAccessToken) return send(503, notConnected());
      try {
        // Identity and posture headers are never a substitute for a signed Access token.
        await verifyAccessToken(request.headers.get('cf-access-jwt-assertion'));
      } catch {
        return send(403, denied());
      }
      return send(200, protectedPage());
    } catch {
      return send(400, 'Invalid request.', 'text/plain; charset=utf-8');
    }
  };
}
