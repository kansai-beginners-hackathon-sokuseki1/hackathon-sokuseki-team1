/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useRef, useState } from 'react';
import { Target } from 'lucide-react';
import { GameScene, getAdventureStage } from './GameScene';

export function StatusHeader({ stats, getRequiredExp, selectedStage = null }) {
  const { level, currentExp } = stats;
  const stage = selectedStage ?? getAdventureStage(level);
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
      <GameScene level={level} stage={stage} />
      <div className="status-row">
        <div className="status-row__primary">
          <div className={`level-ring${levelAnim ? ' level-ring--up' : ''}`}>
            <span className="lv-label">Lv</span>
            <span className="lv-num">{level}</span>
          </div>
          <div className="stage-chip" aria-label={`Current stage ${stage.label}`}>
            <span className="stage-chip__label">STAGE</span>
            <span className="stage-chip__value">{stage.label}</span>
          </div>
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
        className="status-next-level"
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
