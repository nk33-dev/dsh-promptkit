import React from "react";
import type { Api } from "./api.ts";
import { type T } from "./locales.ts";
import { type ToastMessage } from "./ui.tsx";
import { type ComposerInput } from "./useDraft.ts";
import type { WriteBack } from "./Enhance.tsx";
export declare function Library({ api, t, editId, management, notify, onClose, onWrite, ...composer }: ComposerInput & {
    api: Api;
    t: T;
    editId?: string;
    management?: boolean;
    notify: (text: string, action?: ToastMessage["action"]) => void;
    onClose?: () => void;
    onWrite?: WriteBack;
}): React.JSX.Element;
