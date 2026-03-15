/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Lock, Target } from 'lucide-react';
import { GameScene, getAdventureStage } from './GameScene';

export function StatusHeader({
  stats,
  getRequiredExp,
  selectedStage = null,
  selectedStageMode = 'auto',
  autoStage = null,
  stageOptions = [],
  unlockedStageKeys = new Set(),
  canUseLockedStages = false,
  onStageChange
}) {
  const { level, currentExp } = stats;
  const stage = selectedStage ?? getAdventureStage(level);
  const autoResolvedStage = autoStage ?? getAdventureStage(level);
  const requiredExp = getRequiredExp(level);
  const percentage = Math.min(100, Math.round((currentExp / requiredExp) * 100));
  const prevLevel = useRef(level);
  const stageMenuRef = useRef(null);
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

  useEffect(() => {
    function closeStageMenuOnOutside(event) {
      const menu = stageMenuRef.current;
      if (!menu?.hasAttribute('open')) return;
      if (menu.contains(event.target)) return;
      menu.removeAttribute('open');
    }

    document.addEventListener('mousedown', closeStageMenuOnOutside);
    return () => document.removeEventListener('mousedown', closeStageMenuOnOutside);
  }, []);

  return (
    <div className="rpg-window user-status-header">
      <GameScene level={level} stage={stage} />
      <div className="status-row">
        <div className="status-row__primary">
          <div className={`level-ring${levelAnim ? ' level-ring--up' : ''}`}>
            <span className="lv-label">Lv</span>
            <span className="lv-num">{level}</span>
          </div>
          <details className="stage-chip stage-chip--menu" ref={stageMenuRef}>
            <summary className="stage-chip__summary" aria-label={`Current stage ${stage.label}`}>
              <span className="stage-chip__copy">
                <span className="stage-chip__label">STAGE</span>
                <span className="stage-chip__value">{stage.label}</span>
              </span>
              <ChevronDown size={16} className="stage-chip__chevron" />
            </summary>
            <div className="stage-chip__menu rpg-window">
              <button
                type="button"
                className={`stage-chip__option${selectedStageMode === 'auto' ? ' stage-chip__option--active' : ''}`}
                onClick={() => {
                  onStageChange?.(null);
                  stageMenuRef.current?.removeAttribute('open');
                }}
              >
                <span className="stage-chip__option-copy">
                  <span className="stage-chip__option-title">自動</span>
                  <span className="stage-chip__option-meta">{autoResolvedStage.label}</span>
                </span>
              </button>
              {stageOptions.map((option) => {
                const unlocked = canUseLockedStages || unlockedStageKeys.has(option.key);
                const isActive = selectedStageMode === 'manual' && stage.key === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`stage-chip__option${isActive ? ' stage-chip__option--active' : ''}`}
                    onClick={() => {
                      if (!unlocked) return;
                      onStageChange?.(option.key);
                      stageMenuRef.current?.removeAttribute('open');
                    }}
                    disabled={!unlocked}
                  >
                    <span className="stage-chip__option-copy">
                      <span className="stage-chip__option-title">
                        {!unlocked && <Lock size={12} className="stage-chip__lock" />}
                        {option.label}
                      </span>
                      <span className="stage-chip__option-meta">
                        {unlocked ? `Lv ${option.minLevel}+` : `Lv ${option.minLevel} で解放`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </details>
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
