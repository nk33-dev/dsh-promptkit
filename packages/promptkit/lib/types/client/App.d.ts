import React from "react";
import type { Api } from "./api.ts";
import type { T } from "./locales.ts";
import { type ComposerInput } from "./useDraft.ts";
export declare function App({ api, t, ...composer }: ComposerInput & {
    api: Api;
    t: T;
}): React.JSX.Element;
