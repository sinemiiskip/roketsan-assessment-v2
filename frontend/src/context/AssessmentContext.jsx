import { createContext, useContext, useState } from 'react'

const AssessmentContext = createContext(null)

export function AssessmentProvider({ children }) {
  const [session, setSession] = useState(null)
  const [scenario, setScenario] = useState(null)
  const [iceBreakerResult, setIceBreakerResult] = useState(null)
  const [scenarioResult, setScenarioResult] = useState(null)
  const [audioResult, setAudioResult] = useState(null)
  const [intrayResult, setIntrayResult] = useState(null)

  return (
    <AssessmentContext.Provider value={{
      session, setSession,
      scenario, setScenario,
      iceBreakerResult, setIceBreakerResult,
      scenarioResult, setScenarioResult,
      audioResult, setAudioResult,
      intrayResult, setIntrayResult
    }}>
      {children}
    </AssessmentContext.Provider>
  )
}

export function useAssessment() {
  return useContext(AssessmentContext)
}
