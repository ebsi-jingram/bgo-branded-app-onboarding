import { describe, expect, it } from 'vitest'
import openQuestionsDoc from '../../docs/open-questions.md?raw'
import { validateRegistry } from '../engine/generateChecklist'
import type { AccountStatus, AppleAccess, BlockerCategory, GoogleAccess, OnboardingAnswers, Tri } from '../types/onboarding'
import { PROCEDURE_IDS, PROCEDURES, type ProcedureId } from './procedures'
import { checklistFor } from './testSupport'

/** Field names from the Oct 29 draft. A procedure may only claim one of these until the repo is checked. */
const DRAFT_FIELDS = new Set([
  'IOS_DISPLAY_NAME', 'IOS_BUNDLE_ID', 'APPLE_ID',
  'APPLE_APP_STORE_CONNECT_ISSUER_ID', 'APPLE_APP_STORE_CONNECT_KEY_ID', 'APPLE_APP_STORE_CONNECT_KEY',
  'ANDROID_DISPLAY_NAME', 'ANDROID_BUNDLE_ID',
  'ANDROID_KEYSTORE', 'ANDROID_KEYSTORE_KEY_ALIAS', 'ANDROID_KEYSTORE_KEY_PASSWORD', 'ANDROID_KEYSTORE_PASSWORD',
  'GOOGLE_PLAY_API_KEY', 'AUTH0_DOMAIN', 'AUTH0_AUDIENCE', 'AUTH0_CLIENT_ID', 'AUTH0_SCHEME',
  'CLIENT_ORGANIZATION_CODE', 'ENV', 'EBSI_ENV', 'BRANDS_REPO',
])
const DRAFT_RESOURCES = new Set(['GoogleService-Info.plist', 'google-services.json', 'google_tag_manager_workspace.json'])

