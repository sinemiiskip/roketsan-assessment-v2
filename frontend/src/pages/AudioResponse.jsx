import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAssessment } from '../context/AssessmentContext'
import RoketsanLogo from '../components/RoketsanLogo'
import StepIndicator from '../components/StepIndicator'

export default function AudioResponse() {
  const navigate = useNavigate()
  const { session, scenario, setAudioResult } = useAssessment()
  const [state, setState] = useState('idle') // idle | recording | recorded | transcribing | done
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [bars, setBars] = useState(Array(40).fill(3))
  const [submitting, setSubmitting] = useState(false)

  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const animRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => () => {
    clearInterval(timerRef.current)
    cancelAnimationFrame(animRef.current)
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.start()
      setState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)

      // Waveform animation
      const animateWave = () => {
        setBars(Array(40).fill(0).map(() => Math.random() * 48 + 4))
        animRef.current = requestAnimationFrame(animateWave)
      }
      animateWave()

      // Speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        const rec = new SR()
        rec.lang = 'tr-TR'
        rec.continuous = true
        rec.interimResults = true
        rec.onresult = e => {
          let text = ''
          for (let i = 0; i < e.results.length; i++) {
            text += e.results[i][0].transcript + ' '
          }
          setTranscript(text)
        }
        rec.start()
        recognitionRef.current = rec
      }
    } catch {
      alert('Mikrofon erişimi reddedildi. Lütfen tarayıcı izinlerini kontrol edin.')
    }
  }

  function stopRecording() {
    mediaRef.current?.stop()
    mediaRef.current?.stream?.getTracks().forEach(t => t.stop())
    recognitionRef.current?.stop()
    clearInterval(timerRef.current)
    cancelAnimationFrame(animRef.current)
    setBars(Array(40).fill(3))
    setState('recorded')
  }

  async function handleSubmit() {
    if (!transcript.trim()) {
      alert('Konuşma metni alınamadı. Lütfen tekrar deneyin.')
      return
    }
    setSubmitting(true)
    setState('transcribing')
    try {
      const res = await axios.post('https://roketsan-assessment.onrender.com/api/submit-audio', {
        session_id: session?.session_id,
        transcript,
        duration: seconds
      })
      setAudioResult(res.data.evaluation)
      setState('done')
      setTimeout(() => navigate('/intray'), 1500)
    } catch {
      setAudioResult({ transcript, duration: seconds, overallScore: 0, aiAnalysis: null })
      navigate('/intray')
    } finally {
      setSubmitting(false)
    }
  }

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      <div className="grid-bg" />
      <div className="glow-orb" style={{ width: 500, height: 500, background: 'rgba(0,255,136,0.04)', bottom: -100, right: -100 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '24px 48px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <RoketsanLogo size={28} />
          <StepIndicator current={4} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>MODÜL 03</div>
        </div>
        <div className="progress-bar" style={{ borderRadius: 0, height: 3 }}>
          <div className="progress-fill" style={{ width: '60%' }} />
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px' }}>
          <div className="fade-in" style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="badge badge-medium" style={{ marginBottom: 20, display: 'inline-flex' }}>SESLİ YANIT MODÜLü</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Kriz Senaryosu — Sözlü Değerlendirme
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              {scenario?.keyQuestion || 'Senaryo hakkındaki görüşlerinizi ve aksiyon planınızı sesli olarak paylaşın.'}
            </p>
          </div>

          {/* Waveform */}
          <div className="fade-in-delay-1" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-dim)',
            borderRadius: 16, padding: '40px 32px', marginBottom: 32, textAlign: 'center'
          }}>
            {/* Timer */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 500,
              color: state === 'recording' ? 'var(--accent-green)' : 'var(--text-muted)',
              marginBottom: 32, letterSpacing: 4,
              textShadow: state === 'recording' ? '0 0 20px rgba(0,255,136,0.5)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              {fmt(seconds)}
            </div>

            {/* Waveform bars */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 64, marginBottom: 32 }}>
              {bars.map((h, i) => (
                <div key={i} style={{
                  width: 3, height: state === 'recording' ? h : 3, borderRadius: 2,
                  background: state === 'recording'
                    ? `rgba(0,255,136,${0.4 + (h / 52) * 0.6})`
                    : 'var(--border-dim)',
                  transition: state === 'recording' ? 'height 0.05s ease' : 'height 0.3s ease'
                }} />
              ))}
            </div>

            {/* Status */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 32 }}>
              {state === 'idle' && '● MİKROFON HAZIR'}
              {state === 'recording' && <span style={{ color: 'var(--accent-green)', animation: 'pulse 1s infinite' }}>● KAYIT DEVAM EDİYOR</span>}
              {state === 'recorded' && <span style={{ color: 'var(--accent-blue)' }}>● KAYIT TAMAMLANDI</span>}
              {state === 'transcribing' && <span style={{ color: 'var(--warning)' }}>● ANALİZ EDİLİYOR...</span>}
              {state === 'done' && <span style={{ color: 'var(--accent-green)' }}>✓ TAMAMLANDI</span>}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              {state === 'idle' && (
                <button className="btn-primary" onClick={startRecording} style={{ minWidth: 200 }}>
                  ● Kaydı Başlat
                </button>
              )}
              {state === 'recording' && (
                <button onClick={stopRecording} style={{
                  background: '#ef4444', color: 'white', border: 'none',
                  padding: '14px 32px', borderRadius: 8, fontFamily: 'var(--font-display)',
                  fontSize: 16, fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
                  minWidth: 200, textTransform: 'uppercase'
                }}>
                  ■ Kaydı Durdur
                </button>
              )}
              {state === 'recorded' && (
                <>
                  <button className="btn-secondary" onClick={() => { setState('idle'); setSeconds(0); setTranscript('') }}>
                    ↺ Tekrar Kaydet
                  </button>
                  <button className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ minWidth: 200 }}>
                    {submitting ? 'Gönderiliyor...' : 'Yanıtı Gönder →'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Transcript preview */}
          {transcript && (
            <div className="fade-in" style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-dim)',
              borderRadius: 12, padding: '20px 24px'
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 10 }}>
                CANLI TRANSKRİPT
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
                "{transcript}"
              </p>
            </div>
          )}

          {/* Tips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
            {[
              { icon: '🎯', tip: 'Net ve yapılandırılmış cevap verin' },
              { icon: '⏱', tip: '3-5 dakika idealdir' },
              { icon: '💡', tip: 'Somut örnekler kullanın' },
              { icon: '🎤', tip: 'Sakin ve özgüvenli konuşun' },
            ].map(item => (
              <div key={item.tip} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                background: 'rgba(0,255,136,0.03)', border: '1px solid var(--border-dim)', borderRadius: 8
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
