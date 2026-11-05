import type { DraftAnswers } from '../types/onboarding'

export interface DemoScenario {
  id: 'A' | 'B' | 'C' | 'D'
  title: string
  description: string
  answers: DraftAnswers
}

/** Fictional organizations only. Presenter shortcuts for demos. */
export const DEMO_SCENARIOS: readonly DemoScenario[] = [
  {
    id: 'A',
    title: 'Accounts ready, Admin access',
    description: 'Both stores set up already. The shortest path.',
    answers: {
      organizationName: 'Lakeside Manufacturing (fictional)',
      platforms: ['ios', 'android'],
      appleAccountStatus: 'active',
      appleAccess: 'admin',
      googleAccountStatus: 'active',
      googleAccess: 'account-admin',
      securityReview: 'no',
    },
  },
  {
    id: 'B',
    title: 'New to Apple',
    description: 'iOS only, and the Apple Developer account still needs creating.',
    answers: {
      organizationName: 'Cedar Valley Schools (fictional)',
      platforms: ['ios'],
      appleAccountStatus: 'none',
      appleAccess: 'admin',
      securityReview: 'no',
    },
  },
  {
    id: 'C',
    title: 'Limited access, security review',
    description: 'App Manager on Apple, a new Google account with app-only access.',
    answers: {
      organizationName: 'Harborline Logistics (fictional)',
      platforms: ['ios', 'android'],
      appleAccountStatus: 'active',
      appleAccess: 'app-manager',
      googleAccountStatus: 'none',
      googleAccess: 'app-admin',
      securityReview: 'yes',
    },
  },
  {
    id: 'D',
    title: 'Still figuring things out',
    description: 'Not sure about the Apple account, and access needs a conversation.',
    answers: {
      organizationName: 'Summit Ridge Health (fictional)',
      platforms: ['ios', 'android'],
      appleAccountStatus: 'unsure',
      appleAccess: 'admin',
      googleAccountStatus: 'active',
      googleAccess: 'needs-discussion',
      securityReview: 'unsure',
    },
  },
]
