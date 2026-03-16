import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAssessment } from '../context/AssessmentContext'
import RoketsanLogo from '../components/RoketsanLogo'
import StepIndicator from '../components/StepIndicator'

const EMAILS = [
  { id: 'email_1', from: 'Genel Müdür', subject: 'ACIL: DSB Sunumu Yarın Sabah 09:00', preview: 'Savunma Sanayi Başkanlığı sunumunu bugün mesai bitimine kadar onaylamanız gerekmektedir...', time: '08:47', priority: 'Q1' },
  { id: 'email_2', from: 'İK Departmanı', subject: 'Q3 Yetkinlik Gelişim Planı — Gözden Geçirme', preview: 'Ekibinizin yıllık yetkinlik gelişim planını gelecek ay başına kadar onaylayabilir misiniz?', time: '09:12', priority: 'Q2' },
  { id: 'email_3', from: 'Sekreterya', subject: 'Çarşamba Toplantı Odası Rezervasyonu', preview: 'Çarşamba günkü haftalık ekip toplantısı için toplantı odası rezervasyonu yapılması gerekmektedir.', time: '09:35', priority: 'Q3' },
  { id: 'email_4', from: 'Sosyal Kulüp', subject: 'Yaz Pikniği Organizasyonu — Oy Kullanın', preview: 'Bu yılki yaz pikniği için tarih ve mekan seçimine katılımınızı bekliyoruz. Anket linki ektedir.', time: '10:02', priority: 'Q4' },
  { id: 'email_5', from: 'Tedarik Zinciri', subject: 'ACIL: Kritik Parça Stoğu Bitti', preview: 'XR-7 projesi için kritik elektronik parça stoğumuz tükendi. Alternatif tedarikçi araştırması yapılmalı.', time: '10:18', priority: 'Q1' },
  { id: 'email_6', from: 'Proje Ofisi', subject: 'Uzun Vadeli Ar-Ge Stratejisi Taslağı', preview: '2025-2030 Ar-Ge yol haritası taslağı hazırlandı. Görüşlerinizi paylaşmanızı rica ederiz.', time: '11:05', priority: 'Q2' },
]

const QUADRANTS = [
  { id: 'Q1', label: 'Acil & Önemli', sub: 'Hemen Yap', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
  { id: 'Q2', label: 'Önemli & Acil Değil', sub: 'Planla', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
  { id: 'Q3', label: 'Acil & Önemsiz', sub: 'Delege Et', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  { id: 'Q4', label: 'Acil Değil & Önemsiz', sub: 'Ertele / Sil', color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.25)' },
]

export default function InTray() {
  const navigate = useNavigate()
  const { session, setIntrayResult } = useAssessment()
  const [placements, setPlacements] = useState({})
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const unplaced = EMAILS.filter(e => !placements[e.id])
  const allPlaced = EMAILS.every(e => placements[e.id])

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
      const res = await axios.post('https://roketsan-assessment.onrender.com/api/submit-intray', {
        session_id: session?.session_id,
        selections: placements
      })
      setIntrayResult(res.data.result)
    } catch {
      setIntrayResult({ totalScore: 0, percentage: 0, results: [] })
    }
    navigate('/outro')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      <div className="grid-bg" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '24px 48px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <RoketsanLogo size={28} />
          <StepIndicator current={5} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>MODÜL 04</div>
        </div>
        <div className="progress-bar" style={{ borderRadius: 0, height: 3 }}>
          <div className="progress-fill" style={{ width: '80%' }} />
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
          <div className="fade-in" style={{ marginBottom: 28 }}>
            <span className="badge badge-medium" style={{ marginBottom: 12, display: 'inline-flex' }}>IN-TRAY EGZERSİZİ</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Eisenhower Matrisi — E-posta Önceliklendirme
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              E-postaları sürükleyerek doğru kadrana yerleştirin. {EMAILS.length - Object.keys(placements).length} e-posta kaldı.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>

            {/* Email inbox */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 12 }}>
                GELEN KUTUSU ({unplaced.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {unplaced.map(email => (
                  <div key={email.id} draggable
                    onDragStart={() => onDragStart(email.id)}
                    onDragEnd={onDragEnd}
                    style={{
                      background: dragging === email.id ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      border: `1px solid ${dragging === email.id ? 'var(--accent-green)' : 'var(--border-dim)'}`,
                      borderRadius: 8, padding: '12px 14px', cursor: 'grab',
                      opacity: dragging === email.id ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-blue)' }}>{email.from}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{email.time}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>{email.subject}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{email.preview.substring(0, 60)}...</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {QUADRANTS.map(q => (
                <div key={q.id}
                  onDragOver={e => onDragOver(e, q.id)}
                  onDrop={e => onDrop(e, q.id)}
                  style={{
                    background: dragOver === q.id ? q.bg : 'var(--bg-card)',
                    border: `2px solid ${dragOver === q.id ? q.color : q.border}`,
                    borderRadius: 12, padding: '16px',
                    minHeight: 180, transition: 'all 0.2s ease'
                  }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: q.color }}>{q.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: q.color, opacity: 0.7, letterSpacing: 1 }}>{q.sub}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {EMAILS.filter(e => placements[e.id] === q.id).map(email => (
                      <div key={email.id} style={{
                        background: 'var(--bg-secondary)', border: `1px solid ${q.border}`,
                        borderRadius: 6, padding: '8px 10px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8
                      }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{email.subject}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{email.from}</div>
                        </div>
                        <button onClick={() => removeFromQuadrant(email.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                    {EMAILS.filter(e => placements[e.id] === q.id).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', opacity: 0.5 }}>
                        E-posta sürükleyin
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={!allPlaced || submitting}>
              {submitting ? 'Gönderiliyor...' : 'Matrisi Onayla → Tamamla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
