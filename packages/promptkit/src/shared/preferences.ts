import preferences from "./preferences.json" with { type: "json" };
import type { Settings } from "./types.ts";

export const promptDetails = preferences.details;
export const promptAudiences = preferences.audiences;
export const promptDetailLabelsEn = preferences.detailLabelsEn;
export const promptAudienceLabelsEn = preferences.audienceLabelsEn;
export function questionLimit(detail: Settings["detail"]): number {
  return preferences.questionLimits[detail] ?? 10;
}
export function outputBudget(detail: Settings["detail"]): number {
  return preferences.outputBudgets[detail] ?? 4096;
}
export function generationGuidance(settings: Pick<Settings, "detail" | "audience">): string {
  return [
    promptDetails.find(item => item.value === settings.detail)?.rule ?? promptDetails[1].rule,
    promptAudiences.find(item => item.value === settings.audience)?.rule ?? promptAudiences[1].rule,
    `本次最多提出 ${questionLimit(settings.detail)} 题；这是上限，不是题数目标。`,
  ].join("\n");
}
