import React from "react";
import type { Api } from "./api.ts";
import type { T } from "./locales.ts";
export declare function Settings({ api, t, onSaved, }: {
    api: Api;
    t: T;
    onSaved: () => void;
}): React.JSX.Element;
