export default function RoketsanLogo({ size = 40 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" stroke="#00ff88" strokeWidth="2" fill="none" opacity="0.8"/>
        <circle cx="50" cy="50" r="36" stroke="#00ff88" strokeWidth="1" fill="none" opacity="0.4"/>
        <path d="M50 15 L58 35 L78 35 L62 48 L68 68 L50 56 L32 68 L38 48 L22 35 L42 35 Z"
          fill="none" stroke="#00ff88" strokeWidth="1.5" opacity="0.9"/>
        <circle cx="50" cy="50" r="5" fill="#00ff88" opacity="0.9"/>
        <line x1="50" y1="2" x2="50" y2="20" stroke="#00ff88" strokeWidth="1" opacity="0.5"/>
        <line x1="50" y1="80" x2="50" y2="98" stroke="#00ff88" strokeWidth="1" opacity="0.5"/>
        <line x1="2" y1="50" x2="20" y2="50" stroke="#00ff88" strokeWidth="1" opacity="0.5"/>
        <line x1="80" y1="50" x2="98" y2="50" stroke="#00ff88" strokeWidth="1" opacity="0.5"/>
      </svg>
      <span style={{
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: size * 0.55,
        fontWeight: 700,
        letterSpacing: '3px',
        color: '#e8f4f8',
        textTransform: 'uppercase'
      }}>ROKETSAN</span>
    </div>
  )
}
