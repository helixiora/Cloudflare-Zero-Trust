# Requirements scope

Status: draft for stakeholder validation

Phase: isolated lab implementation; company discovery remains open

PoC implementation: local application and hosted Workers login lab built; anonymous/forged-header Access redirects and successful authenticator sign-in verified. Direct Google integration and device enforcement remain unverified.

## 1. Problem statement

The organization wants to reduce the risk that unauthorized, unmanaged, or unhealthy devices can access company systems. The proposed solution should provide controlled remote access based on user identity and device trust, with less implicit network access than a conventional VPN.

## 2. Objectives

1. Permit access only to explicitly authorized users on devices that meet a documented baseline.
2. Limit each user/group to the specific application or service required.
3. Remove the need to expose the selected internal service directly to the Internet.
4. Provide useful evidence of authentication, authorization, device posture, and denial events.
5. Preserve a practical user experience and a safe rollback path.
6. Produce enough evidence to make a go/no-go decision for a larger rollout.

## 3. Required discovery inputs

The following must be known before a company-connected pilot is approved. The initial local sample application does not depend on access to company systems:

| Area | Required input | Owner | Status |
| --- | --- | --- | --- |
| Users | Pilot users, roles/groups, locations, employees vs contractors | Sponsor / HR / IT | Open |
| Identity | IdP, MFA method, group source, joiner/mover/leaver process, emergency access | Identity owner | Open |
| Devices | Ownership model, OS/version inventory, MDM/EDR, encryption/firewall/update baseline | Endpoint owner | Open |
| Resource | One low-risk app/service, protocol, hostname/IP, dependencies, data classification | App owner | Open |
| Network | Current VPN, DNS, IP ranges, overlapping subnets, egress restrictions, connector location | Network owner | Open |
| Security | Required posture checks, session duration, logging/SIEM, admin roles, incident response | Security owner | Open |
| Privacy/legal | Acceptable device/traffic telemetry, TLS inspection position, retention constraints | Privacy/legal | Open |
| Operations | Support desk, escalation path, maintenance, rollback owner and recovery target | IT operations | Open |
| Commercial | Tenant/plan, pilot seats, feature entitlements, expected production cost | Procurement / Cloudflare owner | Open |

## 4. Functional requirements

### Must have for the PoC

- **FR-01 Identity:** Authenticate pilot users through the organization's approved IdP with MFA.
- **FR-02 Enrollment:** Restrict Cloudflare One Client enrollment to a named pilot group or equally narrow rule.
- **FR-03 Device trust:** Require at least one meaningful device-management signal in addition to user identity and client enrollment. The exact signal must be agreed during design.
- **FR-04 Least privilege:** Allow the pilot group to reach only the selected resource and required protocol/port.
- **FR-05 Denial:** Deny and log attempts from an unauthorized user, unenrolled device, and deliberately non-compliant test device.
- **FR-06 Private connectivity:** Connect the selected private resource through an outbound-only Cloudflare-supported connector without opening a new inbound Internet path.
- **FR-07 Revocation:** Demonstrate user access removal and device access removal within the agreed target time.
- **FR-08 Logging:** Capture authentication, Access/Gateway decision, device posture, and tunnel health evidence needed for the evaluation.
- **FR-09 Rollback:** Restore the pre-PoC access path or disable the pilot control within an agreed recovery time.
- **FR-10 Coexistence:** Avoid disrupting non-pilot users and unrelated device traffic.

### Should have for the PoC

- **FR-11 Multiple networks:** Test from at least an office network and an external/home network.
- **FR-12 Client resilience:** Test reconnect, reboot, sleep/wake, and temporary Cloudflare/tunnel failure behavior.
- **FR-13 DNS:** Use a friendly internal hostname if private IP access would otherwise require users to remember an IP address.
- **FR-14 Automation readiness:** Record configuration choices in a form that can later be translated to Terraform without committing live identifiers or secrets publicly.
- **FR-15 High availability design:** Document the production replica/failover design, even if the PoC uses a single non-critical connector.

