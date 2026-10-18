import type {
  InputState,
  InputActions,
} from "@deepseek-ai/dsh-client-ui-conversation/client";
export interface DraftGuard {
  sessionId: string;
  draft: string;
  revision: number;
  attachmentIds: readonly string[];
  references: string;
}
export function captureDraft(sessionId: string, input: InputState): DraftGuard {
  return {
    sessionId,
    draft: input.draft,
    revision: input.draftRev,
    attachmentIds: [...input.attachmentIds],
    references: JSON.stringify(input.occurrences),
  };
}
export function draftUnchanged(
  guard: DraftGuard,
  sessionId: string,
  input: InputState,
): boolean {
  return (
    guard.sessionId === sessionId &&
    guard.draft === input.draft &&
    guard.revision === input.draftRev &&
    guard.references === JSON.stringify(input.occurrences) &&
    JSON.stringify(guard.attachmentIds) === JSON.stringify(input.attachmentIds)
  );
}
export function detectLength(input: InputState): number {
  return (
    input.draft.length -
    input.occurrences.reduce((sum, r) => sum + r.length - 1, 0) -
    (input.claim ? input.claim.token.length - 1 : 0)
  );
}
interface Edit {
  start: number;
  end: number;
  text: string;
}
export function replacementEdits(
  input: InputState,
  text: string,
): Edit[] | null {
  if (input.claim) return null;
  const refs = input.occurrences;
  const edits: Edit[] = [];
  let oldAt = 0,
    newAt = 0,
    offset = 0;
  for (const ref of refs) {
    const at = text.indexOf(ref.clipboardText, newAt);
    if (at < 0 || ref.invalid || !ref.clipboardText) return null;
    edits.push({
      start: oldAt - offset,
      end: ref.offset - offset,
      text: text.slice(newAt, at),
    });
    oldAt = ref.offset + ref.length;
    newAt = at + ref.clipboardText.length;
    offset += ref.length - 1;
  }
  edits.push({
    start: oldAt - offset,
    end: input.draft.length - offset,
    text: text.slice(newAt),
  });
  return edits.reverse();
}
export function writeDraft(
  actions: InputActions,
  read: () => InputState,
  guard: DraftGuard,
  sessionId: string,
  text: string,
  mode: "replace" | "append",
): boolean {
  const current = read();
  if (sessionId !== guard.sessionId || current.phase !== "plain") return false;
  if (mode === "append") {
    const at = detectLength(current);
    const ok = actions.insertText((current.draft ? "\n\n" : "") + text, {
      start: at,
      end: at,
      draftRev: current.draftRev,
    });
    if (ok) actions.persistDraft();
    return ok;
  }
  if (!draftUnchanged(guard, sessionId, current)) return false;
  const edits = replacementEdits(current, text);
  if (!edits) return false;
  // 从后向前修改纯文本区间，原生引用节点的身份和附件不变。
  for (const edit of edits) {
    const liveRevision = actions.captureInsertion().draftRev;
    if (
      !actions.insertText(edit.text, {
        start: edit.start,
        end: edit.end,
        draftRev: liveRevision,
      })
    )
      return false;
  }
  actions.persistDraft();
  return true;
}
