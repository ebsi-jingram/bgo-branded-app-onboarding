# Benefits Go Branded App Setup (Preview)

> **Preview, not yet approved for client use.** An exploratory add-on to SKY-2640. The official
> deliverables are the client-facing developer account guide and the Confluence playbook. All
> example data is fictional.

A self-serve website for clients setting up a branded Benefits Go app. Instead of reading the full
setup guide, the client answers five short questions (app stores, existing accounts, the access they
can give Empyrean, approvals) and gets a personalized checklist:

- Only the steps that apply to them, in the order they can be done
- Plain instructions from the setup guide, with links to the right Apple and Google pages
- **Mark as done** checkboxes and a progress bar; later steps unlock as earlier ones are finished
- Progress saved in their browser, so they can come back later

## Run it

```bash
npm install
npm run dev     # then open the link it prints (usually http://localhost:5173)
npm test        # unit tests (Vitest)
npm run lint    # oxlint
npm run build   # type-check and production build
```

Requires Node 20 or newer.

## How it works

```
questions → DraftAnswers → normalize() → OnboardingAnswers → orderSteps(CLIENT_STEPS) → checklist
```

- `src/data/clientSteps.ts`: the client's steps, each taken from a section of the setup guide.
- `src/engine/orderSteps.ts`: picks the steps that apply and orders them by prerequisites.
- `src/checklist/`: progress rules (what's done, ready or locked) and browser storage.
- `src/questionnaire/flow.ts`: the screen flow as a pure, tested reducer.

## Limitations

- Progress is stored only in the client's browser. Empyrean can't see it, and it doesn't move between devices.
- The Empyrean invitation address and secure-transfer method aren't decided yet, so steps refer to
  "your Implementation representative".
- The setup guide itself is a draft and not yet approved for distribution.
- Theme colors are read from the Benefits Go app icon, not from an official brand guide. Confirm with Design before any real use.

See `docs/decisions.md` for design decisions and `docs/open-questions.md` for pending questions.
