# Decisions

Newest first. Each entry says what was decided, why, and what was rejected.

## 2026-11-05: Client-facing, self-serve setup walkthrough
- **Decision (Jacques):** the site is for clients, not for Empyrean staff. Sales can point clients to it:
  "instead of reading the documentation, this walks you through everything". Clients answer five short
  questions, then get only their own steps from the client guide, in order, with checkboxes and a
  progress bar.
- **Removed:** the internal 63-step implementation plan, its engine and results view (commits up to
  `c262e91` have them). The internal process is documented in the Confluence playbook; duplicating it
  here added scope without helping clients.
- **Reverses "V1 is intake only":** clients can now mark steps done. A checkmark means "the client says
  it's done", not "Empyrean verified it"; verification stays with Empyrean (client guide §9).
- **Progress is saved in the client's browser only.** Nothing is sent anywhere. Letting Empyrean see a
  client's progress needs accounts, a server and hosting (Q23), and is out of scope for the preview.
- **Steps unlock in order:** a step can't be checked until its prerequisites are; un-checking a step
  also un-checks steps that depend on it; changing an answer keeps only progress that still makes sense.
- **Guards in tests:** client-facing text may not mention internal names (Connect, Jira, SecretSpec,
  team members, open-question IDs), and links may only point to official Apple and Google pages.
- **Pending (Q21):** whether clients should use this at all is a stakeholder decision. The banner says
  "Preview, not yet approved for client use".
- **Followed the guide where it was silent:** App Store Connect API access is only a client step under
  App Manager. The guide's §8 is "only if requested", so the Admin path doesn't ask for it (see Q25).

## 2026-11-05: Checklist engine rules (M2)
- **Prerequisites that don't apply are dropped, not bridged.** Each procedure lists every
  prerequisite it really needs, so a reader can see a task's dependencies in one place.
  *Rejected:* bridging through skipped tasks. It quietly added unrelated dependencies (e.g. Apple
  steps waiting on Google registration).
- **Every task except the first always keeps at least one prerequisite.** Found during M2: when all
  of a task's prerequisites were dropped, it floated free and stayed Planned even when the whole plan
  should be blocked. The every-combination test now checks this for all 9,504 answer combinations.
- **Cycles are checked on the graph that applies to the answers.** Google app-level access reverses
  the order of the Play app and the invitation, so the full registry legitimately has mutually
  exclusive edges in both directions.
- **Only two open questions block tasks: Q17 (no-access exception) and Q15 (unlisted distribution).**
  For those, no procedure exists at all. Other open questions are shown on the task but don't block,
  because the work can start under current practice.
- **Reported blocker categories map to tasks** [P]: D-U-N-S and organization verification block
  enrollment; internal approvals and an existing-account conflict block invitations. "Other" only
  appears in the intake summary.

## 2026-11-05: V1 is intake only
- **Decision:** the questionnaire describes the client's situation and generates a plan. It doesn't
  track progress. Tasks are Planned or Blocked only.
- **Why:** the client guide draft suggests status questions ("invitations sent?", "Engineering
  verified?", "credentials delivered?"). Those turn the tool into a tracker that needs a Completed
  state and saved progress. That's out of scope for the first demo.
- **Revisit:** if the prototype is approved, as a separate phase (see Q20 on which system owns status).

## 2026-11-05: Derive, don't ask, whether client-generated Apple credentials are needed
- **Decision:** whether the client must create the App Store Connect API key and APNs key follows
  from the Apple access model. It isn't a separate question.
- **Why:** App Manager can't create API keys (Carlos, Oct 13 and Nov 3; Connect PDF), so App Manager
  always means the client creates the keys. Asking separately would allow contradictory answers.
- **Note:** under Admin, the Account Holder still has to enable API access once (client guide draft §8).

## 2026-11-05: Procedures carry an audience
- **Decision:** each procedure is `client` or `internal`.
- **Why:** the client guide draft asks for internal engineering detail to stay out of client-facing
  content. The results page can show the client's checklist separately from Empyrean's.

## 2026-11-05: Account status includes "verification pending"
- **Why:** the client guide separates "account exists" from "account active and verified" (§4, §5, §9).

## 2026-11-05: Tooling follows the current official Vite template
- **Decision:** keep the template's oxlint (not ESLint) and TypeScript 7. Vitest is the only added dependency.
- **Why:** these are the template defaults as of create-vite 9.3.4. Swapping them would add config for no gain.

## 2026-11-03: Own typed question flow, no form library
- **Decision:** React + TypeScript + Vite with typed questions and typed checklist rules in one system.
- **Rejected:** SurveyJS and react-jsonschema-form (they keep question conditions in their own
  expression language, separate from the checklist rules, so the two can drift); forking
  Udaykalse/multistep-form (no LICENSE file, one commit, type errors, fixed index-based steps);
  formkitcn (Next.js, about 51 dependencies).
- **Revisit:** if non-developers need to edit the questions, a form library can sit on top of the
  same engine.

## 2026-11-03: Engine and UI shape
- `generateChecklist(answers)` is a pure function: topological sort with a stable playbook-order
  tie-break, parallel waves, cycle and unknown-ID errors, and conditional prerequisites.
  Prerequisite edges to tasks that don't apply are dropped.
- A task is Blocked if it has its own blocker (unknown answer, pending decision) or any upstream task is Blocked.
- UI is a discriminated-union state machine (`Screen`), not boolean flags.
- `normalize()` turns draft answers into a complete type, so the engine never null-checks answers.
- Cross-platform steps are split per platform (e.g. `-ios` / `-android`), because Apple and Google
  progress independently.

## 2026-11-03: Data handling
- Fictional data only. No secrets, personal details or identity documents.
- The Connect email template collects a client's date of birth. This prototype won't.
