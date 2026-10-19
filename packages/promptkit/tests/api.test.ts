import { describe, expect, it, vi } from "vitest";
import { Api } from "../src/client/api.ts";
import { defaultSettings } from "../src/shared/defaults.ts";
describe("Gateway lifecycle", () => {
  it("keeps configuration available while the composer remounts after sending", async () => {
    const config = { settings: defaultSettings(), revision: 1, presets: [] };
    const api = new Api({ request: async () => ({ ok: true, value: { ok: true, data: config, error: "" } }) });
    await api.call("config.read", {});
    expect(api.configuration).toEqual(config);
  });
  it("notifies mounted consumers after successful configuration saves and removes listeners", async () => {
    const request = vi.fn(async () => ({
      ok: true as const,
      value: { ok: true, data: null, error: "" },
    }));
    const api = new Api({ request }),
      changed = vi.fn(),
      unsubscribe = api.onConfigurationChange(changed);
    await api.call("settings.save", {});
    expect(changed).toHaveBeenCalledTimes(1);
    unsubscribe();
    await api.call("presets.save", {});
    expect(changed).toHaveBeenCalledTimes(1);
    api.dispose();
  });
  it("aborts in-flight requests on plugin disposal and rejects later calls", async () => {
    let signal: AbortSignal | undefined;
    const request = vi.fn((_request, activeSignal?: AbortSignal) => {
      signal = activeSignal;
      return new Promise<any>((resolve) =>
        activeSignal?.addEventListener(
          "abort",
          () => resolve({ ok: false, error: { message: "cancelled" } }),
          { once: true },
        ),
      );
    });
    const api = new Api({ request }),
      pending = api.call("config.read", {});
    api.dispose();
    expect(signal?.aborted).toBe(true);
    await expect(pending).rejects.toThrow("cancelled");
    await expect(api.call("config.read", {})).rejects.toThrow(
      "Plugin disabled",
    );
  });
  it("propagates caller cancellation through the native Gateway", async () => {
    let signal: AbortSignal | undefined;
    const request = vi.fn(async (_request, s?: AbortSignal) => {
      signal = s;
      return { ok: true as const, value: { ok: true, data: null, error: "" } };
    });
    const api = new Api({ request }),
      controller = new AbortController();
    await api.call("generate", {}, controller.signal);
    controller.abort();
    expect(signal?.aborted).toBe(true);
  });
});
