import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RoketsanLogo from '../components/RoketsanLogo'

const MOCK_CANDIDATES = [
  {
    id: '1', name: 'Ayşe Kaya', department: 'Mühendislik', position: 'Takım Lideri',
    date: '15.03.2026', overallScore: 84,
    competencies: [
      { name: 'Stratejik Düşünme', score: 88 },
      { name: 'Kriz Yönetimi', score: 82 },
      { name: 'İletişim', score: 79 },
      { name: 'Karar Verme', score: 86 },
      { name: 'Ekip Liderliği', score: 85 },
    ],
    aiSummary: 'Aday, kriz senaryosunda güçlü stratejik düşünme yetkinliği sergiledi. Karar verme süreçleri sistematik ve veri odaklıydı. İletişim becerileri geliştirilmeye açık alan olarak öne çıktı.',
    iceBreakerScore: 78, scenarioScore: 85, audioScore: 82, intrayScore: 91,
    grade: 'B+'
  },
  {
    id: '2', name: 'Mehmet Demir', department: 'Ar-Ge', position: 'Kıdemli Mühendis',
    date: '15.03.2026', overallScore: 91,
    competencies: [
      { name: 'Stratejik Düşünme', score: 94 },
      { name: 'Kriz Yönetimi', score: 89 },
      { name: 'İletişim', score: 92 },
      { name: 'Karar Verme', score: 90 },
      { name: 'Ekip Liderliği', score: 88 },
    ],
    aiSummary: 'Aday tüm modüllerde yüksek performans sergiledi. Özellikle iletişim ve stratejik düşünme yetkinliklerinde öne çıktı. Liderlik potansiyeli yüksek bir profil olarak değerlendirilmektedir.',
    iceBreakerScore: 90, scenarioScore: 92, audioScore: 88, intrayScore: 94,
    grade: 'A'
  },
  {
    id: '3', name: 'Zeynep Arslan', department: 'Kalite', position: 'Müdür',
    date: '14.03.2026', overallScore: 76,
    competencies: [
      { name: 'Stratejik Düşünme', score: 74 },
      { name: 'Kriz Yönetimi', score: 80 },
      { name: 'İletişim', score: 78 },
      { name: 'Karar Verme', score: 72 },
      { name: 'Ekip Liderliği', score: 76 },
    ],
    aiSummary: 'Aday kriz yönetiminde ortalama üstü performans gösterdi. Stratejik karar verme süreçlerinde gelişim alanı mevcut. Ekip liderliği potansiyeli desteklenmeye değer.',
    iceBreakerScore: 72, scenarioScore: 78, audioScore: 74, intrayScore: 80,
    grade: 'B'
  },
]

function RadarChart({ competencies }) {
  const cx = 120, cy = 120, r = 80
  const n = competencies.length
  const points = competencies.map((c, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const ratio = c.score / 100
    return {
      x: cx + r * ratio * Math.cos(angle),
      y: cy + r * ratio * Math.sin(angle),
      lx: cx + (r + 24) * Math.cos(angle),
      ly: cy + (r + 24) * Math.sin(angle),
      label: c.name.split(' ')[0],
      score: c.score
    }
  })
  const polygon = points.map(p => `${p.x},${p.y}`).join(' ')

  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <svg width="240" height="240" viewBox="0 0 240 240">
      {gridLevels.map(level => {
        const gp = Array.from({ length: n }, (_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2
          return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`
        }).join(' ')
        return <polygon key={level} points={gp} fill="none" stroke="rgba(0,255,136,0.1)" strokeWidth="1" />
      })}
      {Array.from({ length: n }, (_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="rgba(0,255,136,0.1)" strokeWidth="1" />
      })}
      <polygon points={polygon} fill="rgba(0,255,136,0.15)" stroke="#00ff88" strokeWidth="1.5" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#00ff88" />
          <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 9, fill: 'rgba(139,168,190,0.8)', fontFamily: 'Inter, sans-serif' }}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function HRDashboard() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('hr_auth')) navigate('/hr')
  }, [])

  const candidate = selected ? MOCK_CANDIDATES.find(c => c.id === selected) : null

  function getGradeColor(g) {
    if (g.startsWith('A')) return '#00ff88'
    if (g.startsWith('B')) return '#3b82f6'
    if (g.startsWith('C')) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      <div className="grid-bg" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ padding: '20px 40px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <RoketsanLogo size={28} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Değerlendirici Paneli
          </div>
          <button onClick={() => { localStorage.removeItem('hr_auth'); navigate('/hr') }}
            style={{ background: 'none', border: '1px solid var(--border-dim)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1 }}>
            ÇIKIŞ
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', minHeight: 'calc(100vh - 73px)' }}>

          {/* Candidate List */}
          <div style={{ borderRight: '1px solid var(--border-dim)', padding: '24px 20px', overflowY: 'auto' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 16 }}>
              ADAYLAR ({MOCK_CANDIDATES.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOCK_CANDIDATES.map(c => (
                <div key={c.id} onClick={() => setSelected(c.id)}
                  style={{
                    padding: '16px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s ease',
                    background: selected === c.id ? 'rgba(0,255,136,0.08)' : 'var(--bg-card)',
                    border: `1px solid ${selected === c.id ? 'var(--accent-green)' : 'var(--border-dim)'}`
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.department} · {c.position}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: getGradeColor(c.grade) }}>{c.grade}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{c.date}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${c.overallScore}%` }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', minWidth: 32 }}>{c.overallScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate Detail */}
          <div style={{ padding: '32px 40px', overflowY: 'auto' }}>
            {!candidate ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, opacity: 0.4 }}>
                <div style={{ fontSize: 48 }}>👤</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text-muted)' }}>Aday seçiniz</div>
              </div>
            ) : (
              <div className="fade-in">
                {/* Candidate header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{candidate.name}</h2>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{candidate.department} · {candidate.position}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 700, lineHeight: 1, color: getGradeColor(candidate.grade) }}>{candidate.grade}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>GENEL PUAN: {candidate.overallScore}/100</div>
                  </div>
                </div>

                {/* Module scores */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
                  {[
                    { label: 'Isınma', score: candidate.iceBreakerScore },
                    { label: 'Senaryo', score: candidate.scenarioScore },
                    { label: 'Sesli Yanıt', score: candidate.audioScore },
                    { label: 'In-Tray', score: candidate.intrayScore },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 4 }}>{m.score}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>{m.label.toUpperCase()}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                  {/* Radar */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 16 }}>YETKİNLİK RADARI</div>
                    <RadarChart competencies={candidate.competencies} />
                  </div>

                  {/* Competency bars */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 12, padding: '24px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 20 }}>YETKİNLİK SKORLARI</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {candidate.competencies.map(c => (
                        <div key={c.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.name}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: c.score >= 80 ? 'var(--accent-green)' : c.score >= 60 ? 'var(--accent-blue)' : 'var(--warning)' }}>{c.score}</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${c.score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid var(--border-active)', borderRadius: 12, padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 18 }}>🤖</span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)', letterSpacing: 2 }}>YAPAY ZEKA DEĞERLENDİRMESİ</div>
                  </div>
                  <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{candidate.aiSummary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
