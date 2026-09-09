const STORAGE_KEY = 'bosque.panel.notificaciones.sonido';

/** Tin del sistema de estacionamiento (`public/sounds/notification.mp3`). */
const NOTIFICATION_SOUND_SRC = '/sounds/notification.mp3';

let notificationAudio: HTMLAudioElement | null = null;

export function isNotificationSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY) !== '0';
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
}

function getNotificationAudio(): HTMLAudioElement {
  if (!notificationAudio) {
    notificationAudio = new Audio(NOTIFICATION_SOUND_SRC);
    notificationAudio.preload = 'auto';
  }
  return notificationAudio;
}

/** Reproduce el tin de notificaciones de estacionamiento. */
export function playNotificationSound(): void {
  if (!isNotificationSoundEnabled()) return;
  if (typeof window === 'undefined') return;

  try {
    const audio = getNotificationAudio();
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay bloqueado hasta que haya interacción del usuario.
    });
  } catch {
    // Audio no disponible.
  }
}
