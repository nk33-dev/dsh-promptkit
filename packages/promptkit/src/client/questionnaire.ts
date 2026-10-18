import type { Question, Round } from "../shared/types.ts";

export const deferredAnswer = "暂不决定：保留为待定，不替我选择";
export const delegatedAnswer = "你来决定：根据已确认需求选择，并说明依据";
export function answerValues(answer = ""): string[] {
  if (!answer || [deferredAnswer, delegatedAnswer].includes(answer)) return [];
  try {
    const values: unknown = JSON.parse(answer);
    if (Array.isArray(values) && values.every(value => typeof value === "string")) return values;
  } catch { /* 普通单选和自由填写直接按文本读取。 */ }
  return [answer];
}
export function orderedQuestion(question: Question): Question {
  const index = question.recommended;
  if (index === null || index === undefined || index <= 0 || index >= question.options.length) return question;
  return { ...question, recommended: 0, options: [question.options[index], ...question.options.filter((_, i) => i !== index)] };
}
export function mergeQuestionnaire(rounds: Round[], incoming: Question[]) {
  const questions = new Map<string, Question>();
  const answers: Record<string, string> = Object.create(null);
  for (const round of rounds) {
    for (const question of round.questions) questions.set(question.id, orderedQuestion(question));
    for (const answer of round.answers) answers[answer.questionId] = answer.answer;
  }
  for (const question of incoming) questions.set(question.id, orderedQuestion(question));
  const all = [...questions.values()];
  if (all.length > 128) throw new Error("问题记录过长，请直接生成 / Too many questions; generate now");
  const first = incoming[0];
  return { questions: all, answers, index: Math.max(0, all.findIndex(question => question.id === first?.id)) };
}
