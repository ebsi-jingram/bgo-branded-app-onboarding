import { useId } from 'react'
import {
  APPLE_ACCESS_CHOICES,
  APPLE_STATUS_CHOICES,
  GOOGLE_ACCESS_CHOICES,
  GOOGLE_STATUS_CHOICES,
  PLATFORM_CHOICES,
  SECURITY_CHOICES,
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
  organization: "Let's start with your organization",
  platforms: 'Where will your app be available?',
  apple: 'Your Apple account',
  google: 'Your Google Play account',
  security: 'Approvals',
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
        Question {position} of {steps.length}
      </p>
      <progress className="progress" value={position} max={steps.length} aria-hidden="true" />
      <h1 className="card__title">{TITLES[step]}</h1>

      <StepFields step={step} draft={draft} onChange={onChange} errorFor={errorFor} />

      <div className="actions">
        <button type="button" className="button button--secondary" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="button button--primary">
          {position === steps.length ? 'Show my checklist' : 'Continue'}
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
          <p className="choice-group__hint">This preview is for demonstration. Please use a made-up name.</p>
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
          legend="Choose all that apply"
          hint="Not sure? Your Empyrean Implementation representative can confirm."
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
            legend="Does your organization already have an Apple Developer account?"
            choices={APPLE_STATUS_CHOICES}
            value={draft.appleAccountStatus}
            onChange={(appleAccountStatus) => onChange({ appleAccountStatus })}
            error={errorFor('appleAccountStatus')}
          />
          <ChoiceGroup
            mode="single"
            legend="What access can you give Empyrean in App Store Connect?"
            hint="Your organization keeps ownership of the account either way."
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
            legend="Does your organization already have a Google Play developer account?"
            choices={GOOGLE_STATUS_CHOICES}
            value={draft.googleAccountStatus}
            onChange={(googleAccountStatus) => onChange({ googleAccountStatus })}
            error={errorFor('googleAccountStatus')}
          />
          <ChoiceGroup
            mode="single"
            legend="What access can you give Empyrean in Google Play Console?"
            hint="Your organization keeps ownership of the account either way."
            choices={GOOGLE_ACCESS_CHOICES}
            value={draft.googleAccess}
            onChange={(googleAccess) => onChange({ googleAccess })}
            error={errorFor('googleAccess')}
          />
        </>
      )

    case 'security':
      return (
        <ChoiceGroup
          mode="single"
          legend="Does your organization need to approve outside access before inviting Empyrean?"
          hint="For example, a security review by your IT team."
          choices={SECURITY_CHOICES}
          value={draft.securityReview}
          onChange={(securityReview) => onChange({ securityReview })}
          error={errorFor('securityReview')}
        />
      )
  }
}
