import { randomUUID } from "node:crypto";
import { defineDomain, domainTable } from "@deepseek-ai/dsh-storage-domain";
import type { Domain, DomainFacility } from "@deepseek-ai/dsh-storage-domain";
import { z } from "zod";
import { defaultSettings, DEFAULT_PRESETS } from "../shared/defaults.ts";
import {
  settingsSchema,
  favoriteSchema,
  feedbackSchema,
  librarySchema,
  presetSchema,
} from "../shared/schemas.ts";
import type {
  Favorite,
  Feedback,
  Library,
  Project,
  Settings,
} from "../shared/types.ts";
import { normalizeProject, sameProject } from "../shared/project.ts";
export { normalizeProject, sameProject } from "../shared/project.ts";

const spec = defineDomain({
  name: "nk33_promptkit",
  version: 1,
  global: {
    schema: z
      .object({
        hostId: z
          .string()
          .uuid()
          .default(() => randomUUID()),
        settings: settingsSchema,
        library: librarySchema,
      })
      .strict(),
    initial: {
      hostId: randomUUID(),
      settings: defaultSettings(),
      library: {
        revision: 0,
        manualOrder: true,
        favorites: [],
        presets: structuredClone(DEFAULT_PRESETS),
      },
    },
  },
  tables: { feedback: domainTable<string, Feedback>(feedbackSchema) },
});
type DataDomain = Domain<typeof spec>;
export function prepareImport(raw: string, current: Library) {
  if (Buffer.byteLength(raw, "utf8") > 8 * 1024 * 1024)
    throw new Error("导入文件超过 8 MiB / Import exceeds 8 MiB");
  const parsed = z
    .object({
      version: z.literal(1),
      favorites: z.array(favoriteSchema).max(5000),
    })
    .strict()
    .parse(JSON.parse(raw));
  const ids = new Set(current.favorites.map((v) => v.id));
  const added: Favorite[] = [];
  for (const entry of parsed.favorites) {
    const item = {
      ...entry,
      project: entry.project ? normalizeProject(entry.project) : null,
    };
    if (!ids.has(item.id)) {
      ids.add(item.id);
      added.push(item);
    }
  }
  if (current.favorites.length + added.length > 5000)
    throw new Error("收藏总数超过 5000 / Library exceeds 5000 prompts");
  return { added, duplicates: parsed.favorites.length - added.length };
}
export class PromptStore {
  private chain: Promise<unknown> = Promise.resolve();
  private closed = false;
  constructor(private readonly domain: DataDomain) {}
  static async open(facility: DomainFacility) {
    const store = new PromptStore(await facility.open(spec));
    if (!store.domain.global.get().library.manualOrder)
      await store.write((data) => {
        // 旧数据只迁移一次：置顶在前，其余按最近使用，之后数组顺序即手动顺序。
        data.library.favorites.sort(
          (a, b) =>
            Number(b.pinned) - Number(a.pinned) ||
            b.lastUsedAt - a.lastUsedAt ||
            b.updatedAt - a.updatedAt,
        );
        data.library.manualOrder = true;
      });
    return store;
  }
  get value(): { hostId: string; settings: Settings; library: Library } {
    return structuredClone(this.domain.global.get());
  }
  get configuration() {
    const { settings, library } = this.domain.global.get();
    return structuredClone({
      settings,
      presets: library.presets,
      revision: library.revision,
    });
  }
  get hostId() {
    return this.domain.global.get().hostId;
  }
  listFavorites(
    project: Project | null,
    query: string,
    scope: string,
    sort: string,
    limit: number,
    tag = "",
  ) {
    const { library } = this.domain.global.get(),
      needle = query.toLocaleLowerCase();
    const visible = library.favorites.filter(
      (f) =>
        scope === "all" ||
        (scope === "untagged" ? f.tags.length === 0 : scope === "global"
          ? !f.project
          : scope === "project"
            ? !!f.project && sameProject(f.project, project)
            : !f.project || sameProject(f.project, project)),
    );
    const entries = visible.filter(
      (f) =>
        (!tag || f.tags.includes(tag)) &&
        (!needle ||
          [f.title, f.body, ...f.tags]
            .join(" ")
            .toLocaleLowerCase()
            .includes(needle)),
    );
    if (sort !== "manual")
      entries.sort(
        (a, b) =>
          (sort === "recent"
            ? b.lastUsedAt - a.lastUsedAt
            : b.updatedAt - a.updatedAt) || b.updatedAt - a.updatedAt,
      );
    return {
      revision: library.revision,
      total: entries.length,
      project,
      // 标签来自完整收藏库，切换筛选时保持稳定。
      tags: [
        ...new Set(
          library.favorites
            .flatMap((f) => f.tags),
        ),
      ],
      items: entries
        .slice(0, limit)
        .map(({ body, ...item }) => ({
          ...structuredClone(item),
          excerpt: body.slice(0, 160),
        })),
    };
  }
  favorite(id: string) {
    const entry = this.domain.global
      .get()
      .library.favorites.find((f) => f.id === id);
    if (!entry) throw new Error("收藏不存在 / Prompt not found");
    return structuredClone(entry);
  }
  private write<T>(
    mutate: (data: {
      hostId: string;
      settings: Settings;
      library: Library;
    }) => T,
  ): Promise<T> {
    if (this.closed)
      return Promise.reject(new Error("插件已停用 / Plugin disabled"));
    const pending = this.chain.then(async () => {
      const data = this.value,
        result = mutate(data);
      // 整个收藏快照一次落盘，导入失败不会留下半个库。
      await this.domain.global.set(data);
      return result;
    });
    this.chain = pending.catch(() => {});
    return pending;
  }
  saveSettings(value: unknown) {
    const settings = settingsSchema.parse(value);
    return this.write((data) => {
      data.settings = settings;
      return settings;
    });
  }
  saveFavorite(value: unknown, expectedRevision: number) {
    const raw = z
      .object({
        title: z.string(),
        body: z.string(),
        id: z.string().optional(),
        tags: z.array(z.string()).optional(),
        pinned: z.boolean().optional(),
        project: z.unknown().optional(),
        createdAt: z.number().optional(),
        updatedAt: z.number().optional(),
        lastUsedAt: z.number().optional(),
      })
      .strict()
      .parse(value);
    return this.write((data) => {
      this.revision(data.library, expectedRevision);
      const old = data.library.favorites.find((v) => v.id === raw.id),
        now = Date.now();
      const item = favoriteSchema.parse({
        id: raw.id || randomUUID(),
        title: raw.title.trim(),
        body: raw.body,
        tags: [
          ...new Set((raw.tags || []).map((v) => v.trim()).filter(Boolean)),
        ],
        pinned: raw.pinned ?? false,
        project: raw.project ?? null,
        createdAt: old?.createdAt ?? now,
        updatedAt: now,
        lastUsedAt: old?.lastUsedAt ?? 0,
      });
      if (item.project) item.project = normalizeProject(item.project);
      const index = data.library.favorites.findIndex((v) => v.id === item.id);
      // 编辑保持原位置，新条目放在最前。
      if (index >= 0) data.library.favorites[index] = item;
      else data.library.favorites.unshift(item);
      librarySchema.parse(data.library);
      data.library.revision++;
      return item;
    });
  }
  deleteFavorite(id: string, revision: number) {
    return this.write((data) => {
      this.revision(data.library, revision);
      const index = data.library.favorites.findIndex((v) => v.id === id);
      if (index < 0) throw new Error("收藏不存在 / Prompt not found");
      // 返回被删条目和位置，供界面「撤销」原样放回。
      const [favorite] = data.library.favorites.splice(index, 1);
      data.library.revision++;
      return { favorite, index, revision: data.library.revision };
    });
  }
  addFavorite(title: string, body: string, project: Project | null) {
    return this.write((data) => {
      const now = Date.now();
      const item = favoriteSchema.parse({
        id: randomUUID(),
        title: title.trim(),
        body,
        tags: [],
        pinned: false,
        project: project && normalizeProject(project),
        createdAt: now,
        updatedAt: now,
        lastUsedAt: 0,
      });
      data.library.favorites.unshift(item);
      librarySchema.parse(data.library);
      data.library.revision++;
      return item;
    });
  }
  restoreFavorite(value: unknown, index: number) {
    const item = favoriteSchema.parse(value);
    return this.write((data) => {
      if (data.library.favorites.some((v) => v.id === item.id))
        throw new Error("收藏已存在 / Prompt already exists");
      if (item.project) item.project = normalizeProject(item.project);
      data.library.favorites.splice(
        Math.min(Math.max(index, 0), data.library.favorites.length),
        0,
        item,
      );
      librarySchema.parse(data.library);
      data.library.revision++;
      return item;
    });
  }
  reorderFavorites(ids: string[], revision: number) {
    return this.write((data) => {
      this.revision(data.library, revision);
      const all = data.library.favorites,
        moved = new Set(ids);
      if (moved.size !== ids.length || ids.some((id) => !all.some((v) => v.id === id)))
        throw new Error("收藏已变化，请刷新后重试 / Library changed; refresh and retry");
      // ids 只覆盖当前筛选可见的条目：按原槽位依次填入新顺序，其余条目不动。
      const order = ids.map((id) => all.find((v) => v.id === id)!);
      let next = 0;
      data.library.favorites = all.map((v) => (moved.has(v.id) ? order[next++] : v));
      data.library.revision++;
      return data.library.revision;
    });
  }
  touchFavorite(id: string) {
    return this.write((data) => {
      const item = data.library.favorites.find((v) => v.id === id);
      if (item) {
        item.lastUsedAt = Date.now();
        data.library.revision++;
      }
      return true;
    });
  }
  savePreset(value: unknown, revision: number) {
    const preset = presetSchema.parse(value);
    return this.write((data) => {
      this.revision(data.library, revision);
      data.library.presets = data.library.presets
        .filter((v) => v.id !== preset.id)
        .concat(preset);
      librarySchema.parse(data.library);
      data.library.revision++;
      return preset;
    });
  }
  import(raw: string, revision: number, commit: boolean) {
    if (!commit) {
      const library = this.value.library;
      this.revision(library, revision);
      const { added, duplicates } = prepareImport(raw, library);
      return Promise.resolve({
        added: added.length,
        duplicates,
        revision: library.revision,
      });
    }
    return this.write((data) => {
      this.revision(data.library, revision);
      const { added, duplicates } = prepareImport(raw, data.library);
      data.library.favorites.push(...added);
      data.library.revision++;
      return {
        added: added.length,
        duplicates,
        revision: data.library.revision,
      };
    });
  }
  export() {
    return JSON.stringify(
      { version: 1, favorites: this.value.library.favorites },
      null,
      2,
    );
  }
  feedback(): Feedback[] {
    return [...this.domain.table("feedback").entries()]
      .map(([, value]) => value as Feedback)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  async addFeedback(value: unknown) {
    const record = feedbackSchema.parse(value);
    await this.domain.table("feedback").put(record.id, record);
    return record;
  }
  async deleteFeedback(id: string) {
    return this.domain.table("feedback").delete(id);
  }
  private revision(library: Library, expected: number) {
    if (library.revision !== expected)
      throw new Error(
        "收藏库已更新，请刷新后重试 / Library changed; refresh and retry",
      );
  }
  async close() {
    this.closed = true;
    await this.chain;
    await this.domain.close();
  }
}
