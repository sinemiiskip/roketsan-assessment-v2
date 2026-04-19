import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAssessmentStore } from '../store/assessmentStore'
import RoketsanLogo from '../components/RoketsanLogo'
import StepIndicator from '../components/StepIndicator'

const URGENCY_COLORS = {
  critical: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.4)', text: '#ef4444', label: 'KRİTİK' },
  high: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b', label: 'YÜKSEK' },
  medium: { bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.3)', text: '#00ff88', label: 'ORTA' },
}

export default function Scenario() {
  const navigate = useNavigate()
  const { session, scenario, setScenario, setScenarioResult } = useAssessmentStore()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const MIN_WORDS = 80

  useEffect(() => {
    if (scenario) { setLoading(false); return }
    generateScenario()
  }, [])

  async function generateScenario() {
    setLoading(true)
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/generate-content`, {
        session_id: session?.session_id
      })
      setScenario(res.data.scenario)
    } catch {
      setScenario({
        title: 'Kritik Tedarik Zinciri Krizi',
        urgency: 'critical',
        context: 'Roketsan\'ın yeni nesil güdüm sistemi projesinde kritik bir bileşenin tedarikçisi, ihracat lisansı askıya alınması nedeniyle teslimatı durdurdu.',
        crisis: 'Üretim hattı 48 saat içinde duracak. Mevcut stok kritik seviyenin altında. Savunma Sanayi Başkanlığı proje milestone toplantısı 72 saat sonra yapılacak. Yedek tedarikçi listesi güncel değil ve alternatif bileşen entegrasyonu için mühendislik onayı gerekiyor. Projenin gecikmesi durumunda sözleşme cezası devreye girecek.',
        keyQuestion: 'Bu krizi yönetmek için ilk 4 saatte hangi stratejik adımları atarsınız? Kaynakları nasıl önceliklendirirsiniz?',
        stakeholders: ['Tedarik Zinciri Müdürü', 'Üretim Müdürü', 'Proje Yöneticisi', 'DSB Temsilcisi'],
        timeConstraint: '48 saat içinde üretim hattı durma riski',
        expectedCompetencies: ['crisis_management', 'decision_making', 'strategic_thinking']
      })
    } finally {
      setLoading(false)
    }
  }

  function handleReportChange(e) {
    const val = e.target.value
    setReport(val)
    setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0)
  }

  async function handleSubmit() {
    if (wordCount < MIN_WORDS) return
    setSubmitting(true)
    try {
      // Submit to backend for scoring
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/submit-scenario`, {
        session_id: session?.session_id,
        response: report
      })
      setScenarioResult(res.data.result)
    } catch (err) {
      console.error('Scenario submit failed:', err)
      // Fallback: save locally
      setScenarioResult({ report, wordCount, submittedAt: new Date().toISOString() })
    } finally {
      setSubmitting(false)
      navigate('/audio')
    }
  }

  const urgency = URGENCY_COLORS[scenario?.urgency] || URGENCY_COLORS.medium

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      <div className="grid-bg" />
      <div className="glow-orb" style={{ width: 600, height: 600, background: 'rgba(239,68,68,0.04)', top: -200, left: -200 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ padding: '24px 48px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <RoketsanLogo size={28} />
          <StepIndicator current={3} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>MODÜL 02</div>
        </div>
        <div className="progress-bar" style={{ borderRadius: 0, height: 3 }}>
          <div className="progress-fill" style={{ width: '40%' }} />
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

          {/* Left: Scenario */}
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span className="badge badge-critical">KRİZ SENARYOSU</span>
              {scenario && (
                <span style={{ padding: '3px 10px', borderRadius: 20, background: urgency.bg, border: `1px solid ${urgency.border}`, color: urgency.text, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2 }}>
                  ● {urgency.label}
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '40px 0' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent-green)', letterSpacing: 2 }}>
                  ▶ AI SENARYO ÜRETİLİYOR...
                </div>
                {[1,2,3].map(i => (
                  <div key={i} style={{ height: 16, background: 'var(--bg-card)', borderRadius: 4, width: `${100 - i*10}%`, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : scenario && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {scenario.title}
                </h2>

                <div style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 10 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>ARKA PLAN</div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{scenario.context}</p>
                </div>

                <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.05)', border: `1px solid ${urgency.border}`, borderRadius: 10 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: urgency.text, letterSpacing: 2, marginBottom: 8 }}>KRİZ DURUMU</div>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>{scenario.crisis}</p>
                </div>

                {scenario.stakeholders && (
                  <div style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 10 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 12 }}>PAYDAŞLAR</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {scenario.stakeholders.map(s => (
                        <span key={s} style={{ padding: '4px 12px', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 20, fontSize: 12, color: 'var(--accent-blue)' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ padding: '16px 20px', background: 'rgba(0,255,136,0.05)', border: '1px solid var(--border-active)', borderRadius: 10 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)', letterSpacing: 2, marginBottom: 8 }}>SORU</div>
                  <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>{scenario.keyQuestion}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
                  <span style={{ color: '#ef4444', fontSize: 16 }}>⏱</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ef4444' }}>{scenario.timeConstraint}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Report */}
          <div className="fade-in-delay-1">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span className="badge badge-medium">RAPOR YAZIMI</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>Min. {MIN_WORDS} kelime</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Kriz Yönetim Raporunuz</label>
              <textarea
                className="input-field"
                placeholder={`Senaryoyu okuyun ve kriz yönetim raporunuzu yazın.\n\nÖnerilen yapı:\n• Durumu nasıl değerlendiriyorsunuz?\n• Hangi aksiyonları alırsınız ve neden?\n• Kaynakları nasıl önceliklendirirsiniz?\n• Risk ve fırsatlar neler?`}
                value={report}
                onChange={handleReportChange}
                style={{ minHeight: 340, resize: 'vertical', lineHeight: 1.7 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: wordCount >= MIN_WORDS ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                {wordCount} / {MIN_WORDS} kelime {wordCount >= MIN_WORDS ? '✓' : ''}
              </div>
              <div className="progress-bar" style={{ width: 120 }}>
                <div className="progress-fill" style={{ width: `${Math.min(100, (wordCount / MIN_WORDS) * 100)}%` }} />
              </div>
            </div>

            <button className="btn-primary" onClick={handleSubmit}
              disabled={wordCount < MIN_WORDS || submitting || loading}
              style={{ width: '100%' }}>
              {submitting ? 'Kaydediliyor...' : 'Raporu Gönder → Sesli Yanıta Geç'}
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
              Raporunuz AI tarafından değerlendirilecektir.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
