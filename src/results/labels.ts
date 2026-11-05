/** Display text for the results page. Pure functions, no React. */
import { PROCEDURES, type ProcedureId } from '../data/procedures'
import { BLOCKER_CHOICES } from '../questionnaire/choices'
import type {
  AnswerField,
  BlockReason,
  GeneratedTask,
  OnboardingAnswers,
  OwnerRole,
  PhaseId,
  SourceTag,
  StakeholderQuestionId,
} from '../types/onboarding'

export const PHASE_NAMES: Record<PhaseId, string> = {
  '01': 'Discovery and routing',
  '02': 'Developer account registration',
  '03': 'Account access and handoff',
  '04': 'App identities and credentials',
  '05': 'Services, branding and store listings',
  '06': 'Build configuration',
  '07': 'Testing and builds',
  '08': 'Submission and launch',
  '09': 'Ongoing maintenance',
}

export const OWNER_LABELS: Record<OwnerRole, string> = {
  client: 'Client',
  'client-account-holder': 'Client account holder',
  implementation: 'Implementation',
  engineering: 'Engineering',
  'app-support': 'App Support',
  design: 'Design',
  tbc: 'Owner not decided',
}

export const SOURCE_LABELS: Record<SourceTag, string> = {
  C: 'Connect procedure',
  T: "Carlos's technical guidance",
  G: 'Client guide draft',
  P: 'Proposed by this prototype',
  Q: 'Depends on a pending decision',
}

const FIELD_LABELS: Record<AnswerField, string> = {
  organizationName: 'organization name',
  platforms: 'platforms',
  appleAccountStatus: 'whether the client has an Apple Developer account',
  appleAccess: 'which Apple access model to use',
  googleAccountStatus: 'whether the client has a Google Play account',
  googleAccess: 'which Google Play access model to use',
  clientContactConfirmed: 'a confirmed primary client contact',
  registrationContactsReady: 'who will register the new account and verify them',
  securityRestrictions: 'whether a security review is needed',
  knownBlockers: 'known blockers',
}

/** Only the questions that can block a task need a short title; others link to the doc. */
const QUESTION_TITLES: Partial<Record<StakeholderQuestionId, string>> = {
  Q15: 'no agreed procedure for Apple unlisted distribution',
  Q17: 'no agreed process for clients who give Empyrean no access',
}

const TITLES = new Map<ProcedureId, string>(PROCEDURES.map((p) => [p.id, p.title]))

export function describeReason(reason: BlockReason<ProcedureId>): string {
  switch (reason.kind) {
    case 'open-question':
      return `Pending decision ${reason.id}: ${QUESTION_TITLES[reason.id] ?? 'see docs/open-questions.md'}`
    case 'needs-answer':
      return `Needs an answer: ${FIELD_LABELS[reason.field]}`
    case 'client-blocker':
      return `Client reported: ${BLOCKER_CHOICES.find((c) => c.value === reason.category)?.label ?? reason.category}`
    case 'upstream':
      return `Waiting on a blocked step: ${TITLES.get(reason.id) ?? reason.id}`
  }
}

export const titleOf = (id: ProcedureId): string => TITLES.get(id) ?? id

export function platformLabel(answers: OnboardingAnswers): string {
  if (answers.apple && answers.google) return 'iOS and Android'
  return answers.apple ? 'iOS only' : 'Android only'
}

export interface PhaseRun<Id extends string> {
  phase: PhaseId
  tasks: GeneratedTask<Id>[]
}

/**
 * Splits the ordered checklist into runs of consecutive tasks in the same phase.
 * The order is never changed, so a phase can appear more than once when the
 * real dependency order goes back to it.
 */
export function phaseRuns<Id extends string>(tasks: readonly GeneratedTask<Id>[]): PhaseRun<Id>[] {
  const runs: PhaseRun<Id>[] = []
  for (const task of tasks) {
    const last = runs[runs.length - 1]
    if (last !== undefined && last.phase === task.procedure.phase) last.tasks.push(task)
    else runs.push({ phase: task.procedure.phase, tasks: [task] })
  }
  return runs
}

/** A task the client has to do themselves, for these answers. */
export const isClientTask = <Id extends string>(task: GeneratedTask<Id>): boolean =>
  task.owners.some((owner) => owner === 'client' || owner === 'client-account-holder')
