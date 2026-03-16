import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessment } from '../context/AssessmentContext'
import RoketsanLogo from '../components/RoketsanLogo'
import StepIndicator from '../components/StepIndicator'

const QUESTIONS = [
  {
    id: 1,
    question: 'Ekibinizde kritik bir proje gecikmesi yaşandığında ilk tepkiniz ne olur?',
    options: [
      { id: 'a', text: 'Hemen tüm ekibi toplayıp durum değerlendirmesi yaparım.', competency: 'crisis_management', score: 3 },
      { id: 'b', text: 'Sorumlu kişiyi belirleyip hesap sorarım.', competency: 'decision_making', score: 1 },
      { id: 'c', text: 'Üst yönetime derhal bildiririm.', competency: 'communication', score: 2 },
      { id: 'd', text: 'Kök nedeni analiz edip aksiyon planı oluştururum.', competency: 'strategic_thinking', score: 3 },
    ]
  },
  {
    id: 2,
    question: 'İki önemli projeniz aynı anda kritik aşamaya geldiğinde ne yaparsınız?',
    options: [
      { id: 'a', text: 'Stratejik öneme göre önceliklendirip kaynakları yeniden dağıtırım.', competency: 'strategic_thinking', score: 3 },
      { id: 'b', text: 'Her iki projeye de eşit kaynak ayırırım.', competency: 'decision_making', score: 1 },
      { id: 'c', text: 'Ekibimle birlikte karar veririm.', competency: 'team_leadership', score: 2 },
      { id: 'd', text: 'Müdürümden yönlendirme isterim.', competency: 'communication', score: 1 },
    ]
  },
  {
    id: 3,
    question: 'Ekibinizden biri yüksek riskli ama yenilikçi bir fikir önerdiğinde tutumunuz nedir?',
    options: [
      { id: 'a', text: 'Fikri redderim, mevcut prosedürlere bağlı kalırım.', competency: 'strategic_thinking', score: 0 },
      { id: 'b', text: 'Risk analizini yapar, uygulanabilir bulursam desteklerim.', competency: 'strategic_thinking', score: 3 },
      { id: 'c', text: 'Fikri üst yönetime ileterim.', competency: 'communication', score: 2 },
      { id: 'd', text: 'Küçük ölçekli pilot uygulama önerisi yaparım.', competency: 'decision_making', score: 3 },
    ]
  },
  {
    id: 4,
    question: 'Bir müşteri toplantısında ekibiniz hata yaptığında nasıl davranırsınız?',
    options: [
      { id: 'a', text: 'Hatayı yapan kişiyi toplantıda uyarırım.', competency: 'team_leadership', score: 0 },
      { id: 'b', text: 'Hatayı sahiplenirim, çözüm odaklı konuşurum.', competency: 'team_leadership', score: 3 },
      { id: 'c', text: 'Toplantıyı kısa keser, daha sonra ele alırım.', competency: 'crisis_management', score: 1 },
      { id: 'd', text: 'Müşteriye özür diler, telafi planı sunarım.', competency: 'communication', score: 2 },
    ]
  },
]

export default function IceBreaker() {
  const navigate = useNavigate()
  const { setIceBreakerResult } = useAssessment()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)
  const [animating, setAnimating] = useState(false)

  const q = QUESTIONS[current]
  const progress = ((current) / QUESTIONS.length) * 100

  function handleSelect(option) {
    setSelected(option.id)
  }

  function handleNext() {
    if (!selected) return
    const newAnswers = { ...answers, [q.id]: QUESTIONS[current].options.find(o => o.id === selected) }

    if (current < QUESTIONS.length - 1) {
      setAnimating(true)
      setTimeout(() => {
        setAnswers(newAnswers)
        setCurrent(current + 1)
        setSelected(null)
        setAnimating(false)
      }, 300)
    } else {
      // Calculate scores
      const allAnswers = { ...newAnswers }
      const scores = {}
      Object.values(allAnswers).forEach(ans => {
        if (!scores[ans.competency]) scores[ans.competency] = 0
        scores[ans.competency] += ans.score
      })
      setIceBreakerResult({ answers: allAnswers, scores })
      navigate('/scenario')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" />
      <div className="glow-orb" style={{ width: 500, height: 500, background: 'rgba(14,165,233,0.05)', top: -100, right: -100 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ padding: '24px 48px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <RoketsanLogo size={28} />
          <StepIndicator current={2} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            {current + 1} / {QUESTIONS.length}
          </div>
        </div>

        {/* Progress */}
        <div className="progress-bar" style={{ borderRadius: 0, height: 3 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Content */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
          <div style={{ marginBottom: 40, opacity: animating ? 0 : 1, transition: 'opacity 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span className="badge badge-medium">ISINMA SORUSU</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                Soru {current + 1} / {QUESTIONS.length}
              </span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, lineHeight: 1.4, color: 'var(--text-primary)', marginBottom: 40 }}>
              {q.question}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {q.options.map((opt, i) => (
                <button key={opt.id} onClick={() => handleSelect(opt)}
                  style={{
                    background: selected === opt.id ? 'rgba(0,255,136,0.1)' : 'var(--bg-card)',
                    border: `1px solid ${selected === opt.id ? 'var(--accent-green)' : 'var(--border-dim)'}`,
                    borderRadius: 10, padding: '18px 24px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
                    transform: selected === opt.id ? 'translateX(8px)' : 'translateX(0)'
                  }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${selected === opt.id ? 'var(--accent-green)' : 'var(--border-dim)'}`,
                    background: selected === opt.id ? 'var(--accent-green)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
                    color: selected === opt.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span style={{ color: selected === opt.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5 }}>
                    {opt.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
            <button className="btn-primary" onClick={handleNext} disabled={!selected}>
              {current < QUESTIONS.length - 1 ? 'Sonraki →' : 'Senaryoya Geç →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
