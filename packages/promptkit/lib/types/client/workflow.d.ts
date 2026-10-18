import type { GenerationResult, Round, Project, Favorite } from "../shared/types.ts";
import type { DraftGuard } from "./draft.ts";
import type { Api } from "./api.ts";
export interface Workflow {
    result: GenerationResult | null;
    edited: string;
    history: Round[];
    answers: Record<string, string>;
    questionIndex: number;
    /** 输入框为空时「需求对齐」第一题的回答，作为本次草稿。 */
    intro: string;
    messages: {
        role: "user" | "assistant";
        text: string;
        round?: number;
    }[];
    supplement: string;
    guard?: DraftGuard;
    project?: Project | null;
    started: boolean;
}
interface LibraryState {
    /** 正在编辑的条目，关闭卡片后保留未保存的修改。 */
    editing: Favorite | null;
    tagText: string;
    search: string;
    /** 筛选：all、project、global 或自定义标签。 */
    filter: string;
    limit: number;
}
export declare function libraryState(api: Api, sessionId: string, management: boolean): LibraryState;
export declare function workflow(api: Api, sessionId: string, mode: string): Workflow;
export {};
