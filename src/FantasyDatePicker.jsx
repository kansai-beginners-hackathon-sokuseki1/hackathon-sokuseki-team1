import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './FantasyDatePicker.css';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function formatFantasyDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}日`;
}

export function FantasyDatePicker({ value, onChange, disabled }) {
  const today = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState({});
  const [viewYear, setViewYear] = useState(
    () => (value ? new Date(`${value}T00:00:00`).getFullYear() : today.getFullYear())
  );
  const [viewMonth, setViewMonth] = useState(
    () => (value ? new Date(`${value}T00:00:00`).getMonth() : today.getMonth())
  );
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function onOutside(event) {
      if (
        popupRef.current && !popupRef.current.contains(event.target) &&
        triggerRef.current && !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

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
    const popupWidth = 272;
    let left = rect.left;
    if (left + popupWidth > window.innerWidth - 8) left = window.innerWidth - popupWidth - 8;
    setPopupStyle({ top: rect.bottom + 6, left });
    setIsOpen((prev) => !prev);
  }

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((year) => year - 1);
    } else {
      setViewMonth((month) => month - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((year) => year + 1);
    } else {
      setViewMonth((month) => month + 1);
    }
  }

  function selectDay(day) {
    const date = new Date(viewYear, viewMonth, day);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dateNum = String(date.getDate()).padStart(2, '0');
    onChange(`${date.getFullYear()}-${month}-${dateNum}`);
    setIsOpen(false);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < firstDay; index += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  const displayText = selectedDate
    ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}日`
    : '期限を設定';

  const popup = isOpen && ReactDOM.createPortal(
    <div className="fdp-popup" style={popupStyle} ref={popupRef}>
      <span className="fdp-corner fdp-corner--tl">✦</span>
      <span className="fdp-corner fdp-corner--tr">✦</span>
      <span className="fdp-corner fdp-corner--bl">✦</span>
      <span className="fdp-corner fdp-corner--br">✦</span>

      <div className="fdp-header">
        <button type="button" className="fdp-nav" onClick={prevMonth}>◀</button>
        <div className="fdp-month-label">
          <span className="fdp-year">{viewYear}年</span>
          <span className="fdp-month-name">{MONTHS[viewMonth]}</span>
        </div>
        <button type="button" className="fdp-nav" onClick={nextMonth}>▶</button>
      </div>

      <div className="fdp-grid">
        {DAYS.map((day, index) => (
          <div key={day} className={`fdp-day-label fdp-day-label--${index === 0 ? 'sun' : index === 6 ? 'sat' : 'week'}`}>
            {day}
          </div>
        ))}

        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} className="fdp-day-empty" />;

          const col = (firstDay + day - 1) % 7;
          const isSelected = selectedDate
            && selectedDate.getFullYear() === viewYear
            && selectedDate.getMonth() === viewMonth
            && selectedDate.getDate() === day;
          const isToday = today.getFullYear() === viewYear
            && today.getMonth() === viewMonth
            && today.getDate() === day;
          const isSun = col === 0;
          const isSat = col === 6;

          return (
            <button
              key={day}
              type="button"
              className={[
                'fdp-day',
                isSelected ? 'fdp-day--selected' : '',
                isToday ? 'fdp-day--today' : '',
                isSun ? 'fdp-day--sun' : '',
                isSat ? 'fdp-day--sat' : ''
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
          <button
            type="button"
            className="fdp-clear-btn"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            期限を解除
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
        <span className="fdp-icon">📅</span>
        <span className="fdp-text">{displayText}</span>
      </button>
      {popup}
    </div>
  );
}
