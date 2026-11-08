import type { Context } from "@deepseek-ai/cordis";
import {
  BlockAssembler,
  createAssistantMessage,
  createUserMessage,
} from "@deepseek-ai/dsh-llm";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import type {
  Settings,
  Protocol,
  GenerationRequest,
  GenerationResult,
  ContextReport,
  Preset,
  Question,
} from "../shared/types.ts";
import { GRILL_FORMAT, REFERENCE_BOUNDARY } from "../shared/defaults.ts";
import { generationGuidance, questionLimit, outputBudget } from "../shared/preferences.ts";
import { REWRITE_RULE, GRILL_RULE } from "../rules.ts";
import { z } from "zod";

declare module "@deepseek-ai/dsh-llm/types" {
  interface LlmRequestPurposeMap {
    promptkit: true;
  }
}

type ConversationMessage = { role: "user" | "assistant"; content: string };
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

async function readModelResponse(response: Response, signal: AbortSignal): Promise<string> {
  const tooLarge = () => new Error("模型响应超过 2 MiB，请缩短要求后重试 / Model response exceeds 2 MiB; shorten your request and retry");
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) {
    await response.body?.cancel().catch(() => {});
    throw tooLarge();
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  const parts: string[] = [];
  try {
    signal.throwIfAborted();
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch {
        signal.throwIfAborted();
        throw new Error("模型响应读取中断，请重试 / Model response was interrupted; retry");
      }
      signal.throwIfAborted();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) throw tooLarge();
      parts.push(decoder.decode(chunk.value, { stream: true }));
    }
    parts.push(decoder.decode());
    return parts.join("");
  } catch (error) {
    await reader.cancel().catch(() => {});
    signal.throwIfAborted();
    if (error instanceof TypeError)
      throw new Error("模型响应不是有效 UTF-8，请重试 / Model response is not valid UTF-8; retry");
    throw error;
  } finally {
    signal.removeEventListener("abort", abort);
    reader.releaseLock();
  }
}

const formatError =
  "模型返回的格式不正确，请重试，已填答案会保留 / Invalid model format; retry without losing answers";
/** 截到字符上限并去掉首尾空白。 */
function clip(value: unknown, max: number): string {
  return typeof value === "string" ? [...value.trim()].slice(0, max).join("").trim() : "";
}
/**
 * 模型偶尔多给选项、推荐越界或个别字段类型不对；逐题规整，只丢弃无法使用的题，
 * 不因为一道题让整批问题失败。
 */
