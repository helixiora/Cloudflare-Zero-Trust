# Live PoC test checklist

Status as of 2026-10-26: **login baseline verified; full device PoC not run**. The Workers sample is deployed. The exact-tester policy requires an authenticator on every fresh login. Direct Google integration and all device scenarios remain untested.

| Baseline test | Observed result | Status |
| --- | --- | --- |
| Anonymous request to `/` and `/protected` | HTTP 302 to the configured team's Access login; no sample resource returned. | Passed |
| Forged email, JWT and authorization cookie without a valid session | Redirected to Access; no sample resource returned. | Passed |
| Exact tester before MFA enrollment | Access stopped at the MFA setup requirement. | Passed |
| Exact tester after private enrollment and challenge | Protected page opened and application verified a real Access JWT. | Passed |
| Different account / failed MFA code / session expiry | Requires additional user-driven scenarios; not inferred from configuration. | Not run |

The App Launcher initially blocked enrollment because it had no policy. It was enabled using the same exact-tester policy and a 30-minute session; the user then enrolled their authenticator privately. No authenticator secrets were stored in this repository.

Automated tests use synthetic signing keys and a mocked provider. They do not establish that Google login, device approval, or MFA succeeds in the real account. Record private operational evidence separately; do not commit the live address or identifying account/device details.

Keep the completed checklist and identifying screenshots/logs in a private working location. Use fresh/private browser sessions where relevant; existing sessions and posture polling can otherwise hide policy changes. Do not deliberately disable antivirus, encryption, or firewalls to simulate failure. Use an unapproved spare device or a dedicated test policy/inventory change.

| ID | Test | Expected result | Status |
| --- | --- | --- | --- |
| L01 | Named tester, Google login, MFA, enrolled and approved device | Page and sample resource open through the public test URL. | Not run |
| L02 | Allowed tester skips/fails the MFA challenge | Protected resource is not returned. | Not run |
| L03 | Different Google account, including another account in the work domain | Denied unless that exact email is explicitly allowed. | Not run |
| L04 | Allowed tester on an unenrolled device | Device requirement denies access. | Not run |
| L05 | Allowed tester on an enrolled but unapproved spare device | Approved-device check denies access. | Not run |
| L06 | Modify only a dedicated test-device allowlist/check to fail | New access fails after the documented evaluation interval. Record elapsed time. | Not run |
| L07 | Remove tester from the lab allow policy and revoke existing sessions | Fresh login fails. Record behavior of existing sessions separately. | Not run |
| L08 | Revoke a lab device registration | New access fails. Record elapsed time and whether re-enrollment must also be restricted. | Not run |
| L09 | Direct local request to /protected without a token or with a forged email header | 403 when configured; 503 before configuration. | Not run |
| L10 | Expired login session | A new login/MFA is required; origin refuses expired tokens. | Not run |
| L11 | Tunnel variant: disconnect/restart the connector | Test address fails closed, then recovers on reconnect. | Not run; not applicable to Workers |
| L12 | Tunnel variant: stop the local demo process | Origin is unavailable; no alternate unprotected content appears. | Not run; not applicable to Workers |
| L13 | Office and home network; current VPN where applicable | Expected routing/login behavior; unrelated work still functions. | Not run |
| L14 | Review Access and posture logs | Allow/deny and device-rule evidence match the observed tests. | Not run |
| L15 | Execute rollback: stop the lab connector, or disable the Workers route for the hosted variant | Lab URL no longer reaches the demo; company access is unaffected. | Not run |

Agree numeric latency, recovery, and revocation targets before acceptance. Record actual measurements, client version, test context, and limitations. Cloudflare posture decisions have polling/cache delays; an issued token remains usable until expiry/revocation takes effect. Do not promise instant termination of every established connection.

A green app page verifies its Access token. Mark the PoC successful only after both allow and deny scenarios are demonstrated against the actual policy. If logs or enrollment restrictions cannot prove the desired device rule, record a failed/incomplete criterion rather than relaxing the rule.
