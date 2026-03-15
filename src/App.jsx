import React, { useEffect, useState } from 'react';
import { AuthScreen } from './AuthScreen';
import { FantasyBackground, FantasyOverlay } from './FantasyBackground';
import { MainApp } from './MainApp';
import { registerAppServiceWorker } from './notifications';
import { applyTheme } from './themes';
import './index.css';

registerAppServiceWorker();

function App() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [bgTimeLock, setBgTimeLock] = useState(() => localStorage.getItem('bgTimeLock') ?? 'auto');
  const [alertEnabled, setAlertEnabled] = useState(() => localStorage.getItem('alertEnabled') === 'true');
  const [hideCompletedTasks, setHideCompletedTasks] = useState(() => localStorage.getItem('hideCompletedTasks') !== 'false');
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('colorTheme') ?? 'dark-blue');

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

  const handleLogin = (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setAuthToken(token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setAuthToken(null);
    setCurrentUser(null);
  };

  return (
    <>
      <FantasyBackground />
      <FantasyOverlay />
      {!authToken ? (
        <AuthScreen onLogin={handleLogin} />
      ) : (
        <MainApp
          currentUser={currentUser}
          onLogout={handleLogout}
          colorTheme={colorTheme}
          onThemeChange={handleThemeChange}
          bgTimeLock={bgTimeLock}
          onBgTimeLockChange={handleBgTimeLockChange}
          alertEnabled={alertEnabled}
          onAlertEnabledChange={handleAlertEnabledChange}
          hideCompletedTasks={hideCompletedTasks}
          onHideCompletedTasksChange={(enabled) => {
            localStorage.setItem('hideCompletedTasks', enabled);
            setHideCompletedTasks(enabled);
          }}
        />
      )}
    </>
  );
}

export default App;
