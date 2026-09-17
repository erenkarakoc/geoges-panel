#!/usr/bin/env node
/**
 * Append-only session journal writer (PROJECT_RULES §21.2, D-076, CHG-005).
 *
 * Run by the PostToolUse hook in .claude/settings.json after every file-modifying
 * tool call. The model never writes this file; that is the point. A session that
 * is cut off still leaves an accurate record of what it touched, so the next agent
 * — Claude Code, Codex or any other — can resume from the repository alone.
 *
 * Reads the hook payload on stdin. Never fails the tool call: any error exits 0.
 */

import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const JOURNAL = join(ROOT, "ai", "SESSION_JOURNAL.md");

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

try {
  const raw = readStdin();
  if (!raw.trim()) process.exit(0);

  const payload = JSON.parse(raw);
  const tool = payload.tool_name ?? "?";
  const session = String(payload.session_id ?? "?").slice(0, 8);
  const target =
    payload.tool_response?.filePath ??
    payload.tool_input?.file_path ??
    payload.tool_input?.notebook_path ??
    "";

  if (!target) process.exit(0);

  // Record repository-relative paths; anything outside the repo is noise here.
  const rel = relative(ROOT, resolve(target)).replaceAll("\\", "/");
  if (!rel || rel.startsWith("..")) process.exit(0);

  const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  if (existsSync(JOURNAL)) {
    appendFileSync(JOURNAL, `- ${stamp}Z · ${session} · ${tool} · \`${rel}\`\n`, "utf8");
  }
} catch {
  // A journal that breaks the session would be worse than no journal.
}

process.exit(0);
