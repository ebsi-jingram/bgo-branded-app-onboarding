import { useReducer } from 'react'
import { QuestionStep } from './components/QuestionStep'
import { Results } from './components/Results'
import { Welcome } from './components/Welcome'
import { reduce } from './questionnaire/flow'

function App() {
  const [screen, dispatch] = useReducer(reduce, { kind: 'welcome' })

  return (
    <>
      <header className="banner">
        <span className="banner__brand">
          <img className="banner__logo" src="/branding/bgo-icon.png" alt="" />
          Benefits Go · Branded apps
        </span>
        <span className="banner__tag">Prototype · not approved process · fictional data only</span>
      </header>
      <div className="brand-stripe" aria-hidden="true" />
      <main className="page">
        {screen.kind === 'welcome' && <Welcome onStart={() => dispatch({ type: 'start' })} />}
        {screen.kind === 'question' && (
          <QuestionStep
            key={screen.step}
            step={screen.step}
            draft={screen.draft}
            showErrors={screen.showErrors}
            onChange={(patch) => dispatch({ type: 'update', patch })}
            onContinue={() => dispatch({ type: 'continue' })}
            onBack={() => dispatch({ type: 'back' })}
          />
        )}
        {screen.kind === 'results' && (
          <Results
            answers={screen.answers}
            onBack={() => dispatch({ type: 'back' })}
            onRestart={() => dispatch({ type: 'restart' })}
          />
        )}
      </main>
    </>
  )
}

export default App
