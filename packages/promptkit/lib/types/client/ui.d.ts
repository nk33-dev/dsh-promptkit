import React from "react";
import type { Api } from "./api.ts";
import type { T } from "./locales.ts";
export declare function Button({ primary, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    primary?: boolean;
}): React.JSX.Element;
export declare function Field({ label, children, }: {
    label: string;
    children: React.ReactNode;
}): React.JSX.Element;
export declare function Switch({ label, checked, onChange, disabled, }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}): React.JSX.Element;
export declare function navigateTabs(event: React.KeyboardEvent<HTMLElement>): void;
export declare function download(name: string, text: string): void;
export declare function useTask(): {
    error: string;
    setError: React.Dispatch<React.SetStateAction<string>>;
    notice: string;
    setNotice: React.Dispatch<React.SetStateAction<string>>;
    perform: (task: () => Promise<unknown>, success?: string) => Promise<void>;
    busy: boolean;
};
export declare function Status({ error, notice }: {
    error?: string;
    notice?: string;
}): React.JSX.Element;
export interface ToastMessage {
    id: number;
    text: string;
    action?: {
        label: string;
        run: () => void;
    };
}
export declare function Toast({ toast }: {
    toast: ToastMessage | null;
}): React.JSX.Element | null;
/** 提示条：带操作的停留 5 秒，其余 2 秒。 */
export declare function useToast(): {
    toast: ToastMessage | null;
    notify: (text: string, action?: ToastMessage["action"]) => void;
    clear: () => void;
};
export declare function CardHeader({ title, meta, t, onClose, children, }: {
    title: string;
    meta?: string;
    t: T;
    onClose?: () => void;
    children?: React.ReactNode;
}): React.JSX.Element;
export declare function IconButton({ label, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
}): React.JSX.Element;
export declare function Loading({ text }: {
    text: string;
}): React.JSX.Element;
/** 卡片底部的错误：固定可见，并给出下一步。 */
export declare function ErrorBar({ error, t, onRetry, }: {
    error: string;
    t: T;
    onRetry?: () => void;
}): React.JSX.Element | null;
export declare function useData<T>(api: Api, action: string, payload: unknown, enabled?: boolean): {
    data: T | null;
    error: string;
    reload: () => void;
};
