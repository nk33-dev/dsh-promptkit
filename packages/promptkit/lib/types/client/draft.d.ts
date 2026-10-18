import type { InputState, InputActions } from "@deepseek-ai/dsh-client-ui-conversation/client";
export interface DraftGuard {
    sessionId: string;
    draft: string;
    revision: number;
    attachmentIds: readonly string[];
    references: string;
}
export declare function captureDraft(sessionId: string, input: InputState): DraftGuard;
export declare function draftUnchanged(guard: DraftGuard, sessionId: string, input: InputState): boolean;
export declare function detectLength(input: InputState): number;
interface Edit {
    start: number;
    end: number;
    text: string;
}
export declare function replacementEdits(input: InputState, text: string): Edit[] | null;
export declare function writeDraft(actions: InputActions, read: () => InputState, guard: DraftGuard, sessionId: string, text: string, mode: "replace" | "append"): boolean;
export {};
