import { describe, expect, it } from "vitest";
import { generationGuidance, promptAudiences, questionLimit, outputBudget } from "../src/shared/preferences.ts";
import { defaultSettings } from "../src/shared/defaults.ts";
import { settingsSchema } from "../src/shared/schemas.ts";
import { parseResult } from "../src/host/model.ts";
import { answerValues, mergeQuestionnaire } from "../src/client/questionnaire.ts";

const question = {
  id: "scope", title: "范围", question: "需要哪些功能？", basis: "功能影响交付范围",
  multiSelect: true, options: [{ label: "查询", description: "" }, { label: "借还", description: "" }], recommended: 1,
};
describe("generation preferences", () => {
  it("loads legacy settings and preserves explicit preferences", () => {
    const { detail: _, audience: __, ...legacy } = defaultSettings();
    expect(settingsSchema.parse(legacy)).toMatchObject({ detail: "standard", audience: "p4" });
    expect(settingsSchema.parse({ ...legacy, detail: "detailed", audience: "nontechnical" })).toMatchObject({ detail: "detailed", audience: "nontechnical" });
  });
  it.each(["concise", "standard", "detailed"] as const)("enforces the %s question budget independently of saved history", detail => {
    const limit = questionLimit(detail);
    expect(limit).toBe(detail === "concise" ? 5 : detail === "standard" ? 10 : 15);
    const questions = Array.from({ length: limit }, (_, index) => ({ ...question, id: String(index) }));
    expect(parseResult(JSON.stringify({ kind: "questions", questions }), false, limit).questions).toHaveLength(limit);
    expect(() => parseResult(JSON.stringify({ kind: "questions", questions: [...questions, { ...question, id: "extra" }] }), false, limit)).toThrow();
    expect(generationGuidance({ detail, audience: "p4" })).toContain(`最多提出 ${limit} 题`);
    expect(outputBudget(detail)).toBe(detail === "concise" ? 2048 : detail === "standard" ? 4096 : 8192);
  });
  it("uses each selected audience without sending all audience rules", () => {
    for (const audience of promptAudiences) {
      const text = generationGuidance({ detail: "detailed", audience: audience.value as ReturnType<typeof defaultSettings>["audience"] });
      expect(text).toContain(audience.rule);
      for (const other of promptAudiences.filter(item => item !== audience)) expect(text).not.toContain(other.rule);
    }
  });
  it("keeps earlier answers across targeted follow-up and sorts recommendations", () => {
    const queue = mergeQuestionnaire([{ questions: [question], answers: [{ questionId: "scope", answer: '["查询","借还"]' }] }], [{ ...question, id: "rules", question: "借阅上限？" }]);
    expect(queue.questions.map(q => q.id)).toEqual(["scope", "rules"]);
    expect(queue.index).toBe(1);
    expect(queue.questions[0].options[0].label).toBe("借还");
    expect(answerValues(queue.answers.scope)).toEqual(["查询", "借还"]);
  });
  it("clears the returned question's old answer while retaining the other decisions", () => {
    const queue = mergeQuestionnaire([{ questions: [question, { ...question, id: "stack" }], answers: [{ questionId: "scope", answer: "看不懂" }, { questionId: "stack", answer: "Java" }] }], [{ ...question, question: "先只查询还是包含借还？" }]);
    expect(queue.answers.scope).toBeUndefined();
    expect(queue.answers.stack).toBe("Java");
  });
});
