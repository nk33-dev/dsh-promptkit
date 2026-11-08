import { describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import { independentRequest } from "../src/host/model.ts";
import { defaultSettings } from "../src/shared/defaults.ts";
describe("independent model HTTP integration", () => {
  const options = { ...defaultSettings(), baseUrl: "https://example.test/v1", model: "test", protocol: "chat_completions" as const };
  const invoke = (response: Response, signal = new AbortController().signal) =>
    independentRequest(options, "synthetic-secret", "system", "draft", signal, async () => response);

  it("bounds declared and chunked bytes before buffering the full response", async () => {
    const cancel = vi.fn();
    const oversized = new Response(new ReadableStream({ cancel }), { headers: { "content-length": String(2 * 1024 * 1024 + 1) } });
    await expect(invoke(oversized)).rejects.toThrow("2 MiB");
    expect(cancel).toHaveBeenCalledOnce();
    const cancelFailure = new Response(new ReadableStream({
      cancel() { throw new Error("synthetic-secret"); },
    }), { headers: { "content-length": String(2 * 1024 * 1024 + 1) } });
    await expect(invoke(cancelFailure)).rejects.toThrow("2 MiB");
    const chunk = new TextEncoder().encode("中".repeat(400000));
    let sent = 0;
    const stop = vi.fn();
    const streamed = new Response(new ReadableStream({
      pull(controller) { ++sent; controller.enqueue(chunk); },
      cancel: stop,
    }, { highWaterMark: 0 }));
    await expect(invoke(streamed)).rejects.toThrow("2 MiB");
    expect(sent).toBe(2);
    expect(stop).toHaveBeenCalledOnce();
  });

  it("preserves split UTF-8 and reports interrupted, invalid and cancelled bodies", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ choices: [{ message: { content: "中文结果" } }] }));
    const valid = new Response(new ReadableStream({
      start(controller) { for (const byte of bytes) controller.enqueue(new Uint8Array([byte])); controller.close(); },
    }));
    expect((await invoke(valid)).text).toBe("中文结果");
    const failed = new Response(new ReadableStream({
      pull(controller) { controller.error(new Error("synthetic-secret")); },
    }));
    await expect(invoke(failed)).rejects.toThrow("读取中断");
    await expect(invoke(new Response(new Uint8Array([255])))).rejects.toThrow("UTF-8");
    const controller = new AbortController(), cancel = vi.fn();
    const pending = invoke(new Response(new ReadableStream({ cancel })), controller.signal);
    controller.abort(new DOMException("cancelled", "AbortError"));
    await expect(pending).rejects.toThrow("cancelled");
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("sends all three wire protocols over real local HTTP", async () => {
    const seen: { url: string; auth: string; body: Record<string, unknown> }[] =
      [];
    const server = createServer(async (req, res) => {
      let raw = "";
      for await (const part of req) raw += part;
      seen.push({
        url: req.url!,
        auth: String(req.headers.authorization || req.headers["x-api-key"]),
        body: JSON.parse(raw),
      });
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify(
          req.url?.endsWith("/responses")
            ? { output_text: "real HTTP" }
            : req.url?.endsWith("/messages")
              ? { content: [{ type: "text", text: "real HTTP" }] }
              : { choices: [{ message: { content: "real HTTP" } }] },
        ),
      );
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (!address || typeof address === "string")
      throw Error("Port unavailable");
    try {
      for (const protocol of [
        "chat_completions",
        "responses",
        "anthropic_messages",
      ] as const) {
        const result = await independentRequest(
          {
            ...defaultSettings(),
            baseUrl: `http://127.0.0.1:${address.port}/v1`,
            model: "test",
            protocol,
          },
          "local-test",
          "system",
          "draft",
          new AbortController().signal,
        );
        expect(result.text).toBe("real HTTP");
      }
      expect(seen.map((v) => v.url)).toEqual([
        "/v1/chat/completions",
        "/v1/responses",
        "/v1/messages",
      ]);
      expect(
        seen.every(
          (v) => v.auth === "Bearer local-test" || v.auth === "local-test",
        ),
      ).toBe(true);
      expect(
        seen.every((v) => !JSON.stringify(v.body).includes("local-test")),
      ).toBe(true);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
