import React from "react";
import type { Configuration, Mode } from "../shared/types.ts";
import type { Api } from "./api.ts";
import { type T } from "./locales.ts";
import { type ComposerInput } from "./useDraft.ts";
import { type ToastMessage } from "./ui.tsx";
/** 写回输入框之后：关闭卡片并提示，替换可撤销。 */
export type WriteBack = (how: "replace" | "append", before: string, revision: number) => void;
export declare function Enhance({ api, t, config, mode, notify, onClose, onWrite, onEditFavorite, ...composer }: ComposerInput & {
    api: Api;
    t: T;
    config: Configuration;
    mode: Mode;
    notify: (text: string, action?: ToastMessage["action"]) => void;
    onClose: () => void;
    onWrite: WriteBack;
    onEditFavorite: (id: string) => void;
}): React.JSX.Element;
