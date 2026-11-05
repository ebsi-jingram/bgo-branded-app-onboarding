/**
 * Domain types for the client setup walkthrough (SKY-2640).
 *
 * Flow: the UI collects DraftAnswers (anything may be missing or stale),
 * normalize() turns them into OnboardingAnswers (complete, consistent),
 * and the checklist is built only from OnboardingAnswers.
 */

export type Platform = 'ios' | 'android'

export type Tri = 'yes' | 'no' | 'unsure'

/** Client guide §1/§4/§5: an account can exist but still be awaiting store verification. */
export type AccountStatus = 'active' | 'pending-verification' | 'none' | 'unsure'

/** Client guide §6: Option A (Admin) recommended, Option B (App Manager + extra permissions). */
export type AppleAccess = 'admin' | 'app-manager' | 'needs-discussion'

/** Client guide §7: Option A (account admin) recommended, Option B (app-level admin). */
export type GoogleAccess = 'account-admin' | 'app-admin' | 'needs-discussion'

/** What the questionnaire holds while in progress. Values may be missing or left over from earlier answers. */
export interface DraftAnswers {
  organizationName?: string
  platforms?: Platform[]
  appleAccountStatus?: AccountStatus
  appleAccess?: AppleAccess
  googleAccountStatus?: AccountStatus
  googleAccess?: GoogleAccess
  /** Does the client's organization need to approve outside access before inviting Empyrean? */
  securityReview?: Tri
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
  securityReview: Tri
}

export interface ValidationError {
  field: AnswerField
  message: string
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

export type StepId = 'organization' | 'platforms' | 'apple' | 'google' | 'security'
