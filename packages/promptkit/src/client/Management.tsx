import React, { useState } from "react";
import type { Configuration } from "../shared/types.ts";
import type { Api } from "./api.ts";
import type { T } from "./locales.ts";
import { Settings } from "./Settings.tsx";
import { Library } from "./Library.tsx";
import { Status, Toast, navigateTabs, useData, useToast } from "./ui.tsx";

export function Management({ api, t }: { api: Api; t: T }) {
  api.language = t("settings") === "设置" ? "zh" : "en";
  const [tab, setTab] = useState("settings");
  const { toast, notify } = useToast();
  const { data, error, reload } = useData<Configuration>(
    api,
    "config.read",
    {},
  );
  const tabs = [
    "settings",
    ...(data?.settings.favoritesEnabled ? ["library"] : []),
  ];
  const active = tabs.includes(tab) ? tab : "settings";
  return (
    <section className="pk-panel pk-management" aria-label="PromptKit">
      <div
        className="pk-tabs"
        role="tablist"
        aria-label="PromptKit"
        onKeyDown={navigateTabs}
      >
        {tabs.map((name) => (
          <button
            key={name}
            className="pk-tab"
            role="tab"
            aria-selected={active === name}
            tabIndex={active === name ? 0 : -1}
            onClick={() => setTab(name)}
          >
            {t(name as "settings" | "library")}
          </button>
        ))}
      </div>
      <div
        className="pk-content"
        role="tabpanel"
        aria-label={t(active as "settings" | "library")}
      >
        <Status error={error} />
        {active === "settings" && <Settings api={api} t={t} onSaved={reload} />}
        {active === "library" && (
          <Library api={api} t={t} management notify={notify} />
        )}
        <Toast toast={toast} />
      </div>
    </section>
  );
}
