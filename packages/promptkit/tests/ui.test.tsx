// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { App } from "../src/client/App.tsx";
import { Management } from "../src/client/Management.tsx";
import { useDraft } from "../src/client/useDraft.ts";
import { en } from "../src/client/locales.ts";
import { delegatedAnswer, deferredAnswer } from "../src/client/questionnaire.ts";
import { defaultSettings, DEFAULT_PRESETS } from "../src/shared/defaults.ts";
import type { Configuration, GenerationResult } from "../src/shared/types.ts";
import type {
  InputState,
  InputActions,
} from "@deepseek-ai/dsh-client-ui-conversation/client";
import type { Api } from "../src/client/api.ts";
beforeAll(() => {
  HTMLElement.prototype.showPopover = function () {
    this.dataset.open = "true";
    this.style.display = "block";
  };
  HTMLElement.prototype.hidePopover = function () {
    delete this.dataset.open;
    this.style.display = "none";
  };
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(cleanup);
const config: Configuration = {
  settings: defaultSettings(),
  presets: DEFAULT_PRESETS,
  revision: 0,
};
const saved = {
  id: "saved",
  title: "Saved review",
  body: "Review carefully",
  tags: ["review"],
  pinned: false,
  project: null,
  createdAt: 1,
  updatedAt: 1,
  lastUsedAt: 0,
};
const second = { ...saved, id: "second", title: "Second", tags: [] };
const input = {
  draft: "Build a prompt helper",
  draftRev: 1,
  attachmentIds: [],
  occurrences: [],
  phase: "plain",
  queue: [],
} as unknown as InputState;
const q = {
  id: "scope",
  title: "Scope",
  question: "How much?",
  options: [
    { label: "Core only", description: "Shorter" },
    { label: "Everything", description: "More work" },
  ],
  recommended: 0,
};
const questions: GenerationResult = {
  kind: "questions",
  questions: [q],
  text: "",
  context: { enabled: false, sections: [] },
  metadata: {
    mode: "grill",
    scenario: "general",
    model: "test",
    systemPrompt: "rule",
  },
  protocol: "host",
};
const final: GenerationResult = {
  ...questions,
  kind: "final",
  questions: [],
  text: "Clear task",
};
const t = (key: keyof typeof en) => en[key];
function setup(
  generate: () => Promise<GenerationResult> = async () => final,
  configuration = config,
  management = false,
  draft = input,
) {
  const call = vi.fn(
    async (
      action: string,
      payload?: any,
      _signal?: AbortSignal,
    ): Promise<unknown> => {
      if (action === "config.read") return structuredClone(configuration);
      if (action === "settings.read")
        return {
          ...structuredClone(configuration),
          credentialConfigured: false,
        };
      if (action === "generate") return generate();
      if (action === "project.read") return null;
      if (action === "favorites.list")
        return {
          items: [saved, second]
            .filter((v) => !payload?.tag || v.tags.includes(payload.tag))
            .map(({ body, ...v }) => ({ ...v, excerpt: body })),
          revision: 0,
          total: 2,
          project: null,
          tags: ["review"],
        };
      if (action === "favorites.get")
        return structuredClone(payload.id === "second" ? second : saved);
      if (action === "favorites.add")
        return { ...saved, id: "added", body: payload.body };
      if (action === "favorites.delete")
        return { favorite: structuredClone(saved), index: 0, revision: 1 };
      if (action === "models.list") return [];
      if (action === "credentials.list")
        return [
          { name: "NEW_API_KEY", configured: true },
          { name: "PROMPTKIT_API_KEY", configured: false },
        ];
      if (action === "models.efforts")
        return {
          efforts: [
            { id: "low", name: "Low" },
            { id: "high", name: "High" },
          ],
          default: "low",
        };
      return true;
    },
  );
  const listeners = new Set<() => void>();
  const props = {
    api: {
      call,
      onConfigurationChange: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    } as unknown as Api,
    t,
    sessionId: "test",
    input: draft,
    inputActions: {
      insertText: vi.fn(() => true),
      captureInsertion: () => ({ draftRev: 1, start: 0, end: 0 }),
      persistDraft: vi.fn(),
    } as unknown as InputActions,
  };
  return {
    call,
    generations: () => call.mock.calls.filter((v) => v[0] === "generate"),
    notifyConfiguration: () => listeners.forEach((listener) => listener()),
    props,
    ...render(
      management ? <Management api={props.api} t={t} /> : <App {...props} />,
    ),
  };
}
async function start(mode: "grill" | "rewrite" = "grill") {
  fireEvent.click(await screen.findByRole("button", { name: en.generate }));
  fireEvent.click(
    await screen.findByRole("menuitem", {
      name: new RegExp(en[mode === "grill" ? "grill" : "generate"]),
    }),
  );
}
const option = (name: RegExp) => screen.findByRole("radio", { name });
describe("entry", () => {
  it("opens the menu immediately without another request", async () => {
    const { call } = setup();
    const button = await screen.findByRole("button", { name: en.generate });
    expect(call.mock.calls.map((v) => v[0])).toEqual(["config.read"]);
    fireEvent.click(button);
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(call.mock.calls.map((v) => v[0])).toEqual(["config.read"]);
  });
  it("renders only enabled icons and updates after settings change", async () => {
    const { call, notifyConfiguration } = setup();
    await screen.findByRole("button", { name: en.library });
    call.mockResolvedValueOnce({
      ...config,
      settings: {
        ...config.settings,
        rewriteEnabled: false,
        grillEnabled: false,
      },
    });
    act(notifyConfiguration);
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: en.generate })).toBeNull(),
    );
    expect(screen.getByRole("button", { name: en.library })).toBeTruthy();
    call.mockResolvedValueOnce({
      ...config,
      settings: { ...config.settings, favoritesEnabled: false },
    });
    act(notifyConfiguration);
    await screen.findByRole("button", { name: en.generate });
    expect(screen.queryByRole("button", { name: en.library })).toBeNull();
  });
  it("starts directly when only one mode is enabled", async () => {
    const { generations } = setup(async () => final, {
      ...config,
      settings: { ...config.settings, grillEnabled: false },
    });
    fireEvent.click(await screen.findByRole("button", { name: en.generate }));
    await screen.findByLabelText(en.result);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(generations()).toHaveLength(1);
  });
  it("disables the entry on whitespace and enables it as the draft changes", async () => {
    const { generations, props, rerender } = setup(
      async () => questions,
      config,
      false,
      {
        ...input,
        draft: " \n ",
      } as InputState,
    );
    const trigger = (await screen.findByRole("button", {
      name: en.generate,
    })) as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    fireEvent.click(trigger);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(generations()).toHaveLength(0);
    expect(
      (screen.getByRole("button", { name: en.library }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    rerender(
      <App {...props} input={{ ...input, draft: "A library system" }} />,
    );
    expect(trigger.disabled).toBe(false);
    await start();
    await option(/Core only/);
    expect((generations()[0][1] as any).prompt).toBe("A library system");
  });
  it("supports vertical keyboard navigation in the mode menu", async () => {
    setup();
    fireEvent.click(await screen.findByRole("button", { name: en.generate }));
    const items = within(screen.getByRole("menu")).getAllByRole("menuitem");
    items[0].focus();
    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);
  });
});
describe("clarify needs", () => {
  it("puts the recommendation first and uses matching keyboard numbers", async () => {
    const { generations } = setup(async () => generations().length === 1 ? { ...questions, questions: [{ ...q, recommended: 1, basis: "Scope changes delivery." }] } : final);
    await start();
    await screen.findByText("Scope changes delivery.");
    expect(screen.getAllByRole("radio")[0].textContent).toContain("Everything");
    fireEvent.keyDown(document.body, { key: "1" });
    await screen.findByLabelText(en.result);
    expect((generations()[1][1] as any).history[0].answers[0].answer).toBe("Everything");
  });
  it("collects multiple choices before continuing", async () => {
    const { generations } = setup(async () => generations().length === 1 ? { ...questions, questions: [{ ...q, multiSelect: true }] } : final);
    await start();
    fireEvent.click(await screen.findByRole("checkbox", { name: /Core only/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Everything/ }));
    expect(generations()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: en.confirmChoices }));
    await screen.findByLabelText(en.result);
    expect(JSON.parse((generations()[1][1] as any).history[0].answers[0].answer)).toEqual(["Core only", "Everything"]);
  });
  it("delegates explicitly and keeps prior questions available after follow-up", async () => {
    const { generations } = setup(async () => generations().length === 1 ? questions : generations().length === 2 ? { ...questions, questions: [{ ...q, id: "rules", title: "Rules", question: "Any borrowing limit?" }] } : final);
    await start();
    fireEvent.click(await screen.findByRole("button", { name: en.delegate }));
    await screen.findByText("Any borrowing limit?");
    expect((generations()[1][1] as any).history[0].answers[0].answer).toBe(delegatedAnswer);
    fireEvent.click(screen.getByRole("button", { name: "1. Scope" }));
    expect(screen.getByRole("button", { name: en.delegate }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: en.direct }));
    await screen.findByLabelText(en.result);
    expect((generations()[2][1] as any).forceFinal).toBe(true);
  });
  it("advances after each choice and submits the round automatically", async () => {
    let count = 0;
    const { generations } = setup(async () =>
      ++count === 1
        ? {
            ...questions,
            questions: [
              { ...q, id: "__proto__" },
              { ...q, id: "constructor", question: "Which stack?" },
            ],
          }
        : final,
    );
    await start();
    expect((await option(/Core only/)).getAttribute("aria-checked")).toBe(
      "false",
    );
    fireEvent.click(await option(/Core only/));
    await screen.findByText("Which stack?");
    expect(screen.getByRole("button", { name: "1. Scope" }).getAttribute("data-answered")).toBe("true");
    fireEvent.click(await option(/Everything/));
    await screen.findByLabelText(en.result);
    const history = (generations()[1][1] as any).history;
    expect(history[0].answers.map((a: any) => a.answer)).toEqual([
      "Core only",
      "Everything",
    ]);
  });
  it("disables next on the last question and skips explicitly", async () => {
    const { generations } = setup(async () =>
      generations().length === 1 ? questions : final,
    );
    await start();
    await option(/Core only/);
    expect(
      (
        screen.getByRole("button", {
          name: en.nextQuestion,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: en.nextQuestion }));
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(generations()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: en.defer }));
    await screen.findByLabelText(en.result);
    expect((generations()[1][1] as any).history[0].answers[0].answer).toBe(
      deferredAnswer,
    );
  });
  it("turns Other into an inline input; Escape collapses and Enter answers", async () => {
    const { generations } = setup(async () =>
      generations().length === 1 ? questions : final,
    );
    await start();
    fireEvent.click(await option(new RegExp(en.other)));
    let field = screen.getByLabelText(en.other);
    fireEvent.keyDown(field, { key: "Escape" });
    expect(screen.queryByLabelText(en.other)).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(await option(new RegExp(en.other)));
    field = screen.getByLabelText(en.other);
    fireEvent.change(field, { target: { value: "Only search" } });
    fireEvent.keyDown(field, { key: "Enter" });
    await screen.findByLabelText(en.result);
    expect((generations()[1][1] as any).history[0].answers[0].answer).toBe(
      "Only search",
    );
  });
  it("picks options with number keys", async () => {
    const { generations } = setup(async () =>
      generations().length === 1 ? questions : final,
    );
    await start();
    await option(/Core only/);
    fireEvent.keyDown(document.body, { key: "2" });
    await screen.findByLabelText(en.result);
    expect((generations()[1][1] as any).history[0].answers[0].answer).toBe(
      "Everything",
    );
  });
  it("goes back without losing answers", async () => {
    setup(async () => ({
      ...questions,
      questions: [q, { ...q, id: "stack", question: "Which stack?" }],
    }));
    await start();
    fireEvent.click(await option(/Core only/));
    await screen.findByText("Which stack?");
    fireEvent.click(screen.getByRole("button", { name: en.previousQuestion }));
    expect((await option(/Core only/)).getAttribute("aria-checked")).toBe(
      "true",
    );
  });
  it("continues beyond three rounds and waits for the summary to be confirmed", async () => {
    let count = 0;
    const { generations } = setup(async () => {
      count++;
      if (count <= 5) return questions;
      if (count === 6)
        return { ...final, kind: "summary", text: "Java backend" };
      return final;
    });
    await start();
    for (let i = 0; i < 5; i++) {
      fireEvent.click(await option(/Core only/));
      await waitFor(() => expect(generations()).toHaveLength(i + 2));
    }
    await screen.findByText("Java backend");
    expect(screen.queryByLabelText(en.result)).toBeNull();
    expect(generations().every((v) => !(v[1] as any).forceFinal)).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: en.writePrompt }));
    await screen.findByLabelText(en.result);
    expect((generations().at(-1)![1] as any).forceFinal).toBe(true);
  });
  it("changes the last round's answers from the summary", async () => {
    let count = 0;
    const { generations } = setup(async () =>
      ++count === 1 ? questions : { ...final, kind: "summary" },
    );
    await start();
    fireEvent.click(await option(/Core only/));
    await screen.findByText("Clear task");
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(en.changeAnswers) }),
    );
    expect((await option(/Core only/)).getAttribute("aria-checked")).toBe(
      "true",
    );
    fireEvent.click(await option(/Everything/));
    await screen.findByText("Clear task");
    const history = (generations().at(-1)![1] as any).history;
    expect(history).toHaveLength(1);
    expect(history[0].answers[0].answer).toBe("Everything");
  });
  it("stops asking and writes when requested", async () => {
    const { generations } = setup(async () =>
      generations().length === 1 ? questions : final,
    );
    await start();
    await option(/Core only/);
    fireEvent.click(screen.getByRole("button", { name: en.direct }));
    await screen.findByLabelText(en.result);
    expect((generations()[1][1] as any).forceFinal).toBe(true);
  });
  it("keeps answers when a request fails and retries from the bottom bar", async () => {
    let requests = 0;
    const { generations } = setup(async () => {
      if (++requests === 1) return questions;
      if (requests === 2) throw Error("temporary failure");
      return final;
    });
    await start();
    fireEvent.click(await option(/Core only/));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("temporary failure");
    fireEvent.click(within(alert).getByRole("button", { name: en.retry }));
    await screen.findByLabelText(en.result);
    expect((generations().at(-1)![1] as any).history[0].answers[0].answer).toBe(
      "Core only",
    );
  });
});
describe("result", () => {
  it("applies successive edits, retains them on regenerate and reports unchanged output", async () => {
    let count = 0;
    const { generations } = setup(async () => ({
      ...final,
      text: ++count === 1 ? "Library" : "Library with CSV",
    }));
    await start("rewrite");
    const result = await screen.findByLabelText(en.result);
    fireEvent.change(result, { target: { value: "Personal library" } });
    const follow = screen.getByLabelText(en.revise);
    expect(
      (screen.getByRole("button", { name: en.improve }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.change(follow, { target: { value: "Add CSV" } });
    fireEvent.keyDown(follow, { key: "Enter", isComposing: true });
    expect(generations()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: en.improve }));
    await waitFor(() =>
      expect(
        (screen.getByLabelText(en.result) as HTMLTextAreaElement).value,
      ).toBe("Library with CSV"),
    );
    expect((generations()[1][1] as any).currentText).toBe("Personal library");
    fireEvent.click(screen.getByRole("button", { name: en.regenerate }));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toContain(en.unchangedResult);
    expect(
      (generations()[2][1] as any).messages.map((m: any) => m.text),
    ).toContain("Add CSV");
  });
  it("sends follow-up changes with the edited text", async () => {
    const { generations } = setup();
    await start("rewrite");
    fireEvent.change(await screen.findByLabelText(en.result), {
      target: { value: "Edited" },
    });
    const follow = screen.getByLabelText(en.revise);
    fireEvent.change(follow, { target: { value: "Add search" } });
    fireEvent.keyDown(follow, { key: "Enter" });
    await waitFor(() => expect(generations()).toHaveLength(2));
    const payload = generations()[1][1] as any;
    expect(payload.currentText).toBe("Edited");
    expect(payload.messages.at(-1).text).toBe("Add search");
  });
  it("replaces without confirmation and offers undo", async () => {
    const { props } = setup();
    await start("rewrite");
    await screen.findByLabelText(en.result);
    fireEvent.click(screen.getByRole("button", { name: en.replace }));
    const undo = await screen.findByRole("button", { name: en.undo });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(en.replaced)).toBeTruthy();
    const insert = props.inputActions.insertText as ReturnType<typeof vi.fn>;
    expect(insert.mock.calls.at(-1)![0]).toBe("Clear task");
    fireEvent.click(undo);
    expect(insert.mock.calls.at(-1)![0]).toBe(input.draft);
  });
  it("saves to prompts immediately and links to editing", async () => {
    const { call } = setup();
    await start("rewrite");
    await screen.findByLabelText(en.result);
    fireEvent.click(screen.getByRole("button", { name: en.savePrompt }));
    fireEvent.click(await screen.findByRole("button", { name: en.edit }));
    expect(
      ((await screen.findByLabelText(en.title)) as HTMLInputElement).value,
    ).toBe(saved.title);
    expect(
      call.mock.calls.find((v) => v[0] === "favorites.add")![1],
    ).toMatchObject({ body: "Clear task" });
  });
  it("locks on a newer draft with a visible restart instead of silently disabling", async () => {
    const { props, rerender, generations } = setup();
    await start("rewrite");
    await screen.findByLabelText(en.result);
    rerender(
      <App {...props} input={{ ...input, draftRev: 2, draft: "new draft" }} />,
    );
    expect(screen.getByText(en.stale)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: en.replace }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: en.append }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: en.restartWithDraft }));
    await waitFor(() => expect(generations()).toHaveLength(2));
    expect((generations()[1][1] as any).prompt).toBe("new draft");
  });
  it("ignores a generation result after the draft changes", async () => {
    let finish!: (v: GenerationResult) => void;
    const { props, rerender, generations } = setup(
      () => new Promise((r) => (finish = r)),
    );
    await start("rewrite");
    await waitFor(() => expect(generations()).toHaveLength(1));
    rerender(
      <App {...props} input={{ ...input, draftRev: 2, draft: "new draft" }} />,
    );
    await act(async () => finish(final));
    expect(screen.queryByLabelText(en.result)).toBeNull();
  });
  it("aborts on close and ignores late results", async () => {
    let finish!: (v: GenerationResult) => void;
    const { generations } = setup(() => new Promise((r) => (finish = r)));
    await start("rewrite");
    await waitFor(() => expect(generations()).toHaveLength(1));
    expect(screen.getByRole("status").textContent).toContain(en.rewriting);
    fireEvent.click(screen.getByRole("button", { name: en.close }));
    expect(generations()[0][2]?.aborted).toBe(true);
    await act(async () => finish(final));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("cancels the request without displaying a late result", async () => {
    let finish!: (v: GenerationResult) => void;
    const { generations } = setup(() => new Promise((r) => (finish = r)));
    await start("rewrite");
    await waitFor(() => expect(generations()).toHaveLength(1));
    fireEvent.click(screen.getByRole("button", { name: en.cancel }));
    await act(async () => finish(final));
    expect(screen.queryByLabelText(en.result)).toBeNull();
    expect(screen.getByRole("button", { name: en.restart })).toBeTruthy();
  });
  it("keeps progress per session and does not restart on reopen", async () => {
    const { props, rerender, generations } = setup();
    await start("rewrite");
    fireEvent.change(await screen.findByLabelText(en.result), {
      target: { value: "Edited prompt" },
    });
    rerender(<App {...props} sessionId="other" />);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    rerender(<App {...props} />);
    await start("rewrite");
    expect(
      ((await screen.findByLabelText(en.result)) as HTMLTextAreaElement).value,
    ).toBe("Edited prompt");
    expect(generations()).toHaveLength(1);
  });
});
describe("saved prompts", () => {
  async function openLibrary() {
    fireEvent.click(await screen.findByRole("button", { name: en.library }));
    return screen.findByRole("button", { name: /^Saved review/ });
  }
  it("appends on click, closes and touches the prompt", async () => {
    const { call, props } = setup();
    fireEvent.click(await openLibrary());
    await screen.findByText(en.appended);
    expect(screen.queryByRole("dialog")).toBeNull();
    const insert = props.inputActions.insertText as ReturnType<typeof vi.fn>;
    expect(insert.mock.calls.at(-1)![0]).toBe(`\n\n${saved.body}`);
    expect(call.mock.calls.some((v) => v[0] === "favorites.touch")).toBe(true);
  });
  it("filters by tag chip", async () => {
    const { call } = setup();
    await openLibrary();
    fireEvent.click(screen.getByRole("button", { name: "review" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Second/ })).toBeNull(),
    );
    expect(
      call.mock.calls.filter((v) => v[0] === "favorites.list").at(-1)![1],
    ).toMatchObject({ tag: "review", scope: "all", sort: "manual" });
  });
  it("deletes without confirmation and restores on undo", async () => {
    const { call } = setup();
    await openLibrary();
    const row = screen.getByRole("button", {
      name: /^Saved review/,
    }).parentElement!;
    fireEvent.click(within(row).getByRole("button", { name: en.delete }));
    fireEvent.click(await screen.findByRole("button", { name: en.undo }));
    await waitFor(() =>
      expect(call.mock.calls.some((v) => v[0] === "favorites.restore")).toBe(
        true,
      ),
    );
    expect(
      call.mock.calls.find((v) => v[0] === "favorites.restore")![1],
    ).toMatchObject({ index: 0, favorite: { id: "saved" } });
  });
  it("reorders with the keyboard on the drag handle", async () => {
    const { call } = setup();
    await openLibrary();
    fireEvent.keyDown(
      screen.getByRole("button", { name: `${en.drag}: Saved review` }),
      { key: "ArrowDown" },
    );
    await waitFor(() =>
      expect(
        call.mock.calls.find((v) => v[0] === "favorites.reorder")?.[1],
      ).toEqual({ ids: ["second", "saved"], revision: 0 }),
    );
  });
  it("keeps unsaved edits when the panel closes", async () => {
    setup();
    await openLibrary();
    const row = screen.getByRole("button", {
      name: /^Saved review/,
    }).parentElement!;
    fireEvent.click(within(row).getByRole("button", { name: en.edit }));
    fireEvent.change(await screen.findByLabelText(en.title), {
      target: { value: "My prompt" },
    });
    fireEvent.click(screen.getByRole("button", { name: en.close }));
    fireEvent.click(screen.getByRole("button", { name: en.library }));
    expect(
      ((await screen.findByLabelText(en.title)) as HTMLInputElement).value,
    ).toBe("My prompt");
  });
  it("saves the current draft directly", async () => {
    const { call } = setup();
    await openLibrary();
    fireEvent.click(screen.getByRole("button", { name: en.saveDraft }));
    await screen.findByText(en.savedPrompt);
    expect(
      call.mock.calls.find((v) => v[0] === "favorites.add")![1],
    ).toMatchObject({ body: input.draft, sessionId: "test" });
  });
  it("stays available with enhancement disabled", async () => {
    setup(async () => final, {
      ...config,
      settings: {
        ...config.settings,
        rewriteEnabled: false,
        grillEnabled: false,
      },
    });
    await openLibrary();
    expect(screen.queryByRole("button", { name: en.generate })).toBeNull();
  });
});
describe("management", () => {
  it("loads sections on demand without presets", async () => {
    const { call } = setup(async () => final, config, true);
    await screen.findByRole("switch", { name: en.rewriteEnabled });
    expect(screen.queryByRole("switch", { name: /Scenario/ })).toBeNull();
    expect(call.mock.calls.some((v) => v[0] === "favorites.list")).toBe(false);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    fireEvent.click(screen.getByRole("tab", { name: en.library }));
    await screen.findByRole("button", { name: /^Saved review/ });
    expect(screen.getByText(en.import)).toBeTruthy();
  });
  it("lets the host model reasoning level be chosen and saved", async () => {
    const { call } = setup(
      async () => final,
      {
        ...config,
        settings: {
          ...config.settings,
          provider: "new",
          model: "deepseek-flash",
        },
      },
      true,
    );
    const select = (await screen.findByLabelText(
      en.reasoningEffort,
    )) as HTMLSelectElement;
    await waitFor(() => expect(select.options.length).toBe(3));
    expect(select.value).toBe("");
    fireEvent.change(select, { target: { value: "high" } });
    fireEvent.click(screen.getByRole("button", { name: en.save }));
    await waitFor(() =>
      expect(
        (call.mock.calls.find((v) => v[0] === "settings.save")?.[1] as any)
          .settings.reasoningEffort,
      ).toBe("high"),
    );
  });
  it("offers existing credential names for reuse", async () => {
    setup(
      async () => final,
      {
        ...config,
        settings: { ...config.settings, connection: "independent" },
      },
      true,
    );
    const select = (await screen.findByLabelText(
      en.credentialRef,
    )) as HTMLSelectElement;
    await waitFor(() =>
      expect([...select.options].some((o) => o.value === "NEW_API_KEY")).toBe(
        true,
      ),
    );
    expect(
      [...select.options].find((o) => o.value === "NEW_API_KEY")?.textContent,
    ).toContain("✓");
    fireEvent.change(select, { target: { value: "NEW_API_KEY" } });
    expect(select.value).toBe("NEW_API_KEY");
    expect(screen.getByText(en.keyConfigured)).toBeTruthy();
    fireEvent.change(select, { target: { value: "__custom__" } });
    const input = (await screen.findByPlaceholderText(
      en.newCredentialRef,
    )) as HTMLInputElement;
    expect(input.value).toBe("NEW_API_KEY");
    fireEvent.change(input, { target: { value: "OTHER_API_KEY" } });
    expect(screen.getByText(en.keyMissing)).toBeTruthy();
  });
  it("defers the model catalog until the host connection is selected", async () => {
    const { call } = setup(
      async () => final,
      {
        ...config,
        settings: { ...config.settings, connection: "independent" },
      },
      true,
    );
    const connection = await screen.findByLabelText(en.connection);
    expect(call.mock.calls.some((v) => v[0] === "models.list")).toBe(false);
    fireEvent.change(connection, { target: { value: "host" } });
    await waitFor(() =>
      expect(
        call.mock.calls.filter((v) => v[0] === "models.list"),
      ).toHaveLength(1),
    );
  });
  it("keeps the original project guard when a refresh reports a different project", async () => {
    const oldProject = { hostId: "host", workingDirectory: "D:/Original" };
    const call = vi.fn(async () => false);
    const { result, rerender } = renderHook(
      ({ project }) =>
        useDraft(
          { call } as unknown as Api,
          t,
          { sessionId: "test", input, inputActions: {} as InputActions },
          project,
        ),
      { initialProps: { project: oldProject } },
    );
    rerender({ project: { ...oldProject, workingDirectory: "D:/Changed" } });
    await expect(result.current.useText("Text", "replace")).rejects.toThrow(
      en.writeFailed,
    );
    expect(call).toHaveBeenCalledWith("project.check", {
      sessionId: "test",
      project: oldProject,
    });
  });
});
