import { DEMO_SCENARIOS, type DemoScenario } from '../data/demoScenarios'

interface Props {
  onStart: () => void
  onLoadScenario: (scenario: DemoScenario) => void
}

export function Welcome({ onStart, onLoadScenario }: Props) {
  return (
    <section className="card card--welcome">
      <img className="welcome-logo" src="/branding/bgo-icon.png" alt="Benefits Go" />
      <h1 className="card__title">Set up your branded Benefits Go app</h1>
      <p className="lead">
        To publish your branded app, Empyrean needs access to your organization's Apple and Google developer accounts.
        Answer a few quick questions and we'll give you a step-by-step checklist with exactly what to do. No need to read
        through the full guide.
      </p>
      <ul className="welcome-list">
        <li>About 2 minutes of questions</li>
        <li>Only the steps that apply to you, in the right order</li>
        <li>Check off steps as you go. Your progress is saved in this browser.</li>
      </ul>
      <button type="button" className="button button--primary" onClick={onStart}>
        Get started
      </button>

      <details className="demo-picker">
        <summary>Demo: load an example</summary>
        <div className="scenarios">
          {DEMO_SCENARIOS.map((scenario) => (
            <button key={scenario.id} type="button" className="scenario" onClick={() => onLoadScenario(scenario)}>
              <span className="scenario__id">{scenario.id}</span>
              <span>
                <span className="scenario__title">{scenario.title}</span>
                <span className="scenario__description">{scenario.description}</span>
              </span>
            </button>
          ))}
        </div>
      </details>
    </section>
  )
}
