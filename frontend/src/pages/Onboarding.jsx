import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAssessmentStore } from '../store/assessmentStore'
import RoketsanLogo from '../components/RoketsanLogo'

// Roketsan A.Ş. gerçek organizasyon yapısına göre
const DEPARTMENT_POSITION_MAP = {
  'Güdüm ve Kontrol Sistemleri': [
    'Sistem Mühendisi', 'Kıdemli Sistem Mühendisi', 'Baş Mühendis',
    'Ar-Ge Uzmanı', 'Kıdemli Ar-Ge Uzmanı', 'Teknik Lider',
    'Grup Müdürü', 'Direktör'
  ],
  'Elektronik Sistemler': [
    'Elektronik Tasarım Mühendisi', 'Kıdemli Elektronik Mühendisi',
    'Devre Tasarım Uzmanı', 'Teknik Lider', 'Grup Müdürü', 'Direktör'
  ],
  'Yazılım ve Simülasyon': [
    'Yazılım Mühendisi', 'Kıdemli Yazılım Mühendisi', 'Gömülü Sistem Uzmanı',
    'Simülasyon Uzmanı', 'Yazılım Mimarı', 'Teknik Lider', 'Grup Müdürü'
  ],
  'Mekanik Tasarım ve Yapı': [
    'Mekanik Tasarım Mühendisi', 'Kıdemli Mekanik Mühendis',
    'Malzeme Uzmanı', 'Yapısal Analiz Uzmanı', 'Teknik Lider', 'Grup Müdürü'
  ],
  'Üretim ve İmalat': [
    'Üretim Mühendisi', 'Kıdemli Üretim Mühendisi', 'Proses Uzmanı',
    'Üretim Planlama Uzmanı', 'Atölye Şefi', 'Üretim Müdürü', 'Direktör'
  ],
  'Kalite Güvence': [
    'Kalite Güvence Mühendisi', 'Kıdemli Kalite Mühendisi',
    'Kalite Sistem Uzmanı', 'Denetim Uzmanı', 'Kalite Müdürü'
  ],
  'Program Yönetimi': [
    'Program Yöneticisi', 'Kıdemli Program Yöneticisi',
    'Proje Koordinatörü', 'Risk Yönetimi Uzmanı',
    'Program Direktörü', 'Genel Müdür Yardımcısı'
  ],
  'İş Geliştirme ve Pazarlama': [
    'İş Geliştirme Uzmanı', 'Kıdemli İş Geliştirme Uzmanı',
    'Teklif Yönetimi Uzmanı', 'İhracat Uzmanı',
    'İş Geliştirme Müdürü', 'Direktör'
  ],
  'Tedarik Zinciri ve Lojistik': [
    'Tedarik Zinciri Uzmanı', 'Satın Alma Uzmanı', 'Kıdemli Satın Alma Uzmanı',
    'Lojistik Uzmanı', 'Tedarikçi Geliştirme Uzmanı',
    'Tedarik Zinciri Müdürü'
  ],
  'İnsan Kaynakları': [
    'İK Uzmanı', 'Kıdemli İK Uzmanı', 'Yetenek Yönetimi Uzmanı',
    'Organizasyonel Gelişim Uzmanı', 'İK Müdürü', 'İK Direktörü'
  ],
  'Finans ve Bütçe': [
    'Finansal Analiz Uzmanı', 'Kıdemli Finans Uzmanı',
    'Bütçe Planlama Uzmanı', 'Maliyet Analiz Uzmanı',
    'Finans Müdürü', 'CFO Yardımcısı'
  ],
  'Savunma Sistem Entegrasyonu': [
    'Entegrasyon Mühendisi', 'Kıdemli Entegrasyon Mühendisi',
    'Test ve Doğrulama Uzmanı', 'Sistem Entegrasyon Lideri',
    'Entegrasyon Müdürü', 'Direktör'
  ]
}

const DEPARTMENTS = Object.keys(DEPARTMENT_POSITION_MAP)

