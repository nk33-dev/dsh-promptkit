import { describe, expect, it } from "vitest";
import { createServer } from "node:http";
import { independentRequest } from "../src/host/model.ts";
import { defaultSettings } from "../src/shared/defaults.ts";
describe("independent model HTTP integration", () => {
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
