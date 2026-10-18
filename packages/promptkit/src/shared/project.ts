import type { Project } from "./types.ts";
export function normalizeProject(project: Project): Project {
  let workingDirectory = project.workingDirectory.replace(/\\/g, "/");
  if (
    /^[A-Za-z]:\//.test(workingDirectory) ||
    workingDirectory.startsWith("//")
  )
    workingDirectory = workingDirectory.toLowerCase();
  if (!workingDirectory.startsWith("/") && !/^[a-z]:\//.test(workingDirectory))
    throw new Error("项目目录需要绝对路径 / Absolute project path required");
  workingDirectory = workingDirectory.replace(/\/+$/, "") || "/";
  return { hostId: project.hostId, workingDirectory };
}
export function sameProject(a: Project | null, b: Project | null): boolean {
  return a === null || b === null
    ? a === b
    : JSON.stringify(normalizeProject(a)) ===
        JSON.stringify(normalizeProject(b));
}
