import { useId } from 'react'
import type { Choice } from '../questionnaire/choices'

interface CommonProps<Value extends string> {
  legend: string
  hint?: string
  choices: readonly Choice<Value>[]
  error?: string
}

type Props<Value extends string> = CommonProps<Value> &
  (
    | { mode: 'single'; value: Value | undefined; onChange: (value: Value) => void }
    | { mode: 'multiple'; value: readonly Value[] | undefined; onChange: (value: Value[]) => void }
  )

/** A labelled set of radio buttons (single) or checkboxes (multiple). */
export function ChoiceGroup<Value extends string>(props: Props<Value>) {
  const name = useId()
  const errorId = `${name}-error`

  const isChecked = (value: Value) =>
    props.mode === 'single' ? props.value === value : (props.value ?? []).includes(value)

  const toggle = (value: Value) => {
    if (props.mode === 'single') {
      props.onChange(value)
      return
    }
    const current = props.value ?? []
    props.onChange(current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
  }

  return (
    <fieldset className="choice-group" aria-describedby={props.error ? errorId : undefined}>
      <legend className="choice-group__legend">{props.legend}</legend>
      {props.hint && <p className="choice-group__hint">{props.hint}</p>}
      {props.choices.map((choice) => (
        <label key={choice.value} className="choice">
          <input
            type={props.mode === 'single' ? 'radio' : 'checkbox'}
            name={name}
            value={choice.value}
            checked={isChecked(choice.value)}
            onChange={() => toggle(choice.value)}
          />
          <span>
            <span className="choice__label">{choice.label}</span>
            {choice.hint && <span className="choice__hint">{choice.hint}</span>}
          </span>
        </label>
      ))}
      {props.error && (
        <p id={errorId} className="field-error" role="alert">
          {props.error}
        </p>
      )}
    </fieldset>
  )
}
