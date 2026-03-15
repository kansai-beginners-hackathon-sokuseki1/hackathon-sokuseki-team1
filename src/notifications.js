const SERVICE_WORKER_PATH = '/sw.js';
const SERVICE_WORKER_SCOPE = '/';
const NOTIFICATION_ICON_PATH = '/icon-192.svg';

export function registerAppServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
      scope: SERVICE_WORKER_SCOPE
    }).catch(() => {});
  });
}

export async function sendNotification(title, body) {
  if (Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: NOTIFICATION_ICON_PATH
      });
      return;
    } catch {
      return;
    }
  }

  new Notification(title, { body });
}
