# PoC operator runbook

Initial implementation: 2026-10-21. Updated: 2026-10-26. Zero Trust Free activation was completed personally by the operator. A separate Workers login lab is deployed; see [the Workers guide](worker-lab.md). The tunnel configuration described below has not been applied, and direct Google integration/device enforcement are not yet proven.

## Architecture and boundary

This runbook describes the **tunnel variant** of the sample web application, with Access protecting the entire hostname. The current domainless Workers variant uses the same token verification and has its own setup guide. Neither variant claims to replace arbitrary TCP/UDP VPN access.

```text
Browser on approved test device
  -> Cloudflare Access (exact email + Google login + MFA + both posture checks)
  -> Cloudflare Tunnel (also validates the Access token)
  -> local app at 127.0.0.1:8787 (also validates the signed Access token)
```

The Cloudflare One Client supplies device signals. The app cannot independently attest device ownership or query MDM. A successful app response proves a valid Access token, while the actual Access policy and negative device tests prove the device requirement.

The sample listener is always bound to loopback. The connector must run on the same machine. No LAN listener, inbound firewall change, root certificate, Docker installation, company resource, or private-network route is required for this version.

## 1. Local preparation

Use Node.js 22.14+ and pnpm 11.25.0. The project pins `jose` 6.2.13 and includes a lockfile.

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm start
```

Root `/` is an introductory page, `/healthz` is process liveness only, and `/protected` is the sample resource. Without both Access settings the protected resource returns HTTP 503. Once settings exist, missing/invalid tokens return HTTP 403. There is no preview switch that grants protected access.

The app never trusts a supplied email, posture, forwarding header, or cookie in place of token verification. It restricts the signing algorithm to RS256, checks issuer/audience/expiry/issued-at/subject, and uses the configured team's public signing keys. It does not log tokens, emails, queries, or request headers.

## 2. Set up the lab account

Complete Cloudflare signup using the operator's work Google account. Select **Zero Trust Free** for the lab. Review any terms or checkout personally; do not start a paid subscription for this experiment.

Create a distinct Zero Trust team name and note it privately. Sign-in to the Cloudflare dashboard and sign-in to an Access-protected application are separate integrations: using Google for the dashboard does not automatically configure Google for the sample app.

For this tunnel variant, use an existing active DNS zone in the test account and a new, unused first-level subdomain. The hostname and zone must belong together. Do not move company DNS or use a wildcard/multi-level hostname for this lab. Without a suitable active zone, use [the Workers variant](worker-lab.md) for login/device learning first. Do not buy a domain implicitly.

## 3. Configure Google and device prerequisites

In Cloudflare's identity-provider integrations, configure Google or Google Workspace using the current official setup instructions. OAuth client creation and Workspace administrator approval may be needed. Keep client secrets in Cloudflare, never in this repository. Test the login integration. Record its Cloudflare integration UUID privately.

Limit **device enrollment permissions** to the exact pilot users and this Google integration. Account-wide enrollment/client settings are deliberately not managed by this Terraform module, so it cannot overwrite an existing organization's enrollment policy or DNS/routing profile.

Enable independent MFA in the **lab** organization and allow authenticator applications or security keys. Do not enable a global requirement on an existing company organization for this lab. The module requires independent MFA only on its own pilot policy. Test the extra challenge rather than assuming Google password sign-in proves MFA.

Install the Cloudflare One Client on the consenting test endpoints and enroll them into the lab team. For the included `gateway` requirement, use the appropriate traffic mode and ensure the Access team, app, and login traffic are routed as Cloudflare requires. DNS-only mode is insufficient. Existing VPN coexistence must be checked before changing routing. TLS decryption is not needed.

Create an approved-device check separately and record its UUID. The first module accepts an enabled Intune/Workspace ONE compliance check, a managed client-certificate check, or an explicit device inventory check (serial number or unique client ID). For a small learning lab without MDM, a serial-number allowlist for explicitly chosen test laptops is possible; record that it is a weaker inventory signal, not hardware-backed attestation or malware protection. OS/client presence alone is not approval. Other EDR/custom integrations and additional health checks need an explicit extension after the baseline is agreed.

The mandatory existing check is intentionally not invented or silently replaced with an always-passing check. Verify its real pass/fail results in the dashboard before proceeding.

## 4. Validate and review infrastructure

Use Terraform 1.7+ (tested with 1.16.6). The Cloudflare provider is pinned to 5.28.1 and its dependency lockfile is committed. A portable, checksum-verified local Terraform binary may exist under ignored `.tools/terraform/`; it is not a global installation.

```powershell
terraform -chdir=infra init -backend=false -input=false
terraform -chdir=infra validate
terraform -chdir=infra test
Copy-Item infra/terraform.tfvars.example infra/terraform.tfvars
```

Replace all example values in the ignored `infra/terraform.tfvars`. The module reads the existing zone and device-rule metadata, and creates exactly six resources: a Gateway posture check, an allow policy, an Access application, a remotely managed tunnel, tunnel configuration, and a proxied CNAME. Preconditions reject a zone in the wrong account, a multi-level/unrelated hostname, or a device rule that only checks client/OS presence. It neither creates the Google/MDM integration nor changes the organization's client, enrollment, MFA defaults, DNS nameservers, or existing VPN.

Use a narrowly scoped Cloudflare API token in the local process environment as `CLOUDFLARE_API_TOKEN`. Minimum relevant permission families are **Access: Apps and Policies Write**, **Zero Trust Write** (for the added posture check), **Cloudflare Tunnel Write** or its current connector equivalent, and **DNS Write** on the single test zone. Verify exact permissions in the actual account. Never paste a token into chat, HCL, a command literal, or the public repo. The account owner should create it and set it locally.

```powershell
terraform -chdir=infra plan -input=false -out=lab.tfplan
```

Check the plan targets only the six lab resources and the intended unused hostname. Saved plans and state can contain sensitive configuration and are ignored. Never upload them to public CI or issues.

After reviewing the intended target and plan, deploy with:

```powershell
terraform -chdir=infra apply lab.tfplan
```

No apply has been run as part of local implementation. The automated tests mock the provider; they do not prove the real Cloudflare API accepts all fields or that the tenant's entitlements and integrations are ready. Confirm the deployed policy and MFA behavior in the dashboard.

The DNS record depends on the Access application and token-verifying tunnel configuration. No bypass, service-token exception, or domain-wide email rule is created. Both posture requirements are in **Require** (AND), with the pilot emails in **Include** (OR). Do not add an Everyone allow policy.

## 5. Connect the demo

Copy `poc/.env.example` to ignored `poc/.env`. Set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` from the matching Terraform outputs. Keep `PORT=8787`, matching the tunnel's local service.

