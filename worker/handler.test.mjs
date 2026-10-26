import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { customFetch, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createWorker } from './handler.mjs';

const env = { ACCESS_TEAM_DOMAIN: 'https://test-team.cloudflareaccess.com', ACCESS_AUD: 'a'.repeat(64) };
const url = 'https://zt-lab.example.workers.dev';
let privateKey, worker;
const request = (path, options) => new Request(`${url}${path}`, options);

before(async () => {
  const pair = await generateKeyPair('RS256', { extractable: true });
  privateKey = pair.privateKey;
  const jwk = await exportJWK(pair.publicKey);
  worker = createWorker({ stylesheet: 'body { color: black; }', jwksOptions: {
    [customFetch]: async (keyUrl) => {
      assert.equal(String(keyUrl), `${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
      return new Response(JSON.stringify({ keys: [{ ...jwk, kid: 'worker-key', alg: 'RS256' }] }), {
        headers: { 'content-type': 'application/json' },
      });
    },
  } });
});

async function signedToken(audience = env.ACCESS_AUD) {
  return new SignJWT({}).setProtectedHeader({ alg: 'RS256', kid: 'worker-key' })
    .setIssuer(env.ACCESS_TEAM_DOMAIN).setAudience(audience).setSubject('lab-user')
    .setIssuedAt().setExpirationTime('5m').sign(privateKey);
}

test('Worker serves the introduction but never unlocks unconfigured content', async () => {
  assert.equal((await worker.fetch(request('/'), {})).status, 200);
  const response = await worker.fetch(request('/protected'), {});
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /Project notebook/);
});

test('invalid Worker bindings fail closed and never reuse a previous valid handler', async () => {
  await worker.fetch(request('/'), env);
  for (const invalid of [{ ACCESS_AUD: env.ACCESS_AUD }, { ACCESS_TEAM_DOMAIN: 'https://evil.example', ACCESS_AUD: env.ACCESS_AUD }]) {
    assert.equal((await worker.fetch(request('/protected'), invalid)).status, 503);
  }
});

test('Worker validates real signatures and refuses a token issued for a different application', async () => {
  const response = await worker.fetch(request('/protected', { headers: { 'cf-access-jwt-assertion': await signedToken() } }), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Project notebook/);
  const wrongApp = await worker.fetch(request('/protected', { headers: { 'cf-access-jwt-assertion': await signedToken('b'.repeat(64)) } }), env);
  assert.equal(wrongApp.status, 403);
});

test('Worker does not trust client-supplied identity, posture, or cookies', async () => {
  const response = await worker.fetch(request('/protected', { headers: {
    'cf-access-authenticated-user-email': 'tester@example.com',
    'x-device-posture': 'passed', cookie: 'CF_Authorization=forged',
  } }), env);
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('Worker keeps authentication on HEAD and rejects writes and secret-file paths', async () => {
  const head = await worker.fetch(request('/protected', { method: 'HEAD' }), env);
  assert.equal(head.status, 403);
  assert.equal(await head.text(), '');
  assert.equal((await worker.fetch(request('/protected', { method: 'POST' }), env)).status, 405);
  assert.equal((await worker.fetch(request('/.dev.vars'), env)).status, 404);
  assert.equal((await worker.fetch(request('/style.css'), env)).headers.get('content-type'), 'text/css; charset=utf-8');
});
