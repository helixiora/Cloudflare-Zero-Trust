# Our first working experiment

We are using a harmless sample web page to learn how Cloudflare protects access. It contains no company data.

The experiment asks: **can an approved person open this page from an approved device, while another person or device is blocked?**

## What is ready

- A sample app that runs on this computer at `http://127.0.0.1:8787`.
- An introduction page explaining the experiment.
- A protected page that stays locked until real Cloudflare settings are connected.
- Verification of Cloudflare's signed login tokens, including their signature, issuer, expiry, and intended application.
- Reusable configuration for one Cloudflare Access application, one tunnel, one test address, exact test users, MFA, and device checks.
- Automated checks for forged/expired logins and unsafe configuration.
- A hosted Workers version, protected by Cloudflare Access without buying a domain or changing company DNS.
- A live test checklist for the tests that must be done using real accounts and devices.

## What we do next

1. **Login baseline completed.** Zero Trust Free is active. The exact tester enrolled an authenticator privately, completed its challenge, and reached the signed-token sample page. Anonymous and forged-header requests are redirected to login. A different-account denial and session expiry still need testing.
2. **Test a device.** Choose a laptop with a supported operating system, enroll it, and require its approval in the policy. Then demonstrate that an unapproved device is blocked. This stage has not started.
3. **Connect work Google sign-in.** This needs a separate Google integration. Signing into Cloudflare with a Google-linked account does not establish company Google Workspace integration.
4. **Review with Walter.** Show the successful and failed attempts, agree who manages devices, and choose one low-risk company service for a later pilot.

The current hosted page proves only what we actually test. A successful login alone does not mean the laptop is approved. The [Workers lab guide](worker-lab.md) records the current setup; the tunnel configuration remains available for the later internal-service experiment.

We can recreate the configuration in a company Cloudflare account later. That requires new account-specific values, Google integration, tunnel credentials, and device registrations; switching is not an automatic account merge.

## Try the local page

From the project folder, with Node.js 22.14+ and pnpm available:

```powershell
pnpm install --frozen-lockfile
pnpm start
```

Open `http://127.0.0.1:8787`. Click **Try opening the protected page**. Until Cloudflare is connected, the correct result is **Cloudflare is not connected yet**.

This is useful progress, but it does not yet prove Google sign-in, MFA, or device approval. Those need the real tests in [the live checklist](poc-test-checklist.md).

Technical setup is recorded in the [operator runbook](poc-runbook.md), so you do not need to memorize it.
