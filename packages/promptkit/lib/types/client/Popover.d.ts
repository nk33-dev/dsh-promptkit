import React from "react";
/** 输入框容器：从图标往上找第一个包含编辑区的祖先，找不到就用图标本身。 */
export declare function composerOf(anchor: HTMLElement): HTMLElement;
/**
 * 原生 popover="auto"：Esc 和点击外部由浏览器关闭。
 * 菜单贴着图标弹出；卡片浮在输入框上方，与输入框同宽。
 * 鼠标打开时聚焦容器，键盘打开时聚焦第一个控件。
 */
export declare function Popover({ anchor, label, onClose, children, menu, focusFirst, }: {
    anchor: HTMLElement;
    label: string;
    onClose: () => void;
    children: React.ReactNode;
    menu?: boolean;
    focusFirst?: boolean;
}): React.JSX.Element;
/**
 * 卡片关闭后的提示条：manual popover 放进顶层，压在输入框上方居中。
 * 卡片打开时提示条直接渲染在卡片里，避免点击它触发卡片的点击外部关闭。
 */
export declare function Floating({ anchor, children, }: {
    anchor: HTMLElement;
    children: React.ReactNode;
}): React.JSX.Element;
