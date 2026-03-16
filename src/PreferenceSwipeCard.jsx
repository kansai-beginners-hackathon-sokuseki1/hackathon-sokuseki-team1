import React, { useEffect, useRef, useState } from 'react';

const OPTIONS = [
  { value: 'strength', label: '得意', color: 'var(--success)' },
  { value: 'neutral', label: '普通', color: 'var(--text-secondary)' },
  { value: 'weakness', label: '苦手', color: 'var(--danger)' }
];

const LABELS = Object.fromEntries(OPTIONS.map((option) => [option.value, option.label]));
const CATEGORY_LABELS = {
  planning: '計画・段取り',
  focus: '集中・見直し',
  writing: '文章作成',
  communication: '連絡・相談',
  research: '調査・分析',
  numbers: '数値・集計',
  routine: '定例・事務',
  physical_tasks: '移動・作業'
};
const SWIPE_THRESHOLD = 36;

function getValueFromSwipe(deltaX, deltaY) {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) return null;

  if (absY > absX && deltaY < 0) {
    return 'neutral';
  }

  return deltaX > 0 ? 'strength' : 'weakness';
}

export function PreferenceSwipeCard({ category, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const touchStartRef = useRef(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = OPTIONS.find((option) => option.value === value) ?? OPTIONS[1];
  const categoryLabel = CATEGORY_LABELS[category.id] ?? category.label ?? '未設定';

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const handleTouchStart = (event) => {
    const touch = event.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    suppressClickRef.current = false;
  };

  const handleTouchEnd = (event) => {
    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const nextValue = getValueFromSwipe(deltaX, deltaY);
    if (!nextValue) return;

    suppressClickRef.current = true;
    onChange(nextValue);
  };

  const handleCardClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          border: '1px solid var(--border-window-inner)',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255,255,255,0.03)',
          color: 'var(--text-primary)',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'grid', gap: '4px' }}>
          <span>{categoryLabel}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            タップ/クリックで設定・スマホはスワイプ可
          </span>
        </div>
        <span style={{ color: selectedOption.color, fontSize: '0.88rem' }}>
          {LABELS[selectedOption.value]}
        </span>
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="rpg-window"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(360px, calc(100vw - 32px))',
              padding: '16px',
              display: 'grid',
              gap: '14px',
              animation: 'popIn 0.2s ease'
            }}
          >
            <div style={{ display: 'grid', gap: '4px' }}>
              <div style={{ color: 'var(--accent-secondary)', fontSize: '0.88rem' }}>
                得意・苦手を設定
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: '0.96rem' }}>
                {categoryLabel}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                いまの設定: {LABELS[selectedOption.value]}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              {OPTIONS.map((option) => {
                const isSelected = option.value === selectedOption.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      border: isSelected ? `2px solid ${option.color}` : '1px solid var(--border-window-inner)',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span>{option.label}</span>
                    <span style={{ color: option.color, fontSize: '0.78rem' }}>
                      {isSelected ? '選択中' : '選ぶ'}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-icon"
              onClick={() => setIsOpen(false)}
              style={{ justifySelf: 'end', padding: '8px 12px' }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
