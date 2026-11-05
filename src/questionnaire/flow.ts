/**
 * App state as a pure reducer: which screen is showing, plus the steps the
 * client has marked done. No React here, so every transition is unit-tested.
 */
import { checklistFor, keepConsistent, toggleStep } from '../checklist/progress'
import type { ClientStepId } from '../data/clientSteps'
import { normalize } from '../domain/normalize'
import type { AnswerField, DraftAnswers, OnboardingAnswers, StepId, ValidationError } from '../types/onboarding'

/** Exactly one screen at a time; no combination of boolean flags. */
export type Screen =
  | { kind: 'welcome' }
  /** showErrors becomes true after Continue is pressed with missing answers. */
  | { kind: 'question'; step: StepId; draft: DraftAnswers; showErrors: boolean }
  /** Keeps the draft so "Change my answers" goes back without losing anything. */
  | { kind: 'checklist'; draft: DraftAnswers; answers: OnboardingAnswers }

export interface AppState {
  screen: Screen
  /** Kept across screens so changing an answer doesn't wipe progress. */
  done: readonly ClientStepId[]
}

export const STEP_ORDER: readonly StepId[] = ['organization', 'platforms', 'apple', 'google', 'security']

/** Which answers each step asks for. Step errors are normalize()'s errors for these fields. */
export const STEP_FIELDS: Record<StepId, readonly AnswerField[]> = {
  organization: ['organizationName'],
  platforms: ['platforms'],
  apple: ['appleAccountStatus', 'appleAccess'],
  google: ['googleAccountStatus', 'googleAccess'],
  security: ['securityReview'],
}

export function isStepVisible(step: StepId, draft: DraftAnswers): boolean {
  const platforms = draft.platforms ?? []
  if (step === 'apple') return platforms.includes('ios')
  if (step === 'google') return platforms.includes('android')
  return true
}

export const visibleSteps = (draft: DraftAnswers): StepId[] => STEP_ORDER.filter((s) => isStepVisible(s, draft))

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
  | { type: 'toggle-step'; id: ClientStepId }
  /** Load complete answers (a demo scenario, or a saved visit) and go straight to the checklist. */
  | { type: 'load'; draft: DraftAnswers; done?: readonly ClientStepId[] }

const FIRST_STEP: StepId = 'organization'

export const initialState: AppState = { screen: { kind: 'welcome' }, done: [] }

const question = (step: StepId, draft: DraftAnswers): Screen => ({ kind: 'question', step, draft, showErrors: false })

export function reduce(state: AppState, action: Action): AppState {
  if (action.type === 'restart') return initialState
  if (action.type === 'load') return finish(action.draft, action.done ?? [])

  const { screen } = state
  switch (screen.kind) {
    case 'welcome':
      return action.type === 'start' ? { ...state, screen: question(FIRST_STEP, {}) } : state

    case 'question': {
      const { step, draft } = screen
      if (action.type === 'update') return { ...state, screen: { ...screen, draft: { ...draft, ...action.patch } } }
      if (action.type === 'back') {
        const steps = visibleSteps(draft)
        const previous = steps[steps.indexOf(step) - 1]
        return { ...state, screen: previous === undefined ? { kind: 'welcome' } : question(previous, draft) }
      }
      if (action.type === 'continue') {
        if (stepErrors(step, draft).length > 0) return { ...state, screen: { ...screen, showErrors: true } }
        const steps = visibleSteps(draft)
        const next = steps[steps.indexOf(step) + 1]
        return next !== undefined ? { ...state, screen: question(next, draft) } : finish(draft, state.done)
      }
      return state
    }

    case 'checklist':
      if (action.type === 'back') return { ...state, screen: question(lastStep(screen.draft), screen.draft) }
      if (action.type === 'toggle-step') return { ...state, done: toggleStep(checklistFor(screen.answers), state.done, action.id) }
      return state
  }
}

/** Show the checklist (keeping progress that still makes sense), or send the user to the first unanswered step. */
function finish(draft: DraftAnswers, done: readonly ClientStepId[]): AppState {
  const result = normalize(draft)
  if (result.ok) {
    return {
      screen: { kind: 'checklist', draft, answers: result.value },
      done: keepConsistent(checklistFor(result.value), done),
    }
  }
  const firstIncomplete = visibleSteps(draft).find((s) => stepErrors(s, draft).length > 0) ?? FIRST_STEP
  return { screen: { kind: 'question', step: firstIncomplete, draft, showErrors: true }, done }
}

function lastStep(draft: DraftAnswers): StepId {
  const steps = visibleSteps(draft)
  return steps[steps.length - 1] ?? FIRST_STEP
}
