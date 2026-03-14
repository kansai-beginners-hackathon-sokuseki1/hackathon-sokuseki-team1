import React, { useState } from 'react';
import { api } from './api';

export function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        setError(err.message || 'エラーが発生しました。もう一度お試しください。');
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
          クエストマネージャー
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
            ▶ {mode === 'login' ? 'ギルドにログイン' : '新しい冒険者として登録'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="adventurer@example.com"
                disabled={loading}
                required
              />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  冒険者名（ユーザー名）
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="名前を入力"
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                minLength={8}
                required
              />
            </div>

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0 }}>
                ⚠ {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 'var(--spacing-sm)' }}
            >
              {loading
                ? '認証中...'
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
                アカウントがない？
                {' '}
                <button
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  新規登録
                </button>
              </>
            ) : (
              <>
                すでに登録済み？
                {' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
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
