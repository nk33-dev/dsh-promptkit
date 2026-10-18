import React, { useEffect, useRef, useState } from "react";
import type { Api } from "./api.ts";
import { X } from "lucide-react";
import type { T } from "./locales.ts";
export function Button({
  primary,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      type="button"
      className="pk-button"
      data-primary={primary || undefined}
      {...props}
    />
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="pk-label">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Switch({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="pk-switch">
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
export function navigateTabs(event: React.KeyboardEvent<HTMLElement>) {
  if (
    event.nativeEvent.isComposing ||
    ![
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ].includes(event.key)
  )
    return;
  const tabs = [
      ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
        "[role=tab],[role=menuitem]",
      ),
    ],
    at = tabs.indexOf(event.target as HTMLButtonElement);
  if (at < 0) return;
  event.preventDefault();
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (at +
            (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) +
            tabs.length) %
          tabs.length;
  tabs[next].focus();
  if (tabs[next].getAttribute("role") === "tab") tabs[next].click();
}
export function download(name: string, text: string) {
  const url = URL.createObjectURL(
      new Blob([text], { type: "application/json;charset=utf-8" }),
    ),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
export function useTask() {
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    running = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function perform(task: () => Promise<unknown>, success = "") {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
      if (mounted.current && success) setNotice(success);
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return { error, setError, notice, setNotice, perform, busy };
}
export function Status({ error, notice }: { error?: string; notice?: string }) {
  return (
    <>
      {error && (
        <div className="pk-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="pk-notice" role="status">
          {notice}
        </div>
      )}
    </>
  );
}
export interface ToastMessage {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}
export function Toast({ toast }: { toast: ToastMessage | null }) {
  if (!toast) return null;
  return (
    <div className="pk-toast" role="status">
      <span>{toast.text}</span>
      {toast.action && (
        <button type="button" className="pk-link" onClick={toast.action.run}>
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
/** 提示条：带操作的停留 5 秒，其余 2 秒。 */
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null),
    serial = useRef(0);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setToast((value) => (value === toast ? null : value)),
      toast.action ? 5000 : 2000,
    );
    return () => clearTimeout(timer);
  }, [toast]);
  function notify(text: string, action?: ToastMessage["action"]) {
    setToast({
      id: ++serial.current,
      text,
      action: action && {
        label: action.label,
        run: () => {
          setToast(null);
          action.run();
        },
      },
    });
  }
  return { toast, notify, clear: () => setToast(null) };
}
export function CardHeader({
  title,
  meta,
  t,
  onClose,
  children,
}: {
  title: string;
  meta?: string;
  t: T;
  onClose?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <header className="pk-head">
      <h2>{title}</h2>
      {meta && <span className="pk-meta">{meta}</span>}
      <span className="pk-grow" />
      {children}
      {onClose && (
        <IconButton label={t("close")} onClick={onClose}>
          <X size={16} aria-hidden />
        </IconButton>
      )}
    </header>
  );
}
export function IconButton({
  label,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      className={`pk-icon ${className}`}
      title={props.title ?? label}
      aria-label={label}
      {...props}
    />
  );
}
export function Loading({ text }: { text: string }) {
  return (
    <div className="pk-loading" role="status">
      <span className="pk-spin" aria-hidden />
      {text}
    </div>
  );
}
/** 卡片底部的错误：固定可见，并给出下一步。 */
export function ErrorBar({
  error,
  t,
  onRetry,
}: {
  error: string;
  t: T;
  onRetry?: () => void;
}) {
  if (!error) return null;
  return (
    <div className="pk-error-bar" role="alert">
      <span>{error}</span>
      {onRetry && (
        <button type="button" className="pk-link" onClick={onRetry}>
          {t("retry")}
        </button>
      )}
    </div>
  );
}
export function useData<T>(
  api: Api,
  action: string,
  payload: unknown,
  enabled = true,
) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [version, reload] = useState(0),
    key = JSON.stringify(payload);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setError("");
    api
      .call<T>(action, JSON.parse(key), controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [api, action, key, version, enabled]);
  return { data, error, reload: () => reload((v) => v + 1) };
}
