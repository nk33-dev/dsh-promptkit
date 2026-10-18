import React, { useEffect, useRef, useState } from "react";
import { Bookmark, Sparkles } from "lucide-react";
import type { Configuration, Mode } from "../shared/types.ts";
import type { Api } from "./api.ts";
import type { T } from "./locales.ts";
import { revertDraft, type ComposerInput } from "./useDraft.ts";
import { Enhance, type WriteBack } from "./Enhance.tsx";
import { Library } from "./Library.tsx";
import { Floating, Popover } from "./Popover.tsx";
import { Toast, navigateTabs, useToast } from "./ui.tsx";

type Entry = "enhance" | "library";
type Scene =
  | { kind: "menu" }
  | { kind: "enhance"; mode: Mode }
  | { kind: "library"; editId?: string };

export function App({
  api,
  t,
  ...composer
}: ComposerInput & { api: Api; t: T }) {
  api.language = t("settings") === "设置" ? "zh" : "en";
  // 配置在挂载时预取并随设置变化刷新，点击图标时不再等待。
  const [config, setConfig] = useState<Configuration | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [error, setError] = useState("");
  const [focusFirst, setFocusFirst] = useState(false);
  const { toast, notify, clear } = useToast();
  const pressedOpen = useRef(false),
    latest = useRef(composer);
  latest.current = composer;
  const entry: Entry | null = !scene
    ? null
    : scene.kind === "library"
      ? "library"
      : "enhance";
  function close() {
    setScene(null);
  }
  useEffect(() => {
    let controller: AbortController | undefined;
    function refresh() {
      controller?.abort();
      const active = (controller = new AbortController());
      api
        .call<Configuration>("config.read", {}, active.signal)
        .then((value) => {
          if (active.signal.aborted) return;
          setConfig(value);
          setError("");
        })
        .catch((error) => {
          if (!active.signal.aborted) setError(error.message);
        });
    }
    refresh();
    const unsubscribe = api.onConfigurationChange(refresh);
    return () => {
      controller?.abort();
      unsubscribe();
    };
  }, [api]);
  const modes = config ? enabledModes(config) : [];
  const favorites = !!config?.settings.favoritesEnabled;
  const emptyDraft = !composer.input?.draft.trim();
  useEffect(() => {
    if (
      (scene?.kind === "library" && !favorites) ||
      (scene?.kind === "enhance" && !modes.includes(scene.mode)) ||
      (scene?.kind === "menu" && (modes.length < 2 || emptyDraft))
    )
      close();
  }, [config, scene, emptyDraft]);
  useEffect(() => {
    close();
    clear();
  }, [composer.sessionId]);
  function open(kind: Entry, event: React.MouseEvent<HTMLElement>) {
    // 卡片打开时再点同一个图标：浏览器先按点击外部关掉卡片，这里不再重新打开。
    if (pressedOpen.current || entry === kind) {
      pressedOpen.current = false;
      close();
      return;
    }
    clear();
    setAnchor(event.currentTarget);
    setFocusFirst(event.detail === 0);
    if (kind === "library") setScene({ kind: "library" });
    else if (modes.length === 1) setScene({ kind: "enhance", mode: modes[0] });
    else setScene({ kind: "menu" });
  }
  const written: WriteBack = (how, before, revision) => {
    close();
    if (how === "append") return notify(t("appended"));
    const sessionId = composer.sessionId || "";
    notify(t("replaced"), {
      label: t("undo"),
      run: () => {
        if (
          latest.current.sessionId !== composer.sessionId ||
          !revertDraft(
            latest.current.inputActions,
            () => latest.current.input,
            sessionId,
            before,
            revision,
          )
        )
          notify(t("undoFailed"));
      },
    });
  };
  const single = modes.length === 1 ? modes[0] : null;
  const enhanceLabel = t(single === "grill" ? "grill" : "generate");
  const singleBlocked = emptyDraft;
  const toastView = toast && <Toast toast={toast} />;
  return (
    <div className="pk-tools">
      {modes.length > 0 && (
        <button
          type="button"
          className="pk-tool pk-enhance-tool"
          data-active={entry === "enhance" || undefined}
          title={singleBlocked ? t("emptyDraftHint") : enhanceLabel}
          aria-label={enhanceLabel}
          aria-disabled={singleBlocked || undefined}
          disabled={singleBlocked}
          aria-expanded={entry === "enhance"}
          aria-haspopup={single ? "dialog" : "menu"}
          onPointerDown={() => (pressedOpen.current = entry === "enhance")}
          onClick={(event) => {
            if (singleBlocked && entry !== "enhance") return;
            open("enhance", event);
          }}
        >
          <Sparkles size={16} aria-hidden />
        </button>
      )}
      {favorites && (
        <button
          type="button"
          className="pk-tool pk-library-tool"
          data-active={entry === "library" || undefined}
          title={t("library")}
          aria-label={t("library")}
          aria-expanded={entry === "library"}
          aria-haspopup="dialog"
          onPointerDown={() => (pressedOpen.current = entry === "library")}
          onClick={(event) => open("library", event)}
        >
          <Bookmark size={16} aria-hidden />
        </button>
      )}
      {scene?.kind === "menu" && anchor && (
        <Popover
          key="menu"
          anchor={anchor}
          label={t("enhanceBoth")}
          onClose={close}
          focusFirst={focusFirst}
          menu
        >
          <div className="pk-mode-menu" onKeyDown={navigateTabs}>
            {modes.map((mode) => {
              const blocked = mode === "rewrite" && emptyDraft;
              return (
                <button
                  key={mode}
                  type="button"
                  role="menuitem"
                  aria-disabled={blocked || undefined}
                  disabled={blocked}
                  title={blocked ? t("emptyDraftHint") : undefined}
                  onClick={() => !blocked && setScene({ kind: "enhance", mode })}
                >
                  {t(mode === "grill" ? "grill" : "generate")}
                  <small>
                    {blocked
                      ? t("emptyDraftHint")
                      : t(mode === "grill" ? "grillHint" : "generateHint")}
                  </small>
                </button>
              );
            })}
          </div>
        </Popover>
      )}
      {(scene?.kind === "enhance" || scene?.kind === "library") &&
        anchor &&
        config && (
          <Popover
            key="card"
            anchor={anchor}
            label={t(
              scene.kind === "library"
                ? "library"
                : scene.mode === "grill"
                  ? "grill"
                  : "generate",
            )}
            onClose={close}
            focusFirst={focusFirst}
          >
            {scene.kind === "enhance" ? (
              <Enhance
                key={`${composer.sessionId}:${scene.mode}`}
                api={api}
                t={t}
                config={config}
                mode={scene.mode}
                notify={notify}
                onClose={close}
                onWrite={written}
                onEditFavorite={(id) =>
                  setScene({ kind: "library", editId: id })
                }
                {...composer}
              />
            ) : (
              <Library
                key={`${composer.sessionId}:${scene.editId ?? ""}`}
                api={api}
                t={t}
                editId={scene.editId}
                notify={notify}
                onClose={close}
                onWrite={written}
                {...composer}
              />
            )}
            {toastView}
          </Popover>
        )}
      {!scene && toastView && anchor && (
        <Floating anchor={anchor}>{toastView}</Floating>
      )}
      {!config && error && (
        <span className="pk-caption" role="alert" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
function enabledModes({ settings }: Configuration): Mode[] {
  return (
    [
      settings.defaultMode,
      settings.defaultMode === "rewrite" ? "grill" : "rewrite",
    ] as Mode[]
  ).filter((mode) =>
    mode === "rewrite" ? settings.rewriteEnabled : settings.grillEnabled,
  );
}
