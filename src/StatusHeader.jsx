/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useRef, useState } from 'react';
import { Target } from 'lucide-react';
import { GameScene } from './FantasyBackground';

export function StatusHeader({ stats, getRequiredExp }) {
  const { level, currentExp } = stats;
  const requiredExp = getRequiredExp(level);
  const percentage = Math.min(100, Math.round((currentExp / requiredExp) * 100));
  const prevLevel = useRef(level);
  const [levelAnim, setLevelAnim] = useState(false);

  useEffect(() => {
    if (level !== prevLevel.current) {
      prevLevel.current = level;
      setLevelAnim(true);
      const timer = setTimeout(() => setLevelAnim(false), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [level]);

  return (
    <div className="rpg-window user-status-header">
      <GameScene level={level} />
      <div className="status-row">
        <div className={`level-ring${levelAnim ? ' level-ring--up' : ''}`}>
          <span className="lv-label">Lv</span>
          <span className="lv-num">{level}</span>
        </div>
        <div className="exp-info">
          {currentExp} / {requiredExp} EXP
        </div>
      </div>

      <div className="exp-bar-container">
        <div
          className="exp-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: 'var(--spacing-xs)',
          gap: 'var(--spacing-xs)',
          color: 'var(--text-muted)',
          fontSize: '0.8rem'
        }}
      >
        <Target size={13} />
        <span>次のレベルまであと {requiredExp - currentExp} EXP</span>
      </div>
    </div>
  );
}