function normalizeQuestions(value: unknown, limit: number): Question[] {
  const questions: Question[] = [];
  for (const item of Array.isArray(value) ? value : []) {
    if (questions.length >= limit) break;
    if (!item || typeof item !== "object") continue;
    const source = item as Record<string, unknown>;
    const question = clip(source.question, 1200);
    const options: Question["options"] = [],
      kept: number[] = [];
    (Array.isArray(source.options) ? source.options : []).forEach((option, index) => {
      const record = option && typeof option === "object" ? (option as Record<string, unknown>) : {};
      const label = clip(typeof option === "string" ? option : record.label, 160);
      if (!label || options.length >= 6 || options.some((o) => o.label === label)) return;
      kept.push(index);
      options.push({ label, description: clip(record.description, 600) });
    });
    if (!question || options.length < 2) continue;
    let id = clip(source.id, 80) || `q${questions.length + 1}`;
    const base = id;
    for (let suffix = 2; questions.some((q) => q.id === id); suffix++)
      id = `${[...base].slice(0, 76).join("")}_${suffix}`;
    // 推荐项按原索引找到保留后的位置，被合并或截掉就视为没有推荐。
    const recommended = kept.indexOf(Number.isInteger(source.recommended) ? (source.recommended as number) : -1);
    const basis = clip(source.basis, 600);
    questions.push({
      id,
      title: clip(source.title, 80) || [...question].slice(0, 80).join(""),
      question,
      ...(basis ? { basis } : {}),
      multiSelect: source.multiSelect === true,
      options,
      recommended: recommended >= 0 ? recommended : null,
    });
  }
  return questions;
}
/** 去掉代码围栏；模型在 JSON 前后加了说明文字时，取第一个 { 到最后一个 } 之间的内容。 */
function jsonObject(raw: string): Record<string, unknown> | null {
  const clean = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  for (const candidate of [clean, clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1)]) {
    try {
      const value: unknown = JSON.parse(candidate);
      if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
    } catch {}
  }
  return null;
}
export function parseResult(
  raw: string,
  forceFinal: boolean,
  limit = questionLimit("standard"),
): Pick<GenerationResult, "kind" | "text" | "questions"> {
  const parsed = jsonObject(raw);
  if (!parsed) throw new Error(formatError);
  const kind = typeof parsed.kind === "string" ? parsed.kind : Array.isArray(parsed.questions) ? "questions" : "";
  if (kind === "questions") {
    const questions = normalizeQuestions(parsed.questions, limit);
    if (questions.length) {
      if (forceFinal)
        throw new Error(
          "模型仍在追问，请重试生成 / Model asked again; retry generation",
        );
      return { kind: "questions", questions, text: "" };
    }
  }
  const final = z
    .object({
      kind: z.enum(["summary", "final"]),
      text: z.string().trim().min(1).max(40000),
    })
    .strip()
    .safeParse(parsed);
  if (!final.success || (forceFinal && final.data.kind !== "final"))
    throw new Error(formatError);
  return {
    kind: final.data.kind,
    text: final.data.text,
    questions: [],
  };
}
export function endpoint(base: string, path: string): string {
  const url = new URL(base);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("模型地址格式不正确 / Invalid model endpoint");
  const root = url.href
    .replace(/\/+$/, "")
    .replace(/\/(chat\/completions|responses|messages)$/, "");
  return `${root}/${path}`;
}
function contentText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value
    .map((block) =>
      block && typeof block === "object" && typeof block.text === "string"
        ? block.text
        : "",
    )
    .join("");
}
export async function independentRequest(
  settings: Settings,
  key: string,
  system: string,
  user: string | ConversationMessage[],
  signal: AbortSignal,
  send: typeof fetch = fetch,
): Promise<{ text: string; protocol: string }> {
  if (!settings.baseUrl || !settings.model)
    throw new Error("请填写模型地址和名称 / Set model URL and name");
  const conversation =
    typeof user === "string" ? [{ role: "user", content: user }] : user;
  const protocols: Exclude<Protocol, "auto">[] =
    settings.protocol === "auto"
      ? ["chat_completions", "responses", "anthropic_messages"]
      : [settings.protocol];
  for (let index = 0; index < protocols.length; index++) {
    const protocol = protocols[index];
    const path =
      protocol === "chat_completions"
        ? "chat/completions"
        : protocol === "responses"
          ? "responses"
          : "messages";
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (protocol === "anthropic_messages") {
      headers["x-api-key"] = key;
      headers["anthropic-version"] = "2023-06-01";
    } else headers.authorization = `Bearer ${key}`;
    const body =
      protocol === "responses"
        ? {
            model: settings.model,
            instructions: system,
            input: conversation,
            ...(settings.reasoningEffort
              ? { reasoning: { effort: settings.reasoningEffort } }
              : {}),
            max_output_tokens: outputBudget(settings.detail),
            stream: false,
          }
        : {
            model: settings.model,
            ...(protocol === "anthropic_messages" ? { system } : {}),
            messages: [
              ...(protocol === "chat_completions"
                ? [{ role: "system", content: system }]
                : []),
              ...conversation,
            ],
            max_tokens: outputBudget(settings.detail),
            ...(settings.reasoningEffort && protocol !== "anthropic_messages"
              ? { reasoning_effort: settings.reasoningEffort }
              : {}),
            stream: false,
          };
    const response = await send(endpoint(settings.baseUrl, path), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) {
      await response.body?.cancel();
      // 鉴权、限流和服务端故障不切协议，避免重复计费和掩盖真实错误。
      if (
        [404, 405, 415, 422].includes(response.status) &&
        index < protocols.length - 1
      )
        continue;
      throw new Error(
        `模型请求失败 / Model request failed (HTTP ${response.status})`,
      );
    }
    const raw = await readModelResponse(response, signal);
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      if (index < protocols.length - 1) continue;
      throw new Error("无法解析模型响应 / Could not parse the model response");
    }
    if (data.choices?.[0]?.finish_reason === "length" || data.stop_reason === "max_tokens" || data.status === "incomplete")
      throw new Error("模型输出未完成，请重试或缩短要求 / Model output is incomplete; retry or shorten your request");
    const text =
      protocol === "chat_completions"
        ? contentText(data.choices?.[0]?.message?.content)
        : protocol === "responses"
          ? contentText(data.output_text) ||
            (Array.isArray(data.output)
              ? data.output
                  .map((v: { content?: unknown }) => contentText(v.content))
                  .join("")
              : "")
          : contentText(
              data.content?.filter((v: { type?: string }) => v.type === "text"),
            );
    if (!text.trim()) {
      if (index < protocols.length - 1) continue;
      throw new Error("模型没有返回文本 / Model returned no text");
    }
    if ([...text].length > 100000)
      throw new Error("生成内容过长 / Generated text too long");
    return { text, protocol };
  }
  throw new Error("没有可用的模型协议 / No compatible protocol");
}
export async function generate(
  ctx: Context,
  settings: Settings,
  request: GenerationRequest,
  context: ContextReport,
  presets: Preset[],
  signal: AbortSignal,
  selection: { provider: string; model: string },
): Promise<GenerationResult> {
  settings = { ...settings, detail: request.detail ?? settings.detail };
  if (
    !(request.mode === "grill"
      ? settings.grillEnabled
      : settings.rewriteEnabled)
  )
    throw new Error("此模式已关闭 / Mode is disabled");
  // 场景已从界面下线：只有旧设置仍开着场景时才按请求的场景追加规则，找不到就按通用处理。
  const preset = settings.presetsEnabled
    ? presets.find((p) => p.id === request.scenario)
    : undefined;
  const forceFinal = request.forceFinal;
  const system = [
    request.mode === "grill"
      ? settings.grillSystemPrompt || GRILL_RULE
      : settings.systemPrompt || REWRITE_RULE,
    preset?.rule,
    generationGuidance(settings),
    REFERENCE_BOUNDARY,
    request.mode === "grill" ? GRILL_FORMAT : "",
    request.messages?.length || request.currentText
      ? "后续 user 消息是修改要求；assistant 消息是旧稿。以 currentText 为底稿应用最新修改，返回完整新稿；forceFinal 为 true 时使用最终稿格式。"
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const user = JSON.stringify({
    draft: request.prompt,
    projectContext: context.sections.map((s) => ({
      kind: s.kind,
      text: s.text,
    })),
    previousRounds: request.history,
    currentText: request.currentText || "",
    forceFinal,
  });
  const conversation: ConversationMessage[] = [
    { role: "user", content: user },
    ...(request.messages || []).map(({ role, text }) => ({
      role,
      content: text,
    })),
  ];
  // 问答中途直接生成时，最后一条可能是早先的“看不懂”或补充问题，需追加最终稿指令。
  if (
    conversation.at(-1)?.role === "assistant" ||
    (!request.messages?.length && request.currentText) ||
    (forceFinal && !request.currentText && request.messages?.length)
  )
    conversation.push({
      role: "user",
      content: forceFinal
        ? "根据当前结果和已确认要求生成完整最终提示词。"
        : "根据当前结果和已确认答案继续澄清需求。",
    });
  let output: { text: string; protocol: string }, model: string;
  if (settings.connection === "independent") {
    const credential = await ctx.credentials.resolve(
      credentialRef(settings.credentialRef),
    );
    if (!credential)
      throw new Error(
        "请先配置模型密钥 / Configure the model credential first",
      );
    output = await independentRequest(
      settings,
      credential.value,
      system,
      conversation,
      signal,
    );
    model = settings.model;
  } else {
    const provider = settings.provider || selection.provider;
    model = settings.model || selection.model;
    if (!provider || !model)
      throw new Error("请先选择 Harness 模型 / Select a Harness model first");
    const info = await ctx.llm.resolveModelInfo(provider, model, signal);
    // 设置里选的档位优先；不在模型声明里就退回最低档。
    const reasoningEffort =
      info.reasoning?.efforts.find(
        (effort) => String(effort.id) === settings.reasoningEffort,
      )?.id ?? info.reasoning?.efforts[0]?.id;
    const assembler = new BlockAssembler();
    let received = 0;
    // 辅助改写采用模型声明的最低推理档，避免推理占满短输出预算。
    for await (const chunk of ctx.llm.stream({
      provider,
      model,
      sessionId: request.sessionId as Parameters<typeof ctx.llm.stream>[0]["sessionId"],
      purpose: "promptkit",
      reasoningEffort,
      system,
      messages: conversation.map(({ role, content }) =>
        role === "assistant"
          ? createAssistantMessage({
              content: [{ type: "text", text: content }],
              source: { provider, model },
            })
          : createUserMessage({
              content: [{ type: "text", text: content }],
              source: { kind: "user" },
            }),
      ),
      maxTokens: outputBudget(settings.detail),
      signal,
    })) {
      assembler.push(chunk);
      if (chunk.type === "text-delta") received += chunk.text.length;
      if (received > 200000)
        throw new Error("生成内容过长 / Generated text too long");
    }
    signal.throwIfAborted();
    if (
      assembler.finish.kind === "error" ||
      assembler.finish.kind === "aborted"
    ) {
      const failure = assembler.finish.failure;
      const code = /^[A-Za-z0-9_-]{1,80}$/.test(failure.code)
        ? failure.code
        : "UPSTREAM_ERROR";
      throw new Error(
        `模型请求失败（${code}${failure.status ? `, HTTP ${failure.status}` : ""}），请重试 / Model request failed; retry`,
      );
    }
    if (assembler.finish.kind === "max-tokens")
      throw new Error(
        "模型输出达到长度上限，请重试 / Model output limit reached; retry",
      );
    const text = assembler
      .blocks()
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    if (!text.trim())
      throw new Error("模型没有返回文本 / Model returned no text");
    if ([...text].length > 100000)
      throw new Error("生成内容过长 / Generated text too long");
    output = { text, protocol: "host" };
  }
  return {
    ...(request.mode === "grill"
      ? parseResult(output.text, forceFinal, questionLimit(settings.detail))
      : { kind: "final" as const, text: output.text.trim(), questions: [] }),
    context,
    metadata: {
      mode: request.mode,
      scenario: preset?.id || "general",
      model,
      systemPrompt: system,
    },
    protocol: output.protocol,
  };
}
