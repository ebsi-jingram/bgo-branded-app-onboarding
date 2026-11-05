/**
 * Domain types for the branded-app onboarding prototype (SKY-2640).
 *
 * Flow: the UI collects DraftAnswers (anything may be missing or stale),
 * normalize() turns them into OnboardingAnswers (complete, consistent),
 * and the checklist engine consumes only OnboardingAnswers.
 */

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

export type Platform = 'ios' | 'android'

export type Tri = 'yes' | 'no' | 'unsure'

/** Client guide §1/§4/§5: an account can exist but still be awaiting store verification. */
export type AccountStatus = 'active' | 'pending-verification' | 'none' | 'unsure'

/** Client guide §6: Option A (Admin) preferred, Option B (App Manager + extra permissions). */
export type AppleAccess = 'admin' | 'app-manager' | 'no-access' | 'undecided'

/** Client guide §7: Option A (account admin) preferred, Option B (app-level admin). */
export type GoogleAccess = 'account-admin' | 'app-admin' | 'no-access' | 'undecided'

/** Categories only. The prototype never collects free-text details about a client. */
export type BlockerCategory =
  | 'duns-number'
  | 'organization-verification'
  | 'internal-approvals'
  | 'existing-account-conflict'
  | 'other'

/** What the questionnaire holds while in progress. Values may be missing or left over from earlier answers. */
export interface DraftAnswers {
  organizationName?: string
  platforms?: Platform[]
  appleAccountStatus?: AccountStatus
  appleAccess?: AppleAccess
  googleAccountStatus?: AccountStatus
  googleAccess?: GoogleAccess
  /** Has the client named a primary contact for the onboarding? */
  clientContactConfirmed?: Tri
  /** Only asked when an account must be registered (client guide §3). */
  registrationContactsReady?: Tri
  securityRestrictions?: Tri
  knownBlockers?: BlockerCategory[]
}

export type AnswerField = keyof DraftAnswers

export interface PlatformAnswers<Access> {
  accountStatus: AccountStatus
  access: Access
}

export type AppleAnswers = PlatformAnswers<AppleAccess>
export type GoogleAnswers = PlatformAnswers<GoogleAccess>

/** At least one platform is always selected; "neither" is not representable. */
export type PlatformSelection =
  | { apple: AppleAnswers; google: null }
  | { apple: null; google: GoogleAnswers }
  | { apple: AppleAnswers; google: GoogleAnswers }

/** Complete, consistent answers. Produced only by normalize(). */
export type OnboardingAnswers = PlatformSelection & {
  organizationName: string
  clientContactConfirmed: Tri
  /** Present only when a selected platform has accountStatus "none". */
  registration: { contactsReady: Tri } | null
  securityRestrictions: Tri
  knownBlockers: readonly BlockerCategory[]
}

