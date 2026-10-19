import { describe, expect, it, vi } from "vitest";
import type { Context } from "@deepseek-ai/cordis";
import type { StreamChunk } from "@deepseek-ai/dsh-llm";
import { generate } from "../src/host/model.ts";
import { defaultSettings, DEFAULT_PRESETS } from "../src/shared/defaults.ts";
const request = {
  sessionId: "test",
  prompt: "draft",
  mode: "rewrite" as const,
  scenario: "general",
  history: [],
  forceFinal: false,
};
function context(chunks: StreamChunk[]) {
  const stream = vi.fn(async function* () {
    for (const chunk of chunks) yield chunk;
  });
  return {
    stream,
    ctx: {
      llm: {
        resolveModelInfo: async () => ({
          reasoning: { efforts: [{ id: "low", name: "Low" }] },
        }),
        stream,
      },
    } as unknown as Context,
  };
}
describe("Harness stream integration", () => {
  it("uses the request depth for rules and output budget without changing the saved default", async () => {
    const { ctx, stream } = context([
      { type: "block-end", index: 0, block: { type: "text", text: "Polished" } },
      { type: "finish", reason: { kind: "stop" } },
    ]);
    const settings = defaultSettings();
    const result = await generate(
      ctx, settings, { ...request, detail: "concise" },
      { enabled: false, sections: [] }, DEFAULT_PRESETS,
      new AbortController().signal, { provider: "test", model: "model" },
    );
    expect(stream.mock.calls[0][0].maxTokens).toBe(2048);
    expect(result.metadata.systemPrompt).toContain("最多提出 5 题");
    expect(settings.detail).toBe("standard");
  });
  it("sends edits as native conversation turns with the current editable draft", async () => {
    const { ctx, stream } = context([
      { type: "block-end", index: 0, block: { type: "text", text: "Revised" } },
      { type: "finish", reason: { kind: "stop" } },
    ]);
    await generate(
      ctx,
      defaultSettings(),
      {
        ...request,
        currentText: "Manually edited",
        messages: [
          { role: "assistant", text: "Old result" },
          { role: "user", text: "Add CSV" },
        ],
      },
      { enabled: false, sections: [] },
      DEFAULT_PRESETS,
      new AbortController().signal,
      { provider: "test", model: "model" },
    );
    const messages = stream.mock.calls[0][0].messages;
    expect(JSON.parse(messages[0].content[0].text).currentText).toBe(
      "Manually edited",
    );
    expect(messages.at(-1)).toMatchObject({
      role: "user",
      content: [{ type: "text", text: "Add CSV" }],
    });
    expect(messages[1].role).toBe("assistant");
  });
  it("uses the canonical assembler for complete text blocks without deltas", async () => {
    const { ctx, stream } = context([
      {
        type: "block-end",
        index: 0,
        block: { type: "text", text: "complete result" },
      },
      { type: "finish", reason: { kind: "stop" } },
    ]);
    const result = await generate(
      ctx,
      defaultSettings(),
      request,
      { enabled: false, sections: [] },
      DEFAULT_PRESETS,
      new AbortController().signal,
      { provider: "test", model: "model" },
    );
    expect(result.text).toBe("complete result");
    expect(stream.mock.calls[0][0]).toMatchObject({
      reasoningEffort: "low",
      maxTokens: 4096,
    });
    expect(stream.mock.calls[0][0]).not.toHaveProperty("tools");
  });
  it("reports normalized stream failures without exposing provider text", async () => {
    const { ctx } = context([
      {
        type: "finish",
        reason: {
          kind: "error",
          failure: { code: "NETWORK_ERROR", message: "private-key" },
        },
      },
    ]);
    await expect(
      generate(
        ctx,
        defaultSettings(),
        request,
        { enabled: false, sections: [] },
        DEFAULT_PRESETS,
        new AbortController().signal,
        { provider: "test", model: "model" },
      ),
    ).rejects.toThrow("模型请求失败");
  });
  it("reports exhausted output budgets rather than presenting partial text", async () => {
    const { ctx } = context([
      { type: "text-delta", index: 0, text: "partial" },
      { type: "finish", reason: { kind: "max-tokens" } },
    ]);
    await expect(
      generate(
        ctx,
        defaultSettings(),
        request,
        { enabled: false, sections: [] },
        DEFAULT_PRESETS,
        new AbortController().signal,
        { provider: "test", model: "model" },
      ),
    ).rejects.toThrow("长度上限");
  });
});
