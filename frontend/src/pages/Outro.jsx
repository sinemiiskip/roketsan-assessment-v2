import { useEffect, useState } from 'react'
import { useAssessmentStore } from '../store/assessmentStore'
import RoketsanLogo from '../components/RoketsanLogo'

export default function Outro() {
  const { session, clearAssessment } = useAssessmentStore()
  const [visible, setVisible] = useState(false)
  const [survey, setSurvey] = useState({ overall: 0, interface: 0, fairness: 0, submitted: false })

  useEffect(() => {
    setTimeout(() => setVisible(true), 300)
    // Clear assessment data from localStorage after completion
    // Small delay to ensure data was saved to backend first
    setTimeout(() => clearAssessment(), 3000)
  }, [])

  function handleSurveySubmit() {
    setSurvey(s => ({ ...s, submitted: true }))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" />
      <div className="glow-orb" style={{ width: 700, height: 700, background: 'rgba(0,255,136,0.05)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '48px 24px', opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ marginBottom: 24 }}>
            <RoketsanLogo size={28} />
          </div>

          {/* Animated checkmark */}
          <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 32px' }}>
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

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
            Değerlendirme <span style={{ color: 'var(--accent-green)' }}>Tamamlandı</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7 }}>
            Tebrikler, <strong style={{ color: 'var(--text-primary)' }}>{session?.name}</strong>!<br />
            Tüm modülleri başarıyla tamamladınız.
          </p>
        </div>

        {/* What happens next */}
        <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid var(--border-active)', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)', letterSpacing: 2, marginBottom: 16 }}>
            BUNDAN SONRA NE OLACAK?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '📋', title: 'Yanıtlarınız kaydedildi', desc: 'Tüm modüllerdeki yanıtlarınız güvenli bir şekilde sistemimize iletildi.' },
              { icon: '🔍', title: 'Uzman değerlendirmesi', desc: 'İnsan Kaynakları ekibimiz yanıtlarınızı detaylı olarak inceleyecek.' },
              { icon: '📞', title: 'Size ulaşacağız', desc: 'Değerlendirme sonuçları en kısa sürede İK ekibi tarafından paylaşılacaktır.' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed modules summary — no scores */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 16 }}>
            TAMAMLANAN MODÜLLER
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { step: '01', label: 'Isınma Soruları', desc: 'Çoktan seçmeli liderlik soruları' },
              { step: '02', label: 'Kriz Senaryosu', desc: 'Yazılı kriz yönetim raporu' },
              { step: '03', label: 'Sesli Yanıt', desc: 'Sözlü liderlik değerlendirmesi' },
              { step: '04', label: 'In-Tray Egzersizi', desc: 'E-posta önceliklendirme' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'rgba(0,255,136,0.03)', border: '1px solid var(--border-dim)', borderRadius: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,255,136,0.15)', border: '1px solid var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'var(--accent-green)', fontSize: 12 }}>✓</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Survey */}
        {!survey.submitted ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 4 }}>MEMNUNİYET ANKETİ</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Değerlendirme sürecini geliştirmemize yardımcı olun.</p>
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
                      style={{ width: 40, height: 40, borderRadius: 8, border: `1px solid ${survey[item.key] >= score ? 'var(--accent-green)' : 'var(--border-dim)'}`, background: survey[item.key] >= score ? 'rgba(0,255,136,0.15)' : 'transparent', color: survey[item.key] >= score ? 'var(--accent-green)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13, transition: 'all 0.2s' }}>
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
            <span style={{ color: 'var(--accent-green)', fontSize: 14 }}>✓ Geri bildiriminiz için teşekkürler!</span>
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