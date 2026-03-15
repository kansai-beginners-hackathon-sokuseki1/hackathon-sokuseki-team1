import React, { useCallback, useEffect, useState } from 'react';
import { AuthScreen } from './AuthScreen';
import { ErrorBoundary } from './ErrorBoundary';
import { FantasyBackground, FantasyOverlay } from './FantasyBackground';
import { MainApp } from './MainApp';
import { AUTH_EVENT_NAME } from './api';
import { registerAppServiceWorker } from './notifications';
import { applyAudioSettings, initializeAudio } from './soundEffects';
import { applyTheme } from './themes';
import './index.css';

registerAppServiceWorker();

function loadCurrentUser() {
  const saved = localStorage.getItem('currentUser');
  return saved ? JSON.parse(saved) : null;
}

function loadSelectedStageKey(userId) {
  if (!userId) return null;
  return localStorage.getItem(`selectedStageKey:${userId}`);
}

function App() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));
  const [authNotice, setAuthNotice] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => loadCurrentUser());
  const [bgTimeLock, setBgTimeLock] = useState(() => localStorage.getItem('bgTimeLock') ?? 'auto');
  const [alertEnabled, setAlertEnabled] = useState(() => localStorage.getItem('alertEnabled') === 'true');
  const [hideCompletedTasks, setHideCompletedTasks] = useState(() => localStorage.getItem('hideCompletedTasks') !== 'false');
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('colorTheme') ?? 'dark-blue');
  const [seVolume, setSeVolume] = useState(() => Number(localStorage.getItem('seVolume') ?? '70'));
  const [bgmVolume, setBgmVolume] = useState(() => Number(localStorage.getItem('bgmVolume') ?? '35'));
  const [selectedStageKey, setSelectedStageKey] = useState(() => loadSelectedStageKey(loadCurrentUser()?.id));

  useEffect(() => {
    function updateTimePeriod() {
      if (bgTimeLock !== 'auto') {
        document.documentElement.dataset.time = bgTimeLock;
        return;
      }

      const hour = new Date().getHours();
      let period;
      if (hour >= 20 || hour < 5) period = 'night';
      else if (hour < 7) period = 'dawn';
      else if (hour < 11) period = 'morning';
      else if (hour < 15) period = 'noon';
      else period = 'dusk';
      document.documentElement.dataset.time = period;
    }

    updateTimePeriod();
    const id = setInterval(updateTimePeriod, 60_000);
    return () => clearInterval(id);
  }, [bgTimeLock]);

  useEffect(() => {
    applyTheme(colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    initializeAudio();
  }, []);

  useEffect(() => {
    applyAudioSettings({ seVolume, bgmVolume });
  }, [seVolume, bgmVolume]);

  const handleThemeChange = (themeKey) => {
    localStorage.setItem('colorTheme', themeKey);
    setColorTheme(themeKey);
  };

  const handleBgTimeLockChange = (value) => {
    localStorage.setItem('bgTimeLock', value);
    setBgTimeLock(value);
  };

  const handleAlertEnabledChange = async (enabled) => {
    if (enabled && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }
    localStorage.setItem('alertEnabled', enabled);
    setAlertEnabled(enabled);
  };

  const handleSeVolumeChange = (value) => {
    localStorage.setItem('seVolume', value);
    setSeVolume(value);
  };

  const handleBgmVolumeChange = (value) => {
    localStorage.setItem('bgmVolume', value);
    setBgmVolume(value);
  };

  const handleLogin = (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setAuthToken(token);
    setCurrentUser(user);
    setSelectedStageKey(loadSelectedStageKey(user?.id));
    setAuthNotice(null);
  };

  const handleLogout = useCallback((notice = null) => {
    const resolvedNotice = typeof notice === 'string' ? notice : null;

    if (currentUser?.authProvider === 'google') {
      window.google?.accounts?.id?.disableAutoSelect?.();
      window.google?.accounts?.id?.cancel?.();
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setAuthToken(null);
    setCurrentUser(null);
    setSelectedStageKey(null);
    setAuthNotice(resolvedNotice);
  }, [currentUser?.authProvider]);

  useEffect(() => {
    const handleAuthInvalid = (event) => {
      handleLogout(event.detail?.message || 'ログイン情報が無効です。もう一度ログインしてください。');
    };

    window.addEventListener(AUTH_EVENT_NAME, handleAuthInvalid);
    return () => window.removeEventListener(AUTH_EVENT_NAME, handleAuthInvalid);
  }, [handleLogout]);

  const handleSelectedStageKeyChange = (value) => {
    if (!currentUser?.id) return;
    const storageKey = `selectedStageKey:${currentUser.id}`;
    if (!value) {
      localStorage.removeItem(storageKey);
      setSelectedStageKey(null);
      return;
    }

    localStorage.setItem(storageKey, value);
    setSelectedStageKey(value);
  };

  return (
    <>
      <FantasyBackground />
      <FantasyOverlay />
      {!authToken ? (
        <AuthScreen onLogin={handleLogin} initialError={authNotice} />
      ) : (
        <ErrorBoundary resetKey={authToken}>
          <MainApp
            key={currentUser?.id ?? 'guest'}
            currentUser={currentUser}
            onLogout={handleLogout}
            colorTheme={colorTheme}
            onThemeChange={handleThemeChange}
            bgTimeLock={bgTimeLock}
            onBgTimeLockChange={handleBgTimeLockChange}
            alertEnabled={alertEnabled}
            onAlertEnabledChange={handleAlertEnabledChange}
            seVolume={seVolume}
            onSeVolumeChange={handleSeVolumeChange}
            bgmVolume={bgmVolume}
            onBgmVolumeChange={handleBgmVolumeChange}
            hideCompletedTasks={hideCompletedTasks}
            onHideCompletedTasksChange={(enabled) => {
              localStorage.setItem('hideCompletedTasks', enabled);
              setHideCompletedTasks(enabled);
            }}
            selectedStageKey={selectedStageKey}
            onSelectedStageKeyChange={handleSelectedStageKeyChange}
          />
        </ErrorBoundary>
      )}
    </>
  );
}

export default App;
