export function serializeQuestBreakdown(breakdown) {
  if (!breakdown?.mainQuest || !Array.isArray(breakdown?.subQuests) || breakdown.subQuests.length === 0) {
    return "";
  }

  return JSON.stringify({
    type: "quest_main_v1",
    role: "main",
    mainQuest: breakdown.mainQuest,
    subQuests: breakdown.subQuests.map((item) => ({
      title: String(item?.title || "").trim(),
      intent: String(item?.intent || "").trim()
    })).filter((item) => item.title)
  });
}

export function serializeSubQuestMetadata({ parentTaskId, parentTitle, mainQuest, subQuest }) {
  if (!subQuest?.title) return "";

  return JSON.stringify({
    type: "quest_subtask_v1",
    role: "sub",
    parentTaskId: String(parentTaskId || "").trim(),
    parentTitle: String(parentTitle || "").trim(),
    mainQuest: String(mainQuest || "").trim(),
    title: String(subQuest.title || "").trim(),
    intent: String(subQuest.intent || "").trim()
  });
}

export function parseQuestMetadata(description) {
  if (typeof description !== "string" || !description.trim()) return null;

  try {
    const parsed = JSON.parse(description);

    if (parsed?.type === "quest_breakdown_v1" || parsed?.type === "quest_main_v1") {
      if (typeof parsed.mainQuest !== "string" || !Array.isArray(parsed.subQuests)) return null;
      const subQuests = parsed.subQuests
        .map((item) => ({
          title: String(item?.title || "").trim(),
          intent: String(item?.intent || "").trim()
        }))
        .filter((item) => item.title);

      return {
        role: "main",
        mainQuest: parsed.mainQuest.trim(),
        subQuests
      };
    }

    if (parsed?.type === "quest_subtask_v1") {
      return {
        role: "sub",
        parentTaskId: String(parsed.parentTaskId || "").trim(),
        parentTitle: String(parsed.parentTitle || "").trim(),
        mainQuest: String(parsed.mainQuest || "").trim(),
        title: String(parsed.title || "").trim(),
        intent: String(parsed.intent || "").trim()
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function parseQuestBreakdown(description) {
  const metadata = parseQuestMetadata(description);
  if (!metadata || metadata.role !== "main") return null;
  return {
    mainQuest: metadata.mainQuest,
    subQuests: metadata.subQuests
  };
}
