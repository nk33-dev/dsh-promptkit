import { z } from "zod";
import type {
  InvocationDescriptor,
  TypertRemoteContribution,
} from "@deepseek-ai/dsh-typert-protocol";
import type { Json, RpcRequest, RpcResponse } from "./types.ts";
const json: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number().finite(),
    z.string(),
    z.array(json),
    z.record(z.string(), json),
  ]),
);
export const rpcRequestSchema: z.ZodType<RpcRequest> = z
  .object({ action: z.string().min(1).max(80), payload: json })
  .strict();
export const rpcResponseSchema: z.ZodType<RpcResponse> = z
  .object({ ok: z.boolean(), data: json, error: z.string() })
  .strict();
// Host 和 Client 共用边界 schema，通过宿主 Gateway 校验及取消请求。
const request: InvocationDescriptor = {
  id: "@nk33-dev/dsh-promptkit#promptkit/request",
  namespace: "promptkit",
  service: "promptkit",
  method: "request",
  invocation: { kind: "direct" },
  parameters: [
    {
      name: "request",
      wire: "request",
      source: "json",
      codec: {
        mode: "strict",
        typeSymbol: "PromptKitRequest",
        create: () => rpcRequestSchema,
      },
    },
  ],
  cancellation: { parameter: "signal" },
  result: {
    mode: "strict",
    typeSymbol: "PromptKitResponse",
    create: () => rpcResponseSchema,
  },
};
export const remoteContribution: TypertRemoteContribution = {
  package: "@nk33-dev/dsh-promptkit",
  descriptors: [request],
};
