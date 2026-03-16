import { useEffect, useState } from 'react'
import { useAssessment } from '../context/AssessmentContext'
import RoketsanLogo from '../components/RoketsanLogo'

export default function Outro() {
  const { session } = useAssessment()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 300)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="grid-bg" />
      <div className="glow-orb" style={{ width: 700, height: 700, background: 'rgba(0,255,136,0.06)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 600, padding: '0 24px', opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease' }}>

        {/* Animated checkmark */}
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 40px' }}>
          <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(0,255,136,0.15)" strokeWidth="2" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="#00ff88" strokeWidth="2"
              strokeDasharray="340" strokeDashoffset={visible ? 0 : 340}
              style={{ transition: 'stroke-dashoffset 1.2s ease', transformOrigin: 'center', transform: 'rotate(-90deg)' }} />
            <path d="M38 60 L52 74 L82 44" fill="none" stroke="#00ff88" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="60" strokeDashoffset={visible ? 0 : 60}
              style={{ transition: 'stroke-dashoffset 0.6s ease 0.8s' }} />
          </svg>
        </div>

        <div style={{ marginBottom: 16 }}>
          <RoketsanLogo size={28} />
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.1 }}>
          Değerlendirme<br />
          <span style={{ color: 'var(--accent-green)' }}>Tamamlandı</span>
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
          Tebrikler, <strong style={{ color: 'var(--text-primary)' }}>{session?.name || 'Katılımcı'}</strong>.<br />
          Tüm değerlendirme modüllerini başarıyla tamamladınız.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
          {[
            { label: 'Isınma Soruları', status: 'Tamamlandı' },
            { label: 'Kriz Senaryosu', status: 'Tamamlandı' },
            { label: 'Sesli Yanıt', status: 'Tamamlandı' },
            { label: 'In-Tray Egzersizi', status: 'Tamamlandı' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              background: 'rgba(0,255,136,0.05)', border: '1px solid var(--border-active)', borderRadius: 8
            }}>
              <span style={{ color: 'var(--accent-green)', fontSize: 16 }}>✓</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)', letterSpacing: 1 }}>{item.status}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '20px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Sonuçlarınız İnsan Kaynakları departmanı tarafından değerlendirilecek ve size en kısa sürede bilgi verilecektir. Bu sekmeyi kapatabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  )
}
