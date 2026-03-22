import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAssessment } from '../context/AssessmentContext'
import RoketsanLogo from '../components/RoketsanLogo'

const API = 'https://roketsan-assessment.onrender.com'

export default function Outro() {
  const { session, audioResult, intrayResult, iceBreakerResult } = useAssessment()
  const [visible, setVisible] = useState(false)
  const [report, setReport] = useState(null)
  const [loadingReport, setLoadingReport] = useState(true)
  const [survey, setSurvey] = useState({ overall: 0, interface: 0, fairness: 0, submitted: false })

  useEffect(() => {
    setTimeout(() => setVisible(true), 300)
    generateReport()
  }, [])

  async function generateReport() {
    setLoadingReport(true)
    try {
      const scores = {
        icebreaker: iceBreakerResult ? 75 : 0,
        audio: audioResult?.overallScore || 0,
        intray: intrayResult?.percentage || 0
      }
      const overallScore = Math.round((scores.icebreaker + scores.audio + scores.intray) / 3)
      const grade = overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B+' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C+' : 'C'

      // AI rapor üret
      const prompt = `Sen Roketsan A.Ş. kıdemli liderlik değerlendirme uzmanısın.

Aday: ${session?.name}
Departman: ${session?.department}
Pozisyon: ${session?.position}

Değerlendirme sonuçları:
- Genel puan: ${overallScore}/100
- Not: ${grade}
- Ses analizi özeti: ${audioResult?.aiAnalysis?.summary || 'Tamamlandı'}
- Liderlik profili: ${audioResult?.aiAnalysis?.leadershipProfile || 'Belirleniyor'}
- Güçlü yönler: ${audioResult?.aiAnalysis?.strengths?.join(', ') || 'Analiz edildi'}
- In-Tray skoru: ${intrayResult?.percentage || 0}%

Kişiye özel, motive edici ve yapıcı bir geri bildirim raporu yaz (Türkçe).
Sadece JSON döndür:
{
  "headline": "Kısa ve güçlü bir başlık (örn: Analitik Düşünen Lider)",
  "overallFeedback": "3-4 cümle genel değerlendirme",
  "topStrength": "En güçlü yön ve bunu destekleyen 1-2 cümle",
  "keyDevelopment": "En önemli gelişim alanı ve somut öneri",
  "nextStep": "Kariyer gelişimi için 1 somut öneri",
  "motivationalNote": "Motive edici kapanış cümlesi"
}`

      const res = await axios.post(`${API}/api/generate-content`, {
        session_id: session?.session_id,
        customPrompt: prompt,
        isReport: true
      })

      // Gemini'den rapor al
      if (res.data?.report) {
        setReport({ ...res.data.report, overallScore, grade })
      } else {
        // Fallback rapor
        setReport({
          headline: audioResult?.aiAnalysis?.leadershipProfile || 'Yetkin Lider Adayı',
          overallFeedback: audioResult?.aiAnalysis?.summary || `${session?.name}, değerlendirme merkezi sürecini başarıyla tamamladı. Tüm modüllerde aktif katılım gösterdi.`,
          topStrength: audioResult?.aiAnalysis?.strengths?.[0] || 'Analitik yaklaşım ve problem çözme becerisi öne çıktı.',
          keyDevelopment: audioResult?.aiAnalysis?.improvements?.[0] || 'Stratejik iletişim becerilerini geliştirme fırsatı mevcut.',
          nextStep: 'Liderlik gelişim programlarına katılım değerlendirilebilir.',
          motivationalNote: 'Roketsan\'ın geleceğini şekillendirme yolculuğunuzda başarılar dileriz.',
          overallScore,
          grade
        })
      }
    } catch (err) {
      const overallScore = Math.round(((audioResult?.overallScore || 0) + (intrayResult?.percentage || 0)) / 2)
      setReport({
        headline: 'Değerlendirme Tamamlandı',
        overallFeedback: `${session?.name}, tüm değerlendirme modüllerini başarıyla tamamladı.`,
        topStrength: audioResult?.aiAnalysis?.strengths?.[0] || 'Aktif katılım ve çözüm odaklı yaklaşım.',
        keyDevelopment: 'Sonuçlarınız İK ekibi tarafından detaylı olarak incelenecektir.',
        nextStep: 'Değerlendirme sürecinin tamamlanması için İK departmanıyla iletişime geçiniz.',
        motivationalNote: 'Başarılar!',
        overallScore,
        grade: overallScore >= 80 ? 'B+' : overallScore >= 70 ? 'B' : 'C+'
      })
    } finally {
      setLoadingReport(false)
    }
  }

  function handleSurveySubmit() {
    setSurvey(s => ({ ...s, submitted: true }))
  }

  const gradeColor = report?.grade?.startsWith('A') ? '#00ff88' : report?.grade?.startsWith('B') ? '#3b82f6' : '#f59e0b'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" />
      <div className="glow-orb" style={{ width: 700, height: 700, background: 'rgba(0,255,136,0.05)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '48px 24px', opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ marginBottom: 24 }}>
            <RoketsanLogo size={28} />
          </div>

          {/* Animated checkmark */}
          <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 24px' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(0,255,136,0.15)" strokeWidth="2" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="#00ff88" strokeWidth="2"
                strokeDasharray="290" strokeDashoffset={visible ? 0 : 290}
                style={{ transition: 'stroke-dashoffset 1.2s ease', transformOrigin: 'center', transform: 'rotate(-90deg)' }} />
              <path d="M32 50 L44 62 L68 38" fill="none" stroke="#00ff88" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="50" strokeDashoffset={visible ? 0 : 50}
                style={{ transition: 'stroke-dashoffset 0.6s ease 0.8s' }} />
            </svg>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Değerlendirme <span style={{ color: 'var(--accent-green)' }}>Tamamlandı</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
            Tebrikler, <strong style={{ color: 'var(--text-primary)' }}>{session?.name}</strong>!
          </p>
        </div>

        {/* AI Geri Bildirim Raporu */}
        {loadingReport ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 16, padding: '32px', textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-green)', letterSpacing: 2, marginBottom: 16 }}>
              ▶ KİŞİSEL RAPOR HAZIRLANIYOR...
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', opacity: 0.7 }} />
              ))}
            </div>
          </div>
        ) : report && (
          <div style={{ marginBottom: 24 }}>
            {/* Score card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, background: 'rgba(0,255,136,0.05)', border: '1px solid var(--border-active)', borderRadius: 16, padding: '24px', marginBottom: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)', letterSpacing: 2, marginBottom: 8 }}>YAPAY ZEKA GERİ BİLDİRİM RAPORU</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  {report.headline}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{report.overallFeedback}</p>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 24px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-dim)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, color: gradeColor, lineHeight: 1 }}>{report.grade}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{report.overallScore}/100</div>
              </div>
            </div>

            {/* Detail cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 12, padding: '20px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)', letterSpacing: 2, marginBottom: 10 }}>💪 GÜÇLÜ YÖN</div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{report.topStrength}</p>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 12, padding: '20px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--warning)', letterSpacing: 2, marginBottom: 10 }}>🎯 GELİŞİM ALANI</div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{report.keyDevelopment}</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 12, padding: '20px', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-blue)', letterSpacing: 2, marginBottom: 10 }}>→ SONRAKİ ADIM</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{report.nextStep}</p>
            </div>

            <div style={{ background: 'rgba(0,255,136,0.03)', border: '1px solid var(--border-active)', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--accent-green)', fontStyle: 'italic' }}>"{report.motivationalNote}"</p>
            </div>
          </div>
        )}

        {/* Memnuniyet Anketi */}
        {!survey.submitted ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 16 }}>MEMNUNİYET ANKETİ</div>
            {[
              { key: 'overall', label: 'Değerlendirme süreci genel olarak nasıldı?' },
              { key: 'interface', label: 'Platform arayüzü kullanımı kolay mıydı?' },
              { key: 'fairness', label: 'Değerlendirme adil ve objektif görünüyor mu?' }
            ].map(item => (
              <div key={item.key} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{item.label}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(score => (
                    <button key={score} onClick={() => setSurvey(s => ({ ...s, [item.key]: score }))}
                      style={{
                        width: 40, height: 40, borderRadius: 8, border: `1px solid ${survey[item.key] >= score ? 'var(--accent-green)' : 'var(--border-dim)'}`,
                        background: survey[item.key] >= score ? 'rgba(0,255,136,0.15)' : 'transparent',
                        color: survey[item.key] >= score ? 'var(--accent-green)' : 'var(--text-muted)',
                        cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13, transition: 'all 0.2s'
                      }}>
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn-primary" onClick={handleSurveySubmit}
              disabled={!survey.overall || !survey.interface || !survey.fairness}
              style={{ marginTop: 8 }}>
              Anketi Gönder
            </button>
          </div>
        ) : (
          <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid var(--border-active)', borderRadius: 12, padding: '16px', textAlign: 'center', marginBottom: 24 }}>
            <span style={{ color: 'var(--accent-green)', fontSize: 14 }}>✓ Anket gönderildi. Geri bildiriminiz için teşekkürler!</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Sonuçlarınız İnsan Kaynakları departmanı tarafından değerlendirilecek ve size en kısa sürede bilgi verilecektir.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
            Bu sekmeyi güvenle kapatabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  )
}
