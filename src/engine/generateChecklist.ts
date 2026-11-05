import type {
  BlockReason,
  Checklist,
  ChecklistError,
  GeneratedTask,
  OnboardingAnswers,
  Owners,
  Procedure,
  Result,
  TaskState,
} from '../types/onboarding'

/**
 * Checks the registry itself: duplicate IDs and prerequisites that point at
 * IDs that don't exist. Independent of any answers.
 */
export function validateRegistry<Id extends string>(
  procedures: readonly Procedure<Id>[],
): ChecklistError<Id>[] {
  const errors: ChecklistError<Id>[] = []
  const ids = new Set<string>()
  for (const procedure of procedures) {
    if (ids.has(procedure.id)) errors.push({ kind: 'duplicate-id', id: procedure.id })
    ids.add(procedure.id)
  }
  for (const procedure of procedures) {
    for (const prerequisite of procedure.prerequisites) {
      if (!ids.has(prerequisite.id)) {
        errors.push({ kind: 'unknown-prerequisite', task: procedure.id, missing: prerequisite.id })
      }
    }
  }
  return errors
}

/**
 * Builds the dependency-ordered checklist for one set of answers.
 *
 * 1. Keep the procedures whose appliesWhen() is true.
 * 2. Keep prerequisite edges whose when() is true (or absent) and whose
 *    target also applies. Edges to tasks that don't apply are dropped, so
 *    each procedure must list every prerequisite it really needs.
 * 3. Topologically sort; ties go to registry (playbook) order so output is stable.
 * 4. A task is Blocked by its own blockers() or by any blocked prerequisite.
 *
 * Cycles are checked on the graph that actually applies, because some edges
 * are mutually exclusive (e.g. Google app-level access reverses the order of
 * the Play app record and the invitation).
 */
export function generateChecklist<Id extends string>(
  procedures: readonly Procedure<Id>[],
  answers: OnboardingAnswers,
): Result<Checklist<Id>, ChecklistError<Id>[]> {
  const registryErrors = validateRegistry(procedures)
  if (registryErrors.length > 0) return { ok: false, error: registryErrors }

  const applicable = procedures.filter((p) => p.appliesWhen(answers))
  const applicableIds = new Set<string>(applicable.map((p) => p.id))
  const position = new Map<string, number>(applicable.map((p, i) => [p.id, i]))

  const edges = new Map<Id, Id[]>(
    applicable.map((p) => [
      p.id,
      p.prerequisites
        .filter((pre) => applicableIds.has(pre.id) && (pre.when?.(answers) ?? true))
        .map((pre) => pre.id)
        .sort((a, b) => indexOf(position, a) - indexOf(position, b)),
    ]),
  )

  const cycle = findCycle(applicable.map((p) => p.id), edges)
  if (cycle !== null) return { ok: false, error: [{ kind: 'cycle', path: cycle }] }

  const sorted = topologicalOrder(applicable, edges, position)
  const wave = new Map<Id, number>()
  const blocked = new Set<Id>()
  const tasks: GeneratedTask<Id>[] = sorted.map((procedure, i) => {
    const prerequisites = edges.get(procedure.id) ?? []
    const taskWave = 1 + Math.max(0, ...prerequisites.map((id) => wave.get(id) ?? 0))
    wave.set(procedure.id, taskWave)

    const reasons: BlockReason<Id>[] = [
      ...(procedure.blockers?.(answers) ?? []),
      ...prerequisites.filter((id) => blocked.has(id)).map((id): BlockReason<Id> => ({ kind: 'upstream', id })),
    ]
    const state = toState(reasons)
    if (state.kind === 'blocked') blocked.add(procedure.id)

    return {
      procedure,
      order: i + 1,
      wave: taskWave,
      owners: resolveOwners(procedure, answers),
      prerequisites,
      state,
    }
  })

  return { ok: true, value: { tasks } }
}

function toState<Id extends string>(reasons: readonly BlockReason<Id>[]): TaskState<Id> {
  const [first, ...rest] = reasons
  return first === undefined ? { kind: 'planned' } : { kind: 'blocked', reasons: [first, ...rest] }
}

function resolveOwners<Id extends string>(procedure: Procedure<Id>, answers: OnboardingAnswers): Owners {
  return typeof procedure.owners === 'function' ? procedure.owners(answers) : procedure.owners
}

function indexOf(position: ReadonlyMap<string, number>, id: string): number {
  const index = position.get(id)
  if (index === undefined) throw new Error(`Internal error: no position for ${id}`)
  return index
}

/** Kahn's algorithm; among ready tasks, the earliest in the registry goes first. */
function topologicalOrder<Id extends string>(
  applicable: readonly Procedure<Id>[],
  edges: ReadonlyMap<Id, readonly Id[]>,
  position: ReadonlyMap<string, number>,
): Procedure<Id>[] {
  const remaining = new Map<Id, number>(applicable.map((p) => [p.id, edges.get(p.id)?.length ?? 0]))
  const dependents = new Map<Id, Id[]>()
  for (const [id, prerequisites] of edges) {
    for (const pre of prerequisites) dependents.set(pre, [...(dependents.get(pre) ?? []), id])
  }

  const ready = applicable.filter((p) => remaining.get(p.id) === 0)
  const sorted: Procedure<Id>[] = []
  const byId = new Map<Id, Procedure<Id>>(applicable.map((p) => [p.id, p]))

  while (ready.length > 0) {
    ready.sort((a, b) => indexOf(position, a.id) - indexOf(position, b.id))
    const next = ready.shift()
    if (next === undefined) break
    sorted.push(next)
    for (const dependent of dependents.get(next.id) ?? []) {
      const count = (remaining.get(dependent) ?? 0) - 1
      remaining.set(dependent, count)
      const procedure = byId.get(dependent)
      if (count === 0 && procedure !== undefined) ready.push(procedure)
    }
  }
  return sorted
}

/** Depth-first search. Returns the IDs on the first cycle found (first ID repeated at the end), or null. */
function findCycle<Id extends string>(ids: readonly Id[], edges: ReadonlyMap<Id, readonly Id[]>): Id[] | null {
  const state = new Map<Id, 'visiting' | 'done'>()
  const stack: Id[] = []

  const visit = (id: Id): Id[] | null => {
    const current = state.get(id)
    if (current === 'done') return null
    if (current === 'visiting') return [...stack.slice(stack.indexOf(id)), id]
    state.set(id, 'visiting')
    stack.push(id)
    for (const pre of edges.get(id) ?? []) {
      const cycle = visit(pre)
      if (cycle !== null) return cycle
    }
    stack.pop()
    state.set(id, 'done')
    return null
  }

  for (const id of ids) {
    const cycle = visit(id)
    if (cycle !== null) return cycle
  }
  return null
}
