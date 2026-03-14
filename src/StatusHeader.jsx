import React from 'react';
import { Target } from 'lucide-react';

export function StatusHeader({ stats, getRequiredExp }) {
  const { level, currentExp } = stats;
  const requiredExp = getRequiredExp(level);
  const percentage = Math.min(100, Math.round((currentExp / requiredExp) * 100));

  return (
    <div className="rpg-window user-status-header">
      <div className="status-row">
        <div className="level-badge">
          <span>Lv.</span>
          {level}
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

      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        marginTop: 'var(--spacing-xs)',
        gap: 'var(--spacing-xs)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem'
      }}>
        <Target size={13} />
        <span>次のレベルまであと {requiredExp - currentExp} EXP</span>
      </div>
    </div>
  );
}
