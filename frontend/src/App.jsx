import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import IceBreaker from './pages/IceBreaker'
import Scenario from './pages/Scenario'
import AudioResponse from './pages/AudioResponse'
import InTray from './pages/InTray'
import Outro from './pages/Outro'
import HRLogin from './pages/HRLogin'
import HRDashboard from './pages/HRDashboard'
import { AssessmentProvider } from './context/AssessmentContext'
import './index.css'

export default function App() {
  return (
    <AssessmentProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/icebreaker" element={<IceBreaker />} />
          <Route path="/scenario" element={<Scenario />} />
          <Route path="/audio" element={<AudioResponse />} />
          <Route path="/intray" element={<InTray />} />
          <Route path="/outro" element={<Outro />} />
          <Route path="/hr" element={<HRLogin />} />
          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AssessmentProvider>
  )
}
