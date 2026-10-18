import React, { useEffect, useState } from "react";
import type { Api } from "./api.ts";
import type { T } from "./locales.ts";
import { promptDetails, promptAudiences, promptDetailLabelsEn, promptAudienceLabelsEn } from "../shared/preferences.ts";
import { Button, Field, Switch, Status, useTask, useData } from "./ui.tsx";
import type {
  Settings as SettingsValue,
  SettingsData,
  CredentialOption,
  EffortList,
  ModelOption,
  Mode,
} from "../shared/types.ts";
export function Settings({
  api,
  t,
  onSaved,
}: {
  api: Api;
  t: T;
  onSaved: () => void;
}) {
  const { data, error, reload } = useData<SettingsData>(
    api,
    "settings.read",
    {},
  );
  const [draftSettings, setDraftSettings] = useState<SettingsValue | null>(
      null,
    ),
    [customRef, setCustomRef] = useState(false),
    [key, setKey] = useState("");
  const models = useData<ModelOption[]>(
    api,
    "models.list",
    {},
    draftSettings?.connection === "host",
  );
  const credentials = useData<CredentialOption[]>(
    api,
    "credentials.list",
    {},
    !!draftSettings,
  );
  const efforts = useData<EffortList>(
    api,
    "models.efforts",
    { provider: draftSettings?.provider, model: draftSettings?.model },
    draftSettings?.connection === "host" && !!draftSettings.provider,
  );
  const task = useTask(),
    { perform } = task;
  useEffect(() => {
    if (data) setDraftSettings(data.settings);
  }, [data]);
  async function load() {
    reload();
    onSaved();
  }
  async function fillRule(key: "systemPrompt" | "grillSystemPrompt") {
    await perform(async () => {
      const rules = await api.call<Record<typeof key, string>>(
        "rules.defaults",
        {},
      );
      setDraftSettings((value) =>
        value ? { ...value, [key]: rules[key] } : value,
      );
    });
  }
  if (!data || !draftSettings)
    return (
      <>
        <Status error={error} />
        <Button onClick={reload}>{t(error ? "retry" : "loading")}</Button>
      </>
    );
  return (
    <>
      <Status
        error={task.error || error || models.error}
        notice={task.notice}
      />
      <div className="pk-stack">
        <strong>{t("features")}</strong>
        {(
          [
            "rewriteEnabled",
            "grillEnabled",
            "favoritesEnabled",
          ] as const
        ).map((k) => (
          <Switch
            key={k}
            label={t(k)}
            checked={draftSettings[k]}
            onChange={(v) => setDraftSettings({ ...draftSettings, [k]: v })}
          />
        ))}
        <Field label={t("defaultMode")}>
          <select
            className="pk-input"
            value={draftSettings.defaultMode}
            onChange={(e) =>
              setDraftSettings({
                ...draftSettings,
                defaultMode: e.target.value as Mode,
              })
            }
          >
            <option value="rewrite">{t("generate")}</option>
            <option value="grill">{t("grill")}</option>
          </select>
        </Field>
        {(["detail", "audience"] as const).map(key => {
          const options = key === "detail" ? promptDetails : promptAudiences;
          const english = key === "detail"
            ? promptDetailLabelsEn : promptAudienceLabelsEn;
          return <Field key={key} label={t(key)}>
            <select className="pk-input" value={draftSettings[key]}
              onChange={event => setDraftSettings({ ...draftSettings, [key]: event.target.value })}>
              {options.map((item, index) => <option key={item.value} value={item.value}>
                {api.language === "en" ? english[index] : item.label}
              </option>)}
            </select>
            {api.language !== "en" && <p className="pk-caption">{options.find(item => item.value === draftSettings[key])?.description}</p>}
          </Field>;
        })}
        <details>
          <summary>{t("rules")}</summary>
          <div className="pk-stack">
            <p className="pk-caption">{t("rulesHint")}</p>
            {(["systemPrompt", "grillSystemPrompt"] as const).map((k) => (
              <section className="pk-stack" key={k}>
                <Field
                  label={t(k === "systemPrompt" ? "rewriteRule" : "grillRule")}
                >
                  <textarea
                    className="pk-input pk-textarea"
                    value={draftSettings[k]}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        [k]: e.target.value,
                      })
                    }
                  />
                </Field>
                <div className="pk-row">
                  <Button onClick={() => fillRule(k)}>
                    {t("fillDefault")}
                  </Button>
                  <Button
                    onClick={() =>
                      setDraftSettings({
                        ...draftSettings,
                        [k]: "",
                      })
                    }
                  >
                    {t("useDefault")}
                  </Button>
                </div>
              </section>
            ))}
          </div>
        </details>
        <hr className="pk-divider" />
        <Switch
          label={t("contextEnabled")}
          checked={draftSettings.context.enabled}
          onChange={(v) =>
            setDraftSettings({
              ...draftSettings,
              context: { ...draftSettings.context, enabled: v },
            })
          }
        />
        <p className="pk-caption">{t("contextWarning")}</p>
        <details>
          <summary>{t("contextItems")}</summary>
          <div className="pk-stack">
            {(["project", "instructions", "directory", "manifests"] as const).map(
              (k) => (
                <Switch
                  key={k}
                  label={t(k === "project" ? "projectInfo" : k)}
                  disabled={!draftSettings.context.enabled}
                  checked={draftSettings.context[k]}
                  onChange={(v) =>
                    setDraftSettings({
                      ...draftSettings,
                      context: { ...draftSettings.context, [k]: v },
                    })
                  }
                />
              ),
            )}
          </div>
        </details>
        <hr className="pk-divider" />
        <Field label={t("connection")}>
          <select
            className="pk-input"
            value={draftSettings.connection}
            onChange={(e) =>
              setDraftSettings({
                ...draftSettings,
                connection: e.target.value as SettingsValue["connection"],
              })
            }
          >
            <option value="host">{t("host")}</option>
            <option value="independent">{t("independent")}</option>
          </select>
        </Field>
        {draftSettings.connection === "host" ? (
          <>
          <Field label={t("hostModel")}>
            <select
              className="pk-input"
              value={
                draftSettings.provider
                  ? `${draftSettings.provider}\n${draftSettings.model}`
                  : ""
              }
              onChange={(e) => {
                const [provider = "", model = ""] = e.target.value.split("\n");
                setDraftSettings({
                  ...draftSettings,
                  provider,
                  model,
                });
              }}
            >
              <option value="">{t("defaultModel")}</option>
              {(models.data || []).map((m) => (
                <option
                  key={`${m.provider}/${m.model}`}
                  value={`${m.provider}\n${m.model}`}
                >
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          {!!efforts.data?.efforts?.length && (
            <Field label={t("reasoningEffort")}>
              <select
                className="pk-input"
                value={draftSettings.reasoningEffort}
                onChange={(e) =>
                  setDraftSettings({
                    ...draftSettings,
                    reasoningEffort: e.target.value,
                  })
                }
              >
                <option value="">{t("effortAuto")}</option>
                {efforts.data.efforts.map((effort) => (
                  <option key={effort.id} value={effort.id}>
                    {effort.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          </>
        ) : (
          <>
            <Field label={t("baseUrl")}>
              <input
                className="pk-input"
                type="url"
                value={draftSettings.baseUrl}
                onChange={(e) =>
                  setDraftSettings({
                    ...draftSettings,
                    baseUrl: e.target.value,
                  })
                }
              />
            </Field>
            <Field label={t("model")}>
              <input
                className="pk-input"
                value={draftSettings.model}
                onChange={(e) =>
                  setDraftSettings({
                    ...draftSettings,
                    model: e.target.value,
                  })
                }
              />
            </Field>
            <Field label={t("protocol")}>
              <select
                className="pk-input"
                value={draftSettings.protocol}
                onChange={(e) =>
                  setDraftSettings({
                    ...draftSettings,
                    protocol: e.target.value as SettingsValue["protocol"],
                  })
                }
              >
                <option value="chat_completions">Chat Completions</option>
                <option value="responses">Responses</option>
                <option value="anthropic_messages">Anthropic Messages</option>
                <option value="auto">{t("auto")}</option>
              </select>
            </Field>
            <Field label={t("key")}>
              <input
                className="pk-input"
                type="password"
                autoComplete="new-password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </Field>
            <div className="pk-row">
              <Button
                disabled={!key}
                onClick={() =>
                  perform(async () => {
                    await api.call("settings.save", {
                      settings: draftSettings,
                    });
                    await api.call("credential.save", { key });
                    setKey("");
                    await load();
                  }, t("saved"))
                }
              >
                {t("saveKey")}
              </Button>
              <Button
                disabled={!data.credentialConfigured}
                onClick={() =>
                  perform(async () => {
                    await api.call("credential.remove", {});
                    await load();
                  }, t("saved"))
                }
              >
                {t("removeKey")}
              </Button>
            </div>
            <p className="pk-caption">
              {t(
                (credentials.data?.find(
                  (item) => item.name === draftSettings.credentialRef,
                )?.configured ??
                  (draftSettings.credentialRef ===
                    data.settings.credentialRef &&
                    data.credentialConfigured))
                  ? "keyConfigured"
                  : "keyMissing",
              )}
            </p>
            <details>
              <summary>{t("credentialRef")}</summary>
              <div className="pk-stack">
                <p className="pk-caption">{t("credentialRefHint")}</p>
                {customRef ? (
                  <div className="pk-row">
                    <input
                      className="pk-input"
                      autoComplete="off"
                      placeholder={t("newCredentialRef")}
                      value={draftSettings.credentialRef}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          credentialRef: e.target.value,
                        })
                      }
                    />
                    <Button onClick={() => setCustomRef(false)}>
                      {t("chooseExisting")}
                    </Button>
                  </div>
                ) : (
                  <select
                    className="pk-input"
                    aria-label={t("credentialRef")}
                    value={draftSettings.credentialRef}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") setCustomRef(true);
                      else
                        setDraftSettings({
                          ...draftSettings,
                          credentialRef: e.target.value,
                        });
                    }}
                  >
                    {!credentials.data?.some(
                      (item) => item.name === draftSettings.credentialRef,
                    ) &&
                      draftSettings.credentialRef && (
                        <option value={draftSettings.credentialRef}>
                          {draftSettings.credentialRef}
                        </option>
                      )}
                    {(credentials.data || []).map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                        {item.configured ? " ✓" : ""}
                      </option>
                    ))}
                    <option value="__custom__">{t("newCredentialRef")}</option>
                  </select>
                )}
                <p className="pk-caption">{t("keyHint")}</p>
              </div>
            </details>
          </>
        )}
        <Field label={t("timeout")}>
          <input
            className="pk-input"
            type="number"
            min={5}
            max={300}
            value={draftSettings.timeoutSeconds}
            onChange={(e) =>
              setDraftSettings({
                ...draftSettings,
                timeoutSeconds: Number(e.target.value),
              })
            }
          />
        </Field>
        <Button
          primary
          onClick={() =>
            perform(async () => {
              await api.call("settings.save", {
                settings: draftSettings,
              });
              await load();
            }, t("saved"))
          }
        >
          {t("save")}
        </Button>
      </div>
    </>
  );
}
