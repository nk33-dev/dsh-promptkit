import React, { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCw,
} from "lucide-react";
import type {
  Configuration,
  GenerationResult,
  Mode,
  Question,
  Round,
} from "../shared/types.ts";
import type { Api } from "./api.ts";
import { format, type T } from "./locales.ts";
import { useDraft, type ComposerInput } from "./useDraft.ts";
import { draftUnchanged, replacementEdits } from "./draft.ts";
import { workflow } from "./workflow.ts";
import { answerValues, deferredAnswer, delegatedAnswer, mergeQuestionnaire } from "./questionnaire.ts";
import {
  Button,
  CardHeader,
  ErrorBar,
  IconButton,
  Loading,
  useTask,
  type ToastMessage,
} from "./ui.tsx";

interface Run {
  start?: boolean;
  forceFinal?: boolean;
  /** 指定后从这些轮次重来，丢弃追加的对话。 */
  rounds?: Round[];
  addition?: string;
  supplementOnly?: boolean;
  answers?: Record<string, string>;
  intro?: string;
}
/** 写回输入框之后：关闭卡片并提示，替换可撤销。 */
export type WriteBack = (
  how: "replace" | "append",
  before: string,
  revision: number,
) => void;

export function Enhance({
  api,
  t,
  config,
  mode,
  notify,
  onClose,
  onWrite,
  onEditFavorite,
  ...composer
}: ComposerInput & {
  api: Api;
  t: T;
  config: Configuration;
  mode: Mode;
  notify: (text: string, action?: ToastMessage["action"]) => void;
  onClose: () => void;
  onWrite: WriteBack;
  onEditFavorite: (id: string) => void;
}) {
  const saved = useRef(workflow(api, composer.sessionId || "", `${mode}:${config.settings.detail}:${config.settings.audience}`)).current;
  const root = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState(saved.result),
    [edited, setEdited] = useState(saved.edited),
    [history, setHistory] = useState(saved.history),
    [answers, setAnswers] = useState(saved.answers),
    [questionIndex, setQuestionIndex] = useState(saved.questionIndex),
    [intro, setIntro] = useState(saved.intro),
    [messages, setMessages] = useState(saved.messages),
    [supplement, setSupplement] = useState(saved.supplement),
    [busy, setBusy] = useState<string | null>(null),
    [other, setOther] = useState<string | null>(null);
  const [extra, setExtra] = useState<"option" | "question" | null>(null),
    [extraText, setExtraText] = useState("");
  const task = useTask(),
    writer = useDraft(api, t, composer, undefined, saved);
  const request = useRef<AbortController | null>(null),
    generation = useRef(0),
    restarting = useRef(false),
    last = useRef<() => void>(() => {});
  const title = t(mode === "grill" ? "grill" : "generate");
  const selected =
    result?.kind === "questions" ? result.questions[questionIndex] : undefined;
  const answerFor = (id: string) =>
    Object.hasOwn(answers, id) ? answers[id] : "";
  const locked = writer.stale;
  useEffect(() => {
    Object.assign(saved, {
      result,
      edited,
      history,
      answers,
      questionIndex,
      intro,
      messages,
      supplement,
      guard: writer.guard || undefined,
      project: writer.origin.current,
    });
  });
  function cancel() {
    generation.current++;
    request.current?.abort();
    request.current = null;
    setBusy(null);
  }
  useEffect(() => {
    if (!saved.started) void generate({ start: true });
    return () => {
      generation.current++;
      request.current?.abort();
    };
  }, []);
  // 生成途中输入框被改：作废这次请求。按新内容重来时锁定还没解除，不能把它也取消掉。
  useEffect(() => {
    if (locked && busy && !restarting.current) cancel();
  }, [locked, busy]);
  useEffect(() => {
    if (!selected || busy || locked) return;
    const card = root.current?.closest<HTMLElement>(".pk-card");
    const active = document.activeElement;
    if (card && (!active || active === document.body || active.closest(".pk-tools") && !card.contains(active))) {
      card.tabIndex = -1;
      card.focus({ preventScroll: true });
    }
  }, [selected, busy, locked]);
  function busyText({ start, forceFinal, addition }: Run) {
    if (mode === "rewrite")
      return t(!start && addition ? "revising" : "rewriting");
    if (forceFinal) return t(result?.kind === "final" ? "revising" : "writing");
    return t("thinkingQuestions");
  }

  async function generate(run: Run = {}) {
    if (request.current && !request.current.signal.aborted && !run.start)
      return;
    const { start = false, forceFinal = false, supplementOnly = false } = run;
    if (!start && locked) return;
    const addition = run.addition ?? "";
    const current = run.answers ?? answers;
    let rounds = start ? [] : (run.rounds ?? history);
    if (!start && run.rounds === undefined && result?.kind === "questions") {
      const confirmed = result.questions
        .filter((q) => (Object.hasOwn(current, q.id) ? current[q.id] : "").trim())
        .map((q) => ({ questionId: q.id, answer: current[q.id].trim() }));
      if (!supplementOnly || confirmed.length)
        rounds = [{ questions: result.questions, answers: confirmed }];
    }
    const nextMessages =
      start || run.rounds
        ? []
        : [
            ...messages,
            ...(supplementOnly && selected
              ? [
                  {
                    role: "assistant" as const,
                    text: JSON.stringify(selected),
                    round: rounds.length,
                  },
                ]
              : []),
            ...(result?.text
              ? [
                  {
                    role: "assistant" as const,
                    text: edited,
                    round: rounds.length,
                  },
                ]
              : []),
            ...(addition.trim()
              ? [{ role: "user" as const, text: addition.trim(), round: rounds.length }]
              : []),
          ];
    request.current?.abort();
    const controller = new AbortController(),
      token = ++generation.current;
    request.current = controller;
    last.current = () => void generate(run);
    task.setError("");
    setOther(null);
    setBusy(busyText(run));
    restarting.current = start;
    try {
      const guard = start
        ? await writer.reset(controller.signal)
        : writer.guard;
      if (!guard || token !== generation.current) return;
      const introText = start ? "" : (run.intro ?? intro);
      if (start) {
        saved.started = false;
        setResult(null);
        setEdited("");
        setHistory([]);
        setMessages([]);
        setAnswers({});
        setQuestionIndex(0);
        setIntro("");
        setSupplement("");
      }
      const prompt = guard.draft.trim() ? guard.draft : introText;
      if (!prompt.trim()) {
        throw new Error(t("emptyDraft"));
      }
      const output = await api.call<GenerationResult>(
        "generate",
        {
          sessionId: guard.sessionId,
          prompt,
          mode,
          scenario: "general",
          history: rounds,
          forceFinal,
          messages: nextMessages.map(({ role, text }) => ({ role, text })),
          currentText: start || run.rounds ? "" : edited,
        },
        controller.signal,
      );
      const live = writer.current.current;
      if (
        token !== generation.current ||
        !live.input ||
        !draftUnchanged(guard, live.sessionId, live.input)
      )
        return;
      saved.started = true;
      setIntro(introText);
      const queue = output.kind === "questions" ? mergeQuestionnaire(rounds, output.questions) : null;
      setResult(queue ? { ...output, questions: queue.questions } : output);
      setEdited(output.text ?? "");
      setHistory(rounds);
      setMessages(nextMessages);
      setSupplement("");
      if (addition.trim() && output.text?.trim() === edited.trim()) {
        task.setError(t("unchangedResult"));
        setSupplement(addition);
      }
      setAnswers(queue?.answers ?? {});
      setQuestionIndex(queue?.index ?? 0);
      setExtra(null);
      setExtraText("");
    } catch (error) {
      if (!controller.signal.aborted && token === generation.current)
        task.setError((error as Error).message);
    } finally {
      if (token === generation.current) {
        request.current = null;
        restarting.current = false;
        setBusy(null);
      }
    }
  }
  /** 单选自动继续，多选在确认后提交；回改旧答案时重新检查后续问题。 */
  function pick(answer: string, complete = false) {
    if (!selected || !result || locked) return;
    let value = answer;
    const decision = [deferredAnswer, delegatedAnswer].includes(answer);
    if (selected.multiSelect && !decision && !complete) {
      const values = answerValues(answerFor(selected.id));
      value = JSON.stringify(values.includes(answer) ? values.filter(item => item !== answer) : [...values, answer]);
    }
    const baseline = history.flatMap(round => round.answers).find(item => item.questionId === selected.id)?.answer;
    const changed = baseline && baseline !== value;
    const questions = changed ? result.questions.slice(0, questionIndex + 1) : result.questions;
    if (changed) {
      setResult({ ...result, questions });
      setHistory([]);
      setMessages([]);
    }
    const next = Object.fromEntries(questions.filter(q => q.id === selected.id || answers[q.id]).map(q => [q.id, q.id === selected.id ? value : answers[q.id]]));
    setAnswers(next);
    setOther(null);
    if (selected.multiSelect && !decision && !complete) return;
    if (questionIndex < questions.length - 1)
      setQuestionIndex(questionIndex + 1);
    else if (changed) void generate({ rounds: [{ questions, answers: questions.flatMap(q => next[q.id] ? [{ questionId: q.id, answer: next[q.id] }] : []) }] });
    else void generate({ answers: next });
  }
  function editAnswers() {
    const index = history.length - 1,
      round = history[index];
    if (!round || !result) return;
    setHistory(history.slice(0, index));
    setMessages(messages.filter((message) => (message.round ?? 0) <= index));
    setEdited("");
    setResult({ ...result, kind: "questions", text: "", questions: round.questions });
    setAnswers(
      Object.fromEntries(round.answers.map((a) => [a.questionId, a.answer])),
    );
    setQuestionIndex(0);
    task.setError("");
  }
  // 追问时数字键选择选项，←/→ 切换题目；焦点在输入控件里时不拦截。
  useEffect(() => {
    if (!selected || busy || locked || other !== null) return;
    const question = selected;
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        target?.closest("input,textarea,select,[contenteditable=true]") ||
        (target && target !== document.body && !target.closest(".pk-card"))
      )
        return;
      const n = Number(event.key);
      if (n >= 1 && n <= question.options.length)
        pick(question.options[n - 1].label);
      else if (n === question.options.length + 1) setOther(customAnswer(question));
      else if (
        event.key === "ArrowRight" &&
        questionIndex < result!.questions.length - 1
      )
        advance();
      else if (event.key === "ArrowLeft" && questionIndex > 0)
        setQuestionIndex(questionIndex - 1);
      else return;
      event.preventDefault();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  function customAnswer(question: Question) {
    return answerValues(answerFor(question.id)).find(answer => !question.options.some(option => option.label === answer)) || "";
  }
  /** 分页只切换题目；跳过通过独立按钮提交。 */
  function advance() {
    if (!selected || !result || questionIndex >= result.questions.length - 1)
      return;
    setQuestionIndex(questionIndex + 1);
    setOther(null);
  }
  async function saveFavorite() {
    await task.perform(async () => {
      const item = await api.call<{ id: string }>("favorites.add", {
        body: edited,
        sessionId: composer.sessionId || "",
      });
      notify(t("savedPrompt"), {
        label: t("edit"),
        run: () => onEditFavorite(item.id),
      });
    });
  }
  async function use(how: "copy" | "replace" | "append") {
    await task.perform(async () => {
      const before = writer.current.current.input?.draft ?? "";
      const message = await writer.useText(edited, how);
      if (how === "copy") notify(message);
      else
        onWrite(how, before, composer.inputActions!.captureInsertion().draftRev);
    });
  }
  const view = busy
    ? "busy"
    : result?.kind === "questions" && selected
      ? "questions"
      : result?.kind === "summary"
        ? "summary"
        : result?.kind === "final"
          ? "final"
          : mode === "grill" &&
              saved.started &&
              !writer.guard?.draft.trim() &&
              !task.error
            ? "intro"
            : "empty";
  const meta =
    view === "questions"
      ? format(t("questionCount"), { n: questionIndex + 1, total: result!.questions.length })
      : view === "summary"
        ? t("summaryMeta")
        : view === "final"
          ? t("resultMeta")
          : "";
  const files = result?.context.sections.flatMap((s) => s.files) ?? [];
  const contextDetail = result?.context.sections
    .map((s) =>
      [
        `${s.kind}: ${s.files.join(", ")}`,
        ...s.skipped.map(
          (reason) =>
            reason.split(" / ")[api.language === "en" ? 1 : 0] || reason,
        ),
      ].join("\n"),
    )
    .join("\n\n");
  const unsafe = !!composer.input && !replacementEdits(composer.input, edited);
  const canWrite = !!composer.inputActions && !!writer.guard;
  return (
    <div ref={root} className="pk-workflow">
      <CardHeader title={title} meta={meta} t={t} onClose={onClose} />
      {locked && (
        <div className="pk-stale" role="status">
          <span>{t("stale")}</span>
          <button
            type="button"
            className="pk-link"
            onClick={() => generate({ start: true })}
          >
            {t("restartWithDraft")}
          </button>
        </div>
      )}
      <div className={`pk-body${view === "final" ? " is-result" : ""}`}>
        {view === "busy" && <Loading text={busy!} />}
        {view === "empty" && !task.error && (
          <Button onClick={() => generate({ start: true })}>
            {t("restart")}
          </Button>
        )}
        {view === "intro" && (
          <>
            <h3 className="pk-question">{t("intro")}</h3>
            <input
              className="pk-input"
              aria-label={t("intro")}
              placeholder={t("introPlaceholder")}
              maxLength={20000}
              autoFocus
              disabled={locked}
              onKeyDown={(event) => {
                event.stopPropagation();
                const value = event.currentTarget.value.trim();
                if (
                  event.key === "Enter" &&
                  !event.nativeEvent.isComposing &&
                  event.keyCode !== 229 &&
                  value
                ) {
                  event.preventDefault();
                  void generate({ intro: value });
                }
              }}
            />
          </>
        )}
        {view === "questions" && selected && (
          <>
            <div className="pk-question-row">
              <h3 className="pk-question">{selected.question}</h3>
              <IconButton
                label={t("rephrase")}
                disabled={locked}
                onClick={() =>
                  generate({ supplementOnly: true, addition: t("rephraseRequest") })
                }
              >
                <RotateCw size={15} aria-hidden />
              </IconButton>
            </div>
            {selected.basis && <p className="pk-caption pk-basis">{selected.basis}</p>}
            {selected.multiSelect && <p className="pk-caption">{t("multipleChoices")}</p>}
            <div
              role={selected.multiSelect ? "group" : "radiogroup"}
              aria-label={selected.question}
              className="pk-options"
            >
              {selected.options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  role={selected.multiSelect ? "checkbox" : "radio"}
                  className="pk-option"
                  aria-checked={answerValues(answerFor(selected.id)).includes(option.label)}
                  disabled={locked}
                  onClick={() => pick(option.label)}
                >
                  <span className="pk-option-number" aria-hidden>
                    {index + 1}
                  </span>
                  <span>
                    <strong>{option.label}</strong>
                    {selected.recommended === index && (
                      <span className="pk-badge">{t("recommended")}</span>
                    )}
                    {option.description && <small>{option.description}</small>}
                  </span>
                </button>
              ))}
              {other !== null ? (
                <div className="pk-option pk-option-editing">
                  <span className="pk-option-number" aria-hidden>
                    {selected.options.length + 1}
                  </span>
                  <input
                    aria-label={t("other")}
                    placeholder={t("otherPlaceholder")}
                    maxLength={3000}
                    autoFocus
                    value={other}
                    onChange={(event) => setOther(event.target.value)}
                    onBlur={() => !other.trim() && setOther(null)}
                    onKeyDown={(event) => {
                      event.stopPropagation();
                      if (
                        event.nativeEvent.isComposing ||
                        event.keyCode === 229
                      )
                        return;
                      if (event.key === "Enter" && other.trim()) {
                        event.preventDefault();
                        pick(other.trim());
                      } else if (event.key === "Escape") {
                        // 只收起输入框，不关闭卡片。
                        event.preventDefault();
                        event.stopPropagation();
                        setOther(null);
                      }
                    }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  role={selected.multiSelect ? "checkbox" : "radio"}
                  className="pk-option"
                  aria-checked={!!customAnswer(selected)}
                  disabled={locked}
                  onClick={() => setOther(customAnswer(selected))}
                >
                  <span className="pk-option-number" aria-hidden>
                    {selected.options.length + 1}
                  </span>
                  <span>
                    <strong>{customAnswer(selected) || t("other")}</strong>
                  </span>
                </button>
              )}
            </div>
            <div className="pk-decisions">
              <button type="button" className="pk-link" disabled={locked} aria-pressed={answerFor(selected.id) === deferredAnswer} title={t("deferHint")} onClick={() => pick(deferredAnswer)}>{t("defer")}</button>
              <button type="button" className="pk-link" disabled={locked} aria-pressed={answerFor(selected.id) === delegatedAnswer} title={t("delegateHint")} onClick={() => pick(delegatedAnswer)}>{t("delegate")}</button>
              {selected.multiSelect && <Button primary disabled={locked || !answerValues(answerFor(selected.id)).length} onClick={() => pick(answerFor(selected.id), true)}>{t("confirmChoices")}</Button>}
            </div>
            {extra && <form className="pk-follow-row" onSubmit={event => {
              event.preventDefault();
              const value = extraText.trim();
              if (!value || locked) return;
              if (extra === "option") {
                setResult({ ...result!, questions: result!.questions.map(q => q.id === selected.id ? { ...q, options: [...q.options, { label: value, description: "" }] } : q) });
                setExtra(null); setExtraText("");
              } else void generate({ supplementOnly: true, addition: `${t("addQuestionRequest")} ${value}` });
            }}>
              <input className="pk-input" autoFocus aria-label={t(extra === "option" ? "addOption" : "addQuestion")} placeholder={t(extra === "option" ? "addOption" : "addQuestion")} maxLength={extra === "option" ? 160 : 3000} value={extraText} onChange={event => setExtraText(event.target.value)} />
              <Button type="submit" disabled={locked || !extraText.trim()}>{t("confirm")}</Button>
            </form>}
          </>
        )}
        {view === "summary" && (
          <>
            <p className="pk-caption">{t("summaryHint")}</p>
            <div className="pk-summary">{edited}</div>
          </>
        )}
        {view === "final" && (
          <>
            <textarea
              className="pk-input pk-result"
              aria-label={t("result")}
              rows={10}
              value={edited}
              onChange={(e) => setEdited(e.target.value)}
            />
            <div className="pk-follow-row">
              <input
                className="pk-input pk-follow"
                aria-label={t("revise")}
                placeholder={t("revise")}
                maxLength={3000}
                disabled={locked}
                value={supplement}
                onChange={(e) => setSupplement(e.target.value)}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (
                    event.key === "Enter" &&
                    !event.nativeEvent.isComposing &&
                    event.keyCode !== 229 &&
                    supplement.trim()
                  ) {
                    event.preventDefault();
                    void generate({ forceFinal: true, addition: supplement });
                  }
                }}
              />
              <Button
                disabled={locked || !supplement.trim()}
                onClick={() =>
                  generate({ forceFinal: true, addition: supplement })
                }
              >
                {t("improve")}
              </Button>
            </div>
            {files.length > 0 && (
              <p className="pk-caption pk-context" title={contextDetail}>
                {format(t("contextUsed"), {
                  files: files.join(api.language === "en" ? ", " : "、"),
                })}
              </p>
            )}
          </>
        )}
      </div>
      <ErrorBar
        error={task.error}
        t={t}
        onRetry={busy ? undefined : () => last.current()}
      />
      {view === "busy" && (
        <footer className="pk-foot">
          <span className="pk-grow" />
          <Button onClick={cancel}>{t("cancel")}</Button>
        </footer>
      )}
      {view === "questions" && selected && (
        <footer className="pk-foot">
          <span className="pk-pager">
            <IconButton
              label={t("previousQuestion")}
              disabled={questionIndex === 0 || locked}
              onClick={() => setQuestionIndex(questionIndex - 1)}
            >
              <ChevronLeft size={16} aria-hidden />
            </IconButton>
            <span className="pk-dots" role="group" aria-label={t("questions")}>{result!.questions.map((q, index) => <button type="button" key={q.id} className="pk-dot" aria-label={`${index + 1}. ${q.title}`} aria-current={index === questionIndex ? "step" : undefined} data-answered={!!answerFor(q.id)} disabled={locked} onClick={() => { setQuestionIndex(index); setOther(null); setExtra(null); }}>{index + 1}</button>)}</span>
            <IconButton
              label={t("nextQuestion")}
              disabled={locked || questionIndex >= result!.questions.length - 1}
              onClick={advance}
            >
              <ChevronRight size={16} aria-hidden />
            </IconButton>
          </span>
          <span className="pk-grow" />
          <details className="pk-more">
            <summary>{t("more")}</summary>
            <div className="pk-more-menu">
              <Button disabled={locked || selected.options.length >= 6} onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); setExtra("option"); setExtraText(""); }}>{t("addOption")}</Button>
              <Button disabled={locked} onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); setExtra("question"); setExtraText(""); }}>{t("addQuestion")}</Button>
              <Button disabled={locked} onClick={() => generate({ start: true })}>{t("restart")}</Button>
            </div>
          </details>
          <Button
            disabled={locked}
            onClick={() => generate({ forceFinal: true })}
          >
            {t("direct")}
          </Button>
        </footer>
      )}
      {view === "summary" && (
        <footer className="pk-foot">
          {history.length > 0 && (
            <button
              type="button"
              className="pk-link"
              disabled={locked}
              onClick={editAnswers}
            >
              ‹ {t("changeAnswers")}
            </button>
          )}
          <span className="pk-grow" />
          <Button
            disabled={locked}
            onClick={() => generate({ addition: t("askMoreRequest") })}
          >
            {t("askMore")}
          </Button>
          <Button
            primary
            disabled={locked}
            onClick={() => generate({ forceFinal: true })}
          >
            {t("writePrompt")}
          </Button>
        </footer>
      )}
      {view === "final" && (
        <footer className="pk-foot">
          {mode === "grill" && history.length > 0 && <button type="button" className="pk-link" disabled={locked} onClick={editAnswers}>{t("changeAnswers")}</button>}
          <IconButton
            label={t("regenerate")}
            disabled={locked}
            onClick={() =>
              generate({ forceFinal: true, addition: t("regenerateRequest") })
            }
          >
            <RotateCw size={16} aria-hidden />
          </IconButton>
          <IconButton
            label={t("copy")}
            disabled={!edited.trim()}
            onClick={() => use("copy")}
          >
            <Copy size={16} aria-hidden />
          </IconButton>
          {config.settings.favoritesEnabled && (
            <IconButton
              label={t("savePrompt")}
              disabled={!edited.trim()}
              onClick={saveFavorite}
            >
              <Bookmark size={16} aria-hidden />
            </IconButton>
          )}
          <span className="pk-grow" />
          <Button
            disabled={!edited.trim() || !canWrite}
            onClick={() => use("append")}
          >
            {t("append")}
          </Button>
          <Button
            primary
            title={unsafe ? t("unsafeReplace") : undefined}
            disabled={!edited.trim() || !canWrite || locked || unsafe}
            onClick={() => use("replace")}
          >
            {t("replace")}
          </Button>
        </footer>
      )}
    </div>
  );
}
