export const XP_PER_COMPLETED_TASK = 10;

const STAGE_RULES = [
  { minCompletedTasks: 0, stage: "camp" },
  { minCompletedTasks: 1, stage: "meadow" },
  { minCompletedTasks: 3, stage: "forest" },
  { minCompletedTasks: 5, stage: "ruins" },
  { minCompletedTasks: 8, stage: "dragon-gate" }
];

export function calculateLevel(xp) {
  return Math.floor(xp / 50) + 1;
}

export function calculateProgressStage(completedTaskCount) {
  let currentStage = STAGE_RULES[0].stage;
  for (const rule of STAGE_RULES) {
    if (completedTaskCount >= rule.minCompletedTasks) {
      currentStage = rule.stage;
    }
  }
  return currentStage;
}

export function calculateGuideState({ totalTaskCount, completedTaskCount, overdueTaskCount }) {
  if (completedTaskCount === 0 && totalTaskCount === 0) {
    return "welcome";
  }

  if (overdueTaskCount > 0) {
    return "danger-overdue";
  }

  if (totalTaskCount > 0 && completedTaskCount === totalTaskCount) {
    return "victory";
  }

  return "quest-board-active";
}
