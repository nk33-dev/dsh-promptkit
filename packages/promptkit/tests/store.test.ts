import { afterEach, describe, expect, it } from "vitest";
import { Context } from "@deepseek-ai/cordis";
import Storage from "@deepseek-ai/dsh-storage";
import { JsonStorageBackend } from "@deepseek-ai/dsh-storage-json";
import { DomainFacility } from "@deepseek-ai/dsh-storage-domain";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  PromptStore,
  normalizeProject,
  prepareImport,
} from "../src/host/store.ts";

const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const clean of cleanup.splice(0).reverse()) await clean();
});
async function open(root?: string) {
  const directory = root || (await mkdtemp(join(tmpdir(), "promptkit-store-")));
  if (!root)
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
  const ctx = new Context(),
    fiber = ctx.plugin(Storage);
  await fiber;
  const backend = new JsonStorageBackend(directory);
  ctx.storage.backend.register("json", backend);
  const facility = new DomainFacility(ctx, { backend: "json" }),
    store = await PromptStore.open(facility);
  cleanup.push(async () => {
    await store.close();
    await backend.close();
    await fiber.dispose();
  });
  return { store, backend, root: directory };
}
const prompt = {
  id: "one",
  title: "检查需求",
  body: "审查这段代码",
  tags: ["代码"],
  pinned: false,
  project: null,
};
describe("persistent library", () => {
  it("returns bounded summaries and searches bodies without returning full text", async () => {
    const { store } = await open();
    await store.saveFavorite(
      { ...prompt, body: "a".repeat(180) + "find-me" },
      0,
    );
    await store.saveFavorite(
      { ...prompt, id: "two", pinned: true, body: "find-me" },
      1,
    );
    const list = store.listFavorites(null, "find-me", "current", "manual", 1);
    expect(list.total).toBe(2);
    expect(list.items.map((item) => item.id)).toEqual(["two"]);
    expect(list.items[0]).not.toHaveProperty("body");
    const first = store
      .listFavorites(null, "", "all", "updated", 10)
      .items.find((item) => item.id === "one")!;
    expect(first.excerpt).toHaveLength(160);
    expect(store.favorite("one").body).toContain("find-me");
    expect(store.configuration).not.toHaveProperty("favorites");
    list.items[0].tags.push("temporary");
    expect(store.favorite("two").tags).not.toContain("temporary");
  });
  it("filters global and current-project summaries without exposing other projects", async () => {
    const { store } = await open();
    const project = { hostId: "host", workingDirectory: "/workspace/Demo" };
    await store.saveFavorite(prompt, 0);
    await store.saveFavorite({ ...prompt, id: "local", project }, 1);
    await store.saveFavorite(
      {
        ...prompt,
        id: "other",
        project: { ...project, workingDirectory: "/workspace/Elsewhere" },
      },
      2,
    );
    expect(
      store
        .listFavorites(project, "", "current", "recent", 50)
        .items.map((item) => item.id)
        .sort(),
    ).toEqual(["local", "one"]);
    expect(
      store
        .listFavorites(null, "", "current", "recent", 50)
        .items.map((item) => item.id),
    ).toEqual(["one"]);
    expect(
      store
        .listFavorites(project, "", "project", "recent", 50)
        .items.map((item) => item.id),
    ).toEqual(["local"]);
    expect(
      store
        .listFavorites(project, "", "global", "recent", 50)
        .items.map((item) => item.id),
    ).toEqual(["one"]);
  });
  it("survives close and reopen with settings, favorites and presets", async () => {
    const a = await open();
    await a.store.saveFavorite(prompt, 0);
    await a.store.saveSettings({
      ...a.store.value.settings,
      rewriteEnabled: false,
    });
    await a.store.savePreset(
      { id: "test", title: "Test", rule: "Check facts" },
      1,
    );
    const hostId = a.store.value.hostId;
    await a.store.close();
    await a.backend.close();
    const b = await open(a.root);
    expect(b.store.value.hostId).toBe(hostId);
    expect(b.store.value.settings.rewriteEnabled).toBe(false);
    expect(b.store.value.library.favorites[0].title).toBe(prompt.title);
    expect(b.store.value.library.presets.at(-1)?.id).toBe("test");
  });
  it("rejects stale writes without replacing another window edit", async () => {
    const { store } = await open();
    await store.saveFavorite(prompt, 0);
    await expect(
      store.saveFavorite({ ...prompt, title: "stale" }, 0),
    ).rejects.toThrow("刷新");
    expect(store.value.library.favorites[0].title).toBe(prompt.title);
  });
  it("serializes concurrent writes and detects conflicting revisions", async () => {
    const { store } = await open();
    const writes = await Promise.allSettled([
      store.saveFavorite(prompt, 0),
      store.saveFavorite({ ...prompt, id: "two" }, 0),
    ]);
    expect(writes.filter((v) => v.status === "fulfilled")).toHaveLength(1);
    expect(store.value.library.favorites).toHaveLength(1);
  });
  it("preserves data on invalid imports and skips duplicate IDs", async () => {
    const { store } = await open();
    await store.saveFavorite(prompt, 0);
    const exported = store.export(),
      item = JSON.parse(exported).favorites[0];
    await expect(
      store.import(
        JSON.stringify({
          version: 1,
          favorites: [item, { ...item, id: "two", body: "" }],
        }),
        1,
        true,
      ),
    ).rejects.toThrow();
    expect(store.export()).toBe(exported);
    const raw = JSON.stringify({
      version: 1,
      favorites: [item, { ...item, id: "two" }],
    });
    expect(await store.import(raw, 1, false)).toEqual({
      added: 1,
      duplicates: 1,
      revision: 1,
    });
    expect(store.value.library.favorites).toHaveLength(1);
    await store.import(raw, 1, true);
    expect(store.value.library.favorites).toHaveLength(2);
  });
  it("keeps library data when its feature switch is disabled", async () => {
    const { store } = await open();
    await store.saveFavorite(prompt, 0);
    await store.saveSettings({
      ...store.value.settings,
      favoritesEnabled: false,
    });
    expect(store.value.library.favorites).toHaveLength(1);
  });
  it("accepts the full favorite editor shape but preserves server timestamps", async () => {
    const { store } = await open();
    await store.saveFavorite(
      { ...prompt, createdAt: 1, updatedAt: 1, lastUsedAt: 0 },
      0,
    );
    expect(store.value.library.favorites[0].createdAt).toBeGreaterThan(1);
  });
  it("does not update stored favorites through temporary value edits", async () => {
    const { store } = await open();
    await store.saveFavorite(prompt, 0);
    const temp = store.value;
    temp.library.favorites[0].body = "temporary";
    expect(store.value.library.favorites[0].body).toBe(prompt.body);
  });
  it("puts new prompts first, keeps edits in place and reorders the visible slice", async () => {
    const { store } = await open();
    const project = { hostId: "host", workingDirectory: "/workspace/Demo" };
    await store.saveFavorite({ ...prompt, id: "a" }, 0);
    await store.saveFavorite({ ...prompt, id: "b", project }, 1);
    await store.saveFavorite({ ...prompt, id: "c", tags: ["审查"] }, 2);
    const ids = (scope = "all", tag = "") =>
      store
        .listFavorites(project, "", scope, "manual", 50, tag)
        .items.map((item) => item.id);
    expect(ids()).toEqual(["c", "b", "a"]);
    await store.saveFavorite({ ...prompt, id: "a", title: "改过" }, 3);
    expect(ids()).toEqual(["c", "b", "a"]);
    expect(ids("all", "审查")).toEqual(["c"]);
    expect(store.listFavorites(null, "", "current", "manual", 50).tags).toEqual(
      ["审查", "代码"],
    );
    // 只拖动「通用」里的两条，项目条目留在原槽位。
    await store.reorderFavorites(["a", "c"], 4);
    expect(ids()).toEqual(["a", "b", "c"]);
    await expect(store.reorderFavorites(["a", "x"], 5)).rejects.toThrow();
    await expect(store.reorderFavorites(["a", "a"], 5)).rejects.toThrow();
  });
  it("restores a deleted prompt at its original position", async () => {
    const { store } = await open();
    await store.saveFavorite({ ...prompt, id: "a" }, 0);
    await store.saveFavorite({ ...prompt, id: "b" }, 1);
    await store.saveFavorite({ ...prompt, id: "c" }, 2);
    const removed = await store.deleteFavorite("b", 3);
    expect(removed.index).toBe(1);
    await store.restoreFavorite(removed.favorite, removed.index);
    expect(store.value.library.favorites.map((v) => v.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
    await expect(store.restoreFavorite(removed.favorite, 0)).rejects.toThrow();
  });
  it("adds a quick favorite first without a revision check", async () => {
    const { store } = await open();
    const project = { hostId: "host", workingDirectory: "D:\\Project\\Demo" };
    await store.saveFavorite(prompt, 0);
    const item = await store.addFavorite("第一行", "第一行\n第二行", project);
    expect(store.value.library.favorites[0].id).toBe(item.id);
    expect(item.project?.workingDirectory).toBe("d:/project/demo");
  });
  it("migrates legacy order once: pinned first, then recently used", async () => {
    const root = await mkdtemp(join(tmpdir(), "promptkit-store-"));
    cleanup.push(() => rm(root, { recursive: true, force: true }));
    const a = await open(root);
    const item = (id: string, pinned: boolean, lastUsedAt: number) => ({
      ...prompt,
      id,
      pinned,
      createdAt: 1,
      updatedAt: 1,
      lastUsedAt,
    });
    // 模拟旧版本落盘的数据：没有 manualOrder，数组按写入顺序。
    await a.store.import(
      JSON.stringify({
        version: 1,
        favorites: [item("old", false, 1), item("pin", true, 0), item("new", false, 9)],
      }),
      0,
      true,
    );
    const data = a.store.value;
    delete data.library.manualOrder;
    await (a.store as unknown as { domain: { global: { set(v: unknown): Promise<void> } } }).domain.global.set(data);
    await a.store.close();
    await a.backend.close();
    const b = await open(root);
    expect(b.store.value.library.favorites.map((v) => v.id)).toEqual([
      "pin",
      "new",
      "old",
    ]);
    expect(b.store.value.library.manualOrder).toBe(true);
  });
  it("rejects oversized import files before parsing", () => {
    expect(() =>
      prepareImport(" ".repeat(8 * 1024 * 1024 + 1), {
        revision: 0,
        favorites: [],
        presets: [],
      }),
    ).toThrow("8 MiB");
  });
  it("normalizes Windows identities and preserves POSIX case", () => {
    expect(
      normalizeProject({
        hostId: "one",
        workingDirectory: "D:\\Project\\Demo\\",
      }).workingDirectory,
    ).toBe("d:/project/demo");
    expect(
      normalizeProject({ hostId: "one", workingDirectory: "/Project/Demo" })
        .workingDirectory,
    ).toBe("/Project/Demo");
  });
});
