import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAssessmentStore = create(
  persist(
    (set, get) => ({
      // Session
      session: null,
      setSession: (session) => set({ session }),

      // Scenario
      scenario: null,
      setScenario: (scenario) => set({ scenario }),

      // Results
      iceBreakerResult: null,
      setIceBreakerResult: (result) => set({ iceBreakerResult: result }),

      scenarioResult: null,
      setScenarioResult: (result) => set({ scenarioResult: result }),

      audioResult: null,
      setAudioResult: (result) => set({ audioResult: result }),

      intrayResult: null,
      setIntrayResult: (result) => set({ intrayResult: result }),

      // Get everything together
      getOverallResults: () => {
        const { session, scenario, iceBreakerResult, scenarioResult, audioResult, intrayResult } = get();
        if (!session) return null;
        return { session, scenario, iceBreakerResult, scenarioResult, audioResult, intrayResult };
      },

      // Clear on assessment complete or restart
      clearAssessment: () => set({
        session: null,
        scenario: null,
        iceBreakerResult: null,
        scenarioResult: null,
        audioResult: null,
        intrayResult: null,
      }),
    }),
    {
      name: 'roketsan-assessment', // saves to localStorage automatically
      partialize: (state) => ({
        session: state.session,
        scenario: state.scenario,
        iceBreakerResult: state.iceBreakerResult,
        scenarioResult: state.scenarioResult,
        audioResult: state.audioResult,
        intrayResult: state.intrayResult,
      }),
    }
  )
);