# BGO Branded App Onboarding (Prototype)

> **Prototype, not approved process.** This is an exploratory add-on to SKY-2640. The official
> deliverables are the Confluence playbook and the client-facing developer account guide.
> Nothing here is approved company policy, and all client data is fictional.

A local web app that asks a few questions about a client's branded Benefits Go setup
(platforms, Apple and Google account status, access model, contacts, restrictions) and
generates:

1. **Intake summary:** what we know, what's unknown, and which decisions are pending.
2. **Implementation checklist:** a dependency-ordered list of tasks for this client's
   situation, each with owner, prerequisites, completion criteria, source and status.

## Run it

```bash
npm install
npm run dev     # local dev server
npm test        # unit tests (Vitest)
npm run lint    # oxlint
npm run build   # type-check and production build
```

Requires Node 20 or newer.

## How it works

```
questions (UI) → DraftAnswers → normalize() → OnboardingAnswers → generateChecklist() → results
```

- `src/types/onboarding.ts`: the domain types. Impossible states (no platform selected,
  Apple answers on an Android-only project) can't be represented.
- `src/domain/normalize.ts`: validates in-progress answers and drops answers that no longer apply.
- `src/data/procedures.ts` (M2): the playbook as typed data. Each task has a source tag and
  an approval status.
- `src/engine/` (M2): pure checklist generation with dependency ordering, parallel waves and
  Blocked states. No React.

## Source tags

| Tag | Meaning |
|---|---|
| C | Connect's established procedure |
| T | Carlos's technical guidance |
| G | SKY-2640 client-facing guide draft (not yet approved) |
| P | Proposed by this prototype; not confirmed by anyone |
| Q | Depends on a pending decision in `docs/open-questions.md` |

## Limitations

- Intake only: tasks are shown as Planned or Blocked. There is no progress tracking.
- No backend, accounts, uploads, integrations or hosting.
- Never collects credentials, signing material, personal details or identity documents.
- SecretSpec field names come from an Oct 29 draft and have not been verified against the brands repo.
- Colors and branding (M5) are approximate placeholders, not official BGO brand assets.

See `docs/decisions.md` for design decisions and `docs/open-questions.md` for pending stakeholder questions.
