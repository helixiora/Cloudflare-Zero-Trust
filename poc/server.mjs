import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { readConfig } from './access.mjs';
import { createRequestHandler } from './application.mjs';

const stylesheet = await readFile(new URL('./style.css', import.meta.url), 'utf8');

export function createApp({ config = readConfig(), logger = console.log, jwksOptions } = {}) {
  const handle = createRequestHandler({ access: config.access, stylesheet, logger, jwksOptions });
  return createServer({ maxHeaderSize: 24576, requestTimeout: 10000, headersTimeout: 10000 }, async (req, res) => {
    try {
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) value.forEach((entry) => headers.append(key, entry));
        else if (value !== undefined) headers.set(key, value);
      }
      const response = await handle(new Request(new URL(req.url, 'http://127.0.0.1'), { method: req.method, headers }));
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : 'Invalid request.');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = readConfig();
  const server = createApp({ config });
  server.on('error', (error) => {
    console.error(`Demo server could not start (${error.code || 'unknown error'}).`);
    process.exitCode = 1;
  });
  server.listen(config.port, '127.0.0.1', () => {
    console.log(`Zero Trust lab: http://127.0.0.1:${config.port}`);
    console.log(config.access ? 'Access token validation enabled.' : 'Preview ready; /protected is locked until Cloudflare is configured.');
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close());
  }
}
