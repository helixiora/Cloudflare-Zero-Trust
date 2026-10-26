import { readConfig } from '../poc/access.mjs';
import { createRequestHandler } from '../poc/application.mjs';

export function createWorker({ stylesheet = '', jwksOptions } = {}) {
  let cachedSettings, cachedHandler;
  return {
    async fetch(request, env) {
      try {
        const { access } = readConfig(env);
        const settings = JSON.stringify(access);
        if (!cachedHandler || settings !== cachedSettings) {
          cachedHandler = createRequestHandler({ access, stylesheet, jwksOptions });
          cachedSettings = settings;
        }
        return await cachedHandler(request);
      } catch {
        return new Response(request.method === 'HEAD' ? null : 'Cloudflare Access configuration is invalid. The sample resource remains locked.', {
          status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
        });
      }
    },
  };
}
