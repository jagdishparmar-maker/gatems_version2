export type NotificationSoundKind = 'checkin' | 'dock' | 'checkout' | 'ready';

const FREQ: Record<NotificationSoundKind, number> = {
  checkin: 523.25, // C5
  dock: 659.25, // E5
  checkout: 392.0, // G4
  ready: 587.33, // D5
};

/**
 * Short UI beep using Web Audio API (no audio files).
 * Browsers may require a prior user gesture before audio unlocks.
 */
export function playNotificationSound(kind: NotificationSoundKind): void {
  if (typeof window === 'undefined') return;

  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const resume = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = FREQ[kind];
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.23);
    };

    void ctx.resume().then(resume).catch(() => {
      /* ignore — autoplay policy */
    });
  } catch {
    /* ignore */
  }
}
