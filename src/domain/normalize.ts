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

/**
 * Turns in-progress answers into complete, consistent OnboardingAnswers.
 *
 * Answers that no longer apply (e.g. Google answers after the user switched
 * to iOS only) are dropped here, so nothing downstream sees stale values.
 */
export function normalize(draft: DraftAnswers): Result<OnboardingAnswers, ValidationError[]> {
  const errors: ValidationError[] = []
  const missing = (field: AnswerField, message: string) => {
    errors.push({ field, message })
  }

  const organizationName = draft.organizationName?.trim() || undefined
  if (organizationName === undefined) missing('organizationName', 'Enter an organization name.')

  const platforms = new Set<Platform>(draft.platforms ?? [])
  if (platforms.size === 0) missing('platforms', 'Select at least one platform.')

  const apple = platforms.has('ios')
    ? platformAnswers(draft.appleAccountStatus, draft.appleAccess, 'appleAccountStatus', 'appleAccess', 'Apple', missing)
    : undefined
  const google = platforms.has('android')
    ? platformAnswers(draft.googleAccountStatus, draft.googleAccess, 'googleAccountStatus', 'googleAccess', 'Google Play', missing)
    : undefined
  const selection = selectPlatforms(platforms, apple, google)

  const registration = registrationAnswers(draft, platforms, missing)

  const { clientContactConfirmed, securityRestrictions } = draft
  if (clientContactConfirmed === undefined) missing('clientContactConfirmed', 'Say whether a primary contact is confirmed.')
  if (securityRestrictions === undefined) missing('securityRestrictions', 'Say whether security restrictions apply.')

  const knownBlockers = draft.knownBlockers === undefined ? undefined : [...new Set(draft.knownBlockers)]
  if (knownBlockers === undefined) missing('knownBlockers', 'Select any known blockers, or "None".')

  if (
    errors.length > 0 ||
    organizationName === undefined ||
    selection === undefined ||
    registration === undefined ||
    clientContactConfirmed === undefined ||
    securityRestrictions === undefined ||
    knownBlockers === undefined
  ) {
    return { ok: false, error: errors }
  }

  return {
    ok: true,
    value: {
      ...selection,
      organizationName,
      clientContactConfirmed,
      registration,
      securityRestrictions,
      knownBlockers,
    },
  }
}

function platformAnswers<Access>(
  accountStatus: AccountStatus | undefined,
  access: Access | undefined,
  statusField: AnswerField,
  accessField: AnswerField,
  storeName: string,
  missing: (field: AnswerField, message: string) => void,
): PlatformAnswers<Access> | undefined {
  if (accountStatus === undefined) missing(statusField, `Select the ${storeName} account status.`)
  if (access === undefined) missing(accessField, `Select the ${storeName} access model.`)
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

/** Returns null when no registration is needed, undefined when the required answer is missing. */
function registrationAnswers(
  draft: DraftAnswers,
  platforms: ReadonlySet<Platform>,
  missing: (field: AnswerField, message: string) => void,
): OnboardingAnswers['registration'] | undefined {
  if (!needsRegistration(draft, platforms)) return null
  const contactsReady = draft.registrationContactsReady
  if (contactsReady === undefined) {
    missing('registrationContactsReady', 'Say whether the registration contacts are identified.')
    return undefined
  }
  return { contactsReady }
}

/** Shared with the question flow so the contacts question shows exactly when normalize() requires it. */
export function needsRegistration(draft: DraftAnswers, platforms: ReadonlySet<Platform>): boolean {
  return (
    (platforms.has('ios') && draft.appleAccountStatus === 'none') ||
    (platforms.has('android') && draft.googleAccountStatus === 'none')
  )
}
