import type { Question, Round } from "../shared/types.ts";
export declare const deferredAnswer = "\u6682\u4E0D\u51B3\u5B9A\uFF1A\u4FDD\u7559\u4E3A\u5F85\u5B9A\uFF0C\u4E0D\u66FF\u6211\u9009\u62E9";
export declare const delegatedAnswer = "\u4F60\u6765\u51B3\u5B9A\uFF1A\u6839\u636E\u5DF2\u786E\u8BA4\u9700\u6C42\u9009\u62E9\uFF0C\u5E76\u8BF4\u660E\u4F9D\u636E";
export declare function answerValues(answer?: string): string[];
export declare function orderedQuestion(question: Question): Question;
export declare function mergeQuestionnaire(rounds: Round[], incoming: Question[]): {
    questions: Question[];
    answers: Record<string, string>;
    index: number;
};
