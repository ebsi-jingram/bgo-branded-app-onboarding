import type { AccountStatus, AppleAccess, BlockerCategory, GoogleAccess, Platform, Tri } from '../types/onboarding'

export interface Choice<Value extends string> {
  value: Value
  label: string
  hint?: string
}

export const PLATFORM_CHOICES: Choice<Platform>[] = [
  { value: 'ios', label: 'iOS (App Store)' },
  { value: 'android', label: 'Android (Google Play)' },
]

const accountStatusChoices = (store: string): Choice<AccountStatus>[] => [
  { value: 'active', label: 'Yes, active and verified' },
  { value: 'pending-verification', label: `Registered, but ${store} verification isn't finished` },
  { value: 'none', label: 'No, one needs to be created' },
  { value: 'unsure', label: "Not sure", hint: 'The client checks with their IT team first.' },
]

export const APPLE_STATUS_CHOICES = accountStatusChoices('Apple')
export const GOOGLE_STATUS_CHOICES = accountStatusChoices('Google')

export const APPLE_ACCESS_CHOICES: Choice<AppleAccess>[] = [
  { value: 'admin', label: 'Admin', hint: 'Preferred in the guide draft.' },
  { value: 'app-manager', label: 'App Manager with extra permissions', hint: 'The client then creates the API and push keys.' },
  { value: 'no-access', label: 'No access for Empyrean', hint: 'Needs an exception. No process is defined yet.' },
  { value: 'undecided', label: 'Not decided yet' },
]

export const GOOGLE_ACCESS_CHOICES: Choice<GoogleAccess>[] = [
  { value: 'account-admin', label: 'Account admin', hint: 'Preferred in the guide draft.' },
  { value: 'app-admin', label: 'Admin for the branded app only', hint: 'The client creates the app first.' },
  { value: 'no-access', label: 'No access for Empyrean', hint: 'Needs an exception. No process is defined yet.' },
  { value: 'undecided', label: 'Not decided yet' },
]

export const TRI_CHOICES: Choice<Tri>[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
]

export const BLOCKER_CHOICES: Choice<BlockerCategory>[] = [
  { value: 'duns-number', label: 'No D-U-N-S number yet' },
  { value: 'organization-verification', label: 'Organization verification problems' },
  { value: 'internal-approvals', label: 'Internal approvals needed before inviting Empyrean' },
  { value: 'existing-account-conflict', label: 'Unclear who owns an existing account' },
  { value: 'other', label: 'Something else' },
]
