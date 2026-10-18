import React, { useLayoutEffect, useRef } from "react";

/** 输入框容器：从图标往上找第一个包含编辑区的祖先，找不到就用图标本身。 */
export function composerOf(anchor: HTMLElement): HTMLElement {
  for (
    let node = anchor.parentElement;
    node && node !== document.body;
    node = node.parentElement
  )
    if (node.querySelector("[contenteditable=true],textarea")) return node;
  return anchor;
}
/**
 * 原生 popover="auto"：Esc 和点击外部由浏览器关闭。
 * 菜单贴着图标弹出；卡片浮在输入框上方，与输入框同宽。
 * 鼠标打开时不抢焦点，避免出现焦点环；键盘打开时聚焦第一个控件。
 */
export function Popover({
  anchor,
  label,
  onClose,
  children,
  menu = false,
  focusFirst = false,
}: {
  anchor: HTMLElement;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  menu?: boolean;
  focusFirst?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useLayoutEffect(() => {
    const element = panel.current!,
      composer = composerOf(anchor),
      before = document.activeElement as HTMLElement | null;
    element.setAttribute("popover", "auto");
    function position() {
      if (menu) {
        const rect = anchor.getBoundingClientRect(),
          bounds = element.getBoundingClientRect();
        element.style.left = `${Math.max(8, Math.min(rect.right - bounds.width, innerWidth - bounds.width - 8))}px`;
        element.style.top = `${rect.top - bounds.height - 8 >= 8 ? rect.top - bounds.height - 8 : rect.bottom + 8}px`;
        return;
      }
      const box = composer.getBoundingClientRect(),
        width = Math.max(0, Math.min(box.width, innerWidth - 16)),
        room = box.top - 16;
      element.style.width = `${width}px`;
      element.style.left = `${Math.max(8, Math.min(box.left, innerWidth - width - 8))}px`;
      if (room >= 240) {
        element.style.maxHeight = `${Math.min(room, innerHeight * 0.62)}px`;
        element.style.top = "auto";
        element.style.bottom = `${innerHeight - box.top + 8}px`;
      } else {
        const below = innerHeight - box.bottom - 16;
        element.style.maxHeight = `${Math.max(0, Math.min(below >= 240 ? below : innerHeight - 16, innerHeight * 0.62))}px`;
        element.style.bottom = below >= 240 ? "auto" : "8px";
        element.style.top = below >= 240 ? `${box.bottom + 8}px` : "auto";
      }
    }
    const toggle = (event: Event) => {
      if ((event as ToggleEvent).newState === "closed") close.current();
    };
    element.addEventListener("toggle", toggle);
    element.showPopover();
    position();
    const observer = new ResizeObserver(position);
    observer.observe(element);
    observer.observe(composer);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    if (focusFirst)
      element
        .querySelector<HTMLElement>(
          "[role=menuitem],.pk-body input,.pk-body textarea,.pk-body button,.pk-foot button",
        )
        ?.focus();
    return () => {
      element.removeEventListener("toggle", toggle);
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      element.hidePopover();
      if (element.contains(document.activeElement) && before?.isConnected)
        before.focus();
    };
  }, [anchor, menu]);
  return (
    <div
      ref={panel}
      className={`pk-panel pk-flyout${menu ? " pk-menu" : " pk-card"}`}
      role={menu ? "menu" : "dialog"}
      aria-label={label}
    >
      {children}
    </div>
  );
}
/**
 * 卡片关闭后的提示条：manual popover 放进顶层，压在输入框上方居中。
 * 卡片打开时提示条直接渲染在卡片里，避免点击它触发卡片的点击外部关闭。
 */
export function Floating({
  anchor,
  children,
}: {
  anchor: HTMLElement;
  children: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = box.current!;
    element.setAttribute("popover", "manual");
    element.showPopover();
    const rect = composerOf(anchor).getBoundingClientRect(),
      bounds = element.getBoundingClientRect();
    element.style.left = `${Math.max(8, Math.min(rect.left + (rect.width - bounds.width) / 2, innerWidth - bounds.width - 8))}px`;
    element.style.top = `${Math.max(8, rect.top - bounds.height - 8)}px`;
    return () => element.hidePopover();
  }, [anchor, children]);
  return (
    <div ref={box} className="pk-flyout pk-floating">
      {children}
    </div>
  );
}
