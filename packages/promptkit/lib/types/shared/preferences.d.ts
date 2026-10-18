import type { Settings } from "./types.ts";
export declare const promptDetails: {
    value: string;
    label: string;
    description: string;
    rule: string;
}[];
export declare const promptAudiences: {
    value: string;
    label: string;
    description: string;
    rule: string;
}[];
export declare const promptDetailLabelsEn: string[];
export declare const promptAudienceLabelsEn: string[];
export declare function questionLimit(detail: Settings["detail"]): number;
export declare function outputBudget(detail: Settings["detail"]): number;
export declare function generationGuidance(settings: Pick<Settings, "detail" | "audience">): string;
