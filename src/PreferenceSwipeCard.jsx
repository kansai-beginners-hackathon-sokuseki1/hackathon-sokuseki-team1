import React, { useRef } from 'react';

const LABELS = {
  strength: '得意',
  neutral: '普通',
  weakness: '苦手'
};
const SWIPE_THRESHOLD = 36;

function getValueFromDirection(deltaX, deltaY) {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) return null;

  if (absX >= absY) {
    return deltaX > 0 ? 'strength' : 'weakness';
  } else {
    return deltaY < 0 ? 'neutral' : null;
  }
}

export function PreferenceSwipeCard({ category, value, onChange }) {
  const touchStartRef = useRef(null);
  const mouseStartRef = useRef(null);

  const handleTouchStart = (event) => {
    const touch = event.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    if (!touchStartRef.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    const newValue = getValueFromDirection(deltaX, deltaY);
    if (newValue) onChange(newValue);
  };

  const handleMouseDown = (event) => {
    mouseStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseUp = (event) => {
    if (!mouseStartRef.current) return;
    const deltaX = event.clientX - mouseStartRef.current.x;
    const deltaY = event.clientY - mouseStartRef.current.y;
    mouseStartRef.current = null;
    const newValue = getValueFromDirection(deltaX, deltaY);
    if (newValue) onChange(newValue);
  };

  const handleMouseLeave = () => {
    mouseStartRef.current = null;
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
        aria-label={`${category.label}を苦手に設定`}
        onClick={() => onChange('weakness')}
      >
        ←
      </button>

      <div
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          border: '1px solid var(--border-window-inner)',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255,255,255,0.03)',
          touchAction: 'none',
          cursor: 'grab',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'grid', gap: '4px' }}>
          <span>{category.label}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            右:得意 左:苦手 上:普通
          </span>
        </div>
        <span style={{ color: labelColor }}>
          {LABELS[value] ?? LABELS.neutral}
        </span>
      </div>

      <button
        type="button"
        className="btn-icon"
        aria-label={`${category.label}を得意に設定`}
        onClick={() => onChange('strength')}
      >
        →
      </button>
    </div>
  );
}
