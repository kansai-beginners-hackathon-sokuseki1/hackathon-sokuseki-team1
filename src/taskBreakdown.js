export function serializeQuestBreakdown(breakdown) {
  if (!breakdown?.mainQuest || !Array.isArray(breakdown?.subQuests) || breakdown.subQuests.length === 0) {
    return "";
  }

  return JSON.stringify({
    type: "quest_breakdown_v1",
    mainQuest: breakdown.mainQuest,
    subQuests: breakdown.subQuests.map((item) => ({
      title: String(item?.title || "").trim(),
      intent: String(item?.intent || "").trim()
    })).filter((item) => item.title)
  });
}

export function parseQuestBreakdown(description) {
  if (typeof description !== "string" || !description.trim()) return null;

  try {
    const parsed = JSON.parse(description);
    if (parsed?.type !== "quest_breakdown_v1") return null;
    if (typeof parsed.mainQuest !== "string") return null;
    if (!Array.isArray(parsed.subQuests)) return null;

    const subQuests = parsed.subQuests
      .map((item) => ({
        title: String(item?.title || "").trim(),
        intent: String(item?.intent || "").trim()
      }))
      .filter((item) => item.title);

    if (subQuests.length === 0) return null;

    return {
      mainQuest: parsed.mainQuest.trim(),
      subQuests
    };
  } catch {
    return null;
  }
}
