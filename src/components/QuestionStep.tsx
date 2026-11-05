import { useId } from 'react'
import { needsRegistration } from '../domain/normalize'
import {
  APPLE_ACCESS_CHOICES,
  APPLE_STATUS_CHOICES,
  BLOCKER_CHOICES,
  GOOGLE_ACCESS_CHOICES,
  GOOGLE_STATUS_CHOICES,
  PLATFORM_CHOICES,
  TRI_CHOICES,
} from '../questionnaire/choices'
import { stepErrors, visibleSteps } from '../questionnaire/flow'
import type { AnswerField, DraftAnswers, StepId } from '../types/onboarding'
import { ChoiceGroup } from './ChoiceGroup'

interface Props {
  step: StepId
  draft: DraftAnswers
  showErrors: boolean
  onChange: (patch: DraftAnswers) => void
  onContinue: () => void
  onBack: () => void
}

const TITLES: Record<StepId, string> = {
  organization: 'Which organization is this for?',
  platforms: 'Which platforms does the branded app need?',
  apple: 'Apple App Store',
  google: 'Google Play',
  contacts: 'Contacts',
  restrictions: 'Restrictions and blockers',
}

export function QuestionStep({ step, draft, showErrors, onChange, onContinue, onBack }: Props) {
  const steps = visibleSteps(draft)
  const position = steps.indexOf(step) + 1
  const errors = showErrors ? stepErrors(step, draft) : []
  const errorFor = (field: AnswerField) => errors.find((e) => e.field === field)?.message

  return (
    <form
      className="card"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onContinue()
      }}
    >
      <p className="progress-label">
        Step {position} of {steps.length}
      </p>
      <progress className="progress" value={position} max={steps.length} aria-hidden="true" />
      <h1 className="card__title">{TITLES[step]}</h1>

      <StepFields step={step} draft={draft} onChange={onChange} errorFor={errorFor} />

      <div className="actions">
        <button type="button" className="button button--secondary" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="button button--primary">
          {position === steps.length ? 'See the plan' : 'Continue'}
        </button>
      </div>
    </form>
  )
}

interface FieldsProps {
  step: StepId
  draft: DraftAnswers
  onChange: (patch: DraftAnswers) => void
  errorFor: (field: AnswerField) => string | undefined
}

function StepFields({ step, draft, onChange, errorFor }: FieldsProps) {
  const inputId = useId()

  switch (step) {
    case 'organization':
      return (
        <div className="text-field">
          <label htmlFor={inputId} className="text-field__label">
            Organization name
          </label>
          <p className="choice-group__hint">Use a fictional name. This prototype is for demonstration only.</p>
          <input
            id={inputId}
            className="text-field__input"
            value={draft.organizationName ?? ''}
            onChange={(event) => onChange({ organizationName: event.target.value })}
            autoComplete="off"
          />
          {errorFor('organizationName') && (
            <p className="field-error" role="alert">
              {errorFor('organizationName')}
            </p>
          )}
        </div>
      )

    case 'platforms':
      return (
        <ChoiceGroup
          mode="multiple"
          legend="Select all that apply"
          choices={PLATFORM_CHOICES}
          value={draft.platforms}
          onChange={(platforms) => onChange({ platforms })}
          error={errorFor('platforms')}
        />
      )

    case 'apple':
      return (
        <>
          <ChoiceGroup
            mode="single"
            legend="Does the client have an Apple Developer account?"
            choices={APPLE_STATUS_CHOICES}
            value={draft.appleAccountStatus}
            onChange={(appleAccountStatus) => onChange({ appleAccountStatus })}
            error={errorFor('appleAccountStatus')}
          />
          <ChoiceGroup
            mode="single"
            legend="What access will the client give Empyrean?"
            choices={APPLE_ACCESS_CHOICES}
            value={draft.appleAccess}
            onChange={(appleAccess) => onChange({ appleAccess })}
            error={errorFor('appleAccess')}
          />
        </>
      )

    case 'google':
      return (
        <>
          <ChoiceGroup
            mode="single"
            legend="Does the client have a Google Play developer account?"
            choices={GOOGLE_STATUS_CHOICES}
            value={draft.googleAccountStatus}
            onChange={(googleAccountStatus) => onChange({ googleAccountStatus })}
            error={errorFor('googleAccountStatus')}
          />
          <ChoiceGroup
            mode="single"
            legend="What access will the client give Empyrean?"
            choices={GOOGLE_ACCESS_CHOICES}
            value={draft.googleAccess}
            onChange={(googleAccess) => onChange({ googleAccess })}
            error={errorFor('googleAccess')}
          />
        </>
      )

    case 'contacts':
      return (
        <>
          <ChoiceGroup
            mode="single"
            legend="Has the client confirmed a primary contact for onboarding?"
            choices={TRI_CHOICES}
            value={draft.clientContactConfirmed}
            onChange={(clientContactConfirmed) => onChange({ clientContactConfirmed })}
            error={errorFor('clientContactConfirmed')}
          />
          {needsRegistration(draft, new Set(draft.platforms ?? [])) && (
            <ChoiceGroup
              mode="single"
              legend="Has the client identified who will register the new account and who will verify them?"
              hint="Apple and Google need an authorized representative and a separate verification contact. Their details go to the store, not to us."
              choices={TRI_CHOICES}
              value={draft.registrationContactsReady}
              onChange={(registrationContactsReady) => onChange({ registrationContactsReady })}
              error={errorFor('registrationContactsReady')}
            />
          )}
        </>
      )

    case 'restrictions':
      return (
        <>
          <ChoiceGroup
            mode="single"
            legend="Does the client need a security review before giving Empyrean access?"
            choices={TRI_CHOICES}
            value={draft.securityRestrictions}
            onChange={(securityRestrictions) => onChange({ securityRestrictions })}
            error={errorFor('securityRestrictions')}
          />
          <BlockersField draft={draft} onChange={onChange} error={errorFor('knownBlockers')} />
        </>
      )
  }
}

/** "None of these" is an explicit answer (an empty list), different from not answering. */
function BlockersField({
  draft,
  onChange,
  error,
}: {
  draft: DraftAnswers
  onChange: (patch: DraftAnswers) => void
  error: string | undefined
}) {
  const noneChosen = draft.knownBlockers !== undefined && draft.knownBlockers.length === 0
  return (
    <div>
      <ChoiceGroup
        mode="multiple"
        legend="Any known blockers?"
        choices={BLOCKER_CHOICES}
        value={draft.knownBlockers}
        onChange={(knownBlockers) => onChange({ knownBlockers: knownBlockers.length > 0 ? knownBlockers : undefined })}
        error={error}
      />
      <label className="choice choice--standalone">
        <input type="checkbox" checked={noneChosen} onChange={() => onChange({ knownBlockers: noneChosen ? undefined : [] })} />
        <span className="choice__label">None of these</span>
      </label>
    </div>
  )
}
