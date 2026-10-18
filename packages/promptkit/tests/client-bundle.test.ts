import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// 测试真实构建配置和产物，避免测试环境的 node_modules 掩盖宿主缺失模块。
describe("Harness client bundle", () => {
  it("loads and activates with only host-provided modules", async () => {
    const { build } = await import("tsdown");
    const root = new URL("../", import.meta.url);
    const result = await build({
      config: fileURLToPath(new URL("tsdown.client.config.ts", root)),
      cwd: fileURLToPath(root),
      write: false,
    });
    const bundle = result[0].chunks.find(
      (chunk) => chunk.type === "chunk" && chunk.isEntry,
    );
    expect(bundle).toBeDefined();
    const { verifyClientBundle } = await import(
      "../../../scripts/verify-client.mjs"
    );
    const verified = await verifyClientBundle(bundle!.code);
    expect(verified.imports).not.toContain("lucide-react");
  });
  it("rejects a client that imports an unprovided package", async () => {
    const { verifyClientBundle } = await import(
      "../../../scripts/verify-client.mjs"
    );
    await expect(
      verifyClientBundle(`window.__ModuleLoader__.load({
      id:"@nk33-dev/dsh-promptkit",factory(require){require("lucide-react");}
    });`),
    ).rejects.toThrow("lucide-react");
  });
});
