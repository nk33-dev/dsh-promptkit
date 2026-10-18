import { describe, expect, it } from "vitest";
import { abortable } from "../src/host/abort.ts";
describe("bounded cancellation", () => {
  it("releases the caller even if an adapter never settles", async () => {
    const controller = new AbortController(),
      pending = abortable(new Promise(() => {}), controller.signal);
    controller.abort(new Error("cancelled"));
    await expect(pending).rejects.toThrow("cancelled");
  });
  it("handles late adapter failures without an unhandled rejection", async () => {
    let fail!: (error: Error) => void;
    const controller = new AbortController(),
      operation = new Promise((_, reject) => {
        fail = reject;
      }),
      pending = abortable(operation, controller.signal);
    controller.abort(new Error("cancelled"));
    await expect(pending).rejects.toThrow("cancelled");
    fail(new Error("late error"));
    await Promise.resolve();
  });
});
