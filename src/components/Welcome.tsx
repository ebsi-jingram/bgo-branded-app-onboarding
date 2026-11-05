import { DEMO_SCENARIOS, type DemoScenario } from '../data/demoScenarios'

interface Props {
  onStart: () => void
  onLoadScenario: (scenario: DemoScenario) => void
}

export function Welcome({ onStart, onLoadScenario }: Props) {
  return (
    <section className="card card--welcome">
      <img className="welcome-logo" src="/branding/bgo-icon.png" alt="Benefits Go" />
      <h1 className="card__title">Branded app onboarding</h1>
      <p className="lead">
        Answer a few questions about a client's app stores and access. You'll get an implementation plan in the order
        the work can actually happen, showing who owns each step and what's blocked.
      </p>
      <ul className="welcome-list">
        <li>About 2 minutes, 5–6 short steps</li>
        <li>Different answers produce different plans</li>
        <li>Nothing is saved or sent anywhere</li>
      </ul>
      <button type="button" className="button button--primary" onClick={onStart}>
        Get started
      </button>

      <h2 className="scenarios__title">Or jump to a demo scenario</h2>
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
    </section>
  )
}
