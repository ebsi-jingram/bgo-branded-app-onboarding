/**
 * Questionnaire navigation as a pure reducer over the Screen state machine.
 * No React here, so every transition is unit-tested.
 */
import { normalize } from '../domain/normalize'
import type { AnswerField, DraftAnswers, Screen, StepId, ValidationError } from '../types/onboarding'

export const STEP_ORDER: readonly StepId[] = ['organization', 'platforms', 'apple', 'google', 'contacts', 'restrictions']

/** Which answers each step asks for. Step errors are normalize()'s errors for these fields. */
export const STEP_FIELDS: Record<StepId, readonly AnswerField[]> = {
  organization: ['organizationName'],
  platforms: ['platforms'],
  apple: ['appleAccountStatus', 'appleAccess'],
  google: ['googleAccountStatus', 'googleAccess'],
  contacts: ['clientContactConfirmed', 'registrationContactsReady'],
  restrictions: ['securityRestrictions', 'knownBlockers'],
}

export function isStepVisible(step: StepId, draft: DraftAnswers): boolean {
  const platforms = draft.platforms ?? []
  if (step === 'apple') return platforms.includes('ios')
  if (step === 'google') return platforms.includes('android')
  return true
}

export const visibleSteps = (draft: DraftAnswers): StepId[] => STEP_ORDER.filter((s) => isStepVisible(s, draft))

/** Uses normalize() so a step asks for exactly what the final answers require. */
export function stepErrors(step: StepId, draft: DraftAnswers): ValidationError[] {
  const result = normalize(draft)
  return result.ok ? [] : result.error.filter((e) => STEP_FIELDS[step].includes(e.field))
}

export type Action =
  | { type: 'start' }
  | { type: 'update'; patch: DraftAnswers }
  | { type: 'continue' }
  | { type: 'back' }
  | { type: 'restart' }
  /** Demo shortcut: load a complete set of answers and go straight to the plan. */
  | { type: 'load'; draft: DraftAnswers }

const FIRST_STEP: StepId = 'organization'

const question = (step: StepId, draft: DraftAnswers): Screen => ({ kind: 'question', step, draft, showErrors: false })

export function reduce(screen: Screen, action: Action): Screen {
  if (action.type === 'restart') return { kind: 'welcome' }
  if (action.type === 'load') return finish(action.draft)

  switch (screen.kind) {
    case 'welcome':
      return action.type === 'start' ? question(FIRST_STEP, {}) : screen

    case 'question': {
      const { step, draft } = screen
      if (action.type === 'update') return { ...screen, draft: { ...draft, ...action.patch } }
      if (action.type === 'back') {
        const steps = visibleSteps(draft)
        const previous = steps[steps.indexOf(step) - 1]
        return previous === undefined ? { kind: 'welcome' } : question(previous, draft)
      }
      if (action.type === 'continue') {
        if (stepErrors(step, draft).length > 0) return { ...screen, showErrors: true }
        const steps = visibleSteps(draft)
        const next = steps[steps.indexOf(step) + 1]
        if (next !== undefined) return question(next, draft)
        return finish(draft)
      }
      return screen
    }

    case 'results':
      if (action.type === 'back') return question(lastStep(screen.draft), screen.draft)
      return screen
  }
}

/** After the last step: show results, or send the user to the first step still missing an answer. */
function finish(draft: DraftAnswers): Screen {
  const result = normalize(draft)
  if (result.ok) return { kind: 'results', draft, answers: result.value }
  const firstIncomplete = visibleSteps(draft).find((s) => stepErrors(s, draft).length > 0) ?? FIRST_STEP
  return { kind: 'question', step: firstIncomplete, draft, showErrors: true }
}

function lastStep(draft: DraftAnswers): StepId {
  const steps = visibleSteps(draft)
  return steps[steps.length - 1] ?? FIRST_STEP
}
