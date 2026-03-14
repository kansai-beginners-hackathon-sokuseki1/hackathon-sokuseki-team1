/**
 * Web Audio API を使ったレトロ風（8ビット）効果音
 */

function getAudioContext() {
  if (!window._audioCtx) {
    window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window._audioCtx;
}

function playNote(ctx, frequency, startTime, duration, volume = 0.15) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'square'; // 8ビット風
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(volume, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/**
 * クエスト完了SE（ドレミソ風の短いファンファーレ）
 */
export function playQuestComplete() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // ド・ミ・ソ・ド（高）の上昇音型
    const notes = [
      { freq: 261.63, delay: 0,    dur: 0.12 }, // C4
      { freq: 329.63, delay: 0.13, dur: 0.12 }, // E4
      { freq: 392.00, delay: 0.26, dur: 0.12 }, // G4
      { freq: 523.25, delay: 0.39, dur: 0.30 }, // C5（伸ばす）
    ];

    notes.forEach(({ freq, delay, dur }) => {
      playNote(ctx, freq, now + delay, dur, 0.18);
    });
  } catch (e) {
    // AudioContext が使えない環境では無視
    console.warn('SE playback failed:', e);
  }
}

/**
 * レベルアップSE（より豪華なファンファーレ）
 */
export function playLevelUp() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 261.63, delay: 0,    dur: 0.10 }, // C4
      { freq: 329.63, delay: 0.11, dur: 0.10 }, // E4
      { freq: 392.00, delay: 0.22, dur: 0.10 }, // G4
      { freq: 523.25, delay: 0.33, dur: 0.10 }, // C5
      { freq: 659.25, delay: 0.44, dur: 0.10 }, // E5
      { freq: 783.99, delay: 0.55, dur: 0.40 }, // G5（伸ばす）
    ];

    notes.forEach(({ freq, delay, dur }) => {
      playNote(ctx, freq, now + delay, dur, 0.18);
    });
  } catch (e) {
    console.warn('SE playback failed:', e);
  }
}
