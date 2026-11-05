import { useMemo } from 'react'
import { PROCEDURES, type ProcedureId } from '../data/procedures'
import { generateChecklist } from '../engine/generateChecklist'
import {
  OWNER_LABELS,
  PHASE_NAMES,
  SOURCE_LABELS,
  describeReason,
  phaseRuns,
  platformLabel,
  titleOf,
} from '../results/labels'
import type { GeneratedTask, OnboardingAnswers } from '../types/onboarding'

interface Props {
  answers: OnboardingAnswers
  onBack: () => void
  onRestart: () => void
}

export function Results({ answers, onBack, onRestart }: Props) {
  const result = useMemo(() => generateChecklist(PROCEDURES, answers), [answers])

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

  const tasks = result.value.tasks
  const blocked = tasks.filter((t) => t.state.kind === 'blocked').length
  const clientTasks = tasks.filter((t) => t.owners.some((o) => o === 'client' || o === 'client-account-holder')).length

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
          <dd>{tasks.length}</dd>
        </div>
        <div>
          <dt>Blocked</dt>
          <dd>{blocked}</dd>
        </div>
        <div>
          <dt>Client actions</dt>
          <dd>{clientTasks}</dd>
        </div>
      </dl>
      <p className="lead">
        Steps are listed in the order the work can happen. A phase heading repeats when the real order goes back to it.
        Nothing here is approved process.
      </p>
      <Actions onBack={onBack} onRestart={onRestart} />

      {phaseRuns(tasks).map((run) => (
        <section key={`${run.phase}-${run.tasks[0]?.order}`} className="phase">
          <h2 className="phase__title">
            <span className="phase__number">{run.phase}</span> {PHASE_NAMES[run.phase]}
          </h2>
          <ol className="task-list">
            {run.tasks.map((task) => (
              <TaskRow key={task.procedure.id} task={task} />
            ))}
          </ol>
        </section>
      ))}

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
        {procedure.sources.map((source) => (
          <span key={source.tag + source.note} className="chip chip--source" title={`${SOURCE_LABELS[source.tag]}: ${source.note}`}>
            {source.tag}
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
