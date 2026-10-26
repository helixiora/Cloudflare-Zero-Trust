# Hosted login lab

Updated 2026-10-26. This is the current first stage: a harmless sample app on a generated `workers.dev` address, behind Cloudflare Access. It requires no purchased domain, company DNS changes, tunnel, or inbound firewall rules.

## What is deployed

```text
Browser -> Cloudflare Access -> sample Worker -> signed-token check on /protected
```

The same request handler serves the local Node app and the Worker. `/protected` validates the Access JWT against the configured team's keys, issuer, audience, expiry and subject. Missing configuration returns 503; missing or invalid tokens return 403. Other public-facing routes contain only sample introduction/style/health content, and Access must protect **all traffic** to the Worker.

The live lab currently uses the built-in Cloudflare identity provider. The policy allows membership of the test Cloudflare account **AND** the exact named tester's email. It requires an authenticator application on every fresh login, with a one-hour application session. This is an identity experiment. It does not yet require an enrolled/approved device, and it is not a direct Google Workspace integration.

The App Launcher must also be configured for the exact tester so the user can enroll an authenticator. Authenticator support is enabled in the lab organization; the requirement is applied through the pilot policy, without applying global MFA enforcement to all future applications. Keep the launcher's session short and its policy narrow. Do not add Everyone or a whole email domain to solve enrollment errors.

Account IDs, team name, app audience, live URL and test evidence belong in ignored `local/` files or an approved private store. Do not publish screenshots containing login tokens, setup keys, QR codes, email addresses or device inventory.

## Build and local check

Run from the repository root using Node.js 22.14+ and pnpm 11.25.0:

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm check:worker
pnpm dev:worker
```

Open `http://127.0.0.1:8788`. Without bindings the sample stays locked. For local configured denial checks, copy `worker/.dev.vars.example` to ignored `worker/.dev.vars` and use the matching team's domain and audience. Do not put login tokens in that file.

`check:worker` builds with esbuild and runs Wrangler's deployment dry run. It needs no Cloudflare credentials and does not create resources. CI runs it alongside the synthetic token tests. Preview URLs and application observability are disabled in the supplied config; no storage, queues or other paid services are configured.

## Deploy or recreate in another lab account

1. Verify the account and active Free plans in the dashboard. The owner personally completes any checkout, terms and OAuth consent. This repository does not activate a paid Workers plan.
2. Sign in to Wrangler using the narrow deployment scopes needed here:

   ```powershell
   pnpm exec wrangler login --scopes account:read user:read workers_scripts:write
   pnpm exec wrangler whoami
   ```

   Complete authorization yourself. Wrangler stores credentials outside this repository. Do not copy its credential file into the project or broaden scopes because of warnings about unrelated features.
3. Select the intended account through `CLOUDFLARE_ACCOUNT_ID` in the local process environment. `worker/wrangler.jsonc` uses the lab-only Worker name `zt-lab-demo`; confirm it is unused before the first upload. Run `pnpm deploy:worker`.
4. Before adding any real content, open the Worker's **Access** tab and protect **All traffic**, covering production and previews. In the generated Access app, set the exact tester policy, selected login provider, MFA, and a one-hour session. Do not enable account-wide Workers protection for this experiment. Check for more-specific hostname policies, which can take precedence.
5. Set runtime text variables `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` in the Worker's **Settings > Variables and Secrets**, using the team HTTPS domain and generated application's audience. These are configuration values, not API credentials. `keep_vars: true` preserves dashboard variables on later code deployments. Never commit real values to the public Wrangler config.
6. Make an anonymous request: expect a redirect to Access, with no sample resource returned. Open the live URL in a browser, complete the configured login and private MFA enrollment, then verify the sample resource. Do not paste the JWT into chat or a token-inspection website.

The Worker stays locked while its Access bindings are missing. Keep all sample content harmless because hosting and Access are separate configuration steps. Never remove Access to troubleshoot a failed sign-in.

## Private enrollment and live evidence

The user enrolls an authenticator themselves. If **Setup MFA** leads to “contact your administrator to enable the Access App Launcher”, configure the launcher's narrow policy first. Then use the launcher's **Account > MFA devices > Add an MFA device**, or the team's `/AddMfaDevice` enrollment URL. The user chooses **Authenticator application**, scans its QR code, and submits their own verification code. Never capture that QR code or setup key in evidence.

Baseline observed on 2026-10-26: anonymous requests and forged-header requests redirected to Access; sign-in without MFA enrollment was blocked; after private enrollment and a real challenge, the tester reached the page and its JWT was verified. Different-account denial and session-expiry tests remain open.

Record independently:

- Anonymous `/` and `/protected`: redirect to Access.
- Forged identity/token headers without a valid session: no protected content.
- Exact tester without MFA enrollment/completion: blocked.
- Exact tester completing MFA: the signed-token sample page opens.
- Another account: denied.

Authenticated allow/deny scenarios need user participation and must not be inferred from saved policy settings. A successful page proves token verification. Device approval still needs the enrolled/approved and unapproved-device tests in [the full checklist](poc-test-checklist.md).

## Next stage and rollback

Choose a consenting test endpoint with a supported OS before installing the Cloudflare One Client. Agree VPN coexistence and the enrollment policy, then add an approved-device signal and required client posture. Never count OS/client presence alone as company approval. Do not weaken the identity policy to make device setup easier.

For a temporary shutdown, disable the Worker's `workers.dev` route in **Settings > Domains & Routes** and keep Access attached. Preview URLs are already disabled; check there are no other routes or custom domains. Verify the old address no longer serves the demo. Restore the route only with Access still present. For a bad code deployment, roll back to a known version while retaining the matching Access bindings and policy.

Permanent resource deletion and credential revocation are separate cleanup decisions. Review the specific Worker, generated Access app, App Launcher policy and Wrangler authorization before removing anything. A reusable policy may be shared with the launcher. Do not run Terraform destroy for this Worker: the `infra/` state describes the separate, undeployed tunnel variant.

## Official references

- [Access protection for Workers, including policy precedence](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Validate Access JWTs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Independent MFA and authenticator enrollment](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/independent-mfa/)
- [Google identity provider setup](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/google/)
- [Cloudflare One Client support lifecycle](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/download/support-lifecycle/)
