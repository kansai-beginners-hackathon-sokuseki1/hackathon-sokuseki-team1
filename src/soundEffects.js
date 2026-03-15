/**
 * Web Audio API を使ったレトロ風（8ビット）効果音と簡易 BGM。
 */

const audioState = {
  seVolume: 0.7,
  bgmVolume: 0.35,
  bgmTimerId: null,
  unlockBound: false
};

const BGM_LOOP_MS = 3200;
const BGM_PATTERN = [
  { freq: 220.0, delay: 0.0, dur: 0.55, volume: 0.11, type: 'triangle' },
  { freq: 277.18, delay: 0.8, dur: 0.45, volume: 0.08, type: 'triangle' },
  { freq: 329.63, delay: 1.6, dur: 0.45, volume: 0.08, type: 'triangle' },
  { freq: 293.66, delay: 2.4, dur: 0.55, volume: 0.11, type: 'triangle' },
  { freq: 110.0, delay: 0.0, dur: 1.1, volume: 0.05, type: 'sine' },
  { freq: 146.83, delay: 1.6, dur: 1.1, volume: 0.05, type: 'sine' }
];

function clampUnitVolume(value, fallback) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return fallback;
  return Math.max(0, Math.min(1, normalized));
}

function getAudioContext() {
  if (!window._audioCtx) {
    window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window._audioCtx;
}

function playNote(ctx, frequency, startTime, duration, volume, type = 'square') {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(volume, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function scheduleBgmLoop() {
  if (audioState.bgmVolume <= 0) return;

  const ctx = getAudioContext();
  const start = ctx.currentTime + 0.05;

  BGM_PATTERN.forEach(({ freq, delay, dur, volume, type }) => {
    playNote(ctx, freq, start + delay, dur, volume * audioState.bgmVolume, type);
  });
}

function startBgmLoop() {
  if (audioState.bgmTimerId !== null || audioState.bgmVolume <= 0) return;

  scheduleBgmLoop();
  audioState.bgmTimerId = window.setInterval(() => {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') return;
    scheduleBgmLoop();
  }, BGM_LOOP_MS);
}

function stopBgmLoop() {
  if (audioState.bgmTimerId === null) return;
  window.clearInterval(audioState.bgmTimerId);
  audioState.bgmTimerId = null;
}

function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function handleAudioUnlock() {
  resumeAudioContext();
  if (audioState.bgmVolume > 0) {
    startBgmLoop();
  }
}

export function initializeAudio() {
  if (audioState.unlockBound) return;

  const unlock = () => {
    handleAudioUnlock();
  };

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  audioState.unlockBound = true;
}

export function applyAudioSettings({ seVolume, bgmVolume }) {
  audioState.seVolume = clampUnitVolume(seVolume / 100, audioState.seVolume);
  audioState.bgmVolume = clampUnitVolume(bgmVolume / 100, audioState.bgmVolume);

  if (audioState.bgmVolume <= 0) {
    stopBgmLoop();
    return;
  }

  const ctx = getAudioContext();
  if (ctx.state === 'running') {
    startBgmLoop();
  }
}

/**
 * クエスト完了SE（ドレミソ風の短いファンファーレ）
 */
export function playQuestComplete() {
  if (audioState.seVolume <= 0) return;

  try {
    const ctx = resumeAudioContext();
    const now = ctx.currentTime;
    const notes = [
      { freq: 261.63, delay: 0, dur: 0.12 },
      { freq: 329.63, delay: 0.13, dur: 0.12 },
      { freq: 392.0, delay: 0.26, dur: 0.12 },
      { freq: 523.25, delay: 0.39, dur: 0.3 }
    ];

    notes.forEach(({ freq, delay, dur }) => {
      playNote(ctx, freq, now + delay, dur, 0.18 * audioState.seVolume);
    });
  } catch (error) {
    console.warn('SE playback failed:', error);
  }
}

/**
 * レベルアップSE（より豪華なファンファーレ）
 */
export function playLevelUp() {
  if (audioState.seVolume <= 0) return;

  try {
    const ctx = resumeAudioContext();
    const now = ctx.currentTime;
    const notes = [
      { freq: 261.63, delay: 0, dur: 0.1 },
      { freq: 329.63, delay: 0.11, dur: 0.1 },
      { freq: 392.0, delay: 0.22, dur: 0.1 },
      { freq: 523.25, delay: 0.33, dur: 0.1 },
      { freq: 659.25, delay: 0.44, dur: 0.1 },
      { freq: 783.99, delay: 0.55, dur: 0.4 }
    ];

    notes.forEach(({ freq, delay, dur }) => {
      playNote(ctx, freq, now + delay, dur, 0.18 * audioState.seVolume);
    });
  } catch (error) {
    console.warn('SE playback failed:', error);
  }
}
