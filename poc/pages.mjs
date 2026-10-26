function page(title, content, state = 'pending') {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | Zero Trust lab</title><link rel="stylesheet" href="/style.css"></head>
<body><main><header><a href="/" class="brand">ZERO TRUST / LAB 01</a><span class="tag">Proof of concept</span></header>
<section class="card ${state}"><p class="eyebrow">Cloudflare Zero Trust initiative</p><h1>${title}</h1>${content}</section>
<footer>Sample content only. Device approval requires a Cloudflare policy and real device tests.</footer>
</main></body></html>`;
}

export function introduction(configured) {
  return page('A small experiment in safer access.', `
<p class="lead">This is our sample company tool. The experiment is to let the right person in, on an approved device.</p>
<ol><li><strong>Who are you?</strong><span>Sign in with the login method configured for the lab.</span></li>
<li><strong>Is this an approved device?</strong><span>In the device stage, Cloudflare checks the device rules we choose.</span></li>
<li><strong>Can you open the page?</strong><span>Only a successful check should unlock the sample resource.</span></li></ol>
<p class="notice">${configured ? 'Cloudflare settings are loaded. Use the public test address to perform the real login and device tests.' : 'The demo is running. Cloudflare is not connected yet, so the sample resource stays locked.'}</p>
<a class="button" href="/protected">Try opening the protected page <span aria-hidden="true">&rarr;</span></a>`);
}

export const notConnected = () => page('Cloudflare is not connected yet.', '<p class="lead">The demo works, but the protected page is locked until the Cloudflare account and application settings are connected.</p><a class="button" href="/">Back to the experiment</a>');
export const denied = () => page('Access denied.', '<p class="lead">This request does not contain a valid login token for this application. Open the public test address and sign in through Cloudflare.</p><p>We rejected the request. No sample resource was returned.</p>', 'denied');
export const protectedPage = () => page('You reached the protected page.', '<p class="lead">The app verified a signed Cloudflare Access token for this application.</p><div class="sample"><span>Sample internal resource</span><h2>Project notebook</h2><p>This harmless page stands in for a company tool. There is no company data here.</p></div><p class="notice">This proves token validation. Confirm the device and MFA requirements in Cloudflare logs and the test checklist before calling the PoC successful.</p>', 'verified');
