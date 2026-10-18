import { describe, expect, it, vi } from "vitest";
import type {
  InputState,
  InputActions,
} from "@deepseek-ai/dsh-client-ui-conversation/client";
import {
  captureDraft,
  draftUnchanged,
  replacementEdits,
  writeDraft,
} from "../src/client/draft.ts";
function input(overrides: Partial<InputState> = {}): InputState {
  return {
    draft: "fix bug",
    draftRev: 1,
    attachmentIds: [],
    occurrences: [],
    phase: "plain",
    queue: [],
    ...overrides,
  } as InputState;
}
describe("guarded composer writes", () => {
  it("rejects later edits even when text was changed back", () => {
    const state = input(),
      guard = captureDraft("one", state);
    expect(draftUnchanged(guard, "one", input({ draftRev: 3 }))).toBe(false);
  });
  it("rejects a different session and attachment-only changes", () => {
    const state = input(),
      guard = captureDraft("one", state);
    expect(draftUnchanged(guard, "two", state)).toBe(false);
    expect(
      draftUnchanged(guard, "one", input({ attachmentIds: ["new" as never] })),
    ).toBe(false);
  });
  it("replaces pure text in an undoable native insertion and never sends", () => {
    const state = input(),
      insertText = vi.fn(() => true),
      submit = vi.fn(),
      persistDraft = vi.fn();
    expect(
      writeDraft(
        {
          insertText,
          persistDraft,
          submit,
          captureInsertion: () => ({ draftRev: 1, start: 0, end: 0 }),
        } as unknown as InputActions,
        () => state,
        captureDraft("one", state),
        "one",
        "better",
        "replace",
      ),
    ).toBe(true);
    expect(insertText).toHaveBeenCalledWith("better", {
      start: 0,
      end: 7,
      draftRev: 1,
    });
    expect(submit).not.toHaveBeenCalled();
    expect(persistDraft).toHaveBeenCalled();
  });
  it("plans edits around reference chips and rejects missing references", () => {
    const state = input({
      draft: "fix @file now",
      occurrences: [
        {
          occurrenceId: 1,
          source: "file",
          ref: "file",
          offset: 4,
          length: 5,
          label: "file",
          clipboardText: "@file",
        },
      ],
    });
    expect(replacementEdits(state, "review @file carefully")).toEqual([
      { start: 5, end: 9, text: " carefully" },
      { start: 0, end: 4, text: "review " },
    ]);
    expect(replacementEdits(state, "lost reference")).toBeNull();
  });
  it("appends to a revised draft without overwriting it", () => {
    const before = input(),
      current = input({ draft: "new draft", draftRev: 2 }),
      insertText = vi.fn(() => true);
    expect(
      writeDraft(
        { insertText, persistDraft: vi.fn() } as unknown as InputActions,
        () => current,
        captureDraft("one", before),
        "one",
        "result",
        "append",
      ),
    ).toBe(true);
    expect(insertText).toHaveBeenCalledWith("\n\nresult", {
      start: 9,
      end: 9,
      draftRev: 2,
    });
  });
  it("reads the live editor revision between reference-preserving edits", () => {
    const state = input({
      draft: "fix @file now",
      occurrences: [
        {
          occurrenceId: 1,
          source: "file",
          ref: "file",
          offset: 4,
          length: 5,
          label: "file",
          clipboardText: "@file",
        },
      ],
    });
    let revision = 1;
    const insertText = vi.fn((_text: string, span: { draftRev: number }) => {
      if (span.draftRev !== revision) return false;
      revision++;
      return true;
    });
    const actions = {
      insertText,
      persistDraft: vi.fn(),
      captureInsertion: () => ({ start: 0, end: 0, draftRev: revision }),
    } as unknown as InputActions;
    expect(
      writeDraft(
        actions,
        () => state,
        captureDraft("one", state),
        "one",
        "review @file carefully",
        "replace",
      ),
    ).toBe(true);
    expect(insertText.mock.calls.map((v) => v[1].draftRev)).toEqual([1, 2]);
  });
  it("refuses writes while the composer is submitting", () => {
    const state = input({ phase: "submitting" });
    expect(
      writeDraft(
        {} as InputActions,
        () => state,
        captureDraft("one", state),
        "one",
        "result",
        "append",
      ),
    ).toBe(false);
  });
});
