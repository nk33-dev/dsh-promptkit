import { defineConfig } from "tsdown";
export default defineConfig({
  entry: { client: "src/client/index.ts" },
  outDir: "lib",
  format: "cjs",
  platform: "browser",
  clean: false,
  dts: false,
  target: "es2022",
  deps: {
    alwaysBundle: ["lucide-react"],
    onlyBundle: ["lucide-react"],
    neverBundle: ["react", "react/jsx-runtime", "zod", "@deepseek-ai/cordis"],
  },
  inputOptions: { resolve: { mainFields: ["module", "main"] } },
  outputOptions: {
    entryFileNames: "[name].js",
    banner:
      'window.__ModuleLoader__.load({id:"@nk33-dev/dsh-promptkit",factory:function(require){var module={exports:{}};var exports=module.exports;',
    footer: "return module.exports;}});",
  },
});
