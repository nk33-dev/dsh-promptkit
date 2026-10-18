import { describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../src/shared/defaults.ts";
import { generationSchema } from "../src/shared/schemas.ts";
import {
  endpoint,
  independentRequest,
  parseResult,
} from "../src/host/model.ts";
const question = {
  id: "scope",
  title: "范围",
  question: "覆盖哪些场景？",
  options: [
    { label: "核心", description: "先验证" },
    { label: "全部", description: "完整交付" },
  ],
  recommended: 0,
};
describe("model protocols and question boundaries", () => {
  it.each([
    ["chat_completions", { choices: [{ finish_reason: "length", message: { content: "partial" } }] }],
    ["responses", { status: "incomplete", output_text: "partial" }],
    ["anthropic_messages", { stop_reason: "max_tokens", content: [{ type: "text", text: "partial" }] }],
  ] as const)("rejects truncated output from %s", async (protocol, body) => {
    const send = vi.fn(async () => new Response(JSON.stringify(body)));
    await expect(independentRequest({ ...defaultSettings(), baseUrl: "https://example.test/v1", model: "m", protocol }, "key", "system", "draft", new AbortController().signal, send)).rejects.toThrow("输出未完成");
    expect(send).toHaveBeenCalledTimes(1);
  });
  it.each([
    [
      "chat_completions",
      { choices: [{ message: { content: "result" } }] },
      "chat/completions",
    ],
    [
      "responses",
      { output: [{ content: [{ type: "output_text", text: "result" }] }] },
      "responses",
    ],
    [
      "anthropic_messages",
      { content: [{ type: "text", text: "result" }] },
      "messages",
    ],
  ] as const)("supports %s", async (protocol, body, path) => {
    const send = vi.fn(
      async () => new Response(JSON.stringify(body), { status: 200 }),
    );
    const settings = {
      ...defaultSettings(),
      baseUrl: "https://example.test/v1",
      model: "test",
      protocol,
    };
    const result = await independentRequest(
      settings,
      "private-key",
      "system",
      "draft",
      new AbortController().signal,
      send,
    );
    expect(result.text).toBe("result");
    expect(send.mock.calls[0][0]).toBe(`https://example.test/v1/${path}`);
  });
  it("sends the configured reasoning effort on OpenAI-compatible protocols only", async () => {
    const body = async (
      protocol: "chat_completions" | "anthropic_messages" | "responses",
    ) => {
      const send = vi.fn(
        async () =>
          new Response(
            JSON.stringify(
              protocol === "responses"
                ? { output_text: "ok" }
                : protocol === "chat_completions"
                  ? { choices: [{ message: { content: "ok" } }] }
                  : { content: [{ type: "text", text: "ok" }] },
            ),
            { status: 200 },
          ),
      );
      await independentRequest(
        {
          ...defaultSettings(),
          baseUrl: "https://example.test/v1",
          model: "test",
          protocol,
          reasoningEffort: "high",
        },
        "key",
        "system",
        "draft",
        new AbortController().signal,
        send,
      );
      return JSON.parse(send.mock.calls[0][1]!.body as string);
    };
    expect((await body("chat_completions")).reasoning_effort).toBe("high");
    expect((await body("responses")).reasoning).toEqual({ effort: "high" });
    expect((await body("anthropic_messages")).reasoning_effort).toBeUndefined();
  });
  it.each(["chat_completions", "responses", "anthropic_messages"] as const)(
    "preserves follow-up roles in %s",
    async (protocol) => {
      const send = vi.fn(
        async () =>
          new Response(
            JSON.stringify(
              protocol === "responses"
                ? { output_text: "Revised" }
                : protocol === "anthropic_messages"
                  ? { content: [{ type: "text", text: "Revised" }] }
                  : { choices: [{ message: { content: "Revised" } }] },
            ),
          ),
      );
      const conversation = [
        { role: "user" as const, content: "Draft" },
        { role: "assistant" as const, content: "Old prompt" },
        { role: "user" as const, content: "Add CSV" },
      ];
      await independentRequest(
        {
          ...defaultSettings(),
          baseUrl: "https://example.test/v1",
          model: "test",
          protocol,
        },
        "key",
        "system",
        conversation,
        new AbortController().signal,
        send,
      );
      const body = JSON.parse(send.mock.calls[0][1]!.body as string);
      const messages = protocol === "responses" ? body.input : body.messages;
      expect(messages.slice(-3)).toEqual(conversation);
    },
  );
  it("falls back after unsupported endpoints and retains the API prefix", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ output_text: "yes" }), { status: 200 }),
      );
    expect(
      (
        await independentRequest(
          {
            ...defaultSettings(),
            protocol: "auto",
            baseUrl: "https://example.test/api/v1",
            model: "m",
          },
          "key",
          "s",
          "u",
          new AbortController().signal,
          send,
        )
      ).protocol,
    ).toBe("responses");
    expect(send).toHaveBeenCalledTimes(2);
  });
  it.each(["not JSON", "{}"])(
    "falls back after an incompatible successful response: %s",
    async (raw) => {
      const send = vi
        .fn()
        .mockResolvedValueOnce(new Response(raw))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ output_text: "compatible" })),
        );
      expect(
        (
          await independentRequest(
            {
              ...defaultSettings(),
              protocol: "auto",
              baseUrl: "https://example.test/v1",
              model: "m",
            },
            "key",
            "s",
            "u",
            new AbortController().signal,
            send,
          )
        ).text,
      ).toBe("compatible");
      expect(send).toHaveBeenCalledTimes(2);
    },
  );
  it("accepts Chat Completions text blocks", async () => {
    const send = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: [
                    { type: "text", text: "first" },
                    { type: "text", text: " second" },
                  ],
                },
              },
            ],
          }),
        ),
    );
    expect(
      (
        await independentRequest(
          {
            ...defaultSettings(),
            baseUrl: "https://example.test/v1",
            model: "m",
          },
          "key",
          "s",
          "u",
          new AbortController().signal,
          send,
        )
      ).text,
    ).toBe("first second");
  });
  it.each([401, 429, 500])(
    "does not retry another protocol for HTTP %s",
    async (status) => {
      const send = vi.fn(async () => new Response("private-key", { status }));
      await expect(
        independentRequest(
          {
            ...defaultSettings(),
            protocol: "auto",
            baseUrl: "https://example.test/v1",
            model: "m",
          },
          "private-key",
          "s",
          "u",
          new AbortController().signal,
          send,
        ),
      ).rejects.toThrow(`HTTP ${status}`);
      expect(send).toHaveBeenCalledTimes(1);
    },
  );
  it("rejects credentials embedded in URLs", () => {
    expect(() =>
      endpoint("https://user:secret@example.test/v1", "responses"),
    ).toThrow();
  });
  it("parses fenced questions and respects explicit generation", () => {
    const raw = JSON.stringify({ kind: "questions", questions: [question] });
    expect(
      parseResult("```json\n" + raw + "\n```", false).questions,
    ).toHaveLength(1);
    expect(() => parseResult(raw, true)).toThrow("模型仍在追问");
  });
  it("rejects malformed output and accepts a ready final prompt", () => {
    expect(() => parseResult("plain result", false)).toThrow();
    expect(() => parseResult("{broken", false)).toThrow();
    expect(parseResult('{"kind":"final","text":"ready"}', false).kind).toBe(
      "final",
    );
    expect(parseResult('{"kind":"summary","text":"ready"}', false).kind).toBe(
      "summary",
    );
    expect(parseResult('{"kind":"final","text":"ready"}', true).kind).toBe(
      "final",
    );
    expect(() =>
      parseResult('{"kind":"summary","text":"ready"}', true),
    ).toThrow();
  });
  it("accepts further rounds but rejects unknown question IDs", () => {
    const request = {
      sessionId: "one",
      prompt: "draft",
      mode: "grill",
      scenario: "general",
      forceFinal: false,
      history: Array.from({ length: 4 }, () => ({
        questions: [question],
        answers: [],
      })),
    };
    expect(generationSchema.safeParse(request).success).toBe(true);
    expect(
      generationSchema.safeParse({
        ...request,
        history: [
          {
            questions: [question],
            answers: [{ questionId: "unknown", answer: "a" }],
          },
        ],
      }).success,
    ).toBe(false);
  });
  it("ignores extra model annotations while keeping the question contract", () => {
    const result = parseResult(JSON.stringify({ kind: "questions", note: "参考说明", questions: [{ ...question, basis: "范围影响交付", extra: true, options: [{ label: "核心", extra: "ignored" }, { label: "全部" }] }] }), false);
    expect(result.questions[0].options[0]).toEqual({ label: "核心", description: "" });
    expect(result.questions[0]).not.toHaveProperty("extra");
  });
});
