import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAssessmentStore } from '../store/assessmentStore'
import RoketsanLogo from '../components/RoketsanLogo'
import StepIndicator from '../components/StepIndicator'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function IceBreaker() {
  const navigate = useNavigate()
  const { session, setIceBreakerResult } = useAssessmentStore()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { generateQuestions() }, [])

  async function generateQuestions() {
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/generate-icebreaker`, {
        session_id: session?.session_id
      })
      setQuestions(res.data.questions || [])
    } catch (err) {
      console.error('IceBreaker generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const q = questions[current]
  const progress = questions.length > 0 ? (current / questions.length) * 100 : 0

  function handleSelect(option) { setSelected(option.id) }

  async function handleNext() {
    if (!selected || !q) return
    const selectedOption = q.options.find(o => o.id === selected)
    const newAnswers = { ...answers, [q.id]: selectedOption }

    if (current < questions.length - 1) {
      setAnimating(true)
      setTimeout(() => {
        setAnswers(newAnswers)
        setCurrent(current + 1)
        setSelected(null)
        setAnimating(false)
      }, 300)
    } else {
      // Last question — submit to backend
      setSubmitting(true)
      try {
        const answersArray = Object.entries(newAnswers).map(([questionId, option]) => ({
          questionId: parseInt(questionId),
          selectedOptionId: option.id
        }))

        const res = await axios.post(`${API}/api/submit-icebreaker`, {
          session_id: session?.session_id,
          answers: answersArray
        })

        const result = res.data.result
        setIceBreakerResult(result)
      } catch (err) {
        console.error('IceBreaker submit failed:', err)
        // Fallback: calculate locally
        const scores = {}
        Object.values(newAnswers).forEach(ans => {
          if (!scores[ans.competency]) scores[ans.competency] = 0
          scores[ans.competency] += ans.score
        })
        setIceBreakerResult({ answers: newAnswers, scores, totalAnswers: Object.keys(newAnswers).length })
      } finally {
        setSubmitting(false)
        navigate('/scenario')
      }
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
        <div className="grid-bg" />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <RoketsanLogo size={32} />
          <div style={{ marginTop: 32, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent-green)', letterSpacing: 2 }}>
            ▶ AI SORULARI HAZIRLANIYOR...
          </div>
          <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 14 }}>
            Departmanınıza özel sorular üretiliyor
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!q) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" />
      <div className="glow-orb" style={{ width: 500, height: 500, background: 'rgba(14,165,233,0.05)', top: -100, right: -100 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ padding: '24px 48px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <RoketsanLogo size={28} />
          <StepIndicator current={2} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            {current + 1} / {questions.length}
          </div>
        </div>

        {/* Progress */}
        <div className="progress-bar" style={{ borderRadius: 0, height: 3 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Content */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
          <div style={{ marginBottom: 40, opacity: animating ? 0 : 1, transition: 'opacity 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span className="badge badge-medium">AI ISINMA SORUSU</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                Soru {current + 1} / {questions.length}
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1 }}>
                ✦ Gemini AI
              </span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, lineHeight: 1.4, color: 'var(--text-primary)', marginBottom: 40 }}>
              {q.question}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {q.options.map((opt, i) => (
                <button key={opt.id} onClick={() => handleSelect(opt)}
                  style={{
                    background: selected === opt.id ? 'rgba(0,255,136,0.1)' : 'var(--bg-card)',
                    border: `1px solid ${selected === opt.id ? 'var(--accent-green)' : 'var(--border-dim)'}`,
                    borderRadius: 10, padding: '18px 24px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
                    transform: selected === opt.id ? 'translateX(8px)' : 'translateX(0)'
                  }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${selected === opt.id ? 'var(--accent-green)' : 'var(--border-dim)'}`,
                    background: selected === opt.id ? 'var(--accent-green)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
                    color: selected === opt.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span style={{ color: selected === opt.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5 }}>
                    {opt.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
            <button className="btn-primary" onClick={handleNext} disabled={!selected || submitting}>
              {submitting ? 'Kaydediliyor...' : current < questions.length - 1 ? 'Sonraki →' : 'Senaryoya Geç →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