Restart the local app. It should print **Access token validation enabled**. Do not display or copy real login tokens into debugging websites.

Install `cloudflared` from Cloudflare's official distribution on the same machine. In the dashboard, open the newly created lab tunnel and get its connector token. Keep it in an approved secrets store and supply it to `cloudflared` through the local `TUNNEL_TOKEN` environment variable. Run the connector in the foreground for this test:

```powershell
cloudflared tunnel --no-autoupdate run
```

The module deliberately does not fetch or output the connector token, preventing it from being captured in Terraform state. Do not use a Quick Tunnel/`trycloudflare.com` address as a substitute for this Access-protected hostname.

Open the HTTPS test URL, sign in with Google, complete MFA, and select **Try opening the protected page**. Then follow [the live test checklist](poc-test-checklist.md).

## 6. Failure checks

| Symptom | Check |
| --- | --- |
| 503 at the sample resource | Both Access environment settings exist and the app was restarted. |
| 403 at the origin | Team domain and AUD match the Access app; token is valid; use the public Access address. |
| Access denies an approved user | Exact email, Google integration, client enrollment, all required posture results, and MFA enrollment. |
| Posture remains failed after a change | Polling/expiration, routed login/app/team domains, correct device registration, and supported client mode. |
| Tunnel error/502 | App and connector run on the same host; local health endpoint responds; app port is 8787. |
| Hostname/TLS error | Active zone, unused first-level hostname, correct CNAME, and edge certificate availability. |

Never resolve a test failure by removing MFA/posture/Access, exposing the local listener, or trusting unsigned identity headers.

## 7. Rollback and cleanup

1. Stop the lab `cloudflared` process first. The live test address can no longer reach the origin.
2. Stop the sample app if the experiment is finished. No company traffic path needs restoration.
3. Review `terraform -chdir=infra plan -destroy` and confirm it lists only the six resources from this lab state. Stop if it includes unrelated resources.
4. If permanent cleanup is desired, run `terraform -chdir=infra destroy` and review its interactive confirmation. DNS is removed before the app/tunnel configuration because of the declared dependencies.
5. Revoke the lab connector/API tokens and test registrations when no longer needed. Remove only lab-specific integrations, enrollment rules, and device checks after checking their other uses.
6. Preserve redacted evaluation results privately and record completion in the test checklist. Never delete state before cleanup is confirmed.

## Moving to a company account later

Redeploy the same code with new account, zone, team, Google integration, device-rule and hostname values. Obtain a new tunnel token and app AUD, then re-enroll test devices to the destination team. Update the local environment, test the destination, and shut down the old lab. Do not assume account or subscription merging; this is a recreation of a small configuration.

## Sources checked on 2026-10-21

- [Cloudflare: Validate Access JWTs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Cloudflare: Common Access policies and posture AND requirements](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/common-policies/)
- [Cloudflare: Google integration](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/google/)
- [Cloudflare: Independent MFA](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/independent-mfa/)
- [Cloudflare: Device enrollment](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/deployment/device-enrollment/)
- [Cloudflare provider 5.28.1 resource schemas](https://github.com/cloudflare/terraform-provider-cloudflare/tree/v5.28.1/docs/resources)
