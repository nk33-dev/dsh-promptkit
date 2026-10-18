import React from "react";
import type { Context } from "@deepseek-ai/cordis";
import type {
  InputState,
  InputActions,
} from "@deepseek-ai/dsh-client-ui-conversation/client";
import type { TypertRemoteContribution } from "@deepseek-ai/dsh-typert-protocol";
import { remoteContribution } from "../shared/remote.ts";
import { Api, type RemoteNamespace } from "./api.ts";
import { App } from "./App.tsx";
import { Management } from "./Management.tsx";
import { css } from "./style.ts";
import { en, zh, type T } from "./locales.ts";
export const inject = ["slots", "locale", "remote"];
interface ComposerProps {
  sessionId: string;
  t: T;
  useInput: <T>(selector: (state: InputState) => T) => T;
  inputActions: InputActions;
}
interface BrowserHost {
  remote: {
    $mount(contribution: TypertRemoteContribution): Promise<() => void>;
    promptkit: RemoteNamespace;
  };
  locale: {
    register(
      namespace: string,
      dictionaries: { en: object; zh: object },
    ): () => void;
  };
  slots: {
    inject(name: string, callback: () => () => void): () => void;
    register(
      options: object,
      component: React.ComponentType<never>,
    ): () => void;
  };
}
export async function apply(ctx: Context) {
  try {
    const host = ctx as unknown as BrowserHost;
    ctx.effect(() => host.locale.register("promptkit", { en, zh }));
    const unmountRemote = await host.remote.$mount(remoteContribution);
    ctx.effect(() => unmountRemote);
    ctx.inject(["remote.promptkit", "remote", "slots", "locale"], (child) => {
      const services = child as unknown as BrowserHost;
      const api = new Api(services.remote.promptkit);
      child.effect(() => () => api.dispose());
      child.effect(() => {
        const style = document.createElement("style");
        style.dataset.plugin = "@nk33-dev/dsh-promptkit";
        style.textContent = css;
        document.head.appendChild(style);
        return () => style.remove();
      });
      const Composer = (props: ComposerProps) =>
        React.createElement(App, {
          api,
          t: props.t,
          sessionId: props.sessionId,
          input: props.useInput((s) => s),
          inputActions: props.inputActions,
        });
      services.slots.inject("conversation.input.right", () =>
        services.slots.register(
          {
            name: "conversation.input.right",
            id: "nk33-promptkit",
            order: 20,
            locale: "promptkit",
          },
          Composer as React.ComponentType<never>,
        ),
      );
      const Settings = (props: { t: T }) =>
        React.createElement(Management, { api, t: props.t });
      services.slots.inject("settings.section", () =>
        services.slots.register(
          {
            name: "settings.section",
            id: "nk33-promptkit",
            order: 80,
            label: "PromptKit",
            locale: "promptkit",
          },
          Settings as React.ComponentType<never>,
        ),
      );
    });
  } catch (error) {
    console.error("PromptKit activation failed", error);
    throw error;
  }
}
