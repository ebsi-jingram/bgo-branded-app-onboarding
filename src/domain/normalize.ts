import type {
  AccountStatus,
  AnswerField,
  AppleAnswers,
  DraftAnswers,
  GoogleAnswers,
  OnboardingAnswers,
  Platform,
  PlatformAnswers,
  PlatformSelection,
  Result,
  ValidationError,
} from '../types/onboarding'

type Missing = (field: AnswerField, message: string) => void

/**
 * Turns in-progress answers into complete, consistent OnboardingAnswers.
 *
 * Answers that no longer apply (e.g. Google answers after the user switched
 * to iOS only) are dropped here, so nothing downstream sees stale values.
 */
export function normalize(draft: DraftAnswers): Result<OnboardingAnswers, ValidationError[]> {
  const errors: ValidationError[] = []
  const missing: Missing = (field, message) => {
    errors.push({ field, message })
  }

  const organizationName = draft.organizationName?.trim() || undefined
  if (organizationName === undefined) missing('organizationName', "Enter your organization's name.")

  const platforms = new Set<Platform>(draft.platforms ?? [])
  if (platforms.size === 0) missing('platforms', 'Choose at least one app store.')

  const apple = platforms.has('ios')
    ? platformAnswers(draft.appleAccountStatus, draft.appleAccess, 'appleAccountStatus', 'appleAccess', missing)
    : undefined
  const google = platforms.has('android')
    ? platformAnswers(draft.googleAccountStatus, draft.googleAccess, 'googleAccountStatus', 'googleAccess', missing)
    : undefined
  const selection = selectPlatforms(platforms, apple, google)

  const { securityReview } = draft
  if (securityReview === undefined) missing('securityReview', 'Choose an answer.')

  if (errors.length > 0 || organizationName === undefined || selection === undefined || securityReview === undefined) {
    return { ok: false, error: errors }
  }
  return { ok: true, value: { ...selection, organizationName, securityReview } }
}

function platformAnswers<Access>(
  accountStatus: AccountStatus | undefined,
  access: Access | undefined,
  statusField: AnswerField,
  accessField: AnswerField,
  missing: Missing,
): PlatformAnswers<Access> | undefined {
  if (accountStatus === undefined) missing(statusField, 'Choose an answer.')
  if (access === undefined) missing(accessField, 'Choose an answer.')
  return accountStatus === undefined || access === undefined ? undefined : { accountStatus, access }
}

function selectPlatforms(
  platforms: ReadonlySet<Platform>,
  apple: AppleAnswers | undefined,
  google: GoogleAnswers | undefined,
): PlatformSelection | undefined {
  const ios = platforms.has('ios')
  const android = platforms.has('android')
  if (ios && android) return apple && google ? { apple, google } : undefined
  if (ios) return apple ? { apple, google: null } : undefined
  if (android) return google ? { apple: null, google } : undefined
  return undefined
}
