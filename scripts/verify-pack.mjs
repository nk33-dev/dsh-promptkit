import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { verifyClientBundle } from "./verify-client.mjs";

const path = "dist/dsh-promptkit-0.1.2.tgz";
const archive = await readFile(path),
  tar = gunzipSync(archive),
  files = new Map();
for (let offset = 0; offset + 512 <= tar.length; ) {
  const header = tar.subarray(offset, offset + 512);
  const name = header.subarray(0, 100).toString().replace(/\0.*$/s, "");
  if (!name) break;
  const size =
    parseInt(
      header.subarray(124, 136).toString().replace(/\0.*$/s, "").trim(),
      8,
    ) || 0;
  if (offset + 512 + size > tar.length) throw new Error("Truncated archive");
  files.set(name, tar.subarray(offset + 512, offset + 512 + size));
  offset += 512 + Math.ceil(size / 512) * 512;
}
for (const required of [
  "lib/index.js",
  "lib/client.js",
  "rules/rewrite.md",
  "rules/grill.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  "locale/zh.json",
])
  if (!files.has(`package/${required}`))
    throw new Error(`Missing runtime file: ${required}`);
if (
  [...files.keys()].some((name) =>
    /node_modules|\.env|\.credentials|work\/|tests\/|tsbuildinfo/.test(name),
  )
)
  throw new Error("Unexpected package contents");
const manifest = JSON.parse(files.get("package/package.json").toString("utf8"));
if (manifest.license !== "MIT" || manifest.engines.dsh !== "0.2.1-rc.2")
  throw new Error("Manifest mismatch");
const client = await verifyClientBundle(
  files.get("package/lib/client.js").toString("utf8"),
);
console.log(
  JSON.stringify(
    {
      path,
      files: files.size,
      size: archive.length,
      sha256: createHash("sha256").update(archive).digest("hex"),
      checks: [
        "runtime files",
        "rules and locales",
        "licenses",
        "host compatibility",
        "client module factory",
        "client activation",
        "no private or development files",
      ],
      client,
    },
    null,
    2,
  ),
);
