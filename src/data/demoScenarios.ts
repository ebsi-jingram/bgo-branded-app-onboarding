import type { DraftAnswers } from '../types/onboarding'

export interface DemoScenario {
  id: 'A' | 'B' | 'C' | 'D'
  title: string
  description: string
  answers: DraftAnswers
}

/** Fictional organizations only. Scenarios A–D come from the SKY-2640 handoff. */
export const DEMO_SCENARIOS: readonly DemoScenario[] = [
  {
    id: 'A',
    title: 'Existing accounts, Admin access',
    description: 'Both stores already set up; the client grants the preferred Admin access.',
    answers: {
      organizationName: 'Lakeside Manufacturing (fictional)',
      platforms: ['ios', 'android'],
      appleAccountStatus: 'active',
      appleAccess: 'admin',
      googleAccountStatus: 'active',
      googleAccess: 'account-admin',
      clientContactConfirmed: 'yes',
      securityRestrictions: 'no',
      knownBlockers: [],
    },
  },
  {
    id: 'B',
    title: 'New Apple account',
    description: 'iOS only. The client has to enroll in the Apple Developer Program first.',
    answers: {
      organizationName: 'Cedar Valley Schools (fictional)',
      platforms: ['ios'],
      appleAccountStatus: 'none',
      appleAccess: 'admin',
      clientContactConfirmed: 'yes',
      registrationContactsReady: 'yes',
      securityRestrictions: 'no',
      knownBlockers: [],
    },
  },
  {
    id: 'C',
    title: 'Mixed account status, limited access',
    description: 'Apple exists with App Manager; Google Play must be registered and will use app-level access.',
    answers: {
      organizationName: 'Harborline Logistics (fictional)',
      platforms: ['ios', 'android'],
      appleAccountStatus: 'active',
      appleAccess: 'app-manager',
      googleAccountStatus: 'none',
      googleAccess: 'app-admin',
      clientContactConfirmed: 'yes',
      registrationContactsReady: 'yes',
      securityRestrictions: 'yes',
      knownBlockers: [],
    },
  },
  {
    id: 'D',
    title: 'No Empyrean access',
    description: 'Both accounts exist, but the client will not invite Empyrean.',
    answers: {
      organizationName: 'Summit Ridge Health (fictional)',
      platforms: ['ios', 'android'],
      appleAccountStatus: 'active',
      appleAccess: 'no-access',
      googleAccountStatus: 'active',
      googleAccess: 'no-access',
      clientContactConfirmed: 'yes',
      securityRestrictions: 'no',
      knownBlockers: [],
    },
  },
]
