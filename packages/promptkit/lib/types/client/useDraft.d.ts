import type { InputActions, InputState } from "@deepseek-ai/dsh-client-ui-conversation/client";
import type { Project } from "../shared/types.ts";
import type { Api } from "./api.ts";
import type { T } from "./locales.ts";
import { type DraftGuard } from "./draft.ts";
export interface ComposerInput {
    sessionId?: string;
    input?: InputState;
    inputActions?: InputActions;
}
export declare function useDraft(api: Api, t: T, { sessionId, input, inputActions }: ComposerInput, project?: Project | null, resume?: {
    guard?: DraftGuard;
    project?: Project | null;
}): {
    guard: DraftGuard | null;
    stale: boolean;
    reset: (signal?: AbortSignal, allowEmpty?: boolean) => Promise<DraftGuard>;
    useText: (text: string, how: "copy" | "replace" | "append", override?: DraftGuard) => Promise<string>;
    original: () => string;
    current: import("react").MutableRefObject<{
        sessionId: string;
        input: InputState | undefined;
    }>;
    origin: import("react").MutableRefObject<Project | null | undefined>;
};
/** 替换后原样换回，供提示条「撤销」使用；输入框在替换后又被改过就放弃。 */
export declare function revertDraft(actions: InputActions | undefined, read: () => InputState | undefined, sessionId: string, original: string, revision: number): boolean;
