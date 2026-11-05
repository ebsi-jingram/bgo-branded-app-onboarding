import { useMemo, useState } from 'react'
import { PROCEDURES, type ProcedureId } from '../data/procedures'
import { generateChecklist } from '../engine/generateChecklist'
import {
  OWNER_LABELS,
  PHASE_NAMES,
  SOURCE_LABELS,
  describeReason,
  isClientTask,
  phaseRuns,
  platformLabel,
  titleOf,
} from '../results/labels'
import type { GeneratedTask, OnboardingAnswers, SourceRef, SourceTag } from '../types/onboarding'

interface Props {
  answers: OnboardingAnswers
  onBack: () => void
  onRestart: () => void
}

type View = 'all' | 'client'

export function Results({ answers, onBack, onRestart }: Props) {
  const result = useMemo(() => generateChecklist(PROCEDURES, answers), [answers])
  const [view, setView] = useState<View>('all')
  const [openPhases, setOpenPhases] = useState<ReadonlySet<string>>(new Set())

  if (!result.ok) {
    return (
      <section className="card">
        <h1 className="card__title">The plan could not be generated</h1>
        <p className="field-error" role="alert">
          {result.error.map((e) => e.kind).join(', ')}
        </p>
        <Actions onBack={onBack} onRestart={onRestart} />
      </section>
    )
  }

  const allTasks = result.value.tasks
  const clientTasks = allTasks.filter(isClientTask)
  const shown = view === 'client' ? clientTasks : allTasks
  const runs = phaseRuns(shown).map((run) => ({ ...run, key: `${run.phase}-${run.tasks[0]?.order}` }))
  const blockedCount = (tasks: readonly GeneratedTask<ProcedureId>[]) => tasks.filter((t) => t.state.kind === 'blocked').length

  const setPhaseOpen = (key: string, open: boolean) =>
    setOpenPhases((current) => {
      if (current.has(key) === open) return current
      const next = new Set(current)
      if (open) next.add(key)
      else next.delete(key)
      return next
    })

  return (
    <section className="card">
      <h1 className="card__title">Implementation plan for {answers.organizationName}</h1>
      <dl className="summary">
        <div>
          <dt>Platforms</dt>
          <dd>{platformLabel(answers)}</dd>
        </div>
        <div>
          <dt>Steps</dt>
          <dd>{allTasks.length}</dd>
        </div>
        <div>
          <dt>Blocked</dt>
          <dd>{blockedCount(allTasks)}</dd>
        </div>
        <div>
          <dt>Client actions</dt>
          <dd>{clientTasks.length}</dd>
        </div>
      </dl>
      <p className="lead">
        Steps are listed in the order the work can happen. A phase heading repeats when the real order goes back to it.
        Nothing here is approved process.
      </p>
      <Actions onBack={onBack} onRestart={onRestart} />

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Which steps to show">
          <button type="button" aria-pressed={view === 'all'} onClick={() => setView('all')}>
            All steps ({allTasks.length})
          </button>
          <button type="button" aria-pressed={view === 'client'} onClick={() => setView('client')}>
            Client steps ({clientTasks.length})
          </button>
        </div>
        <div className="toolbar__links">
          <button type="button" className="link-button" onClick={() => setOpenPhases(new Set(runs.map((r) => r.key)))}>
            Expand all
          </button>
          <button type="button" className="link-button" onClick={() => setOpenPhases(new Set())}>
            Collapse all
          </button>
        </div>
      </div>

      {runs.map((run) => {
        const blocked = blockedCount(run.tasks)
        return (
          <details
            key={run.key}
            className="phase"
            open={openPhases.has(run.key)}
            onToggle={(event) => setPhaseOpen(run.key, event.currentTarget.open)}
          >
            <summary className="phase__title">
              <span className="phase__number">{run.phase}</span>
              <span className="phase__name">{PHASE_NAMES[run.phase]}</span>
              <span className="phase__counts">
                {run.tasks.length} {run.tasks.length === 1 ? 'step' : 'steps'}
                {blocked > 0 && <span className="phase__blocked"> · {blocked} blocked</span>}
              </span>
            </summary>
            <ol className="task-list">
              {run.tasks.map((task) => (
                <TaskRow key={task.procedure.id} task={task} />
              ))}
            </ol>
          </details>
        )
      })}

      <Actions onBack={onBack} onRestart={onRestart} />
    </section>
  )
}

function TaskRow({ task }: { task: GeneratedTask<ProcedureId> }) {
  const { procedure, state } = task
  return (
    <li className="task" value={task.order}>
      <div className="task__header">
        <span className="task__order" aria-hidden="true">
          {task.order}
        </span>
        <span className="task__title">{procedure.title}</span>
        <span className={`badge badge--${state.kind}`}>{state.kind === 'blocked' ? 'Blocked' : 'Planned'}</span>
      </div>
      <p className="task__summary">{procedure.summary}</p>
      <div className="task__meta">
        {task.owners.map((owner) => (
          <span key={owner} className={owner === 'tbc' ? 'chip chip--unknown' : 'chip'}>
            {OWNER_LABELS[owner]}
          </span>
        ))}
        {procedure.platform !== 'shared' && (
          <span className="chip chip--platform">{procedure.platform === 'ios' ? 'iOS' : 'Android'}</span>
        )}
        {sourceTags(procedure.sources).map(({ tag, notes }) => (
          <span key={tag} className="chip chip--source" title={`${SOURCE_LABELS[tag]}: ${notes.join('; ')}`}>
            {tag}
          </span>
        ))}
      </div>
      {task.prerequisites.length > 0 && (
        <p className="task__after">After: {task.prerequisites.map(titleOf).join(' · ')}</p>
      )}
      {state.kind === 'blocked' && (
        <ul className="task__reasons">
          {state.reasons.map((reason) => {
            const text = describeReason(reason)
            return <li key={text}>{text}</li>
          })}
        </ul>
      )}
    </li>
  )
}

function Actions({ onBack, onRestart }: { onBack: () => void; onRestart: () => void }) {
  return (
    <div className="actions actions--results">
      <button type="button" className="button button--secondary" onClick={onBack}>
        Change answers
      </button>
      <button type="button" className="button button--secondary" onClick={onRestart}>
        Start over
      </button>
    </div>
  )
}

/** One chip per tag; a tag cited twice (e.g. two of Carlos's sessions) lists both notes in its tooltip. */
function sourceTags(sources: readonly SourceRef[]): { tag: SourceTag; notes: string[] }[] {
  const byTag = new Map<SourceTag, string[]>()
  for (const { tag, note } of sources) byTag.set(tag, [...(byTag.get(tag) ?? []), note])
  return [...byTag].map(([tag, notes]) => ({ tag, notes }))
}
