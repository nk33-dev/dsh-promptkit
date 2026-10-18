import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { collectContext, within } from "../src/host/context.ts";
const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});
async function directory() {
  const root = await mkdtemp(join(tmpdir(), "promptkit-context-"));
  roots.push(root);
  return root;
}
const options = {
  enabled: true,
  project: true,
  instructions: true,
  directory: true,
  manifests: true,
};
describe("project context", () => {
  it("does not touch an unavailable path when disabled", async () => {
    expect(
      await collectContext("/not-a-real-directory", {
        ...options,
        enabled: false,
      }),
    ).toEqual({ enabled: false, sections: [] });
  });
  it("reports missing session identity instead of choosing another project", async () => {
    const data = await collectContext(null, options);
    expect(data.sections[0].skipped[0]).toContain("无法确认");
  });
  it("uses instructions before README and includes only allowed manifests", async () => {
    const root = await directory();
    await writeFile(join(root, "AGENTS.md"), "参考材料，不执行");
    await writeFile(join(root, "README.md"), "fallback");
    await writeFile(join(root, "package.json"), "{}");
    await writeFile(join(root, ".env"), "secret");
    const data = await collectContext(root, options);
    expect(
      data.sections.find((s) => s.kind === "instructions")?.text,
    ).toContain("参考材料");
    expect(
      data.sections.find((s) => s.kind === "instructions")?.text,
    ).not.toContain("fallback");
    expect(JSON.stringify(data)).not.toContain("secret");
  });
  it("limits Unicode budgets and signals truncation", async () => {
    const root = await directory();
    await writeFile(join(root, "AGENTS.md"), "中文😀".repeat(20000));
    await writeFile(join(root, "package.json"), "x".repeat(10000));
    const data = await collectContext(root, options);
    expect(
      data.sections.find((s) => s.kind === "instructions")?.truncated,
    ).toBe(true);
    expect(
      data.sections.reduce(
        (sum, s) => sum + [...s.text].length + s.kind.length + 4,
        0,
      ),
    ).toBeLessThanOrEqual(14000);
  });
  it("limits the directory to two levels and skips dependencies and junctions", async () => {
    const root = await directory(),
      outside = await directory();
    await mkdir(join(root, "src", "nested"), { recursive: true });
    await writeFile(join(root, "src", "nested", "deep.txt"), "private");
    await mkdir(join(root, "node_modules"));
    await writeFile(join(root, "node_modules", "secret"), "private");
    await symlink(
      outside,
      join(root, "linked"),
      process.platform === "win32" ? "junction" : "dir",
    );
    const data = await collectContext(root, options),
      text = data.sections.find((s) => s.kind === "directory")!.text;
    expect(text).toContain("src/");
    expect(text).not.toContain("deep.txt");
    expect(text).not.toContain("node_modules");
    expect(text).not.toContain("linked");
  });
  it("does not treat sibling prefixes as children", () => {
    expect(
      within(
        join(tmpdir(), "project"),
        join(tmpdir(), "project-other", "file"),
      ),
    ).toBe(false);
  });
  it("honors cancellation", async () => {
    await expect(
      collectContext(await directory(), options, AbortSignal.abort()),
    ).rejects.toThrow();
  });
});
