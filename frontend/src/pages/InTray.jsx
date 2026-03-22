import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAssessment } from '../context/AssessmentContext'
import RoketsanLogo from '../components/RoketsanLogo'
import StepIndicator from '../components/StepIndicator'

const API = 'https://roketsan-assessment.onrender.com'

const QUADRANTS = [
  { id: 'Q1', label: 'Acil & Önemli', sub: 'Hemen Yap', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', icon: '🔴' },
  { id: 'Q2', label: 'Önemli & Acil Değil', sub: 'Planla', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', icon: '🔵' },
  { id: 'Q3', label: 'Acil & Önemsiz', sub: 'Delege Et', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', icon: '🟡' },
  { id: 'Q4', label: 'Acil Değil & Önemsiz', sub: 'Ertele / Sil', color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.3)', icon: '⚫' },
]

export default function InTray() {
  const navigate = useNavigate()
  const { session, setIntrayResult } = useAssessment()
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [placements, setPlacements] = useState({})
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { generateEmails() }, [])

  async function generateEmails() {
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/generate-intray`, {
        session_id: session?.session_id
      })
      setEmails(res.data.emails || [])
    } catch (err) {
      console.error('InTray generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const unplaced = emails.filter(e => !placements[e.id])
  const allPlaced = emails.length > 0 && emails.every(e => placements[e.id])

  function onDragStart(emailId) { setDragging(emailId) }
  function onDragEnd() { setDragging(null); setDragOver(null) }
  function onDragOver(e, qId) { e.preventDefault(); setDragOver(qId) }
  function onDrop(e, qId) {
    e.preventDefault()
    if (dragging) setPlacements(p => ({ ...p, [dragging]: qId }))
    setDragging(null); setDragOver(null)
  }
  function removeFromQuadrant(emailId) {
    setPlacements(p => { const n = { ...p }; delete n[emailId]; return n })
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await axios.post(`${API}/api/submit-intray`, {
        session_id: session?.session_id,
        selections: placements,
        emails: emails
      })
      setIntrayResult(res.data.result)
    } catch {
      // Calculate locally if API fails
      let totalScore = 0
      const results = emails.map(email => {
        const userChoice = placements[email.id]
        const isCorrect = userChoice === email.correctQuadrant
        const earnedPoints = isCorrect ? email.points : Math.round(email.points * 0.5)
        totalScore += earnedPoints
        return { emailId: email.id, subject: email.subject, userChoice, correctAnswer: email.correctQuadrant, isCorrect, earnedPoints, maxPoints: email.points }
      })
      const maxScore = emails.reduce((sum, e) => sum + e.points, 0)
      setIntrayResult({ totalScore, maxScore, percentage: Math.round((totalScore / maxScore) * 100), results })
    }
    navigate('/outro')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
        <div className="grid-bg" />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <RoketsanLogo size={32} />
          <div style={{ marginTop: 32, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent-green)', letterSpacing: 2 }}>
            ▶ AI MAİLLER HAZIRLANIYOR...
          </div>
          <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 14 }}>
            {session?.department} departmanına özel e-postalar üretiliyor
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', opacity: 0.7 }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      <div className="grid-bg" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ padding: '24px 48px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <RoketsanLogo size={28} />
          <StepIndicator current={5} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1 }}>
              ✦ Gemini AI
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>MODÜL 04</div>
          </div>
        </div>
        <div className="progress-bar" style={{ borderRadius: 0, height: 3 }}>
          <div className="progress-fill" style={{ width: '80%' }} />
        </div>

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
          <div className="fade-in" style={{ marginBottom: 20 }}>
            <span className="badge badge-medium" style={{ marginBottom: 8, display: 'inline-flex' }}>IN-TRAY EGZERSİZİ</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Eisenhower Matrisi — E-posta Önceliklendirme
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              E-postaları okuyun, sürükleyerek doğru kadrana yerleştirin. {unplaced.length} e-posta kaldı.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            {/* Email inbox */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 10 }}>
                GELEN KUTUSU ({unplaced.length}/{emails.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                {unplaced.map(email => (
                  <div key={email.id} draggable
                    onDragStart={() => onDragStart(email.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => setSelectedEmail(selectedEmail?.id === email.id ? null : email)}
                    style={{
                      background: selectedEmail?.id === email.id ? 'var(--bg-card-hover)' : dragging === email.id ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      border: `1px solid ${selectedEmail?.id === email.id ? 'var(--accent-blue)' : dragging === email.id ? 'var(--accent-green)' : 'var(--border-dim)'}`,
                      borderRadius: 8, padding: '12px 14px', cursor: 'grab',
                      opacity: dragging === email.id ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-blue)' }}>{email.from}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{email.time}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>{email.subject}</div>
                    {selectedEmail?.id === email.id ? (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-dim)' }}>
                        {email.body}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {email.body?.substring(0, 70)}...
                        <span style={{ color: 'var(--accent-blue)', marginLeft: 4 }}>oku</span>
                      </div>
                    )}
                  </div>
                ))}
                {unplaced.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    ✓ Tüm e-postalar yerleştirildi
                  </div>
                )}
              </div>
            </div>

            {/* Matrix */}
            <div>
              {/* Quadrant labels */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 8 }}>
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', padding: '4px', background: 'var(--bg-card)', borderRadius: 4 }}>← ACİL DEĞİL | ACİL →</div>
                <div style={{ opacity: 0 }}>.</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {QUADRANTS.map(q => (
                  <div key={q.id}
                    onDragOver={e => onDragOver(e, q.id)}
                    onDrop={e => onDrop(e, q.id)}
                    style={{
                      background: dragOver === q.id ? q.bg : 'var(--bg-card)',
                      border: `2px solid ${dragOver === q.id ? q.color : q.border}`,
                      borderRadius: 12, padding: '14px',
                      minHeight: 200, transition: 'all 0.2s ease'
                    }}>
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{q.icon}</span>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: q.color }}>{q.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: q.color, opacity: 0.7, letterSpacing: 1 }}>{q.sub}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {emails.filter(e => placements[e.id] === q.id).map(email => (
                        <div key={email.id} style={{
                          background: 'var(--bg-secondary)', border: `1px solid ${q.border}`,
                          borderRadius: 6, padding: '8px 10px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{email.subject}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{email.from?.split(' - ')[0]}</div>
                          </div>
                          <button onClick={() => removeFromQuadrant(email.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 0 }}>×</button>
                        </div>
                      ))}
                      {emails.filter(e => placements[e.id] === q.id).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.5 }}>
                          E-posta sürükleyin
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
              {Object.keys(placements).length} / {emails.length} e-posta yerleştirildi
            </div>
            <button className="btn-primary" onClick={handleSubmit} disabled={!allPlaced || submitting}>
              {submitting ? 'Gönderiliyor...' : 'Matrisi Onayla → Tamamla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
