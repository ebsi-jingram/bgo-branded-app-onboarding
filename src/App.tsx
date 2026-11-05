import { useEffect, useReducer } from 'react'
import { loadSaved, save } from './checklist/storage'
import { Checklist } from './components/Checklist'
import { QuestionStep } from './components/QuestionStep'
import { Welcome } from './components/Welcome'
import { type AppState, initialState, reduce } from './questionnaire/flow'

/** Pick up where the client left off, if this browser has a saved visit. */
function restore(): AppState {
  const saved = loadSaved(window.localStorage)
  if (saved === null) return initialState
  const state = reduce(initialState, { type: 'load', draft: saved.draft, done: saved.done })
  // Only resume straight into the checklist; half-finished answers start fresh.
  return state.screen.kind === 'checklist' ? state : initialState
}

function App() {
  const [state, dispatch] = useReducer(reduce, undefined, restore)
  const { screen, done } = state

  useEffect(() => {
    save(window.localStorage, screen.kind === 'welcome' ? null : { draft: screen.draft, done: [...done] })
  }, [screen, done])

  return (
    <>
      <header className="banner">
        <span className="banner__brand">
          <img className="banner__logo" src="/branding/bgo-icon.png" alt="" />
          Benefits Go · Branded app setup
        </span>
        <span className="banner__tag">Preview · not yet approved for client use</span>
      </header>
      <div className="brand-stripe" aria-hidden="true" />
      <main className={screen.kind === 'checklist' ? 'page page--wide' : 'page'}>
        {screen.kind === 'welcome' && (
          <Welcome
            onStart={() => dispatch({ type: 'start' })}
            onLoadScenario={(scenario) => dispatch({ type: 'load', draft: scenario.answers })}
          />
        )}
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
        {screen.kind === 'checklist' && (
          <Checklist
            answers={screen.answers}
            done={done}
            onToggle={(id) => dispatch({ type: 'toggle-step', id })}
            onChangeAnswers={() => dispatch({ type: 'back' })}
            onRestart={() => dispatch({ type: 'restart' })}
          />
        )}
      </main>
    </>
  )
}

export default App
