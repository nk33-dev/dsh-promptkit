import { afterEach, describe, expect, it, vi } from "vitest";
import { Context } from "@deepseek-ai/cordis";
import { PromptKitService } from "../src/index.ts";
import type { PromptStore } from "../src/host/store.ts";

const cleanup: (() => void)[] = [];
afterEach(() => {
  for (const dispose of cleanup.splice(0).reverse()) dispose();
});

function setup(projection: unknown) {
  const ctx = new Context();
  const projections = vi.fn(async () => projection);
  cleanup.push(ctx.provide("sessionController", { projections }));
  const service = new PromptKitService(ctx, { hostId: "host" } as PromptStore);
  const signal = new AbortController().signal;
  return {
    projections,
    signal,
    read: (sessionId = "test") =>
      service.request({ action: "project.read", payload: { sessionId } }, signal),
    check: (workingDirectory: string) =>
      service.request({
        action: "project.check",
        payload: { sessionId: "test", project: { hostId: "host", workingDirectory } },
      }, signal),
  };
}

describe("Harness session projections", () => {
  it("reads the current working directory without activating a session", async () => {
    const { read, projections, signal } = setup({
      kind: "sequenced", asOfSeq: 12, values: { workingDirectory: "/workspace/worktree" },
    });
    expect(await read()).toMatchObject({
      ok: true, data: { hostId: "host", workingDirectory: "/workspace/worktree" },
    });
    expect(projections).toHaveBeenCalledExactlyOnceWith({ sessionId: "test" }, signal);
  });

  it("checks the projected directory before writing back", async () => {
    const { check } = setup({
      kind: "sequenced", asOfSeq: 12, values: { workingDirectory: "/workspace/worktree" },
    });
    expect(await check("/workspace/worktree")).toMatchObject({ ok: true, data: true });
    expect(await check("/workspace/original")).toMatchObject({ ok: true, data: false });
  });

  it.each([
    null,
    { kind: "sequenced", asOfSeq: 0, values: {} },
    { kind: "sequenced", asOfSeq: 0, values: { workingDirectory: 42 } },
    { kind: "migration-required", values: { workingDirectory: "/stale/path" } },
  ])("does not use missing or unsequenced project facts: %j", async (projection) => {
    const { read } = setup(projection);
    expect(await read()).toMatchObject({ ok: true, data: null });
  });

  it("does not query an empty session", async () => {
    const { read, projections } = setup(null);
    expect(await read("")).toMatchObject({ ok: true, data: null });
    expect(projections).not.toHaveBeenCalled();
  });
});
