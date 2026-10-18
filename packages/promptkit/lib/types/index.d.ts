import type { Context } from "@deepseek-ai/cordis";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { PromptStore } from "./host/store.ts";
import type { RpcRequest, RpcResponse } from "./shared/types.ts";
export type { RpcRequest, RpcResponse, Json } from "./shared/types.ts";
export declare const name = "promptkit";
export declare const inject: string[];
declare module "@deepseek-ai/cordis" {
    interface Context {
        promptkit: PromptKitService;
    }
}
export declare class PromptKitService extends TypertRemoteService {
    private readonly store;
    static inject: string[];
    private readonly pending;
    constructor(ctx: Context, store: PromptStore);
    /** 分发插件请求；输入在各业务入口校验，错误不包含模型响应或请求正文。 */
    request(request: RpcRequest, signal: AbortSignal): Promise<RpcResponse>;
    private project;
    private dispatch;
}
export declare function apply(ctx: Context): Promise<void>;
