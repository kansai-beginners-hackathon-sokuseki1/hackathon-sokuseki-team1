import React, { useRef } from 'react';

const STATES = ['strength', 'neutral', 'weakness'];
const LABELS = {
  strength: '得意',
  neutral: '普通',
  weakness: '苦手'
};
const SWIPE_THRESHOLD = 36;

function getNextValue(value, direction) {
  const currentIndex = STATES.indexOf(value);
  const safeIndex = currentIndex >= 0 ? currentIndex : 1;

  if (direction === 'left') {
    return STATES[Math.max(0, safeIndex - 1)];
  }
  return STATES[Math.min(STATES.length - 1, safeIndex + 1)];
}

export function PreferenceSwipeCard({ category, value, onChange }) {
  const touchStartRef = useRef(null);

  const handleTouchStart = (event) => {
    const touch = event.changedTouches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  };

  const handleTouchEnd = (event) => {
    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    onChange(getNextValue(value, deltaX < 0 ? 'right' : 'left'));
  };

  const labelColor = value === 'weakness'
    ? 'var(--danger)'
    : value === 'strength'
      ? 'var(--success)'
      : 'var(--text-muted)';

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        display: 'grid',
        gridTemplateColumns: '48px 1fr 48px',
        gap: '8px',
        alignItems: 'center'
      }}
    >
      <button
        type="button"
        className="btn-icon"
        aria-label={`${category.label}を得意側へ変更`}
        onClick={() => onChange(getNextValue(value, 'left'))}
      >
        ←
      </button>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          border: '1px solid var(--border-window-inner)',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255,255,255,0.03)',
          touchAction: 'pan-y'
        }}
      >
        <div style={{ display: 'grid', gap: '4px' }}>
          <span>{category.label}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            左右にスワイプ
          </span>
        </div>
        <span style={{ color: labelColor }}>
          {LABELS[value] ?? LABELS.neutral}
        </span>
      </div>

      <button
        type="button"
        className="btn-icon"
        aria-label={`${category.label}を苦手側へ変更`}
        onClick={() => onChange(getNextValue(value, 'right'))}
      >
        →
      </button>
    </div>
  );
}
