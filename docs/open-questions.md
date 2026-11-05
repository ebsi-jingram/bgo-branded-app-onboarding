# Open stakeholder questions

None of these is resolved. The prototype shows tasks that depend on them as Blocked or tagged Q,
and never invents an answer.

IDs are stable. Resolve a question by adding a dated **Resolved** line naming who decided it and
where, then update the procedures that link to it.

Sources: H = SKY-2640 handoff · G = client guide draft "pending" list (Nov 5) · R = found while
reviewing the sources for this prototype.

## Highest priority

| ID | Question | Source |
|---|---|---|
| Q01 | Which of Connect's access models will BGO branded apps officially support, and do they apply unchanged? | H, G |
| Q02 | Is Admin access the preferred BGO model? (The client guide draft says yes; not yet approved.) | H |
| Q03 | Which Empyrean Apple and Google accounts or email addresses should clients invite? | H, G |
| Q04 | Who creates the store app records when the client only allows app-scoped access? If the client creates a blank app, who checks its distribution settings? | H, G, R |
| Q05 | What is the exact dependency order between bundle/package IDs, store records, Android signing, Firebase, Auth0 and other services? | H |
| Q06 | Where is the definitive SecretSpec field list for branded apps? | H |
| Q07 | Who verifies developer account permissions, and how does Implementation hand off to Engineering? (Connect: the IM confirms with Tech.) | H, G |
| Q08 | Which client-facing instructions are needed first for the initial rollout? | H |

## Ownership

| ID | Question | Source |
|---|---|---|
| Q09 | Which App Support team members handle client organization code provisioning and Auth0? | H |
| Q10 | Who owns Firebase, push messaging, GTM, analytics, Usher and Bridge configuration? | H |
| Q11 | Who creates and maintains Android signing material? | H |
| Q12 | Who supplies branding assets, iOS Icon Composer files and Android adaptive icons? | H |
| Q13 | Who owns CT Test validation versus branded production QA? | H |

## Release management

| ID | Question | Source |
|---|---|---|
| Q14 | Is Apple unlisted distribution the default for branded apps? | H |
| Q15 | What is the approved unlisted distribution procedure? | H |
| Q16 | Who approves store listing metadata, privacy disclosures, legal terms and availability? | H |
| Q17 | What is the process when a client grants no access (client-managed submission)? Connect sends files; Carlos described pushing to the client's TestFlight, which needs some access. | H, G, R |
| Q18 | Who owns future updates to client-branded apps? | H |
| Q19 | How are releases across multiple branded clients coordinated? | H |

## Process and website

| ID | Question | Source |
|---|---|---|
| Q20 | Which system is authoritative for onboarding status: Asana, Jira or something else? | H |
| Q21 | Should this questionnaire be internal only, client-facing, or role-specific? | H |
| Q22 | Can the website link directly to approved Confluence procedures? | H |
| Q23 | What hosting, branding, security and data-handling requirements apply if the concept is approved? | H |

## Added from the client guide draft and source review

| ID | Question | Source |
|---|---|---|
| Q24 | Exactly which additional permissions does App Manager need? (Client guide draft §6 lists three, "subject to Engineering approval".) | G |
| Q25 | What role and scope should the App Store Connect API key have? | G |
| Q26 | What APNs environment and key configuration is required? | G |
| Q27 | What is the approved secure-transfer method for .p8 files? (Connect uses a Box link from the manager.) | G, R |
| Q28 | What branding and support contact details go in the final client-facing document? | G |
| Q29 | Who makes sure the client's Account Holder or account owner accepts new Apple and Google agreements after onboarding? Only they can, and releases are blocked until they do. | R |
| Q30 | `CLIENT_ORGANIZATION_CODE` is optional in the SecretSpec interface, so `secretspec check` passes without it. Should it be required for branded apps? | R |
| Q31 | Do Empyrean's terms of service cover branded apps, and is availability still limited to the US and Canada? | R |
| Q32 | What naming rules apply to branded app names? (A name containing "test" caused a problem in CT.) | R |
