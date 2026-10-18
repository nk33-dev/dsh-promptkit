import { z } from "zod";
import type { TypertRemoteContribution } from "@deepseek-ai/dsh-typert-protocol";
import type { RpcRequest, RpcResponse } from "./types.ts";
export declare const rpcRequestSchema: z.ZodType<RpcRequest>;
export declare const rpcResponseSchema: z.ZodType<RpcResponse>;
export declare const remoteContribution: TypertRemoteContribution;
