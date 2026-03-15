import React, { useState } from 'react';
import { PreferenceSwipeCard } from './PreferenceSwipeCard';

export function ProfilePrompt({ profile, onSaveProfile, onDismiss }) {
  const [preferences, setPreferences] = useState(profile.preferences);
  const preferenceMap = new Map(preferences.map((item) => [item.categoryId, item.preferenceType]));

  const handleChange = (categoryId, direction) => {
    const current = preferenceMap.get(categoryId) || 'neutral';
    let next = current;
    if (direction === 'left') {
      next = current === 'neutral' ? 'strength' : current === 'weakness' ? 'neutral' : 'strength';
    } else {
      next = current === 'neutral' ? 'weakness' : current === 'strength' ? 'neutral' : 'weakness';
    }
    setPreferences((items) => {
      const others = items.filter((item) => item.categoryId !== categoryId);
      return [...others, { categoryId, preferenceType: next }];
    });
  };

  return (
    <div className="rpg-window" style={{ marginBottom: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem' }}>開始前に設定してください</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            得意・苦手を登録すると、AI の難易度判定がより使いやすくなります。あとで設定することもできます。
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-icon" onClick={onDismiss} style={{ padding: '8px 12px' }}>あとで</button>
          <button className="btn-primary" onClick={() => onSaveProfile({ preferences, onboardingCompleted: true })}>保存</button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
        {profile.categories.map((category) => {
          const value = preferenceMap.get(category.id) || 'neutral';
          return (
            <PreferenceSwipeCard
              key={category.id}
              category={category}
              value={value}
              onChange={(nextValue) => {
                const direction = nextValue === 'strength'
                  ? 'left'
                  : nextValue === 'weakness'
                    ? 'right'
                    : value === 'strength'
                      ? 'right'
                      : 'left';
                handleChange(category.id, direction);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
