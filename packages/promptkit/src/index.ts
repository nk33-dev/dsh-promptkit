import type { Context } from "@deepseek-ai/cordis";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import {
  credentialRef,
  isCredentialRefName,
} from "@deepseek-ai/dsh-credentials";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type {} from "@deepseek-ai/dsh-api-session-controller";
import type {} from "@deepseek-ai/dsh-typert-registry";
import { z } from "zod";
import { PromptStore, sameProject } from "./host/store.ts";
import { collectContext } from "./host/context.ts";
import { generate } from "./host/model.ts";
import { generationSchema, projectSchema } from "./shared/schemas.ts";
import type { RpcRequest, RpcResponse, Json, Project } from "./shared/types.ts";
import { remoteContribution } from "./shared/remote.ts";
import { REWRITE_RULE, GRILL_RULE } from "./rules.ts";
import { abortable } from "./host/abort.ts";
export type { RpcRequest, RpcResponse, Json } from "./shared/types.ts";
export const name = "promptkit";
export const inject = [
  "storageDomain",
  "credentials",
  "llm",
  "sessionController",
  "typert",
];

declare module "@deepseek-ai/cordis" {
  interface Context {
    promptkit: PromptKitService;
  }
}
export class PromptKitService extends TypertRemoteService {
  static inject = ["credentials", "llm", "sessionController"];
  private readonly pending = new Set<AbortController>();
  constructor(
    ctx: Context,
    private readonly store: PromptStore,
  ) {
    super(ctx, "promptkit");
    ctx.effect(() => () => {
      for (const request of this.pending) request.abort();
      this.pending.clear();
    });
  }
  /** 分发插件请求；输入在各业务入口校验，错误不包含模型响应或请求正文。 */
  async request(
    request: RpcRequest,
    signal: AbortSignal,
  ): Promise<RpcResponse> {
    try {
      if (
        this.ctx.invocation &&
        this.ctx.invocation.peer.principal.kind !== "owner"
      )
        throw new Error("此操作需要宿主所有者 / Host owner required");
      const { action, payload } = request;
      const data = await this.dispatch(action, payload, signal);
      return {
        ok: true,
        data: JSON.parse(JSON.stringify(data ?? null)) as Json,
        error: "",
      };
    } catch (error) {
      if (
        signal.aborted ||
        (error as Error).name === "AbortError" ||
        (error as Error).name === "TimeoutError"
      )
        return {
          ok: false,
          data: null,
          error: "请求已取消或超时 / Request cancelled or timed out",
        };
      if (error instanceof z.ZodError || error instanceof SyntaxError)
        return {
          ok: false,
          data: null,
          error: "内容格式不正确，请检查后重试 / Invalid data; check and retry",
        };
      const message = error instanceof Error ? error.message : "";
      return {
        ok: false,
        data: null,
        error: message.includes(" / ")
          ? message
          : "操作失败，请重试 / Operation failed; retry",
      };
    }
  }
  private async project(
    sessionId: string,
    signal: AbortSignal,
  ): Promise<Project | null> {
    if (!sessionId) return null;
    const inspection = await this.ctx.sessionController.inspect(
      sessionId as Parameters<typeof this.ctx.sessionController.inspect>[0],
      signal,
    );
    const cwd = inspection.meta.cwd;
    return cwd ? { hostId: this.store.hostId, workingDirectory: cwd } : null;
  }
  private async dispatch(
    action: string,
    payload: Json,
    signal: AbortSignal,
  ): Promise<unknown> {
    const p = z.record(z.string(), z.unknown()).parse(payload);
    if (action === "rules.defaults")
      return { systemPrompt: REWRITE_RULE, grillSystemPrompt: GRILL_RULE };
    if (action === "config.read") return this.store.configuration;
    if (action === "settings.read") {
      const config = this.store.configuration;
      return {
        ...config,
        credentialConfigured: (
          await this.ctx.credentials.describe(
            credentialRef(config.settings.credentialRef),
          )
        ).configured,
      };
    }
    if (action === "credentials.list") {
      // Harness 不提供引用枚举：汇总环境变量里像密钥的名字和凭据库里的引用名，只返回名字。
      const names = new Set<string>();
      for (const name of Object.keys(process.env))
        if (
          isCredentialRefName(name) &&
          /(_KEY|_TOKEN|_SECRET|_PASSWORD)$/i.test(name)
        )
          names.add(name);
      try {
        const raw = await readFile(
          join(
            process.env.DSH_HOME || join(homedir(), ".dsh"),
            ".credentials.yaml",
          ),
          "utf8",
        );
        let inRefs = false;
        for (const line of raw.split("\n")) {
          if (/^refs:\s*$/.test(line)) inRefs = true;
          else if (/^\S/.test(line)) inRefs = false;
          const match =
            inRefs && /^ {2}([A-Za-z_][A-Za-z0-9_]*):/.exec(line);
          if (match) names.add(match[1]);
        }
      } catch {
        // 凭据库不存在时只看环境变量。
      }
      names.add(this.store.configuration.settings.credentialRef);
      const options = await Promise.all(
        [...names].map(async (name) => ({
          name,
          configured: (await this.ctx.credentials.describe(credentialRef(name)))
            .configured,
        })),
      );
      return options.sort(
        (a, b) =>
          Number(b.configured) - Number(a.configured) ||
          a.name.localeCompare(b.name),
      );
    }
    if (action === "models.efforts") {
      const { settings } = this.store.configuration;
      if (
        settings.connection !== "host" ||
        !settings.provider ||
        !settings.model
      )
        return { efforts: [], default: "" };
      const info = await this.ctx.llm.resolveModelInfo(
        settings.provider,
        settings.model,
        signal,
      );
      return {
        efforts: (info.reasoning?.efforts ?? []).map((effort) => ({
          id: String(effort.id),
          name: effort.name,
        })),
        default: info.reasoning?.defaultEffort
          ? String(info.reasoning.defaultEffort)
          : "",
      };
    }
    if (action === "models.list") {
      const catalog = await this.ctx.sessionController.modelCatalog();
      return catalog.groups.flatMap((g) =>
        g.models.map((m) => ({
          provider: g.id,
          model: m.id,
          label: `${g.name} / ${m.name}`,
        })),
      );
    }
    if (action === "settings.save") return this.store.saveSettings(p.settings);
    if (action === "credential.save") {
      const key = z.string().min(1).max(10000).parse(p.key);
      await this.ctx.credentials.set(
        credentialRef(this.store.configuration.settings.credentialRef),
        key,
      );
      return true;
    }
    if (action === "credential.remove") {
      await this.ctx.credentials.unset(
        credentialRef(this.store.configuration.settings.credentialRef),
      );
      return true;
    }
    if (action === "generate") {
      const req = generationSchema.parse(p),
        { settings, presets } = this.store.configuration;
      if (
        !(req.mode === "grill"
          ? settings.grillEnabled
          : settings.rewriteEnabled)
      )
        throw new Error("此模式已关闭 / Mode disabled");
      const controller = new AbortController();
      this.pending.add(controller);
      const combined = AbortSignal.any([
        signal,
        controller.signal,
        AbortSignal.timeout(settings.timeoutSeconds * 1000),
      ]);
      try {
        return await abortable(
          (async () => {
            const project = await this.project(req.sessionId, combined);
            const context = await collectContext(
              project?.workingDirectory || null,
              settings.context,
              combined,
            );
            const selection =
              settings.connection === "host"
                ? (await this.ctx.sessionController.modelCatalog()).default
                : { provider: "", model: "" };
            return await generate(
              this.ctx,
              settings,
              req,
              context,
              presets,
              combined,
              selection,
            );
          })(),
          combined,
        );
      } finally {
        this.pending.delete(controller);
      }
    }
    if (action === "project.read")
      return this.project(
        z
          .string()
          .max(256)
          .parse(p.sessionId ?? ""),
        signal,
      );
    if (action === "project.check") {
      const project = await this.project(
        z.string().min(1).max(256).parse(p.sessionId),
        signal,
      );
      const expected = projectSchema.nullable().parse(p.project);
      return sameProject(project, expected);
    }
    const { settings } = this.store.configuration;
    const revision = () => z.number().int().nonnegative().parse(p.revision);
    if (action.startsWith("favorites.") && !settings.favoritesEnabled)
      throw new Error("收藏库已关闭 / Library disabled");
    if (action === "favorites.list") {
      const project = await this.project(
        z
          .string()
          .max(256)
          .parse(p.sessionId ?? ""),
        signal,
      );
      return this.store.listFavorites(
        project,
        z
          .string()
          .max(1000)
          .parse(p.query ?? ""),
        z
          .enum(["all", "current", "global", "project"])
          .parse(p.scope ?? "current"),
        z.enum(["manual", "recent", "updated"]).parse(p.sort ?? "manual"),
        z
          .number()
          .int()
          .min(1)
          .max(5000)
          .parse(p.limit ?? 50),
        z
          .string()
          .max(64)
          .parse(p.tag ?? ""),
      );
    }
    if (action === "favorites.get")
      return this.store.favorite(z.string().max(80).parse(p.id));
    if (action === "favorites.save") {
      const favorite = z.record(z.string(), z.unknown()).parse(p.favorite);
      const sessionId = z
        .string()
        .max(256)
        .parse(p.sessionId ?? "");
      let project: Project | null = null;
      if (favorite.project) {
        if (sessionId) {
          project = await this.project(sessionId, signal);
          if (!sameProject(project, projectSchema.parse(favorite.project)))
            throw new Error(
              "项目已变化，请重新打开收藏库 / Project changed; reopen the library",
            );
        } else {
          const old = this.store.favorite(
            z.string().max(80).parse(favorite.id),
          );
          const expected = projectSchema.parse(favorite.project);
          if (sameProject(old.project, expected)) project = old.project;
        }
      }
      if (favorite.project && !project)
        throw new Error("无法确认项目 / Project unavailable");
      return this.store.saveFavorite({ ...favorite, project }, revision());
    }
    if (action === "favorites.delete")
      return this.store.deleteFavorite(
        z.string().max(80).parse(p.id),
        revision(),
      );
    if (action === "favorites.add") {
      // 「存为常用」直接保存：第一行作标题，范围为当前项目，无法确认项目时存为通用。
      const body = z
        .string()
        .refine((v) => !!v.trim())
        .parse(p.body);
      const project = await this.project(
        z
          .string()
          .max(256)
          .parse(p.sessionId ?? ""),
        signal,
      );
      return this.store.addFavorite(
        [...(body.trim().split("\n")[0] ?? "")].slice(0, 80).join(""),
        body,
        project,
      );
    }
    if (action === "favorites.restore")
      return this.store.restoreFavorite(
        p.favorite,
        z.number().int().nonnegative().parse(p.index),
      );
    if (action === "favorites.reorder")
      return this.store.reorderFavorites(
        z.array(z.string().max(80)).max(5000).parse(p.ids),
        revision(),
      );
    if (action === "favorites.touch")
      return this.store.touchFavorite(z.string().max(80).parse(p.id));
    if (action === "favorites.export") return this.store.export();
    if (action === "favorites.import")
      return this.store.import(
        z.string().parse(p.raw),
        revision(),
        z.boolean().parse(p.commit),
      );
    if (action === "presets.save") {
      if (!settings.presetsEnabled)
        throw new Error("场景预设已关闭 / Presets disabled");
      return this.store.savePreset(p.preset, revision());
    }
    if (action.startsWith("feedback.") && !settings.feedbackEnabled)
      throw new Error("结果反馈已关闭 / Feedback disabled");
    if (action === "feedback.list") return this.store.feedback();
    if (action === "feedback.save") {
      throw new Error(
        "此功能已停止记录 / Feedback collection has been retired",
      );
    }
    if (action === "feedback.delete")
      return this.store.deleteFeedback(z.string().max(80).parse(p.id));
    if (action === "feedback.export")
      return JSON.stringify(
        { version: 1, feedback: this.store.feedback() },
        null,
        2,
      );
    throw new Error("未知操作 / Unknown operation");
  }
}
export async function apply(ctx: Context) {
  ctx.typert.register({
    package: remoteContribution.package,
    face: "host",
    schemas: [],
    model: { services: [], events: [], objects: [] },
    invocations: remoteContribution.descriptors,
  });
  const store = await PromptStore.open(ctx.storageDomain);
  ctx.effect(() => () => store.close());
  ctx.plugin(PromptKitService, store);
}
