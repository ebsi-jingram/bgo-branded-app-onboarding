/**
 * The client's own setup steps, taken from the SKY-2640 client-facing guide
 * draft (not yet approved for distribution). Each step names the guide section
 * it comes from. Internal Empyrean work is not here; it lives in the
 * Confluence playbook.
 *
 * Placeholders: the Empyrean invitation email and the secure-transfer method
 * are not decided yet (docs/open-questions.md Q03, Q27), so steps refer to
 * "your Implementation representative" instead of inventing them.
 */
import type { Prerequisite, StepNode } from '../engine/orderSteps'
import type { AccountStatus, AppleAccess, GoogleAccess, OnboardingAnswers, Platform } from '../types/onboarding'

export const CLIENT_STEP_IDS = [
  'check-apple-account',
  'check-google-account',
  'discuss-apple-access',
  'discuss-google-access',
  'prepare-registration',
  'enroll-apple',
  'finish-apple-verification',
  'register-google',
  'finish-google-verification',
  'security-review',
  'invite-apple-admin',
  'invite-apple-app-manager',
  'enable-apple-api-access',
  'create-apple-api-key',
  'create-apns-key',
  'send-apple-keys',
  'create-google-app',
  'invite-google-account-admin',
  'invite-google-app-admin',
  'notify-representative',
] as const

export type ClientStepId = (typeof CLIENT_STEP_IDS)[number]

export interface Link {
  label: string
  url: string
}

export interface ClientStep extends StepNode<ClientStepId, OnboardingAnswers> {
  id: ClientStepId
  title: string
  /** One sentence on why this step matters. */
  why: string
  /** Who at the client's organization does it. */
  who: string
  platform: Platform | 'both'
  /** Section of the client guide this step comes from. */
  guideSection: string
  instructions: readonly string[]
  links?: readonly Link[]
  /** A warning shown in a highlighted box. */
  important?: string
}

// ---------------------------------------------------------------------------
// Answer conditions
// ---------------------------------------------------------------------------

type A = OnboardingAnswers

const appleStatusIs = (...statuses: AccountStatus[]) => (a: A) =>
  a.apple !== null && statuses.includes(a.apple.accountStatus)
const googleStatusIs = (...statuses: AccountStatus[]) => (a: A) =>
  a.google !== null && statuses.includes(a.google.accountStatus)

/** Account exists or is being created, so access steps make sense. */
const appleKnown = appleStatusIs('active', 'pending-verification', 'none')
const googleKnown = googleStatusIs('active', 'pending-verification', 'none')

const appleAccessIs = (...models: AppleAccess[]) => (a: A) =>
  a.apple !== null && appleKnown(a) && models.includes(a.apple.access)
const googleAccessIs = (...models: GoogleAccess[]) => (a: A) =>
  a.google !== null && googleKnown(a) && models.includes(a.google.access)

const needsRegistration = (a: A) => appleStatusIs('none')(a) || googleStatusIs('none')(a)
const always = () => true

/** Steps that must be finished before Empyrean is invited to an Apple account. */
const beforeAppleInvite: Prerequisite<ClientStepId, A>[] = [
  { id: 'enroll-apple' },
  { id: 'finish-apple-verification' },
  { id: 'security-review' },
]
const beforeGoogleInvite: Prerequisite<ClientStepId, A>[] = [
  { id: 'register-google' },
  { id: 'finish-google-verification' },
  { id: 'security-review' },
]

const EMPYREAN_ADDRESS = "the Empyrean name and email address your Implementation representative gives you"

const APP_STORE_CONNECT: Link = { label: 'App Store Connect', url: 'https://appstoreconnect.apple.com/' }
const APPLE_DEVELOPER_ACCOUNT: Link = { label: 'Apple Developer account', url: 'https://developer.apple.com/account/' }
const PLAY_CONSOLE: Link = { label: 'Google Play Console', url: 'https://play.google.com/console/' }

// ---------------------------------------------------------------------------
// Steps, in the order they're usually done (used to break ties)
// ---------------------------------------------------------------------------

