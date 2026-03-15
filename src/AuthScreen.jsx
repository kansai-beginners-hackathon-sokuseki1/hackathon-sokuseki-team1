import React, { useEffect, useRef, useState } from 'react';
import { api } from './api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  const existing = document.querySelector('script[data-google-identity="true"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google sign-in.'));
    document.head.appendChild(script);
  });
}

function mapAuthError(err) {
  if (err.code === 'email_exists') {
    return 'このメールアドレスは既に登録されています。';
  }
  if (err.code === 'invalid_credentials') {
    return 'メールアドレスまたはパスワードが正しくありません。';
  }
  if (err.code === 'google_sign_in_required') {
    return 'このアカウントは Google ログイン専用です。Google で続行してください。';
  }
  if (err.code === 'account_exists_different_sign_in') {
    return '同じメールアドレスのアカウントが別のログイン方法で登録されています。';
  }
  if (err.code === 'google_auth_unavailable') {
    return 'Google ログインは現在利用できません。';
  }
  return err.message || 'エラーが発生しました。もう一度お試しください。';
}

export function AuthScreen({ onLogin, initialError = null }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef(null);
  const googleInitializedRef = useRef(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError(null);
    setShowPassword(false);
  };

  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return undefined;

    let cancelled = false;
    setGoogleLoading(true);

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;

        if (!googleInitializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              if (!response?.credential) return;
              setError(null);
              setLoading(true);

              try {
                const result = await api.loginWithGoogle(response.credential);
                onLogin(result.token, result.user);
              } catch (err) {
                setError(mapAuthError(err));
              } finally {
                setLoading(false);
              }
            }
          });
          googleInitializedRef.current = true;
        }

        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            text: mode === 'login' ? 'signin_with' : 'signup_with',
            width: Math.min(360, Math.max(280, googleButtonRef.current.offsetWidth || 320))
          });
        }

        setGoogleReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setGoogleReady(false);
          setError(mapAuthError(err));
        }
      })
      .finally(() => {
        if (!cancelled) setGoogleLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, onLogin]);

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
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await api.loginAsGuest();
      onLogin(result.token, result.user);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-screen__inner">
        <h1 className="auth-screen__title">クエストマネージャー</h1>

        <div className="rpg-window">
          <p
            style={{
              color: 'var(--accent-secondary)',
              fontSize: '0.85rem',
              borderBottom: '1px solid var(--border-window-inner)',
              paddingBottom: '6px',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            {mode === 'login' ? 'ログイン' : '新規登録'}
          </p>

          {GOOGLE_CLIENT_ID && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <div
                ref={googleButtonRef}
                style={{
                  minHeight: 44,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              />
              {googleLoading && (
                <p style={{ marginTop: 8, marginBottom: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Google ログインを読み込み中...
                </p>
              )}
              {!googleReady && !googleLoading && (
                <p style={{ marginTop: 8, marginBottom: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Google ログインは現在利用できません。
                </p>
              )}
              <div
                style={{
                  marginTop: 'var(--spacing-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.08em',
                }}
              >
                <span style={{ flex: 1, height: 1, background: 'var(--border-window-inner)' }} />
                <span>OR</span>
                <span style={{ flex: 1, height: 1, background: 'var(--border-window-inner)' }} />
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn-primary auth-screen__guest-button"
            onClick={handleGuestLogin}
            disabled={loading}
          >
            {loading ? '処理中...' : 'ゲストで始める'}
          </button>

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
                パスワード
              </label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
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
                  {showPassword ? '非表示' : '表示'}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 'var(--spacing-sm)' }}
            >
              {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録して始める'}
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              marginTop: 'var(--spacing-md)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
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
                すでに登録済みの場合は{' '}
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
