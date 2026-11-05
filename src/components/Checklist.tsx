import { useMemo, useState } from 'react'
import { type ChecklistStep, checklistFor, progressOf, statusOf, type StepStatus } from '../checklist/progress'
import type { ClientStepId } from '../data/clientSteps'
import type { OnboardingAnswers } from '../types/onboarding'

interface Props {
  answers: OnboardingAnswers
  done: readonly ClientStepId[]
  onToggle: (id: ClientStepId) => void
  onChangeAnswers: () => void
  onRestart: () => void
}

const PLATFORM_LABELS = { ios: 'Apple', android: 'Google Play' } as const

export function Checklist({ answers, done, onToggle, onChangeAnswers, onRestart }: Props) {
  const steps = useMemo(() => checklistFor(answers), [answers])
  const doneSet = new Set(done)
  const progress = progressOf(steps, doneSet)
  const titleOf = (id: ClientStepId) => steps.find((s) => s.step.id === id)?.step.title ?? id
  const allDone = progress.total > 0 && progress.done === progress.total

  return (
    <section className="card">
      <p className="eyebrow">{answers.organizationName}</p>
      <h1 className="card__title">Your setup checklist</h1>

      <div className="checklist-progress">
        <div className="checklist-progress__label">
          <strong>
            {progress.done} of {progress.total} steps done
          </strong>
          <span>{progress.percent}%</span>
        </div>
        <progress className="progress progress--large" value={progress.done} max={progress.total}>
          {progress.percent}%
        </progress>
        {progress.next && !allDone && (
          <p className="checklist-progress__next">
            Next up: <a href={`#step-${progress.next.step.id}`}>{progress.next.step.title}</a>
          </p>
        )}
      </div>

      {allDone && <AllDone />}

      <ol className="steps">
        {steps.map((s, index) => (
          <StepCard
            // Re-mount when the status changes so a step returns to its automatic open/closed state.
            key={`${s.step.id}-${statusOf(s, doneSet)}`}
            item={s}
            number={index + 1}
            status={statusOf(s, doneSet)}
            isNext={progress.next?.step.id === s.step.id}
            waitingOn={s.prerequisites.filter((id) => !doneSet.has(id)).map(titleOf)}
            onToggle={() => onToggle(s.step.id)}
          />
        ))}
      </ol>

      <div className="actions actions--checklist">
        <button type="button" className="button button--secondary" onClick={onChangeAnswers}>
          Change my answers
        </button>
        <button
          type="button"
          className="button button--quiet"
          onClick={() => {
            if (window.confirm('Start over? Your answers and checked steps will be cleared.')) onRestart()
          }}
        >
          Start over
        </button>
      </div>
    </section>
  )
}

interface StepCardProps {
  item: ChecklistStep
  number: number
  status: StepStatus
  isNext: boolean
  waitingOn: string[]
  onToggle: () => void
}

function StepCard({ item, number, status, isNext, waitingOn, onToggle }: StepCardProps) {
  const { step } = item
  /** null = automatic: only the next step is open. A click overrides it. */
  const [expanded, setExpanded] = useState<boolean | null>(null)
  const open = expanded ?? isNext

  return (
    <li id={`step-${step.id}`} className={`step step--${status}${isNext ? ' step--next' : ''}`}>
      <details
        open={open}
        onToggle={(event) => {
          // The toggle event also fires when React sets `open`; only record real clicks.
          if (event.currentTarget.open !== open) setExpanded(event.currentTarget.open)
        }}
      >
        <summary className="step__summary">
          <span className="step__marker" aria-hidden="true">
            {status === 'done' ? '✓' : number}
          </span>
          <span className="step__heading">
            <span className="step__title">{step.title}</span>
            <span className="step__tags">
              {step.platform !== 'both' && <span className="tag">{PLATFORM_LABELS[step.platform]}</span>}
              <span className="tag tag--who">{step.who}</span>
            </span>
          </span>
          <span className="step__status">{STATUS_TEXT[status]}</span>
        </summary>

        <div className="step__body">
          <p className="step__why">{step.why}</p>
          <ol className="step__instructions">
            {step.instructions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          {step.important && (
            <p className="step__important">
              <strong>Important:</strong> {step.important}
            </p>
          )}
          {step.links && step.links.length > 0 && (
            <p className="step__links">
              {step.links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                  Open {link.label} ↗
                </a>
              ))}
            </p>
          )}
          <p className="step__source">From the setup guide, {step.guideSection}</p>

          {status === 'locked' ? (
            <p className="step__locked">Finish first: {waitingOn.join(' · ')}</p>
          ) : (
            <label className="step__check">
              <input type="checkbox" checked={status === 'done'} onChange={onToggle} />
              <span>{status === 'done' ? 'Done' : 'Mark as done'}</span>
            </label>
          )}
        </div>
      </details>
    </li>
  )
}

const STATUS_TEXT: Record<StepStatus, string> = {
  done: 'Done',
  ready: 'To do',
  locked: 'Later',
}

function AllDone() {
  return (
    <div className="all-done" role="status">
      <h2 className="all-done__title">You're all set</h2>
      <p>
        Thank you. Empyrean will accept your invitations and check that the permissions work. Your Implementation
        representative will contact you if anything else is needed.
      </p>
      <p>
        <strong>One thing to remember:</strong> Apple and Google sometimes publish new agreements. Only your account
        owner can accept them, and app updates can't be published until they do.
      </p>
    </div>
  )
}