export const CLIENT_STEPS: readonly ClientStep[] = [
  {
    id: 'check-apple-account',
    title: 'Find out whether you already have an Apple Developer account',
    why: 'Creating a second account by mistake causes delays and confusion later.',
    who: 'You, with your IT team',
    platform: 'ios',
    guideSection: '§1',
    instructions: [
      'Ask your IT team whether your organization already has an Apple Developer account.',
      'If it does, find out who the Account Holder is.',
      'Then choose "Change my answers" below and update your answer. Your checklist will update to match.',
    ],
    appliesWhen: appleStatusIs('unsure'),
    prerequisites: [],
  },
  {
    id: 'check-google-account',
    title: 'Find out whether you already have a Google Play developer account',
    why: 'Creating a second account by mistake causes delays and confusion later.',
    who: 'You, with your IT team',
    platform: 'android',
    guideSection: '§1',
    instructions: [
      'Ask your IT team whether your organization already has a Google Play developer account.',
      'If it does, find out who owns it.',
      'Then choose "Change my answers" below and update your answer. Your checklist will update to match.',
    ],
    appliesWhen: googleStatusIs('unsure'),
    prerequisites: [],
  },
  {
    id: 'discuss-apple-access',
    title: 'Talk to your Implementation representative about Apple access',
    why: 'We recommend Admin access, but there are alternatives if your policies require them.',
    who: 'You',
    platform: 'ios',
    guideSection: '§2, §10',
    instructions: [
      'Contact your Empyrean Implementation representative before inviting anyone.',
      'Share any security policies that limit the access you can give an outside company.',
      'Once you have agreed on an access option, choose "Change my answers" below and update your answer.',
    ],
    appliesWhen: (a) => a.apple?.access === 'needs-discussion',
    prerequisites: [],
  },
  {
    id: 'discuss-google-access',
    title: 'Talk to your Implementation representative about Google Play access',
    why: 'We recommend account admin access, but there are alternatives if your policies require them.',
    who: 'You',
    platform: 'android',
    guideSection: '§2, §10',
    instructions: [
      'Contact your Empyrean Implementation representative before inviting anyone.',
      'Share any security policies that limit the access you can give an outside company.',
      'Once you have agreed on an access option, choose "Change my answers" below and update your answer.',
    ],
    appliesWhen: (a) => a.google?.access === 'needs-discussion',
    prerequisites: [],
  },
  {
    id: 'prepare-registration',
    title: 'Gather your contacts and company details',
    why: 'Apple and Google ask for these when you register, and verification is quicker when they are ready.',
    who: 'You',
    platform: 'both',
    guideSection: '§3',
    instructions: [
      'Choose a primary account contact who is authorized to act for your organization. Note their full name, job title, company email and phone number.',
      'Choose a separate verification contact who can confirm the primary contact\'s authority. Note the same details.',
      'Gather your legal business name, corporate address and phone number, and company website.',
      'Find your D-U-N-S number, if you have one.',
    ],
    important:
      'Send identity or verification documents only through Apple\'s or Google\'s own process, never by ordinary email to Empyrean.',
    appliesWhen: needsRegistration,
    prerequisites: [],
  },
  {
    id: 'enroll-apple',
    title: 'Enroll in the Apple Developer Program',
    why: 'Your organization owns the account, and your company name appears as the seller on the App Store.',
    who: 'Your authorized representative, who becomes the Account Holder',
    platform: 'ios',
    guideSection: '§4',
    instructions: [
      'Sign in with the representative\'s Apple Account. Two-factor authentication must be turned on.',
      'Start enrollment and choose Organization as the entity type.',
      'Enter your legal business information and D-U-N-S number, and add a verification contact if asked.',
      'Respond to any verification requests from Apple.',
      'Once approved, accept the program agreement and complete the membership purchase if applicable ($99 USD a year; regional pricing and fee waivers may apply).',
      'Confirm that your membership shows as active.',
    ],
    links: [{ label: 'Apple Developer Program enrollment', url: 'https://developer.apple.com/programs/enroll/' }, APPLE_DEVELOPER_ACCOUNT],
    appliesWhen: appleStatusIs('none'),
    prerequisites: [{ id: 'prepare-registration' }],
  },
  {
    id: 'finish-apple-verification',
    title: 'Finish Apple\'s verification',
    why: 'Empyrean can only be invited once your membership is active.',
    who: 'Your Account Holder',
    platform: 'ios',
    guideSection: '§4, step 3',
    instructions: [
      'Respond to any verification requests from Apple.',
      'Once approved, accept the program agreement and complete the membership purchase if applicable.',
      'Confirm that your membership shows as active.',
    ],
    links: [APPLE_DEVELOPER_ACCOUNT],
    appliesWhen: appleStatusIs('pending-verification'),
    prerequisites: [],
  },
  {
    id: 'register-google',
    title: 'Register a Google Play developer account',
    why: 'Your organization owns the account and publishes the app under its own name.',
    who: 'Your authorized representative',
    platform: 'android',
    guideSection: '§5',
    instructions: [
      'Sign in with a Google Account managed by your organization.',
      'Choose Organization as the account type and accept the Google Play Developer Distribution Agreement.',
      'Enter your legal business information and D-U-N-S number, create or choose a payments profile, and add your website and contact details.',
      'Pay the $25 USD one-time registration fee.',
      'Complete Google\'s organization and identity verification, and submit any documents requested.',
      'Confirm the account is active and verification is complete.',
    ],
    links: [{ label: 'Google Play Console sign-up', url: 'https://play.google.com/console/signup' }],
    appliesWhen: googleStatusIs('none'),
    prerequisites: [{ id: 'prepare-registration' }],
  },
  {
    id: 'finish-google-verification',
    title: 'Finish Google\'s verification',
    why: 'Empyrean can only be invited once your account is active.',
    who: 'Your account owner',
    platform: 'android',
    guideSection: '§5, step 3',
    instructions: [
      'Complete Google\'s organization and identity verification, and submit any documents requested.',
      'Confirm the account is active and verification is complete.',
    ],
    links: [PLAY_CONSOLE],
    appliesWhen: googleStatusIs('pending-verification'),
    prerequisites: [],
  },
  {
    id: 'security-review',
    title: 'Get approval to invite Empyrean',
    why: 'Some organizations must approve outside access before anyone sends an invitation.',
    who: 'You, with your security or IT team',
    platform: 'both',
    guideSection: '§2, §10',
    instructions: [
      'Ask your security or IT team whether outside users need approval before they are invited.',
      'If they do, share the access you plan to give Empyrean (shown in the next steps) and get it approved.',
      'If the requested access isn\'t allowed, contact your Implementation representative before inviting anyone.',
    ],
    appliesWhen: (a) => a.securityReview !== 'no',
    prerequisites: [],
  },
  {
    id: 'invite-apple-admin',
    title: 'Invite Empyrean to App Store Connect as Admin',
    why: 'Admin access lets Empyrean handle app submissions and updates for you.',
    who: 'Someone with Admin or Account Holder access in App Store Connect',
    platform: 'ios',
    guideSection: '§6, Option A',
    instructions: [
      'Sign in to App Store Connect.',
      'Go to Users and Access, then People.',
      'Click + to add a user.',
      `Enter ${EMPYREAN_ADDRESS}.`,
      'Select the Admin role.',
      'Review the details, then click Next and Invite.',
    ],
    links: [APP_STORE_CONNECT],
    appliesWhen: appleAccessIs('admin'),
    prerequisites: beforeAppleInvite,
  },
  {
    id: 'invite-apple-app-manager',
    title: 'Invite Empyrean to App Store Connect as App Manager',
    why: 'App Manager is more limited than Admin, so it needs three extra permissions for Empyrean to build and submit your app.',
    who: 'Someone with Admin or Account Holder access in App Store Connect',
    platform: 'ios',
    guideSection: '§6, Option B',
    instructions: [
      'Sign in to App Store Connect.',
      'Go to Users and Access, then People, and click + to add a user.',
      `Enter ${EMPYREAN_ADDRESS}.`,
      'Select App Manager.',
      'Turn on: Access to Certificates, Identifiers & Profiles; Access to Cloud Managed Distribution Certificate; and Create Apps.',
      'Review the app access settings, then click Next and Invite.',
    ],
    important: 'Access to Certificates, Identifiers & Profiles can show information about your other apps.',
    links: [APP_STORE_CONNECT],
    appliesWhen: appleAccessIs('app-manager'),
    prerequisites: beforeAppleInvite,
  },
  {
    id: 'enable-apple-api-access',
    title: 'Turn on App Store Connect API access',
    why: 'With App Manager access, Empyrean can\'t create the API key itself, so your team creates it in the next step.',
    who: 'Your Account Holder',
    platform: 'ios',
    guideSection: '§8A, step 3',
    instructions: [
      'Sign in to App Store Connect as the Account Holder.',
      'Go to Users and Access, then Integrations, then App Store Connect API.',
      'If API access isn\'t turned on yet, request it.',
    ],
    links: [APP_STORE_CONNECT],
    appliesWhen: appleAccessIs('app-manager'),
    prerequisites: [{ id: 'enroll-apple' }, { id: 'finish-apple-verification' }],
  },
  {
    id: 'create-apple-api-key',
    title: 'Create an App Store Connect API key',
    why: 'Empyrean uses this key to upload and release your app automatically.',
    who: 'Your Account Holder or an Admin',
    platform: 'ios',
    guideSection: '§8A',
    instructions: [
      'In App Store Connect, go to Users and Access, then Integrations, then App Store Connect API, then Team Keys.',
      'Click Generate API Key (or +).',
      'Name it something like "Empyrean CI/CD Key".',
      'Choose the access role your Implementation representative specifies.',
      'Generate the key and download the .p8 file. Note the Key ID and the Issuer ID.',
    ],
    important: 'The .p8 file can only be downloaded once, and team keys can access every app in your account.',
    links: [APP_STORE_CONNECT],
    appliesWhen: appleAccessIs('app-manager'),
    prerequisites: [{ id: 'enable-apple-api-access' }],
  },
  {
    id: 'create-apns-key',
    title: 'Create a push notification (APNs) key',
    why: 'Your app needs this key to send push notifications.',
    who: 'Your Account Holder or an Admin',
    platform: 'ios',
    guideSection: '§8B',
    instructions: [
      'Sign in to your Apple Developer account.',
      'Go to Certificates, Identifiers & Profiles, then Keys, and click +.',
      'Name it something like "Empyrean APNs Key" and turn on Apple Push Notification service (APNs).',
      'Set the environment and key scope your Implementation representative specifies.',
      'Confirm, then download the .p8 file. Note the Key ID and your Team ID.',
    ],
    important: 'The .p8 file can only be downloaded once.',
    links: [APPLE_DEVELOPER_ACCOUNT],
    appliesWhen: appleAccessIs('app-manager'),
    prerequisites: [{ id: 'enroll-apple' }, { id: 'finish-apple-verification' }],
  },
  {
    id: 'send-apple-keys',
    title: 'Send the keys to Empyrean securely',
    why: 'Empyrean needs both keys to build, release and send notifications for your app.',
    who: 'Your Account Holder or an Admin',
    platform: 'ios',
    guideSection: '§8, Secure credential delivery',
    instructions: [
      'API key: send the Key ID, the Issuer ID and the .p8 file.',
      'Push key: send the Key ID, your Team ID and the .p8 file.',
      'Use the secure transfer method your Implementation representative sets up.',
    ],
    important: 'Never email .p8 files as ordinary attachments.',
    appliesWhen: appleAccessIs('app-manager'),
    prerequisites: [{ id: 'create-apple-api-key' }, { id: 'create-apns-key' }],
  },
  {
    id: 'create-google-app',
    title: 'Create your branded app in Google Play Console',
    why: 'App-level access can only be given for an app that already exists.',
    who: 'Your account owner or an account admin',
    platform: 'android',
    guideSection: '§7, Option B',
    instructions: [
      'Ask your Implementation representative for the app name and details to use.',
      'Sign in to Google Play Console and create the app with those details.',
      'Check that the app shows in your list of apps.',
    ],
    links: [PLAY_CONSOLE],
    appliesWhen: googleAccessIs('app-admin'),
    prerequisites: [{ id: 'register-google' }, { id: 'finish-google-verification' }],
  },
  {
    id: 'invite-google-account-admin',
    title: 'Invite Empyrean to Google Play Console as account admin',
    why: 'Account admin access lets Empyrean handle app submissions and updates for you.',
    who: 'Your account owner or an account admin',
    platform: 'android',
    guideSection: '§7, Option A',
    instructions: [
      'Sign in to Google Play Console.',
      'Go to Users and permissions and select Invite new users.',
      `Enter ${EMPYREAN_ADDRESS}.`,
      'Turn on "Make this user an account admin".',
      'Review the permissions and click Invite user.',
    ],
    links: [PLAY_CONSOLE],
    appliesWhen: googleAccessIs('account-admin'),
    prerequisites: beforeGoogleInvite,
  },
  {
    id: 'invite-google-app-admin',
    title: 'Invite Empyrean to your branded app in Google Play Console',
    why: 'App-level access limits Empyrean to your branded app only.',
    who: 'Your account owner or an account admin',
    platform: 'android',
    guideSection: '§7, Option B',
    instructions: [
      'Sign in to Google Play Console.',
      'Go to Users and permissions and select Invite new users.',
      `Enter ${EMPYREAN_ADDRESS}.`,
      'Under App permissions, select your branded app and grant Admin (all permissions).',
      'Check that the access is for the right app, then click Invite user.',
    ],
    links: [PLAY_CONSOLE],
    appliesWhen: googleAccessIs('app-admin'),
    prerequisites: [...beforeGoogleInvite, { id: 'create-google-app' }],
  },
  {
    id: 'notify-representative',
    title: 'Let your Implementation representative know you\'re done',
    why: 'Empyrean then accepts your invitations and checks the permissions work.',
    who: 'You',
    platform: 'both',
    guideSection: '§9',
    instructions: [
      'Tell your Implementation representative which steps you have finished.',
      'Mention any restrictions, verification problems or steps you couldn\'t complete.',
    ],
    appliesWhen: always,
    prerequisites: CLIENT_STEP_IDS.filter((id) => id !== 'notify-representative').map((id) => ({ id })),
  },
]
