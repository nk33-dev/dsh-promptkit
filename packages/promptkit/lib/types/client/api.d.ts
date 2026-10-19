import type { RpcRequest, RpcResponse, Configuration } from "../shared/types.ts";
import type { RemoteResult } from "@deepseek-ai/dsh-typert-protocol";
export interface RemoteNamespace {
    request(request: RpcRequest, signal?: AbortSignal): Promise<RemoteResult<RpcResponse>>;
}
export declare class Api {
    private readonly namespace;
    configuration: Configuration | null;
    language: "zh" | "en";
    private message;
    private readonly controllers;
    private readonly configurationListeners;
    private disposed;
    constructor(namespace: RemoteNamespace);
    call<T = unknown>(action: string, payload: unknown, signal?: AbortSignal): Promise<T>;
    onConfigurationChange(listener: () => void): () => void;
    dispose(): void;
}
