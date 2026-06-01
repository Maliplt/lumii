export default function Spinner() {
  return (
    <>
      <style>{`
        @keyframes _spin { to { transform: rotate(360deg); } }
        @keyframes _fade { 0%,100%{opacity:.4} 50%{opacity:1} }
      `}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7,7,11,0.92)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '4px solid rgba(249, 115, 22, 0.1)',
          borderTopColor: '#ff6a00',
          borderRightColor: 'rgba(255, 106, 0, 0.4)',
          borderBottomColor: 'rgba(255, 106, 0, 0.2)',
          boxShadow: '0 0 24px rgba(255, 106, 0, 0.25)',
          animation: '_spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }} />
        <span style={{
          color: '#ff6a00',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          animation: '_fade 1.6s ease-in-out infinite',
          textShadow: '0 0 8px rgba(255, 106, 0, 0.3)',
        }}>
          Yükleniyor
        </span>
      </div>
    </>
  )
}
