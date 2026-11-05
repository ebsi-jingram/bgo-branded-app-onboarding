/** Helpers shared by the registry and scenario tests. Not used by the app. */
import { normalize } from '../domain/normalize'
import { generateChecklist } from '../engine/generateChecklist'
import type { DraftAnswers, GeneratedTask, OnboardingAnswers } from '../types/onboarding'
import { PROCEDURES, type ProcedureId } from './procedures'

export type Task = GeneratedTask<ProcedureId>

export function checklistFor(answers: OnboardingAnswers): Task[] {
  const result = generateChecklist(PROCEDURES, answers)
  if (!result.ok) throw new Error(`Checklist failed: ${JSON.stringify(result.error)}`)
  return [...result.value.tasks]
}

export function checklistForDraft(draft: DraftAnswers): Task[] {
  const answers = normalize(draft)
  if (!answers.ok) throw new Error(`Invalid answers: ${JSON.stringify(answers.error)}`)
  return checklistFor(answers.value)
}

export const idsOf = (tasks: readonly Task[]): ProcedureId[] => tasks.map((t) => t.procedure.id)

export function find(tasks: readonly Task[], id: ProcedureId): Task {
  const task = tasks.find((t) => t.procedure.id === id)
  if (task === undefined) throw new Error(`Task ${id} is not in the checklist`)
  return task
}

/** Every task reachable through prerequisites, not just direct ones. */
export function allPrerequisites(tasks: readonly Task[], id: ProcedureId): Set<ProcedureId> {
  const seen = new Set<ProcedureId>()
  const visit = (current: ProcedureId) => {
    for (const pre of find(tasks, current).prerequisites) {
      if (!seen.has(pre)) {
        seen.add(pre)
        visit(pre)
      }
    }
  }
  visit(id)
  return seen
}

export const isBefore = (tasks: readonly Task[], first: ProcedureId, second: ProcedureId) =>
  find(tasks, first).order < find(tasks, second).order
