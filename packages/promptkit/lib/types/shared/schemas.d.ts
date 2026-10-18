import { z } from "zod";
export declare const projectSchema: z.ZodObject<{
    hostId: z.ZodString;
    workingDirectory: z.ZodString;
}, z.core.$strict>;
export declare const questionSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    question: z.ZodString;
    options: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        description: z.ZodString;
    }, z.core.$strict>>;
    recommended: z.ZodNumber;
}, z.core.$strict>;
export declare const roundSchema: z.ZodObject<{
    questions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        question: z.ZodString;
        options: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            description: z.ZodString;
        }, z.core.$strict>>;
        recommended: z.ZodNumber;
    }, z.core.$strict>>;
    answers: z.ZodArray<z.ZodObject<{
        questionId: z.ZodString;
        answer: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const settingsSchema: z.ZodObject<{
    rewriteEnabled: z.ZodBoolean;
    grillEnabled: z.ZodBoolean;
    favoritesEnabled: z.ZodBoolean;
    presetsEnabled: z.ZodBoolean;
    feedbackEnabled: z.ZodBoolean;
    defaultMode: z.ZodEnum<{
        rewrite: "rewrite";
        grill: "grill";
    }>;
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
export declare const favoriteSchema: z.ZodObject<{
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
}, z.core.$strict>;
export declare const presetSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    rule: z.ZodString;
}, z.core.$strict>;
export declare const librarySchema: z.ZodObject<{
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
export declare const feedbackSchema: z.ZodObject<{
    id: z.ZodString;
    original: z.ZodString;
    generated: z.ZodString;
    edited: z.ZodString;
    history: z.ZodArray<z.ZodObject<{
        questions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            question: z.ZodString;
            options: z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                description: z.ZodString;
            }, z.core.$strict>>;
            recommended: z.ZodNumber;
        }, z.core.$strict>>;
        answers: z.ZodArray<z.ZodObject<{
            questionId: z.ZodString;
            answer: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    metadata: z.ZodObject<{
        mode: z.ZodEnum<{
            rewrite: "rewrite";
            grill: "grill";
        }>;
        scenario: z.ZodString;
        model: z.ZodString;
        systemPrompt: z.ZodString;
    }, z.core.$strict>;
    rating: z.ZodEnum<{
        useful: "useful";
        improve: "improve";
    }>;
    note: z.ZodString;
    createdAt: z.ZodNumber;
}, z.core.$strict>;
export declare const generationSchema: z.ZodObject<{
    sessionId: z.ZodString;
    prompt: z.ZodString;
    mode: z.ZodEnum<{
        rewrite: "rewrite";
        grill: "grill";
    }>;
    scenario: z.ZodString;
    history: z.ZodArray<z.ZodObject<{
        questions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            question: z.ZodString;
            options: z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                description: z.ZodString;
            }, z.core.$strict>>;
            recommended: z.ZodNumber;
        }, z.core.$strict>>;
        answers: z.ZodArray<z.ZodObject<{
            questionId: z.ZodString;
            answer: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    forceFinal: z.ZodBoolean;
    messages: z.ZodDefault<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
        }>;
        text: z.ZodString;
    }, z.core.$strict>>>;
    currentText: z.ZodDefault<z.ZodString>;
}, z.core.$strict>;
export declare const storedSettingsSchema: z.ZodDefault<z.ZodObject<{
    rewriteEnabled: z.ZodBoolean;
    grillEnabled: z.ZodBoolean;
    favoritesEnabled: z.ZodBoolean;
    presetsEnabled: z.ZodBoolean;
    feedbackEnabled: z.ZodBoolean;
    defaultMode: z.ZodEnum<{
        rewrite: "rewrite";
        grill: "grill";
    }>;
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
}, z.core.$strict>>;
