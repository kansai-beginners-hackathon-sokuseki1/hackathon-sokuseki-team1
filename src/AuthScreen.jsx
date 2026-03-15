import React, { useState } from 'react';
import { api } from './api';

export function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError(null);
    setShowPassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        await api.register(email, username, password);
        const result = await api.login(email, password);
        onLogin(result.token, result.user);
      } else {
        const result = await api.login(email, password);
        onLogin(result.token, result.user);
      }
    } catch (err) {
      if (err.code === 'email_exists') {
        setError('このメールアドレスはすでに登録されています。');
      } else if (err.code === 'invalid_credentials') {
        setError('メールアドレスまたはパスワードが正しくありません。');
      } else {
        setError(err.message || 'エラーが発生しました。もう一度試してください。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        padding: 'var(--spacing-md)'
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h1
          style={{
            textAlign: 'center',
            fontSize: '1.6rem',
            color: 'var(--accent-secondary)',
            letterSpacing: '2px',
            marginBottom: 'var(--spacing-xl)'
          }}
        >
          タスクマネージャー
        </h1>

        <div className="rpg-window">
          <p
            style={{
              color: 'var(--accent-secondary)',
              fontSize: '0.85rem',
              borderBottom: '1px solid var(--border-window-inner)',
              paddingBottom: '6px',
              marginBottom: 'var(--spacing-md)'
            }}
          >
            ▶ {mode === 'login' ? 'ログイン' : '新規登録'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="adventurer@example.com"
                disabled={loading}
                required
              />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  ユーザー名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="表示名を入力"
                  disabled={loading}
                  minLength={2}
                  required
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                パスワード（8文字以上）
              </label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={loading}
                  aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示する'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? '隠す' : '表示'}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0 }}>
                注意: {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 'var(--spacing-sm)' }}
            >
              {loading
                ? '送信中...'
                : mode === 'login' ? '▶ ログイン' : '▶ 登録してはじめる'}
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              marginTop: 'var(--spacing-md)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}
          >
            {mode === 'login' ? (
              <>
                アカウントがない場合は{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  新規登録
                </button>
              </>
            ) : (
              <>
                すでに登録済みなら{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  ログイン
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
