/**
 * Checklist progress: pure functions over the ordered steps and the set of
 * steps the client has marked done. No React.
 *
 * Invariant: a step can only be done if all of its prerequisites are done.
 */
import { CLIENT_STEPS, type ClientStep, type ClientStepId } from '../data/clientSteps'
import { orderSteps, type OrderedStep } from '../engine/orderSteps'
import type { OnboardingAnswers } from '../types/onboarding'

export type ChecklistStep = OrderedStep<ClientStepId, ClientStep>
export type StepStatus = 'done' | 'ready' | 'locked'

/** The client's ordered checklist. Throws only if the step registry itself is broken (a programming error, caught by tests). */
export function checklistFor(answers: OnboardingAnswers): ChecklistStep[] {
  const result = orderSteps<ClientStepId, OnboardingAnswers, ClientStep>(CLIENT_STEPS, answers)
  if (!result.ok) throw new Error(`Invalid client step registry: ${JSON.stringify(result.error)}`)
  return result.value
}

export function statusOf(step: ChecklistStep, done: ReadonlySet<ClientStepId>): StepStatus {
  if (done.has(step.step.id)) return 'done'
  return step.prerequisites.every((id) => done.has(id)) ? 'ready' : 'locked'
}

/**
 * Marks a ready step done, or un-marks a done step together with everything
 * that depends on it. Locked steps can't be marked.
 */
export function toggleStep(
  steps: readonly ChecklistStep[],
  done: readonly ClientStepId[],
  id: ClientStepId,
): ClientStepId[] {
  const doneSet = new Set(done)
  const step = steps.find((s) => s.step.id === id)
  if (step === undefined) return [...done]

  if (!doneSet.has(id)) return statusOf(step, doneSet) === 'ready' ? [...done, id] : [...done]

  const removed = new Set<ClientStepId>([id])
  for (const s of steps) {
    if (s.prerequisites.some((pre) => removed.has(pre))) removed.add(s.step.id)
  }
  return done.filter((d) => !removed.has(d))
}

/**
 * After the answers change, keep only the done steps that still apply and
 * whose prerequisites are all still done (a new prerequisite may have appeared).
 */
export function keepConsistent(steps: readonly ChecklistStep[], done: readonly ClientStepId[]): ClientStepId[] {
  const wanted = new Set(done)
  const kept = new Set<ClientStepId>()
  for (const s of steps) {
    if (wanted.has(s.step.id) && s.prerequisites.every((pre) => kept.has(pre))) kept.add(s.step.id)
  }
  return steps.map((s) => s.step.id).filter((id) => kept.has(id))
}

export interface Progress {
  done: number
  total: number
  percent: number
  /** The first step that can be done now, if any. */
  next: ChecklistStep | undefined
}

export function progressOf(steps: readonly ChecklistStep[], done: ReadonlySet<ClientStepId>): Progress {
  const doneCount = steps.filter((s) => done.has(s.step.id)).length
  return {
    done: doneCount,
    total: steps.length,
    percent: steps.length === 0 ? 0 : Math.round((doneCount / steps.length) * 100),
    next: steps.find((s) => statusOf(s, done) === 'ready'),
  }
}
