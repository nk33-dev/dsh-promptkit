import { open, realpath, opendir, lstat } from "node:fs/promises";
import { resolve, relative, basename, isAbsolute, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  ContextOptions,
  ContextReport,
  ContextSection,
} from "../shared/types.ts";
const run = promisify(execFile);
const MANIFESTS = [
  "Cargo.toml",
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "Pipfile",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "global.json",
  "Directory.Build.props",
];
const IGNORE = new Set([
  "node_modules",
  "target",
  "dist",
  "build",
  "venv",
  "__pycache__",
  "vendor",
  "bin",
  "obj",
]);
const chars = (value: string, limit: number) =>
  [...value].slice(0, limit).join("");
export function within(root: string, target: string): boolean {
  const path = relative(root, target);
  return (
    path === "" ||
    (!path.startsWith(".." + (process.platform === "win32" ? "\\" : "/")) &&
      path !== ".." &&
      !isAbsolute(path))
  );
}
export async function collectContext(
  cwd: string | null,
  options: ContextOptions,
  signal?: AbortSignal,
): Promise<ContextReport> {
  const report: ContextReport = { enabled: options.enabled, sections: [] };
  if (!options.enabled) return report;
  if (!cwd) {
    report.sections.push({
      kind: "project",
      text: "",
      files: [],
      truncated: false,
      skipped: ["无法确认当前会话目录 / Session directory unavailable"],
    });
    return report;
  }
  let root: string;
  try {
    root = await realpath(cwd);
    if (!(await lstat(root)).isDirectory()) throw new Error();
  } catch {
    report.sections.push({
      kind: "project",
      text: "",
      files: [],
      truncated: false,
      skipped: ["目录不可用 / Directory unavailable"],
    });
    return report;
  }
  let remaining = 14000;
  async function section(
    kind: string,
    limit: number,
    task: (s: ContextSection) => Promise<void>,
  ) {
    signal?.throwIfAborted();
    const s: ContextSection = {
      kind,
      text: "",
      files: [],
      truncated: false,
      skipped: [],
    };
    await task(s);
    const allowed = Math.max(0, Math.min(limit, remaining - kind.length - 4));
    const trimmed = chars(s.text, allowed);
    s.truncated ||= trimmed !== s.text;
    s.text = trimmed;
    remaining -= [...trimmed].length + kind.length + 4;
    report.sections.push(s);
  }
  async function read(name: string, s: ContextSection): Promise<string | null> {
    signal?.throwIfAborted();
    try {
      const path = resolve(root, name),
        actual = await realpath(path);
      if (!within(root, actual) || (await lstat(path)).isSymbolicLink()) {
        s.skipped.push(`${name}: 路径越界或链接 / Outside project or link`);
        return null;
      }
      const file = await open(actual, "r");
      try {
        if (!(await file.stat()).isFile()) return null;
        const buffer = Buffer.alloc(32769),
          { bytesRead } = await file.read(buffer, 0, 32769, 0);
        const bytes = buffer.subarray(0, Math.min(bytesRead, 32768));
        if (bytes.includes(0)) {
          s.skipped.push(`${name}: 二进制文件 / Binary file`);
          return null;
        }
        s.truncated ||= bytesRead > 32768;
        s.files.push(name);
        return new TextDecoder("utf-8").decode(bytes);
      } finally {
        await file.close();
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        s.skipped.push(`${name}: 无法读取 / Unreadable`);
      return null;
    }
  }
  if (options.project)
    await section("project", 512, async (s) => {
      s.text = basename(root);
      try {
        const { stdout } = await run(
          "git",
          ["-C", root, "branch", "--show-current"],
          { timeout: 1500, maxBuffer: 4096, windowsHide: true, signal },
        );
        s.text += `\nbranch: ${stdout.trim()}`;
      } catch {
        s.skipped.push("分支不可用 / Branch unavailable");
      }
    });
  if (options.instructions)
    await section("instructions", 6000, async (s) => {
      const docs = await Promise.all(
        ["AGENTS.md", "CLAUDE.md"].map(async (name) => {
          const body = await read(name, s);
          return body === null ? "" : `${name}\n${body}`;
        }),
      );
      if (docs.every((v) => !v)) {
        const body = await read("README.md", s);
        if (body) docs.push(`README.md\n${body}`);
      }
      s.text = docs.filter(Boolean).join("\n\n");
    });
  if (options.manifests)
    await section("manifests", 6000, async (s) => {
      for (const name of MANIFESTS) {
        const body = await read(name, s);
        if (body) s.text += `${name}\n${body}\n\n`;
      }
    });
  if (options.directory)
    await section("directory", 2000, async (s) => {
      let scanned = 0,
        listed = 0;
      async function visit(folder: string, depth: number) {
        try {
          const dir = await opendir(folder);
          for await (const entry of dir) {
            signal?.throwIfAborted();
            if (++scanned > 400 || listed >= 200) {
              s.truncated = true;
              break;
            }
            if (
              entry.name.startsWith(".") ||
              IGNORE.has(entry.name) ||
              entry.isSymbolicLink()
            )
              continue;
            listed++;
            s.text += `${"  ".repeat(depth)}${entry.name}${entry.isDirectory() ? "/" : ""}\n`;
            if (entry.isDirectory() && depth < 1)
              await visit(join(folder, entry.name), depth + 1);
          }
        } catch {
          s.skipped.push(
            `${relative(root, folder) || "."}: 无法读取目录 / Unreadable directory`,
          );
        }
      }
      await visit(root, 0);
    });
  signal?.throwIfAborted();
  return report;
}