### Could have later

- Internet DNS/network/HTTP filtering;
- TLS decryption and detailed HTTP controls;
- Data Loss Prevention, antivirus scanning, CASB, or Browser Isolation;
- SaaS application access control;
- contractor or BYOD-specific policies;
- SIEM/Logpush integration and longer retention;
- full infrastructure-as-code deployment;
- company-wide legacy VPN replacement.

## 5. Non-functional requirements

- **NFR-01 Security:** Default-deny the selected protected resource and grant by named identity group plus device requirement.
- **NFR-02 Availability:** The PoC must not become the only access path to a production-critical system.
- **NFR-03 Performance:** Measure connection time and user-perceived latency against the current path; agree numeric thresholds during design.
- **NFR-04 Supportability:** Help-desk documentation must identify common failure states, diagnostics, escalation, and rollback.
- **NFR-05 Privacy:** Collect only telemetry approved for the pilot; do not enable TLS decryption without a separate privacy/legal and technical decision.
- **NFR-06 Auditability:** Record who changed policies and preserve evaluation evidence within the plan's retention constraints.
- **NFR-07 Compatibility:** Pilot devices must use Cloudflare-supported OS versions and meet client hardware/network prerequisites.
- **NFR-08 Maintainability:** Use clear policy names, descriptions, owners, and change records; avoid broad wildcard rules.
- **NFR-09 Secret handling:** Keep credentials and environment-specific sensitive details out of this public repository and out of plaintext notes.
- **NFR-10 Reversibility:** Every PoC change must have an owner, rollback step, and verification step.

## 6. Explicitly out of scope for the initial PoC

- organization-wide deployment;
- decommissioning the existing VPN;
- production-critical or regulated-data applications;
- broad Internet filtering or employee monitoring;
- TLS decryption;
- mobile/BYOD rollout unless it is the agreed core use case;
- changing endpoint-management or identity-provider platforms;
- purchasing an enterprise contract before technical and commercial evaluation;
- treating successful client enrollment as sufficient proof of a managed device.

## 7. PoC entry criteria

The company-connected pilot may begin only when all of the following are true. Local implementation and tests against a mock provider may proceed while these details are collected:

- sponsor, technical owner, security reviewer, and support owner are named;
- pilot users and one low-risk resource are approved;
- access pattern (published web app or private network) is selected;
- IdP/MFA and pilot group are available;
- approved-device definition and posture signals are documented;
- OS/client compatibility is checked;
- network/DNS/current-VPN conflicts are reviewed;
- data classification and privacy position are recorded;
- tenant, plan, entitlements, and cost assumptions are verified;
- test plan, monitoring, support, and rollback are approved;
- no tenant secrets or internal identifiers are destined for the public repository.

## 8. Draft PoC success criteria

Exact numeric thresholds should be agreed after environment discovery.

| Scenario | Expected result |
| --- | --- |
| Authorized pilot user + compliant enrolled device | Access succeeds only to the selected resource. |
| Authorized user + unenrolled device | Access is denied and the event is diagnosable. |
| Authorized user + deliberately failed posture check | Access is denied after the documented evaluation delay. |
| Non-pilot user + compliant device | Access is denied. |
| Pilot user attempts unrelated private resource/port | Access is denied. |
| User removed from pilot group | New access is denied within the agreed revocation target. |
| Device registration revoked | New access is denied within the agreed revocation target. |
| Connector/client restart | Service recovers within the agreed target, with understandable logs. |
| Rollback invoked | Pre-PoC state is restored and verified within the agreed target. |
| Normal work during pilot | No material disruption to non-pilot users or unrelated traffic. |

## 9. Production decision criteria

The final recommendation should consider security improvement, user experience, application compatibility, availability design, operational workload, privacy, audit/log retention, licensing, migration complexity, and the continuing need for the legacy VPN. A technically successful demo is not by itself approval for production rollout.

