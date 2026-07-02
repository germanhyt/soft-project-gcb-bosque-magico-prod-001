const STORAGE_KEY = 'bosque.panel.notificaciones.sonido';

export function isNotificationSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY) !== '0';
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
}

/** Campana corta generada con Web Audio (sin archivo externo). */
export function playNotificationSound(): void {
  if (!isNotificationSoundEnabled()) return;
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (frequency: number, start: number, duration: number, volume = 0.06) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    };

    playTone(880, now, 0.12);
    playTone(1174.66, now + 0.1, 0.16, 0.05);

    window.setTimeout(() => {
      void ctx.close();
    }, 400);
  } catch {
    // Autoplay bloqueado o contexto no disponible.
  }
}
