import { useMemo } from 'react'
import { PROCEDURES } from '../data/procedures'
import { generateChecklist } from '../engine/generateChecklist'
import type { OnboardingAnswers } from '../types/onboarding'

interface Props {
  answers: OnboardingAnswers
  onBack: () => void
  onRestart: () => void
}

/** M3 placeholder: proves the answers reach the engine. M4 replaces the body with the checklist. */
export function Results({ answers, onBack, onRestart }: Props) {
  const result = useMemo(() => generateChecklist(PROCEDURES, answers), [answers])

  return (
    <section className="card">
      <h1 className="card__title">Plan for {answers.organizationName}</h1>
      {result.ok ? (
        <p className="lead">
          {result.value.tasks.length} tasks, {result.value.tasks.filter((t) => t.state.kind === 'blocked').length}{' '}
          blocked. The full checklist view arrives in M4.
        </p>
      ) : (
        <p className="field-error" role="alert">
          The checklist could not be generated: {result.error.map((e) => e.kind).join(', ')}
        </p>
      )}
      <div className="actions">
        <button type="button" className="button button--secondary" onClick={onBack}>
          Change answers
        </button>
        <button type="button" className="button button--secondary" onClick={onRestart}>
          Start over
        </button>
      </div>
    </section>
  )
}
