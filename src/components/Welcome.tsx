export function Welcome({ onStart }: { onStart: () => void }) {
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
    </section>
  )
}
