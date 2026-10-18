import { useRef, useState } from "react";
import type {
  InputActions,
  InputState,
} from "@deepseek-ai/dsh-client-ui-conversation/client";
import type { Project } from "../shared/types.ts";
import type { Api } from "./api.ts";
import type { T } from "./locales.ts";
import {
  captureDraft,
  draftUnchanged,
  writeDraft,
  type DraftGuard,
} from "./draft.ts";
export interface ComposerInput {
  sessionId?: string;
  input?: InputState;
  inputActions?: InputActions;
}
export function useDraft(
  api: Api,
  t: T,
  { sessionId = "", input, inputActions }: ComposerInput,
  project?: Project | null,
  resume?: { guard?: DraftGuard; project?: Project | null },
) {
  const current = useRef({ sessionId, input });
  current.current = { sessionId, input };
  const [state, setGuard] = useState(
      () => resume?.guard || (input ? captureDraft(sessionId, input) : null),
    ),
    origin = useRef<Project | null | undefined>(
      resume && "project" in resume ? resume.project : project,
    );
  if (origin.current === undefined && project !== undefined)
    origin.current = project;
  const guard = state;
  const stale = !!guard && !!input && !draftUnchanged(guard, sessionId, input);
  async function reset(signal?: AbortSignal, allowEmpty = false) {
    const live = current.current;
    if (!live.input || (!allowEmpty && !live.input.draft.trim()))
      throw new Error(t("emptyDraft"));
    const next = captureDraft(live.sessionId, live.input);
    const project = await api.call<Project | null>(
      "project.read",
      { sessionId: live.sessionId },
      signal,
    );
    if (
      !current.current.input ||
      !draftUnchanged(next, current.current.sessionId, current.current.input)
    )
      throw new Error(t("stale"));
    origin.current = project;
    setGuard(next);
    return next;
  }
  async function useText(
    text: string,
    how: "copy" | "replace" | "append",
    override?: DraftGuard,
  ) {
    const guard = override ?? state;
    if (how === "copy") {
      await navigator.clipboard.writeText(text);
      return t("copied");
    }
    if (!guard || !inputActions || origin.current === undefined)
      throw new Error(t("writeFailed"));
    if (
      !(await api.call<boolean>("project.check", {
        sessionId: guard.sessionId,
        project: origin.current,
      }))
    )
      throw new Error(t("writeFailed"));
    if (
      !writeDraft(
        inputActions,
        () => current.current.input!,
        guard,
        current.current.sessionId,
        text,
        how,
      )
    )
      throw new Error(t("writeFailed"));
    return t(how === "replace" ? "replaced" : "appended");
  }
  return {
    guard,
    stale,
    reset,
    useText,
    original: () => current.current.input?.draft ?? "",
    current,
    origin,
  };
}
/** 替换后原样换回，供提示条「撤销」使用；输入框在替换后又被改过就放弃。 */
export function revertDraft(
  actions: InputActions | undefined,
  read: () => InputState | undefined,
  sessionId: string,
  original: string,
  revision: number,
) {
  const input = read();
  if (!actions || !input || actions.captureInsertion().draftRev !== revision)
    return false;
  return writeDraft(
    actions,
    () => read()!,
    captureDraft(sessionId, input),
    sessionId,
    original,
    "replace",
  );
}
