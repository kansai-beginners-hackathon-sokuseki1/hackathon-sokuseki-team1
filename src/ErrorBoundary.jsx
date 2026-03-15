import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Render error caught by ErrorBoundary:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null
      });
    }
  }

  render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (!hasError) return children;

    return (
      <div className="app-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="rpg-window" style={{ maxWidth: '560px', padding: 'var(--spacing-xl)' }}>
          <p style={{ color: 'var(--danger)', fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>
            画面の描画中にエラーが発生しました。
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.8, marginBottom: 'var(--spacing-md)' }}>
            真っ暗になる代わりにエラー内容を表示しています。再現したときは下の内容を確認してください。
          </p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.8rem',
              color: 'var(--accent-secondary)',
              background: 'rgba(0, 0, 0, 0.32)',
              border: '1px solid var(--border-window-inner)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {error?.stack || error?.message || 'Unknown render error'}
          </pre>
          <button
            type="button"
            className="btn-primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: 'var(--spacing-md)' }}
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }
}