export interface ValidationError {
  field: AnswerField
  message: string
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

// ---------------------------------------------------------------------------
// Sources and stakeholder questions
// ---------------------------------------------------------------------------

/**
 * C = Connect's established procedure (Connect PDF / Confluence page)
 * T = Carlos's technical guidance (Oct 13 walkthrough, Nov 3 doc review)
 * G = SKY-2640 client-facing guide draft (Nov 5; not approved for distribution)
 * P = proposed by this prototype; nobody has confirmed it
 * Q = depends on a pending stakeholder decision
 */
export type SourceTag = 'C' | 'T' | 'G' | 'P' | 'Q'

export interface SourceRef {
  tag: SourceTag
  /** Where it comes from, e.g. "Carlos, Nov 3 doc review". No quotes of internal material. */
  note: string
}

/** IDs match docs/open-questions.md. Add a new ID there first, then here. */
export type StakeholderQuestionId =
  | 'Q01' | 'Q02' | 'Q03' | 'Q04' | 'Q05' | 'Q06' | 'Q07' | 'Q08'
  | 'Q09' | 'Q10' | 'Q11' | 'Q12' | 'Q13' | 'Q14' | 'Q15' | 'Q16'
  | 'Q17' | 'Q18' | 'Q19' | 'Q20' | 'Q21' | 'Q22' | 'Q23' | 'Q24'
  | 'Q25' | 'Q26' | 'Q27' | 'Q28' | 'Q29' | 'Q30' | 'Q31' | 'Q32'

// ---------------------------------------------------------------------------
// Procedures (the playbook as data) and the generated checklist
// ---------------------------------------------------------------------------

export type PhaseId = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09'

/** "tbc" = ownership not yet confirmed (see docs/open-questions.md Q07, Q09–Q13). */
export type OwnerRole =
  | 'client'
  | 'client-account-holder'
  | 'implementation'
  | 'engineering'
  | 'app-support'
  | 'design'
  | 'tbc'

/** Nothing in this prototype is approved company process. */
export type ApprovalStatus = 'not-approved' | 'pending-review'

export type BlockReason<Id extends string> =
  | { kind: 'open-question'; id: StakeholderQuestionId }
  | { kind: 'unknown-answer'; field: AnswerField }
  | { kind: 'upstream'; id: Id }

export interface Prerequisite<Id extends string> {
  id: Id
  /** Omitted = always applies. Edges to tasks that don't apply are dropped by the engine. */
  when?: (answers: OnboardingAnswers) => boolean
}

/**
 * Generic over the ID union so the registry can define its IDs as a literal
 * union; a misspelled prerequisite ID then fails to compile.
 */
export interface Procedure<Id extends string = string> {
  id: Id
  /** Step number in the playbook outline, e.g. "03.05". */
  playbookStep: string
  title: string
  summary: string
  /** "client" tasks mirror the client-facing guide; "internal" tasks stay inside Empyrean. */
  audience: 'client' | 'internal'
  phase: PhaseId
  platform: Platform | 'shared'
  owner: OwnerRole
  sources: readonly [SourceRef, ...SourceRef[]]
  approval: ApprovalStatus
  appliesWhen: (answers: OnboardingAnswers) => boolean
  /** Reasons this task can't start yet for these answers. The engine adds upstream blocks. */
  blockers?: (answers: OnboardingAnswers) => readonly BlockReason<Id>[]
  prerequisites: readonly Prerequisite<Id>[]
  inputs: readonly string[]
  outputs: readonly string[]
  completionCriteria: string
  /** Only verified URLs. Otherwise a title with no URL. */
  referenceDoc?: { title: string; url?: string }
  openQuestions?: readonly StakeholderQuestionId[]
  /** SecretSpec field names, taken from the Oct 29 draft. Not yet verified against brands/specs/. */
  producesFields?: readonly string[]
}

/** V1 is intake only: tasks are Planned or Blocked, never Ready or Completed. */
export type TaskState<Id extends string> =
  | { kind: 'planned' }
  | { kind: 'blocked'; reasons: readonly [BlockReason<Id>, ...BlockReason<Id>[]] }

export interface GeneratedTask<Id extends string = string> {
  procedure: Procedure<Id>
  /** 1-based position in the dependency-ordered list. */
  order: number
  /** Tasks in the same wave have no dependency on each other and can run in parallel. */
  wave: number
  state: TaskState<Id>
}

export type ChecklistError<Id extends string = string> =
  | { kind: 'duplicate-id'; id: Id }
  | { kind: 'unknown-prerequisite'; task: Id; missing: string }
  | { kind: 'cycle'; path: readonly Id[] }

// ---------------------------------------------------------------------------
// UI state machine
// ---------------------------------------------------------------------------

export type StepId =
  | 'organization'
  | 'platforms'
  | 'apple'
  | 'google'
  | 'contacts'
  | 'restrictions'
  | 'blockers'

/** Exactly one screen at a time; no combination of boolean flags. */
export type Screen =
  | { kind: 'welcome' }
  | { kind: 'question'; step: StepId; draft: DraftAnswers }
  | { kind: 'review'; draft: DraftAnswers }
  | { kind: 'results'; answers: OnboardingAnswers }
