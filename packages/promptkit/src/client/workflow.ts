import type {
  GenerationResult,
  Round,
  Project,
  Favorite,
} from "../shared/types.ts";
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
  messages: { role: "user" | "assistant"; text: string; round?: number }[];
  supplement: string;
  guard?: DraftGuard;
  project?: Project | null;
  started: boolean;
}
// 跟随插件实例存活，不写入宿主聊天或磁盘。
const sessions = new WeakMap<Api, Map<string, Workflow>>();
interface LibraryState {
  /** 正在编辑的条目，关闭卡片后保留未保存的修改。 */
  editing: Favorite | null;
  tagText: string;
  search: string;
  /** 筛选：all、project、global 或自定义标签。 */
  filter: string;
  limit: number;
}
const libraries = new WeakMap<Api, Map<string, LibraryState>>();
export function libraryState(
  api: Api,
  sessionId: string,
  management: boolean,
): LibraryState {
  let entries = libraries.get(api);
  if (!entries) {
    entries = new Map();
    libraries.set(api, entries);
  }
  const key = JSON.stringify([sessionId, management]);
  let state = entries.get(key);
  if (!state) {
    state = {
      editing: null,
      tagText: "",
      search: "",
      filter: "all",
      limit: management ? 200 : 50,
    };
    entries.set(key, state);
  }
  return state;
}
export function workflow(api: Api, sessionId: string, mode: string): Workflow {
  let entries = sessions.get(api);
  if (!entries) {
    entries = new Map();
    sessions.set(api, entries);
  }
  const key = JSON.stringify([sessionId, mode]);
  let state = entries.get(key);
  if (!state) {
    state = {
      result: null,
      edited: "",
      history: [],
      answers: {},
      questionIndex: 0,
      intro: "",
      messages: [],
      supplement: "",
      started: false,
    };
    entries.set(key, state);
  }
  return state;
}