describe('procedure registry', () => {
  it('has exactly one procedure per declared ID', () => {
    expect(PROCEDURES.map((p) => p.id).sort()).toEqual([...PROCEDURE_IDS].sort())
  })

  it('passes registry validation', () => {
    expect(validateRegistry(PROCEDURES)).toEqual([])
  })

  it('links only to open questions that exist in docs/open-questions.md', () => {
    const documented = new Set(openQuestionsDoc.match(/^\| (Q\d\d) \|/gm)?.map((row) => row.slice(2, 5)))
    const linked = PROCEDURES.flatMap((p) => p.openQuestions ?? [])
    expect(linked.filter((id) => !documented.has(id))).toEqual([])
  })

  it('claims only field and resource names from the draft list', () => {
    expect(PROCEDURES.flatMap((p) => p.producesFields ?? []).filter((f) => !DRAFT_FIELDS.has(f))).toEqual([])
    expect(PROCEDURES.flatMap((p) => p.producesResources ?? []).filter((f) => !DRAFT_RESOURCES.has(f))).toEqual([])
  })

  it('marks nothing as approved', () => {
    expect(PROCEDURES.filter((p) => !['not-approved', 'pending-review'].includes(p.approval))).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Every combination of answers
// ---------------------------------------------------------------------------

const STATUSES: AccountStatus[] = ['active', 'pending-verification', 'none', 'unsure']
const APPLE_ACCESS: AppleAccess[] = ['admin', 'app-manager', 'no-access', 'undecided']
const GOOGLE_ACCESS: GoogleAccess[] = ['account-admin', 'app-admin', 'no-access', 'undecided']
const TRI: Tri[] = ['yes', 'no', 'unsure']
const BLOCKER_SETS: BlockerCategory[][] = [[], ['duns-number', 'organization-verification', 'internal-approvals', 'existing-account-conflict', 'other']]

function* allAnswers(): Generator<OnboardingAnswers> {
  const appleOptions = STATUSES.flatMap((accountStatus) => APPLE_ACCESS.map((access) => ({ accountStatus, access })))
  const googleOptions = STATUSES.flatMap((accountStatus) => GOOGLE_ACCESS.map((access) => ({ accountStatus, access })))
  const selections = [
    ...appleOptions.map((apple) => ({ apple, google: null })),
    ...googleOptions.map((google) => ({ apple: null, google })),
    ...appleOptions.flatMap((apple) => googleOptions.map((google) => ({ apple, google }))),
  ]
  for (const selection of selections) {
    const needsRegistration = selection.apple?.accountStatus === 'none' || selection.google?.accountStatus === 'none'
    const registrations = needsRegistration ? TRI.map((contactsReady) => ({ contactsReady })) : [null]
    for (const registration of registrations)
      for (const clientContactConfirmed of TRI)
        for (const securityRestrictions of TRI)
          for (const knownBlockers of BLOCKER_SETS)
            yield {
              ...selection,
              organizationName: 'Exhaustive Test Org (fictional)',
              registration,
              clientContactConfirmed,
              securityRestrictions,
              knownBlockers,
            } as OnboardingAnswers
  }
}

/** With every answer known and no blockers, only these may be blocked (unlisted procedure undefined, Q15). */
const BLOCKED_ON_HAPPY_PATH = new Set<ProcedureId>([
  'apple-unlisted-distribution',
  'ios-launch-verify',
  'apple-agreement-acceptance',
  'future-releases',
])

describe('every combination of answers', () => {
  it('produces a valid, consistent checklist', () => {
    let combinations = 0
    const violations: string[] = []
    for (const answers of allAnswers()) {
      combinations++
      const tasks = checklistFor(answers)
      const byId = new Map(tasks.map((t) => [t.procedure.id, t]))
      const fail = (message: string) => violations.push(`${message} | ${JSON.stringify(answers)}`)

      for (const t of tasks) {
        const id = t.procedure.id
        // Platform-specific tasks only for selected platforms.
        if (t.procedure.platform === 'ios' && answers.apple === null) fail(`${id} is iOS-only`)
        if (t.procedure.platform === 'android' && answers.google === null) fail(`${id} is Android-only`)

        // Every task except the first is anchored, so an unconfirmed contact blocks the whole plan
        // (catches tasks whose prerequisites were all dropped for these answers).
        if (id !== 'start-implementation' && t.prerequisites.length === 0) fail(`${id} has no prerequisites`)

        // Prerequisites come first and waves increase.
        for (const pre of t.prerequisites) {
          const prerequisite = byId.get(pre)
          if (prerequisite === undefined) fail(`${id} needs missing ${pre}`)
          else if (prerequisite.order >= t.order || prerequisite.wave >= t.wave) fail(`${pre} not before ${id}`)
        }

        // A blocked prerequisite always blocks its dependents.
        if (t.prerequisites.some((pre) => byId.get(pre)?.state.kind === 'blocked') && t.state.kind !== 'blocked') {
          fail(`${id} should be blocked`)
        }

        if (t.owners.length === 0) fail(`${id} has no owner`)
      }

      const happyPath =
        answers.clientContactConfirmed === 'yes' &&
        answers.securityRestrictions !== 'unsure' &&
        answers.knownBlockers.length === 0 &&
        (answers.registration === null || answers.registration.contactsReady === 'yes') &&
        (answers.apple === null || (answers.apple.accountStatus !== 'unsure' && ['admin', 'app-manager'].includes(answers.apple.access))) &&
        (answers.google === null || (answers.google.accountStatus !== 'unsure' && ['account-admin', 'app-admin'].includes(answers.google.access)))
      if (happyPath) {
        for (const t of tasks) {
          if (t.state.kind === 'blocked' && !BLOCKED_ON_HAPPY_PATH.has(t.procedure.id)) fail(`${t.procedure.id} blocked on happy path`)
        }
      }
    }
    expect(violations.slice(0, 20)).toEqual([])
    // 288 platform/status/access selections × contacts × security × registration × blocker sets.
    // If this changes, an answer option was added or removed: check the new combinations are intended.
    expect(combinations).toBe(9504)
  })
})
