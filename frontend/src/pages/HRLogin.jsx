import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RoketsanLogo from '../components/RoketsanLogo'

const HR_PASSWORD = 'roketsan2024'

export default function HRLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (password === HR_PASSWORD) {
        localStorage.setItem('hr_auth', 'true')
        navigate('/hr/dashboard')
      } else {
        setError('Hatalı şifre. Lütfen tekrar deneyiniz.')
        setLoading(false)
      }
    }, 800)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div className="grid-bg" />
      <div className="glow-orb" style={{ width: 500, height: 500, background: 'rgba(14,165,233,0.05)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: '0 24px' }}>
        <div className="fade-in" style={{ textAlign: 'center', marginBottom: 40 }}>
          <RoketsanLogo size={32} />
          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>
              YETKİLİ GİRİŞİ
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
              İK / Değerlendirici Paneli
            </h2>
          </div>
        </div>

        <form onSubmit={handleLogin} className="card fade-in-delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8 }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <span style={{ fontSize: 13, color: 'var(--accent-blue)' }}>Yetkili personel erişimi</span>
          </div>

          <div>
            <label className="label">Erişim Şifresi</label>
            <input className="input-field" type="password" placeholder="••••••••••••"
              value={password} onChange={e => { setPassword(e.target.value); setError('') }} />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#ef4444', fontSize: 14 }}>
              {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading || !password}>
            {loading ? 'Doğrulanıyor...' : 'Panele Giriş →'}
          </button>

          <button type="button" onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            ← Aday girişine dön
          </button>
        </form>
      </div>
    </div>
  )
}
