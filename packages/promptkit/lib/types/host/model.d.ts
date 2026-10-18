import type { Context } from "@deepseek-ai/cordis";
import type { Settings, GenerationRequest, GenerationResult, ContextReport, Preset } from "../shared/types.ts";
export declare function parseResult(raw: string, forceFinal: boolean): Pick<GenerationResult, "kind" | "text" | "questions">;
export declare function endpoint(base: string, path: string): string;
export declare function independentRequest(settings: Settings, key: string, system: string, user: string, signal: AbortSignal, send?: typeof fetch): Promise<{
    text: string;
    protocol: string;
}>;
export declare function generate(ctx: Context, settings: Settings, request: GenerationRequest, context: ContextReport, presets: Preset[], signal: AbortSignal, selection: {
    provider: string;
    model: string;
}): Promise<GenerationResult>;
