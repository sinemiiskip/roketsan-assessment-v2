import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import RoketsanLogo from '../components/RoketsanLogo'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function RadarChart({ competencies }) {
  if (!competencies || competencies.length === 0) return null
  const cx = 120, cy = 120, r = 80
  const n = competencies.length
  const points = competencies.map((c, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const ratio = (c.score || 0) / 100
    return {
      x: cx + r * ratio * Math.cos(angle),
      y: cy + r * ratio * Math.sin(angle),
      lx: cx + (r + 28) * Math.cos(angle),
      ly: cy + (r + 28) * Math.sin(angle),
      label: c.name.split(' ')[0],
      score: c.score
    }
  })
  const polygon = points.map(p => `${p.x},${p.y}`).join(' ')
  return (
    <svg width="240" height="240" viewBox="0 0 240 240">
      {[0.25, 0.5, 0.75, 1].map(level => {
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

function getGradeColor(g) {
  if (!g) return 'var(--text-muted)'
  if (g.startsWith('A')) return '#00ff88'
  if (g.startsWith('B')) return '#3b82f6'
  if (g.startsWith('C')) return '#f59e0b'
  return '#ef4444'
}

function getGradeLabel(g) {
  const labels = { 'A+': 'Olağanüstü Lider', 'A': 'Güçlü Lider', 'B+': 'Gelişen Lider', 'B': 'Yeterli', 'C+': 'Gelişim Gerekli', 'C': 'Yetersiz' }
  return labels[g] || '-'
}

function ScoreBar({ label, score, weight }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {weight && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>%{weight} ağırlık</span>}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: score >= 80 ? '#00ff88' : score >= 60 ? '#3b82f6' : '#f59e0b' }}>{score ?? '-'}</span>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${score || 0}%` }} />
      </div>
    </div>
  )
}

export default function HRDashboard() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('ALL')

  useEffect(() => {
    if (!localStorage.getItem('hr_auth')) { navigate('/hr'); return }
    fetchCandidates()
  }, [])

  async function fetchCandidates() {
    setLoading(true)
    try {
      const token = localStorage.getItem('hr_token')
      const res = await axios.get(`${API}/api/candidates`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCandidates(res.data.candidates || [])
    } catch (err) {
      setError('Adaylar yüklenemedi. Backend bağlantısını kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = candidates.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.department?.toLowerCase().includes(search.toLowerCase()) ||
      c.position?.toLowerCase().includes(search.toLowerCase())
    const matchGrade = filterGrade === 'ALL' || c.assessment_results?.[0]?.grade === filterGrade
    return matchSearch && matchGrade
  })

  const candidate = selected ? candidates.find(c => c.id === selected || c.session_id === selected) : null
  const results = candidate?.assessment_results?.[0]

  // Build competency scores from results
  const competencies = results?.competency_scores
    ? Object.entries(results.competency_scores).map(([id, data]) => ({
        name: data.name || id,
        score: Math.round(data.score || 0)
      }))
    : [
        { name: 'Stratejik Çeviklik', score: results?.scenario_score || 0 },
        { name: 'İnisiyatif', score: results?.audio_score || 0 },
        { name: 'Ekip Liderliği', score: results?.icebreaker_score || 0 },
        { name: 'Etik Disiplin', score: results?.intray_score || 0 },
      ]

  const stats = {
    total: candidates.length,
    avgScore: candidates.length ? Math.round(candidates.reduce((sum, c) => sum + (c.assessment_results?.[0]?.overall_score || 0), 0) / candidates.length) : 0,
    topGrade: candidates.filter(c => c.assessment_results?.[0]?.grade?.startsWith('A')).length,
    completed: candidates.filter(c => c.status === 'completed' || c.assessment_results?.length > 0).length,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      <div className="grid-bg" />
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ padding: '16px 40px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <RoketsanLogo size={24} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-green)', letterSpacing: 2 }}>● YETKİLİ PANEL</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase' }}>Değerlendirici Paneli</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={fetchCandidates} style={{ background: 'none', border: '1px solid var(--border-dim)', color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              ↺ YENİLE
            </button>
            <button onClick={() => { localStorage.removeItem('hr_auth'); localStorage.removeItem('hr_token'); navigate('/hr') }}
              style={{ background: 'none', border: '1px solid var(--border-dim)', color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              ÇIKIŞ
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ padding: '16px 40px', borderBottom: '1px solid var(--border-dim)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Toplam Aday', value: stats.total },
            { label: 'Tamamlayan', value: stats.completed },
            { label: 'A Notu', value: stats.topGrade },
            { label: 'Ortalama Puan', value: stats.avgScore },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 8, padding: '12px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--accent-green)' }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', minHeight: 'calc(100vh - 145px)' }}>

          {/* Candidate List */}
          <div style={{ borderRight: '1px solid var(--border-dim)', padding: '20px 16px', overflowY: 'auto' }}>

            {/* Search + Filter */}
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                placeholder="Aday, departman veya pozisyon ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, width: '100%' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                {['ALL', 'A+', 'A', 'B+', 'B', 'C+', 'C'].map(g => (
                  <button key={g} onClick={() => setFilterGrade(g)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${filterGrade === g ? 'var(--accent-green)' : 'var(--border-dim)'}`, background: filterGrade === g ? 'rgba(0,255,136,0.1)' : 'transparent', color: filterGrade === g ? 'var(--accent-green)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer' }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 12 }}>
              ADAYLAR ({filtered.length})
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                ▶ YÜKLENİYOR...
              </div>
            ) : error ? (
              <div style={{ color: '#ef4444', fontSize: 13, padding: '16px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{error}</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>Aday bulunamadı</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(c => {
                  const r = c.assessment_results?.[0]
                  const grade = r?.grade || '—'
                  const score = r?.overall_score || 0
                  const isSelected = selected === c.id || selected === c.session_id
                  return (
                    <div key={c.id || c.session_id}
                      onClick={() => setSelected(c.id || c.session_id)}
                      style={{ padding: '14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s', background: isSelected ? 'rgba(0,255,136,0.08)' : 'var(--bg-card)', border: `1px solid ${isSelected ? 'var(--accent-green)' : 'var(--border-dim)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, fontSize: 14 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.department} · {c.position}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: getGradeColor(grade) }}>{grade}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                            {c.created_at ? new Date(c.created_at).toLocaleDateString('tr-TR') : '—'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${score}%` }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', minWidth: 28 }}>{score}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Candidate Detail */}
          <div style={{ padding: '32px 40px', overflowY: 'auto' }}>
            {!candidate ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, opacity: 0.4 }}>
                <div style={{ fontSize: 48 }}>👤</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text-muted)' }}>Aday seçiniz</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>Soldan bir aday seçin</div>
              </div>
            ) : (
              <div className="fade-in">

                {/* Candidate header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{candidate.name}</h2>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>{candidate.department} · {candidate.position}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      {candidate.created_at ? new Date(candidate.created_at).toLocaleString('tr-TR') : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 700, lineHeight: 1, color: getGradeColor(results?.grade) }}>
                      {results?.grade || '—'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {getGradeLabel(results?.grade)}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                      GENEL: {results?.overall_score ?? '—'}/100
                    </div>
                  </div>
                </div>

                {/* Module scores */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
                  {[
                    { label: 'Isınma', score: results?.icebreaker_score, weight: 15 },
                    { label: 'Senaryo', score: results?.scenario_score, weight: 35 },
                    { label: 'Sesli Yanıt', score: results?.audio_score, weight: 30 },
                    { label: 'In-Tray', score: results?.intray_score, weight: 20 },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: m.score >= 80 ? '#00ff88' : m.score >= 60 ? '#3b82f6' : '#f59e0b', marginBottom: 4 }}>
                        {m.score ?? '—'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>{m.label.toUpperCase()}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-green)', marginTop: 2 }}>%{m.weight}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                  {/* Radar */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 16 }}>YETKİNLİK RADARI</div>
                    <RadarChart competencies={competencies} />
                  </div>

                  {/* Competency bars */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 12, padding: '24px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 20 }}>YETKİNLİK SKORLARI</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <ScoreBar label="Stratejik Çeviklik ve Karar Verme" score={results?.scenario_score} weight={30} />
                      <ScoreBar label="İnisiyatif ve Sorumluluk Alma" score={results?.audio_score} weight={25} />
                      <ScoreBar label="Ekip Geliştirme ve İş Birliği" score={results?.icebreaker_score} weight={25} />
                      <ScoreBar label="Etik Değerler ve Kurumsal Disiplin" score={results?.intray_score} weight={20} />
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                {results?.ai_summary && (
                  <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid var(--border-active)', borderRadius: 12, padding: '24px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 18 }}>🤖</span>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)', letterSpacing: 2 }}>YAPAY ZEKA DEĞERLENDİRMESİ</div>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{results.ai_summary}</p>
                  </div>
                )}

                {/* Leadership profile */}
                {results?.leadership_profile && (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 12, padding: '20px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-blue)', letterSpacing: 2, marginBottom: 10 }}>LİDERLİK PROFİLİ</div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{results.leadership_profile}</p>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}