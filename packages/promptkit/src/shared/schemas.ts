import { z } from "zod";
import { defaultSettings } from "./defaults.ts";
const text = (max: number) =>
  z.string().refine((v) => [...v].length <= max, "内容过长 / Text is too long");
export const projectSchema = z
  .object({
    hostId: z.string().min(1).max(256),
    workingDirectory: z.string().min(1).max(4096),
  })
  .strict();
export const questionSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: text(80).refine((value) => !!value.trim()),
    question: text(1200).refine((value) => !!value.trim()),
    basis: text(600).optional(),
    multiSelect: z.boolean().optional(),
    options: z
      .array(
        z
          .object({
            label: text(160).refine((value) => !!value.trim()),
            description: text(600).default(""),
          })
          .strip(),
      )
      .min(2)
      .max(6),
    recommended: z.number().int().min(0).max(5).nullable().default(null),
  })
  .strip()
  .refine((q) => q.recommended === null || q.recommended < q.options.length);
export const roundSchema = z
  .object({
    questions: z.array(questionSchema).min(1).max(128),
    answers: z
      .array(
        z
          .object({ questionId: z.string().max(80), answer: text(3000) })
          .strict(),
      )
      .max(128),
  })
  .strict()
  .refine(
    (r) =>
      new Set(r.questions.map((q) => q.id)).size === r.questions.length &&
      new Set(r.answers.map((a) => a.questionId)).size === r.answers.length &&
      r.answers.every((a) => r.questions.some((q) => q.id === a.questionId)),
  );
export const settingsSchema = z
  .object({
    rewriteEnabled: z.boolean(),
    grillEnabled: z.boolean(),
    favoritesEnabled: z.boolean(),
    presetsEnabled: z.boolean(),
    feedbackEnabled: z.boolean(),
    defaultMode: z.enum(["rewrite", "grill"]),
    detail: z.enum(["concise", "standard", "detailed"]).default("standard"),
    audience: z.enum(["nontechnical", "p4", "p5", "p6", "p7", "p8", "p9", "p10"]).default("p4"),
    systemPrompt: text(50000),
    grillSystemPrompt: text(50000),
    context: z
      .object({
        enabled: z.boolean(),
        project: z.boolean(),
        instructions: z.boolean(),
        directory: z.boolean(),
        manifests: z.boolean(),
      })
      .strict(),
    connection: z.enum(["host", "independent"]),
    baseUrl: z
      .string()
      .max(4096)
      .refine((v) => !v || /^https?:\/\//.test(v)),
    model: z.string().max(512),
    provider: z.string().max(256),
    protocol: z.enum([
      "chat_completions",
      "responses",
      "anthropic_messages",
      "auto",
    ]),
    credentialRef: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
    reasoningEffort: z.string().max(64).default(""),
    timeoutSeconds: z.number().int().min(5).max(300),
  })
  .strict();
export const favoriteSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: text(200).refine((v) => !!v.trim()),
    body: text(20000).refine((v) => !!v.trim()),
    tags: z.array(text(64)).max(20),
    pinned: z.boolean(),
    project: projectSchema.nullable(),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative(),
    lastUsedAt: z.number().int().nonnegative(),
  })
  .strict();
export const presetSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9_-]{0,63}$/),
    title: text(200).refine((v) => !!v.trim()),
    rule: text(50000),
  })
  .strict();
export const librarySchema = z
  .object({
    revision: z.number().int().nonnegative(),
    manualOrder: z.boolean().optional(),
    favorites: z.array(favoriteSchema).max(5000),
    presets: z.array(presetSchema).max(100),
  })
  .strict();
export const feedbackSchema = z
  .object({
    id: z.string().min(1).max(80),
    original: text(20000).refine((v) => !!v.trim()),
    generated: text(100000).refine((v) => !!v.trim()),
    edited: text(100000).refine((v) => !!v.trim()),
    history: z.array(roundSchema),
    metadata: z
      .object({
        mode: z.enum(["rewrite", "grill"]),
        scenario: z.string().max(64),
        model: z.string().max(512),
        systemPrompt: text(100000),
      })
      .strict(),
    rating: z.enum(["useful", "improve"]),
    note: text(3000),
    createdAt: z.number().int().nonnegative(),
  })
  .strict();
export const generationSchema = z
  .object({
    sessionId: z.string().min(1).max(256),
    prompt: text(20000).refine(
      (v) => !!v.trim(),
      "输入框为空 / Draft is empty",
    ),
    mode: z.enum(["rewrite", "grill"]),
    scenario: z.string().max(64),
    history: z.array(roundSchema),
    forceFinal: z.boolean(),
    messages: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            text: text(40000),
          })
          .strict(),
      )
      .default([]),
    currentText: text(100000).default(""),
  })
  .strict()
  .refine(
    (v) =>
      new TextEncoder().encode(JSON.stringify([v.history, v.messages]))
        .length <= 120000,
    "追问记录过长 / Question history is too long",
  );
export const storedSettingsSchema = settingsSchema.default(defaultSettings());
