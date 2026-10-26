# Start here: project handoff

Last updated: **2026-10-26 (Europe/Amsterdam)**. This is a dated handoff, not a live account inventory. Read the latest Git history and check the actual dashboard before changing resources.

## Context and goal

Walter Heck proposed evaluating Cloudflare Zero Trust for Helixiora. Presiyan Penev is leading the research and proof of concept and is learning the product. Explain one practical step at a time, using plain language.

The intended result is: **an explicitly allowed person on an approved device can reach a selected system; another person or an unapproved device cannot**. We are learning with harmless sample content before connecting company systems.

The user will work from a different PC for approximately one week, starting 2026-10-27. Its operating system, management status, installed tools and authenticated sessions are unknown. Do not assume it is already an approved test device.

## Current state

| Area | State at this handoff |
| --- | --- |
| Repository | [helixiora/Cloudflare-Zero-Trust](https://github.com/helixiora/Cloudflare-Zero-Trust), **public**, default branch `main`. Transferred from the operator's personal GitHub account; local `origin` was updated. |
| Implemented code baseline | Commit `5cf905f56916cdb9ce3f56406f0ae224cc4dd00b`. Later commits may update documentation or implementation. |
| Cloudflare account | Operator's isolated lab account; Zero Trust Free activation was completed personally by the user. Moving the GitHub repository did **not** move the Cloudflare account or resources. |
| Hosted app | Worker `zt-lab-demo`, at its generated `workers.dev` address. Access protects **all traffic**. Preview URLs are disabled. |
| Identity policy | Membership of the lab Cloudflare account **AND** the exact tester's email. Authenticator application required on every fresh login. Application session: one hour. |
| App Launcher | Enabled with the same narrow tester policy and a 30-minute session, allowing private authenticator enrollment. |
| Login provider | Built-in Cloudflare identity provider. A Google-linked Cloudflare account is being used; a direct company Google/Workspace integration has **not** been configured. |
| Device approval | **Not configured or tested.** No Cloudflare One Client installation or lab device enrollment was performed. |
| Internal systems and tunnel | No company systems, private-network routes or DNS changes. The Terraform tunnel variant exists as code but has **not** been applied. |
| Deployment | Worker was deployed manually with Wrangler. GitHub Actions validates code; pushing Git commits does not deploy the Worker. |
| Open maintenance item | GitHub reported a high-severity `undici` dependency alert while publishing this handoff. See the first next action below; it has not been fixed. |

The hosted Worker runs at Cloudflare. It does not require the old PC or its local demo process to remain running.

## What we actually verified

- Anonymous requests to `/` and `/protected` redirected to the configured team's Access login (HTTP 302).
- Forged identity headers, a forged JWT and a forged authorization cookie did not return the sample resource.
- Sign-in stopped when the tester had no enrolled MFA method.
- The user enrolled an authenticator privately, completed a real challenge, and reached `/protected`. The application verified the actual Access JWT before showing the sample page. This was checked again after the final deployment.
- Fifteen Node/Worker tests and five mocked Terraform tests passed. Terraform validation/format checks, a Wrangler deployment dry run and a local Worker runtime smoke check passed. GitHub validation passed for the implementation baseline.

These results establish the initial login baseline. Different-account denial, deliberate failed/cancelled MFA, live session expiry/revocation and **all device enforcement scenarios remain untested**. Synthetic token tests and a saved policy are not substitutes for those live tests.

## First session on the new PC

1. Open or clone the **organization** repository. Do not create a replacement repository, new Cloudflare account, new Zero Trust team or duplicate Worker.

   ```text
   git clone https://github.com/helixiora/Cloudflare-Zero-Trust.git
   cd Cloudflare-Zero-Trust
   git status --short
   git remote -v
   git log -5 --oneline
   ```

   For an existing checkout, inspect local changes and fetch the latest `origin/main` before continuing. Preserve work already present.
2. Read this file, [the plain-language guide](docs/poc-guide.md), [the current Workers guide](docs/worker-lab.md) and [the test checklist](docs/poc-test-checklist.md). The [tunnel runbook](docs/poc-runbook.md) describes a later variant, not the deployed architecture.
3. Let the user sign in to their existing GitHub/Cloudflare accounts and complete any MFA directly. The enrolled authenticator remains relevant on the new PC. A new browser session does not mean enrollment must be repeated or MFA removed.
4. Locate the existing `zt-lab-demo` Worker in the authenticated Cloudflare dashboard. Confirm its Access app, policy, runtime variables and current URL before testing. Opening the hosted demo does not require local dependencies or Wrangler authorization.
5. If working on code, first address the development-dependency alert below before installing/running the affected local tools. Use Node.js 22.14+ (the baseline was tested on Node 24) and the repository-pinned pnpm 11.25.0:

   ```text
   pnpm install --frozen-lockfile
   pnpm test
   pnpm check:worker
   ```

   These checks do not deploy resources. `pnpm start` serves the Node demo on loopback port 8787; `pnpm dev:worker` serves the local Worker on loopback port 8788. An unconfigured local `/protected` returning 503 is expected. Local servers do not replace the live Access login flow.

## Private information and authentication

The public clone intentionally contains no actual account ID, team domain, tester email, app audience, live URL, tokens or device inventory. On the original PC, account metadata and evidence are in ignored `local/lab-account.json`, `local/login-evidence.md` and screenshots. Those files are **not** available through Git and are not required to understand this handoff.

Recover required account-specific values from the authenticated dashboard or an approved private store. If the account cannot be identified, ask the user which existing account to use. Do not invent values, request passwords/tokens in chat, or publish private operational details to fill gaps in this file.

Wrangler authorization on the old PC does not sign in the new PC. Authorize it only if deployment work is needed, following [the Workers guide](docs/worker-lab.md). Do not copy credential stores, browser cookies or authenticator setup keys between machines. Keep the existing live `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` runtime settings; `keep_vars: true` preserves dashboard variables during code deployment.

## Next actions, in order

1. **Resolve the known development-dependency alert.** [Dependabot alert #3](https://github.com/helixiora/Cloudflare-Zero-Trust/security/dependabot/3) reports a high-severity denial-of-service issue in `undici`, [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c). Local dependency inspection found `wrangler@4.152.0 -> miniflare@5.20261019.2-beta -> undici@7.29.1`; the advisory lists 7.30.1 as the patched 7.x release. Check the current advisory and all related open alerts, update the compatible tooling/lockfile, and run the app tests and Worker dry run. Do not merely add an unused direct dependency or dismiss the alert. This is a development dependency; the deployed Worker bundles the application and `jose`, not Wrangler/Miniflare. Runtime exposure has not been assessed in this documentation task. Browser-only login testing does not require starting these tools.
2. **Finish the login baseline.** Use a separate fresh browser session to test a different account; it must be denied. Test cancelled/failed MFA without repeated guesses. Observe expiry and targeted session revocation. Keep an authenticated administrator dashboard available for recovery, and avoid revoking the user's whole Cloudflare/GitHub account or authenticator. Record results and limitations privately; update the redacted checklist.
3. **Choose the device test setup.** Check the new PC's OS support, existing VPN and whether it is an appropriate consenting test endpoint. Verify current vendor support requirements. The user previously chose to finish login testing first; enrolling the temporary PC is not a prerequisite for continuing documentation or login checks.
4. **Implement approved-device enforcement in the lab.** Restrict enrollment to the exact tester. Choose an explicit device approval signal (a lab inventory allowlist or an existing management compliance integration), add the appropriate client/posture requirements, and retain the current identity and MFA restrictions. Client installation or OS version alone does not establish device approval. Prove the same allowed user succeeds on an approved device and is denied on an unapproved/unenrolled device. No device checks have been created yet; do not claim success before both cases are observed.
5. **Integrate company Google sign-in.** Set up the separate Google identity integration; coordinate with the company Google administrator if needed. Keep a recoverable admin route and test the integration before changing the working login policy.
6. **Review with Walter before a company-connected pilot.** Agree what counts as an approved device, operational ownership, named testers, success measures, costs and one low-risk application. Then decide whether to deploy the tunnel variant or another agreed architecture.

Use only the isolated sample lab for now. No paid upgrade, domain purchase, company DNS migration or production access change is part of this handoff. Keep Access and MFA in place while troubleshooting. Refer to the Workers guide for rollback; Terraform state does not manage the deployed Worker.

At the end of the temporary setup period, review any lab device registrations or deployment authorizations created on that PC and remove/revoke only those no longer needed. Do not tear down the hosted lab merely because the operator changes PCs.

## Keep this handoff current

After meaningful progress, update this file's date, current state, observed results and next action, plus the relevant test checklist. Separate tested behavior from planned behavior. Keep account/device identifiers and detailed logs out of public commits. Preserve user changes and check the remote before pushing.

## Prompt to resume

> Continue the Helixiora Cloudflare Zero Trust project from this repository. Read AGENTS.md and HANDOFF.md first, then the linked Workers guide and test checklist. I am using a different PC temporarily. Check the latest state, address the recorded development-dependency alert before running the affected tools, and continue the remaining login tests before device approval. Explain each step simply, use the existing lab, and keep all credentials and account/device details private.
