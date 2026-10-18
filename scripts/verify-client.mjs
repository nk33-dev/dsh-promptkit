import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { Script } from "node:vm";
import { fileURLToPath } from "node:url";

const require = createRequire(
  new URL("../packages/promptkit/package.json", import.meta.url),
);
const provided = new Set([
  "react",
  "react/jsx-runtime",
  "zod",
  "@deepseek-ai/cordis",
]);

export async function verifyClientBundle(source) {
  const registrations = [],
    imports = new Set(),
    styles = [],
    slots = [],
    cleanups = [];
  const element = () => ({ dataset: {}, textContent: "", remove() {} });
  const document = {
    createElement: element,
    head: { appendChild: (node) => styles.push(node) },
  };
  const window = {
    __ModuleLoader__: { load: (definition) => registrations.push(definition) },
  };
  new Script(source, { filename: "promptkit-client.js" }).runInNewContext(
    { window, document, console },
    { timeout: 10000 },
  );
  assert.equal(
    registrations.length,
    1,
    "Client must register one package factory",
  );
  const registration = registrations[0];
  assert.equal(registration.id, "@nk33-dev/dsh-promptkit");
  const exports = registration.factory((specifier) => {
    if (!provided.has(specifier))
      throw new Error(
        `Client dependency is unavailable in Harness: ${specifier}`,
      );
    imports.add(specifier);
    return require(specifier);
  });
  assert.equal(typeof exports.apply, "function");
  const host = {
    effect: (callback) => {
      const cleanup = callback();
      if (cleanup) cleanups.push(cleanup);
    },
    inject: (_services, callback) => callback(host),
    locale: { register: () => () => {} },
    remote: { $mount: async () => () => {}, promptkit: {} },
    slots: {
      inject: (_name, callback) => callback(),
      register: (options, component) => {
        assert.equal(typeof component, "function");
        slots.push(options.name);
        return () => {};
      },
    },
  };
  try {
    await exports.apply(host);
    assert.deepEqual(slots.sort(), [
      "conversation.input.right",
      "settings.section",
    ]);
    assert.equal(styles.length, 1);
  } finally {
    for (const cleanup of cleanups.reverse()) cleanup();
  }
  return { imports: [...imports].sort(), slots };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await verifyClientBundle(
    await readFile(
      new URL("../packages/promptkit/lib/client.js", import.meta.url),
      "utf8",
    ),
  );
  console.log(JSON.stringify({ status: "ok", ...result }));
}
