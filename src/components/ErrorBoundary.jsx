import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100%',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        gap: '16px',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 48 }}>⚠️</span>
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
          Coś poszło nie tak
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Wystąpił nieoczekiwany błąd. Odśwież stronę lub wyczyść dane aplikacji w ustawieniach.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            padding: '12px 28px',
            background: 'var(--accent-blue)',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            color: 'white',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Odśwież aplikację
        </button>
      </div>
    )
  }
}
