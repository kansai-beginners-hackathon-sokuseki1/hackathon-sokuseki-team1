/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useRef, useState } from 'react';
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
  const [draftValue, setDraftValue] = useState(value ?? '');
  const [viewYear, setViewYear] = useState(
    () => (value ? new Date(`${value}T00:00:00`).getFullYear() : today.getFullYear())
  );
  const [viewMonth, setViewMonth] = useState(
    () => (value ? new Date(`${value}T00:00:00`).getMonth() : today.getMonth())
  );
  const wrapRef = useRef(null);

  useEffect(() => {
    setDraftValue(value ?? '');
  }, [value]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function closePicker() {
      setDraftValue(value ?? '');
      setIsOpen(false);
    }

    function onOutside(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        closePicker();
      }
    }

    document.addEventListener('mousedown', onOutside);
    window.addEventListener('resize', closePicker);

    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('resize', closePicker);
    };
  }, [isOpen, value]);

  function togglePicker() {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setDraftValue(value ?? '');
        const baseDate = value ? new Date(`${value}T00:00:00`) : today;
        setViewYear(baseDate.getFullYear());
        setViewMonth(baseDate.getMonth());
      }
      return next;
    });
  }

  const selectedDate = draftValue ? new Date(`${draftValue}T00:00:00`) : null;

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
    setDraftValue(`${date.getFullYear()}-${month}-${dateNum}`);
  }

  function confirmSelection() {
    onChange(draftValue);
    setIsOpen(false);
  }

  function cancelSelection() {
    setDraftValue(value ?? '');
    setIsOpen(false);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < firstDay; index += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  const displayText = value
    ? formatFantasyDate(value)
    : '期限を設定';

  return (
    <div className="fdp-wrap" ref={wrapRef}>
      <button
        type="button"
        className="fdp-trigger"
        onClick={togglePicker}
        disabled={disabled}
      >
        <span className="fdp-icon">📜</span>
        <span className="fdp-text">{displayText}</span>
      </button>

      {isOpen && (
        <div className="fdp-popup" role="dialog" aria-label="日付選択">
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
                    isSat ? 'fdp-day--sat' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="fdp-footer">
            <div className="fdp-footer-actions">
              <button
                type="button"
                className="fdp-footer-btn"
                onClick={cancelSelection}
              >
                戻る
              </button>
              <button
                type="button"
                className="fdp-footer-btn fdp-footer-btn--primary"
                onClick={confirmSelection}
              >
                決定
              </button>
            </div>
            {value && (
              <button
                type="button"
                className="fdp-clear-btn"
                onClick={() => {
                  onChange('');
                  setDraftValue('');
                  setIsOpen(false);
                }}
              >
                期限を解除
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