export default function Onboarding() {
  const navigate = useNavigate()
  const { setSession } = useAssessmentStore()
  const [form, setForm] = useState({ name: '', department: '', position: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availablePositions = form.department ? DEPARTMENT_POSITION_MAP[form.department] || [] : []

  function handleDepartmentChange(e) {
    setForm({ ...form, department: e.target.value, position: '' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.department || !form.position) {
      setError('Lütfen tüm alanları doldurunuz.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/init-session`, form)
      setSession({ ...res.data, name: form.name, department: form.department, position: form.position })
      navigate('/icebreaker')
    } catch (err) {
      setError('Bağlantı hatası. Lütfen tekrar deneyiniz.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" />
      <div className="glow-orb" style={{ width: 600, height: 600, background: 'rgba(0,255,136,0.04)', top: -200, right: -200 }} />
      <div className="glow-orb" style={{ width: 400, height: 400, background: 'rgba(14,165,233,0.05)', bottom: -100, left: -100 }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', minHeight: '100vh' }}>

        {/* Left Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', maxWidth: 580 }}>
          <div className="fade-in" style={{ marginBottom: 48 }}>
            <RoketsanLogo size={36} />
          </div>

          <div className="fade-in-delay-1">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 3, height: 24, background: 'var(--accent-green)', borderRadius: 2 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-green)', letterSpacing: 3, textTransform: 'uppercase' }}>
                Assessment Center v2.0
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 700, lineHeight: 1.1, marginBottom: 12, color: 'var(--text-primary)' }}>
              Yapay Zeka Destekli<br />
              <span style={{ color: 'var(--accent-green)' }}>Liderlik Değerlendirme</span><br />
              Merkezi
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7 }}>
              Devam etmek için kişisel bilgilerinizi giriniz. Değerlendirme süreci yaklaşık 45-60 dakika sürmektedir.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="fade-in-delay-2" style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="label">Ad Soyad</label>
              <input className="input-field" placeholder="Adınız ve soyadınız" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>

            <div>
              <label className="label">Departman / Birim</label>
              <select className="input-field" value={form.department} onChange={handleDepartmentChange}>
                <option value="">Departmanınızı seçiniz</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Pozisyon / Unvan</label>
              <select className="input-field" value={form.position}
                onChange={e => setForm({ ...form, position: e.target.value })}
                disabled={!form.department}>
                <option value="">
                  {form.department ? 'Pozisyonunuzu seçiniz' : 'Önce departman seçiniz'}
                </option>
                {availablePositions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {form.department && (
                <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                  {form.department} birimi için {availablePositions.length} pozisyon mevcut
                </div>
              )}
            </div>

            {form.department && form.position && (
              <div className="fade-in" style={{
                padding: '12px 16px',
                background: 'rgba(0,255,136,0.05)',
                border: '1px solid var(--border-active)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <span style={{ fontSize: 16 }}>✦</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)', letterSpacing: 1 }}>
                    DEĞERLENDİRME PROFİLİ HAZIR
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {form.position} · {form.department}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#ef4444', fontSize: 14 }}>
                {error}
              </div>
            )}

            <button className="btn-primary" type="submit"
              disabled={loading || !form.name || !form.department || !form.position}
              style={{ marginTop: 8 }}>
              {loading ? 'Değerlendirme Başlatılıyor...' : 'Değerlendirmeyi Başlat →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button type="button" onClick={() => navigate('/hr')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
                YK / İK Girişi
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 60, borderLeft: '1px solid var(--border-dim)' }}>
          <div className="fade-in-delay-3" style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ position: 'relative', width: 300, height: 300, margin: '0 auto 48px' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{
                  position: 'absolute', inset: `${(i-1)*37}px`,
                  border: '1px solid rgba(0,255,136,0.15)',
                  borderRadius: '50%'
                }} />
              ))}
              {[0,45,90,135].map(deg => (
                <div key={deg} style={{
                  position: 'absolute', top: '50%', left: '50%', width: '50%', height: 1,
                  background: 'rgba(0,255,136,0.1)',
                  transformOrigin: 'left center',
                  transform: `rotate(${deg}deg)`
                }} />
              ))}
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-green)', letterSpacing: 2, opacity: 0.7 }}>SİSTEM HAZIR</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>4 MODÜL</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>45-60 DAKİKA</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { step: '01', label: 'Isınma Soruları', desc: 'Pozisyona özel çoktan seçmeli sorular', color: 'var(--accent-green)' },
                { step: '02', label: 'Kriz Senaryosu', desc: 'Departmanınıza özel AI kriz vakası', color: 'var(--accent-blue)' },
                { step: '03', label: 'Sesli Yanıt', desc: 'Türkçe NLP destekli liderlik analizi', color: '#f59e0b' },
                { step: '04', label: 'In-Tray Egzersizi', desc: 'Gerçekçi iş e-postaları önceliklendirme', color: '#a78bfa' },
              ].map(item => (
                <div key={item.step} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
                  background: 'rgba(0,255,136,0.03)', border: '1px solid var(--border-dim)', borderRadius: 8,
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: item.color, fontWeight: 700, minWidth: 24 }}>{item.step}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-blue)', letterSpacing: 2, marginBottom: 4 }}>BİLİMSEL ÇERÇEVE</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Bass & Avolio Dönüşümcü Liderlik · Goleman EQ Modeli · McClelland Yetkinlik Çerçevesi
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
