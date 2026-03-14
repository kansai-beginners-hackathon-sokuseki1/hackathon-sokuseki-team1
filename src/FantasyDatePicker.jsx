import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './FantasyDatePicker.css';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function formatFantasyDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}日`;
}

export function FantasyDatePicker({ value, onChange, disabled }) {
  const today = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState({});
  const [viewYear, setViewYear] = useState(
    () => value ? new Date(value + 'T00:00:00').getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    () => value ? new Date(value + 'T00:00:00').getMonth() : today.getMonth()
  );
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  // 外側クリックで閉じる
  useEffect(() => {
    if (!isOpen) return;
    function onOutside(e) {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setIsOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isOpen]);

  // スクロール・リサイズで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen]);

  function openPicker() {
    if (disabled) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popupW = 272;
    let left = rect.left;
    if (left + popupW > window.innerWidth - 8) left = window.innerWidth - popupW - 8;
    setPopupStyle({ top: rect.bottom + 6, left });
    setIsOpen(o => !o);
  }

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function selectDay(day) {
    const d = new Date(viewYear, viewMonth, day);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${d.getFullYear()}-${mm}-${dd}`);
    setIsOpen(false);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const displayText = selectedDate
    ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}日`
    : '期限を設定…';

  const popup = isOpen && ReactDOM.createPortal(
    <div className="fdp-popup" style={popupStyle} ref={popupRef}>
      {/* 角飾り */}
      <span className="fdp-corner fdp-corner--tl">✦</span>
      <span className="fdp-corner fdp-corner--tr">✦</span>
      <span className="fdp-corner fdp-corner--bl">✦</span>
      <span className="fdp-corner fdp-corner--br">✦</span>

      {/* ヘッダー */}
      <div className="fdp-header">
        <button type="button" className="fdp-nav" onClick={prevMonth}>◀</button>
        <div className="fdp-month-label">
          <span className="fdp-year">{viewYear}年</span>
          <span className="fdp-month-name">{MONTHS[viewMonth]}</span>
        </div>
        <button type="button" className="fdp-nav" onClick={nextMonth}>▶</button>
      </div>

      {/* 曜日ラベル */}
      <div className="fdp-grid">
        {DAYS.map((d, i) => (
          <div key={d} className={`fdp-day-label fdp-day-label--${i === 0 ? 'sun' : i === 6 ? 'sat' : 'week'}`}>
            {d}
          </div>
        ))}

        {/* 日付セル */}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="fdp-day-empty" />;
          const col = (firstDay + day - 1) % 7;
          const isSel = selectedDate &&
            selectedDate.getFullYear() === viewYear &&
            selectedDate.getMonth() === viewMonth &&
            selectedDate.getDate() === day;
          const isToday =
            today.getFullYear() === viewYear &&
            today.getMonth() === viewMonth &&
            today.getDate() === day;
          const isSun = col === 0;
          const isSat = col === 6;
          return (
            <button
              key={day}
              type="button"
              className={[
                'fdp-day',
                isSel  ? 'fdp-day--selected' : '',
                isToday ? 'fdp-day--today'    : '',
                isSun  ? 'fdp-day--sun'       : '',
                isSat  ? 'fdp-day--sat'       : '',
              ].filter(Boolean).join(' ')}
              onClick={() => selectDay(day)}
            >
              {day}
            </button>
          );
        })}
      </div>

      {value && (
        <div className="fdp-footer">
          <button type="button" className="fdp-clear-btn" onClick={() => { onChange(''); setIsOpen(false); }}>
            ✕ 期限を解除
          </button>
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <div className="fdp-wrap">
      <button
        type="button"
        className="fdp-trigger"
        onClick={openPicker}
        disabled={disabled}
        ref={triggerRef}
      >
        <span className="fdp-icon">⏳</span>
        <span className="fdp-text">{displayText}</span>
      </button>
      {popup}
    </div>
  );
}
