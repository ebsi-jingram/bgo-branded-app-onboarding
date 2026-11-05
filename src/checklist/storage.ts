/**
 * Saves the client's answers and checked steps in this browser only, so a
 * refresh or a later visit picks up where they left off. Nothing is sent
 * anywhere. Storage can be unavailable (private mode, blocked site data), so
 * every access is guarded and the app works without it.
 */
import { CLIENT_STEP_IDS, type ClientStepId } from '../data/clientSteps'
import type { AccountStatus, AppleAccess, DraftAnswers, GoogleAccess, Platform, Tri } from '../types/onboarding'

const KEY = 'bgo-branded-app-setup-v1'

export interface Saved {
  draft: DraftAnswers
  done: ClientStepId[]
}

type Reader = Pick<Storage, 'getItem'>
type Writer = Pick<Storage, 'setItem' | 'removeItem'>

export function loadSaved(storage: Reader): Saved | null {
  try {
    const raw = storage.getItem(KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    return { draft: parseDraft(parsed.draft), done: parseDone(parsed.done) }
  } catch {
    return null
  }
}

export function save(storage: Writer, saved: Saved | null): void {
  try {
    if (saved === null) storage.removeItem(KEY)
    else storage.setItem(KEY, JSON.stringify(saved))
  } catch {
    // Storage unavailable: progress just isn't remembered.
  }
}

/** Saved data could have been edited or come from an older version, so check every value. */
function parseDraft(value: unknown): DraftAnswers {
  if (!isRecord(value)) return {}
  const draft: DraftAnswers = {}
  if (typeof value.organizationName === 'string') draft.organizationName = value.organizationName
  if (Array.isArray(value.platforms)) draft.platforms = value.platforms.filter((p): p is Platform => oneOf(p, PLATFORMS))
  if (oneOf(value.appleAccountStatus, STATUSES)) draft.appleAccountStatus = value.appleAccountStatus
  if (oneOf(value.appleAccess, APPLE_ACCESS)) draft.appleAccess = value.appleAccess
  if (oneOf(value.googleAccountStatus, STATUSES)) draft.googleAccountStatus = value.googleAccountStatus
  if (oneOf(value.googleAccess, GOOGLE_ACCESS)) draft.googleAccess = value.googleAccess
  if (oneOf(value.securityReview, TRI)) draft.securityReview = value.securityReview
  return draft
}

function parseDone(value: unknown): ClientStepId[] {
  return Array.isArray(value) ? value.filter((id): id is ClientStepId => oneOf(id, CLIENT_STEP_IDS)) : []
}

const PLATFORMS: readonly Platform[] = ['ios', 'android']
const STATUSES: readonly AccountStatus[] = ['active', 'pending-verification', 'none', 'unsure']
const APPLE_ACCESS: readonly AppleAccess[] = ['admin', 'app-manager', 'needs-discussion']
const GOOGLE_ACCESS: readonly GoogleAccess[] = ['account-admin', 'app-admin', 'needs-discussion']
const TRI: readonly Tri[] = ['yes', 'no', 'unsure']

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
