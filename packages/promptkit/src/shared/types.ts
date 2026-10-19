export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };
export interface RpcRequest {
  action: string;
  payload: Json;
}
export interface RpcResponse {
  ok: boolean;
  data: Json;
  error: string;
}
export type Mode = "rewrite" | "grill";
export type Protocol =
  | "chat_completions"
  | "responses"
  | "anthropic_messages"
  | "auto";
export interface ContextOptions {
  enabled: boolean;
  project: boolean;
  instructions: boolean;
  directory: boolean;
  manifests: boolean;
}
export interface Settings {
  rewriteEnabled: boolean;
  grillEnabled: boolean;
  favoritesEnabled: boolean;
  presetsEnabled: boolean;
  feedbackEnabled: boolean;
  defaultMode: Mode;
  detail: "concise" | "standard" | "detailed";
  audience: "nontechnical" | "p4" | "p5" | "p6" | "p7" | "p8" | "p9" | "p10";
  systemPrompt: string;
  grillSystemPrompt: string;
  context: ContextOptions;
  connection: "host" | "independent";
  baseUrl: string;
  model: string;
  provider: string;
  protocol: Protocol;
  credentialRef: string;
  /** 留空表示自动（模型声明的最低档）。 */
  reasoningEffort: string;
  timeoutSeconds: number;
}
export interface Project {
  hostId: string;
  workingDirectory: string;
}
export interface Favorite {
  id: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  project: Project | null;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number;
}
export interface Preset {
  id: string;
  title: string;
  rule: string;
}
export interface Question {
  id: string;
  title: string;
  question: string;
  basis?: string;
  multiSelect?: boolean;
  options: { label: string; description: string }[];
  recommended: number | null;
}
export interface Round {
  questions: Question[];
  answers: { questionId: string; answer: string }[];
}
export interface ContextSection {
  kind: string;
  text: string;
  files: string[];
  truncated: boolean;
  skipped: string[];
}
export interface ContextReport {
  enabled: boolean;
  sections: ContextSection[];
}
export interface GenerationRequest {
  sessionId: string;
  prompt: string;
  mode: Mode;
  detail?: Settings["detail"];
  scenario: string;
  history: Round[];
  forceFinal: boolean;
  messages?: { role: "user" | "assistant"; text: string }[];
  currentText?: string;
}
export interface GenerationMetadata {
  mode: Mode;
  scenario: string;
  model: string;
  systemPrompt: string;
}
export interface GenerationResult {
  kind: "questions" | "summary" | "final";
  questions: Question[];
  text: string;
  context: ContextReport;
  metadata: GenerationMetadata;
  protocol: string;
}
export interface Feedback {
  id: string;
  original: string;
  generated: string;
  edited: string;
  history: Round[];
  metadata: GenerationMetadata;
  rating: "useful" | "improve";
  note: string;
  createdAt: number;
}
export interface Library {
  revision: number;
  /** 收藏数组顺序即用户手动排的顺序；旧数据按置顶和最近使用迁移一次。 */
  manualOrder?: boolean;
  favorites: Favorite[];
  presets: Preset[];
}
export interface Configuration {
  settings: Settings;
  presets: Preset[];
  revision: number;
}
export interface CredentialOption {
  name: string;
  configured: boolean;
}
export interface EffortOption {
  id: string;
  name: string;
}
export interface EffortList {
  efforts: EffortOption[];
  default: string;
}
export interface ModelOption {
  provider: string;
  model: string;
  label: string;
}
export interface SettingsData extends Configuration {
  credentialConfigured: boolean;
}
export interface FavoriteSummary extends Omit<Favorite, "body"> {
  excerpt: string;
}
export interface FavoriteList {
  items: FavoriteSummary[];
  revision: number;
  total: number;
  project: Project | null;
  tags: string[];
}
