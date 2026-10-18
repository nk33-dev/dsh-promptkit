import { z } from "zod";
//#region src/shared/remote.ts
const json = z.lazy(() => z.union([
	z.null(),
	z.boolean(),
	z.number().finite(),
	z.string(),
	z.array(json),
	z.record(z.string(), json)
]));
const rpcRequestSchema = z.object({
	action: z.string().min(1).max(80),
	payload: json
}).strict();
const rpcResponseSchema = z.object({
	ok: z.boolean(),
	data: json,
	error: z.string()
}).strict();
const remoteContribution = {
	package: "@nk33-dev/dsh-promptkit",
	descriptors: [{
		id: "@nk33-dev/dsh-promptkit#promptkit/request",
		namespace: "promptkit",
		service: "promptkit",
		method: "request",
		invocation: { kind: "direct" },
		parameters: [{
			name: "request",
			wire: "request",
			source: "json",
			codec: {
				mode: "strict",
				typeSymbol: "PromptKitRequest",
				create: () => rpcRequestSchema
			}
		}],
		cancellation: { parameter: "signal" },
		result: {
			mode: "strict",
			typeSymbol: "PromptKitResponse",
			create: () => rpcResponseSchema
		}
	}]
};
//#endregion
export { remoteContribution, rpcRequestSchema, rpcResponseSchema };
