// モックのフロントエンドと同じ経験値・レベル計算式を使用

/**
 * 難易度（1〜5）から獲得EXPを計算する
 */
export function calculateExpByDifficulty(difficulty) {
  const baseExp = 10;
  const multipliers = [0, 1, 3, 6, 12, 25];
  const diffInt = Math.max(1, Math.min(5, Math.floor(difficulty) || 1));
  const baseReward = baseExp * multipliers[diffInt];
  // ±20% のランダム幅
  const variance = Math.floor(baseReward * 0.2);
  const randomOffset = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
  return Math.max(5, baseReward + randomOffset);
}

/**
 * 累計XPからレベルと現在EXPを計算する
 * フロントエンドの getRequiredExp(level) = floor(100 * 1.2^(level-1)) に対応
 */
export function computeLevelFromXp(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (true) {
    const required = Math.floor(100 * Math.pow(1.2, level - 1));
    if (remaining < required) break;
    remaining -= required;
    level++;
  }
  return { level, currentExp: remaining };
}
