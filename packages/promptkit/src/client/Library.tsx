import React, { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Copy, GripVertical, Pencil, Trash2 } from "lucide-react";
import type { Api } from "./api.ts";
import { format, type T } from "./locales.ts";
import type {
  Favorite,
  FavoriteList,
  FavoriteSummary,
} from "../shared/types.ts";
import {
  Button,
  CardHeader,
  ErrorBar,
  IconButton,
  Loading,
  useData,
  useTask,
  download,
  type ToastMessage,
} from "./ui.tsx";
import { useDraft, type ComposerInput } from "./useDraft.ts";
import { captureDraft, replacementEdits } from "./draft.ts";
import { libraryState } from "./workflow.ts";
import type { WriteBack } from "./Enhance.tsx";

const BUILT_IN = ["all", "untagged"] as const;
function blank(): Favorite {
  return {
    id: crypto.randomUUID(),
    title: "",
    body: "",
    tags: [],
    pinned: false,
    project: null,
    createdAt: 0,
    updatedAt: 0,
    lastUsedAt: 0,
  };
}
export function Library({
  api,
  t,
  editId,
  management = false,
  notify,
  onClose,
  onWrite,
  ...composer
}: ComposerInput & {
  api: Api;
  t: T;
  editId?: string;
  management?: boolean;
  notify: (text: string, action?: ToastMessage["action"]) => void;
  onClose?: () => void;
  onWrite?: WriteBack;
}) {
  const memory = useRef(
    libraryState(api, composer.sessionId || "", management),
  ).current;
  const [search, setSearch] = useState(memory.search),
    [filter, setFilter] = useState(memory.filter),
    [limit, setLimit] = useState(memory.limit),
    [editing, setEditing] = useState<Favorite | null>(
      editId ? null : memory.editing,
    ),
    [tagText, setTagText] = useState(memory.tagText);
  const builtIn = (BUILT_IN as readonly string[]).includes(filter);
  const { data, error, reload } = useData<FavoriteList>(api, "favorites.list", {
    sessionId: composer.sessionId || "",
    query: search,
    scope: builtIn ? filter : "all",
    tag: builtIn ? "" : filter,
    sort: "manual",
    limit,
  });
  // 拖拽后先在本地排好，等宿主确认后再以列表结果为准。
  const [items, setItems] = useState<FavoriteSummary[]>([]);
  useEffect(() => setItems(data?.items ?? []), [data]);
  useEffect(() => {
    Object.assign(memory, { editing, tagText, search, filter, limit });
  });
  const [importData, setImportData] = useState<{
    raw: string;
    added: number;
    duplicates: number;
    revision: number;
  } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null),
    [over, setOver] = useState<string | null>(null);
  const task = useTask(),
    { perform } = task,
    writer = useDraft(api, t, composer, data?.project);
  useEffect(() => {
    if (!editId) return;
    void perform(() => edit(editId));
  }, [editId]);
  async function edit(id: string) {
    const item = await api.call<Favorite>("favorites.get", { id });
    setEditing(item);
    setTagText(item.tags.join(api.language === "en" ? ", " : "，"));
  }
  async function save() {
    if (!editing || !data) return;
    await perform(async () => {
      await api.call("favorites.save", {
        favorite: {
          ...editing,
          project: null,
          title: editing.title.trim() || t("untitled"),
          tags: tagText
            .split(/[,，]/)
            .map((value) => value.trim())
            .filter(Boolean),
        },
        sessionId: composer.sessionId || "",
        revision: data.revision,
      });
      setEditing(null);
      reload();
      notify(t("saved"));
    });
  }
  async function saveDraft() {
    const body = composer.input?.draft ?? "";
    if (!body.trim()) return;
    await perform(async () => {
      const item = await api.call<Favorite>("favorites.add", {
        body,
        sessionId: composer.sessionId || "",
      });
      reload();
      notify(t("savedPrompt"), {
        label: t("edit"),
        run: () => void perform(() => edit(item.id)),
      });
    });
  }
  async function use(item: FavoriteSummary, how: "copy" | "replace" | "append") {
    await perform(async () => {
      const { body } = await api.call<Favorite>("favorites.get", {
        id: item.id,
      });
      const live = writer.current.current;
      const before = live.input?.draft ?? "";
      if (how === "replace" && live.input && !replacementEdits(live.input, body))
        throw new Error(t("unsafeReplace"));
      const message = await writer.useText(
        body,
        how,
        live.input && captureDraft(live.sessionId, live.input),
      );
      void api.call("favorites.touch", { id: item.id }).catch(() => {});
      if (how === "copy") notify(message);
      else
        onWrite?.(
          how,
          before,
          composer.inputActions!.captureInsertion().draftRev,
        );
    });
  }
  async function remove(item: FavoriteSummary) {
    if (!data) return;
    await perform(async () => {
      const removed = await api.call<{ favorite: Favorite; index: number }>(
        "favorites.delete",
        { id: item.id, revision: data.revision },
      );
      reload();
      notify(format(t("deleted"), { title: item.title }), {
        label: t("undo"),
        run: () =>
          void perform(async () => {
            await api.call("favorites.restore", removed);
            reload();
          }),
      });
    });
  }
  async function move(id: string, target: string) {
    if (!data || id === target) return;
    // 放到目标所在位置：往下拖落在目标之后，往上拖落在目标之前。
    const next = [...items],
      to = next.findIndex((v) => v.id === target),
      [moved] = next.splice(
        next.findIndex((v) => v.id === id),
        1,
      );
    next.splice(to, 0, moved);
    setItems(next);
    await perform(async () => {
      try {
        await api.call("favorites.reorder", {
          ids: next.map((v) => v.id),
          revision: data.revision,
        });
      } finally {
        reload();
      }
    });
  }
  async function importFile(file?: File) {
    if (!file || !data) return;
    await perform(async () => {
      if (file.size > 8 * 1024 * 1024) throw new Error(t("invalidFile"));
      const raw = await file.text(),
        preview = await api.call<{
          added: number;
          duplicates: number;
          revision: number;
        }>("favorites.import", { raw, revision: data.revision, commit: false });
      setImportData({ raw, ...preview });
    });
  }
  const canWrite = !management && !!composer.inputActions;
  const hasDraft = !!composer.input?.draft.trim();
  if (editing)
    return (
      <div className="pk-library">
        <CardHeader title={t("editPrompt")} t={t} onClose={onClose} />
        <div className="pk-body pk-edit">
          <label className="pk-label">
            <span>{t("title")}</span>
            <input
              className="pk-input"
              value={editing.title}
              maxLength={200}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
          </label>
          <label className="pk-label">
            <span>{t("body")}</span>
            <textarea
              className="pk-input pk-textarea"
              rows={6}
              maxLength={20000}
              value={editing.body}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
            />
          </label>
          <label className="pk-label">
            <span>{t("tags")}</span>
            <input
              className="pk-input"
              placeholder={t("tagsPlaceholder")}
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
            />
          </label>
        </div>
        <ErrorBar error={task.error} t={t} />
        <footer className="pk-foot">
          <span className="pk-grow" />
          <Button onClick={() => setEditing(null)}>{t("cancel")}</Button>
          <Button
            primary
            disabled={!data || !editing.body.trim() || task.busy}
            onClick={save}
          >
            {t("save")}
          </Button>
        </footer>
      </div>
    );
  const filters = [...BUILT_IN, ...(data?.tags ?? [])];
  return (
    <div className="pk-library">
      {!management && (
        <CardHeader
          title={t("library")}
          t={t}
          onClose={onClose}
        />
      )}
      <div className="pk-body">
        <input
          className="pk-input"
          type="search"
          aria-label={t("search")}
          placeholder={t("search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setLimit(management ? 200 : 50);
          }}
        />
        <div className="pk-chips" role="group" aria-label={t("tags")}>
          {filters.map((value) => (
            <button
              key={value}
              type="button"
              className="pk-chip"
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
                setLimit(management ? 200 : 50);
              }}
            >
              {value === "all"
                ? t("all")
                : value === "untagged"
                    ? t("global")
                    : value}
            </button>
          ))}
        </div>
        {importData && (
          <div className="pk-box">
            <strong>{t("importPreview")}</strong>
            <p>
              {t("added")}: {importData.added} · {t("duplicates")}:{" "}
              {importData.duplicates}
            </p>
            <div className="pk-row">
              <Button
                primary
                onClick={() =>
                  perform(async () => {
                    await api.call("favorites.import", {
                      ...importData,
                      commit: true,
                    });
                    setImportData(null);
                    reload();
                    notify(t("imported"));
                  })
                }
              >
                {t("importConfirm")}
              </Button>
              <Button onClick={() => setImportData(null)}>{t("cancel")}</Button>
            </div>
          </div>
        )}
        {!data && !error && <Loading text={t("loading")} />}
        {data && !items.length && (
          <div className="pk-empty">
            <p>
              {data.total || search || filter !== "all"
                ? t("noMatch")
                : t("emptyLibrary")}
            </p>
          </div>
        )}
        <ul className="pk-list" aria-label={t("library")}>
          {items.map((item, index) => (
            <li
              key={item.id}
              className="pk-row-item"
              data-dragging={dragging === item.id || undefined}
              data-over={(over === item.id && dragging !== item.id) || undefined}
              onDragOver={(event) => {
                if (!dragging) return;
                event.preventDefault();
                setOver(item.id);
              }}
              onDragLeave={() => setOver((v) => (v === item.id ? null : v))}
              onDrop={(event) => {
                event.preventDefault();
                const id = dragging;
                setDragging(null);
                setOver(null);
                if (id) void move(id, item.id);
              }}
            >
              <button
                type="button"
                className="pk-grip"
                draggable
                title={t("drag")}
                aria-label={`${t("drag")}: ${item.title}`}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.id);
                  setDragging(item.id);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setOver(null);
                }}
                onKeyDown={(event) => {
                  const target =
                    event.key === "ArrowUp"
                      ? items[index - 1]
                      : event.key === "ArrowDown"
                        ? items[index + 1]
                        : undefined;
                  if (!target) return;
                  event.preventDefault();
                  void move(item.id, target.id);
                }}
              >
                <GripVertical size={14} aria-hidden />
              </button>
              <button
                type="button"
                className="pk-row-main"
                title={canWrite ? t("append") : t("edit")}
                onClick={() =>
                  canWrite
                    ? void use(item, "append")
                    : void perform(() => edit(item.id))
                }
              >
                <span className="pk-row-title">
                  <strong>{item.title}</strong>
                  {item.tags.map((tag) => (
                    <span key={tag} className="pk-pill">
                      {tag}
                    </span>
                  ))}
                </span>
                <small>{item.excerpt}</small>
              </button>
              <span className="pk-row-actions">
                {canWrite && (
                  <IconButton
                    label={t("replace")}
                    onClick={() => use(item, "replace")}
                  >
                    <ArrowLeftRight size={15} aria-hidden />
                  </IconButton>
                )}
                <IconButton label={t("copy")} onClick={() => use(item, "copy")}>
                  <Copy size={15} aria-hidden />
                </IconButton>
                <IconButton
                  label={t("edit")}
                  onClick={() => perform(() => edit(item.id))}
                >
                  <Pencil size={15} aria-hidden />
                </IconButton>
                <IconButton label={t("delete")} onClick={() => remove(item)}>
                  <Trash2 size={15} aria-hidden />
                </IconButton>
              </span>
            </li>
          ))}
        </ul>
        {data && data.total > items.length && (
          <Button onClick={() => setLimit((value) => Math.min(value + 50, 5000))}>
            {t("showMore")} ({items.length}/{data.total})
          </Button>
        )}
      </div>
      <ErrorBar error={error || task.error} t={t} onRetry={error ? reload : undefined} />
      <footer className="pk-foot">
        {management ? (
          <>
            <Button
              onClick={() => {
                setEditing({ ...blank(), project: null });
                setTagText("");
              }}
            >
              {t("newPrompt")}
            </Button>
            <label className="pk-button pk-import">
              {t("import")}
              <input
                className="pk-file"
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  void importFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <Button
              onClick={() =>
                perform(async () =>
                  download(
                    "promptkit-favorites.json",
                    await api.call<string>("favorites.export", {}),
                  ),
                )
              }
            >
              {t("export")}
            </Button>
          </>
        ) : (
          <Button
            disabled={!hasDraft || task.busy}
            title={hasDraft ? undefined : t("emptyDraftHint")}
            onClick={saveDraft}
          >
            {t("saveDraft")}
          </Button>
        )}
        <span className="pk-grow" />
        {items.length > 1 && <span className="pk-caption">{t("dragHint")}</span>}
      </footer>
    </div>
  );
}
