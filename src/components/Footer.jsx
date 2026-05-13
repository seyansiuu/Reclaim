function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid #f0f0f0',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        marginTop: '4rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #059669)',
            display: 'inline-block',
          }}
        />
        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Reclaim</span>
      </div>
      <p style={{ fontSize: '0.8rem', color: '#bbb' }}>Lost & found made easy · Built for campus</p>
    </footer>
  )
}

export default Footer

