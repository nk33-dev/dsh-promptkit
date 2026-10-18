import type { ContextOptions, ContextReport } from "../shared/types.ts";
export declare function within(root: string, target: string): boolean;
export declare function collectContext(cwd: string | null, options: ContextOptions, signal?: AbortSignal): Promise<ContextReport>;
