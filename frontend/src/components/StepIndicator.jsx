const STEPS = [
  { id: 1, label: 'Giriş' },
  { id: 2, label: 'Isınma' },
  { id: 3, label: 'Senaryo' },
  { id: 4, label: 'Sesli Yanıt' },
  { id: 5, label: 'In-Tray' },
  { id: 6, label: 'Tamamlandı' }
]

export default function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STEPS.map((step, i) => (
        <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `2px solid ${step.id < current ? '#00ff88' : step.id === current ? '#00ff88' : 'rgba(0,255,136,0.2)'}`,
              background: step.id < current ? '#00ff88' : step.id === current ? 'rgba(0,255,136,0.15)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 500,
              color: step.id < current ? '#070d14' : step.id === current ? '#00ff88' : 'rgba(0,255,136,0.3)',
              transition: 'all 0.3s ease'
            }}>
              {step.id < current ? '✓' : step.id}
            </div>
            <span style={{
              fontFamily: 'Rajdhani, sans-serif', fontSize: 10, fontWeight: 600,
              letterSpacing: '1px', textTransform: 'uppercase',
              color: step.id === current ? '#00ff88' : 'rgba(139,168,190,0.5)'
            }}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              width: 40, height: 1, marginBottom: 20,
              background: step.id < current ? '#00ff88' : 'rgba(0,255,136,0.15)'
            }} />
          )}
        </div>
      ))}
    </div>
  )
}
