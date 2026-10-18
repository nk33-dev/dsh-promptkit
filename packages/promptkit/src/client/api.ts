import type { RpcRequest, RpcResponse, Json } from "../shared/types.ts";
import type { RemoteResult } from "@deepseek-ai/dsh-typert-protocol";
export interface RemoteNamespace {
  request(
    request: RpcRequest,
    signal?: AbortSignal,
  ): Promise<RemoteResult<RpcResponse>>;
}
export class Api {
  language: "zh" | "en" = "zh";
  private message(text: string) {
    const parts = text.split(" / ");
    return this.language === "en" ? parts.at(-1)! : parts[0];
  }
  private readonly controllers = new Set<AbortController>();
  private readonly configurationListeners = new Set<() => void>();
  private disposed = false;
  constructor(private readonly namespace: RemoteNamespace) {}
  async call<T = unknown>(
    action: string,
    payload: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    if (this.disposed) throw new Error("插件已停用 / Plugin disabled");
    const controller = new AbortController();
    this.controllers.add(controller);
    try {
      const response = await this.namespace.request(
        { action, payload: JSON.parse(JSON.stringify(payload)) as Json },
        signal
          ? AbortSignal.any([signal, controller.signal])
          : controller.signal,
      );
      if (!response.ok)
        throw new Error(
          this.message(
            response.error.message ||
              "宿主连接失败，请重试 / Host connection failed; retry",
          ),
        );
      if (!response.value.ok)
        throw new Error(this.message(response.value.error));
      if (action === "settings.save" || action === "presets.save")
        for (const listener of this.configurationListeners) listener();
      return response.value.data as T;
    } finally {
      this.controllers.delete(controller);
    }
  }
  onConfigurationChange(listener: () => void) {
    this.configurationListeners.add(listener);
    return () => {
      this.configurationListeners.delete(listener);
    };
  }
  dispose() {
    this.disposed = true;
    for (const controller of this.controllers) controller.abort();
    this.controllers.clear();
    this.configurationListeners.clear();
  }
}
