import type { AccountStatus, AppleAccess, GoogleAccess, Platform, Tri } from '../types/onboarding'

export interface Choice<Value extends string> {
  value: Value
  label: string
  hint?: string
}

export const PLATFORM_CHOICES: Choice<Platform>[] = [
  { value: 'ios', label: 'Apple App Store', hint: 'iPhone and iPad' },
  { value: 'android', label: 'Google Play', hint: 'Android phones and tablets' },
]

const accountStatusChoices = (store: string): Choice<AccountStatus>[] => [
  { value: 'active', label: "Yes, and it's active" },
  { value: 'pending-verification', label: `Yes, but ${store} is still verifying us` },
  { value: 'none', label: 'No, we need to create one', hint: "We'll walk you through it." },
  { value: 'unsure', label: "I'm not sure", hint: "We'll help you find out first." },
]

export const APPLE_STATUS_CHOICES = accountStatusChoices('Apple')
export const GOOGLE_STATUS_CHOICES = accountStatusChoices('Google')

export const APPLE_ACCESS_CHOICES: Choice<AppleAccess>[] = [
  { value: 'admin', label: 'Admin (recommended)', hint: 'Lets Empyrean handle submissions and updates for you. Fewest steps.' },
  {
    value: 'app-manager',
    label: 'App Manager with extra permissions',
    hint: "More limited. You'll also create two keys and send them to us.",
  },
  { value: 'needs-discussion', label: 'I need to check with my team first' },
]

export const GOOGLE_ACCESS_CHOICES: Choice<GoogleAccess>[] = [
  { value: 'account-admin', label: 'Account admin (recommended)', hint: 'Lets Empyrean handle submissions and updates for you.' },
  { value: 'app-admin', label: 'Admin for the branded app only', hint: "More limited. You'll create the app first." },
  { value: 'needs-discussion', label: 'I need to check with my team first' },
]

export const SECURITY_CHOICES: Choice<Tri>[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: "I'm not sure", hint: "We'll add a step to check." },
]
