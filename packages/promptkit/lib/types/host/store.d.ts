import type { Domain, DomainFacility } from "@deepseek-ai/dsh-storage-domain";
import { z } from "zod";
import type { Favorite, Feedback, Library, Project, Settings } from "../shared/types.ts";
export { normalizeProject, sameProject } from "../shared/project.ts";
declare const spec: {
    name: string;
    version: number;
    global: {
        schema: z.ZodObject<{
            hostId: z.ZodDefault<z.ZodString>;
            settings: z.ZodObject<{
                rewriteEnabled: z.ZodBoolean;
                grillEnabled: z.ZodBoolean;
                favoritesEnabled: z.ZodBoolean;
                presetsEnabled: z.ZodBoolean;
                feedbackEnabled: z.ZodBoolean;
                defaultMode: z.ZodEnum<{
                    rewrite: "rewrite";
                    grill: "grill";
                }>;
                detail: z.ZodDefault<z.ZodEnum<{
                    concise: "concise";
                    standard: "standard";
                    detailed: "detailed";
                }>>;
                audience: z.ZodDefault<z.ZodEnum<{
                    nontechnical: "nontechnical";
                    p4: "p4";
                    p5: "p5";
                    p6: "p6";
                    p7: "p7";
                    p8: "p8";
                    p9: "p9";
                    p10: "p10";
                }>>;
                systemPrompt: z.ZodString;
                grillSystemPrompt: z.ZodString;
                context: z.ZodObject<{
                    enabled: z.ZodBoolean;
                    project: z.ZodBoolean;
                    instructions: z.ZodBoolean;
                    directory: z.ZodBoolean;
                    manifests: z.ZodBoolean;
                }, z.core.$strict>;
                connection: z.ZodEnum<{
                    host: "host";
                    independent: "independent";
                }>;
                baseUrl: z.ZodString;
                model: z.ZodString;
                provider: z.ZodString;
                protocol: z.ZodEnum<{
                    chat_completions: "chat_completions";
                    responses: "responses";
                    anthropic_messages: "anthropic_messages";
                    auto: "auto";
                }>;
                credentialRef: z.ZodString;
                reasoningEffort: z.ZodDefault<z.ZodString>;
                timeoutSeconds: z.ZodNumber;
            }, z.core.$strict>;
            library: z.ZodObject<{
                revision: z.ZodNumber;
                manualOrder: z.ZodOptional<z.ZodBoolean>;
                favorites: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    title: z.ZodString;
                    body: z.ZodString;
                    tags: z.ZodArray<z.ZodString>;
                    pinned: z.ZodBoolean;
                    project: z.ZodNullable<z.ZodObject<{
                        hostId: z.ZodString;
                        workingDirectory: z.ZodString;
                    }, z.core.$strict>>;
                    createdAt: z.ZodNumber;
                    updatedAt: z.ZodNumber;
                    lastUsedAt: z.ZodNumber;
                }, z.core.$strict>>;
                presets: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    title: z.ZodString;
                    rule: z.ZodString;
                }, z.core.$strict>>;
            }, z.core.$strict>;
        }, z.core.$strict>;
        initial: {
            hostId: `${string}-${string}-${string}-${string}-${string}`;
            settings: Settings;
            library: {
                revision: number;
                manualOrder: boolean;
                favorites: never[];
                presets: import("../shared/types.ts").Preset[];
            };
        };
    };
    tables: {
        feedback: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, Feedback>;
    };
};
type DataDomain = Domain<typeof spec>;
export declare function prepareImport(raw: string, current: Library): {
    added: Favorite[];
    duplicates: number;
};
export declare class PromptStore {
    private readonly domain;
    private chain;
    private closed;
    constructor(domain: DataDomain);
    static open(facility: DomainFacility): Promise<PromptStore>;
    get value(): {
        hostId: string;
        settings: Settings;
        library: Library;
    };
    get configuration(): {
        settings: {
            rewriteEnabled: boolean;
            grillEnabled: boolean;
            favoritesEnabled: boolean;
            presetsEnabled: boolean;
            feedbackEnabled: boolean;
            defaultMode: "rewrite" | "grill";
            detail: "concise" | "standard" | "detailed";
            audience: "nontechnical" | "p4" | "p5" | "p6" | "p7" | "p8" | "p9" | "p10";
            systemPrompt: string;
            grillSystemPrompt: string;
            context: {
                enabled: boolean;
                project: boolean;
                instructions: boolean;
                directory: boolean;
                manifests: boolean;
            };
            connection: "host" | "independent";
            baseUrl: string;
            model: string;
            provider: string;
            protocol: "chat_completions" | "responses" | "anthropic_messages" | "auto";
            credentialRef: string;
            reasoningEffort: string;
            timeoutSeconds: number;
        };
        presets: {
            id: string;
            title: string;
            rule: string;
        }[];
        revision: number;
    };
    get hostId(): string;
    listFavorites(project: Project | null, query: string, scope: string, sort: string, limit: number, tag?: string): {
        revision: number;
        total: number;
        project: Project | null;
        tags: string[];
        items: {
            excerpt: string;
            id: string;
            title: string;
            tags: string[];
            pinned: boolean;
            project: {
                hostId: string;
                workingDirectory: string;
            } | null;
            createdAt: number;
            updatedAt: number;
            lastUsedAt: number;
        }[];
    };
    favorite(id: string): {
        id: string;
        title: string;
        body: string;
        tags: string[];
        pinned: boolean;
        project: {
            hostId: string;
            workingDirectory: string;
        } | null;
        createdAt: number;
        updatedAt: number;
        lastUsedAt: number;
    };
    private write;
    saveSettings(value: unknown): Promise<{
        rewriteEnabled: boolean;
        grillEnabled: boolean;
        favoritesEnabled: boolean;
        presetsEnabled: boolean;
        feedbackEnabled: boolean;
        defaultMode: "rewrite" | "grill";
        detail: "concise" | "standard" | "detailed";
        audience: "nontechnical" | "p4" | "p5" | "p6" | "p7" | "p8" | "p9" | "p10";
        systemPrompt: string;
        grillSystemPrompt: string;
        context: {
            enabled: boolean;
            project: boolean;
            instructions: boolean;
            directory: boolean;
            manifests: boolean;
        };
        connection: "host" | "independent";
        baseUrl: string;
        model: string;
        provider: string;
        protocol: "chat_completions" | "responses" | "anthropic_messages" | "auto";
        credentialRef: string;
        reasoningEffort: string;
        timeoutSeconds: number;
    }>;
    saveFavorite(value: unknown, expectedRevision: number): Promise<{
        id: string;
        title: string;
        body: string;
        tags: string[];
        pinned: boolean;
        project: {
            hostId: string;
            workingDirectory: string;
        } | null;
        createdAt: number;
        updatedAt: number;
        lastUsedAt: number;
    }>;
    deleteFavorite(id: string, revision: number): Promise<{
        favorite: Favorite;
        index: number;
        revision: number;
    }>;
    addFavorite(title: string, body: string, project: Project | null): Promise<{
        id: string;
        title: string;
        body: string;
        tags: string[];
        pinned: boolean;
        project: {
            hostId: string;
            workingDirectory: string;
        } | null;
        createdAt: number;
        updatedAt: number;
        lastUsedAt: number;
    }>;
    restoreFavorite(value: unknown, index: number): Promise<{
        id: string;
        title: string;
        body: string;
        tags: string[];
        pinned: boolean;
        project: {
            hostId: string;
            workingDirectory: string;
        } | null;
        createdAt: number;
        updatedAt: number;
        lastUsedAt: number;
    }>;
    reorderFavorites(ids: string[], revision: number): Promise<number>;
    touchFavorite(id: string): Promise<boolean>;
    savePreset(value: unknown, revision: number): Promise<{
        id: string;
        title: string;
        rule: string;
    }>;
    import(raw: string, revision: number, commit: boolean): Promise<{
        added: number;
        duplicates: number;
        revision: number;
    }>;
    export(): string;
    feedback(): Feedback[];
    addFeedback(value: unknown): Promise<{
        id: string;
        original: string;
        generated: string;
        edited: string;
        history: {
            questions: {
                id: string;
                title: string;
                question: string;
                options: {
                    label: string;
                    description: string;
                }[];
                recommended: number | null;
                basis?: string | undefined;
                multiSelect?: boolean | undefined;
            }[];
            answers: {
                questionId: string;
                answer: string;
            }[];
        }[];
        metadata: {
            mode: "rewrite" | "grill";
            scenario: string;
            model: string;
            systemPrompt: string;
        };
        rating: "useful" | "improve";
        note: string;
        createdAt: number;
    }>;
    deleteFeedback(id: string): Promise<boolean>;
    private revision;
    close(): Promise<void>;
}
