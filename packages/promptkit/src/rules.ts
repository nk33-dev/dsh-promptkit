import { readFileSync } from "node:fs";
export const REWRITE_RULE = readFileSync(
  new URL("../rules/rewrite.md", import.meta.url),
  "utf8",
).trim();
export const GRILL_RULE = readFileSync(
  new URL("../rules/grill.md", import.meta.url),
  "utf8",
).trim();
