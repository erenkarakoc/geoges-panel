#!/usr/bin/env node
/**
 * Session resume block (PROJECT_RULES §21.2, D-076, CHG-005).
 *
 * Run by the SessionStart hook. Prints what an agent needs to pick up an
 * interrupted session, in the order the rules say to trust it:
 *
 *   1. uncommitted changes      — what the last session left in the tree
 *   2. journal tail             — what it touched, hook-written, crash-proof
 *   3. unfinished tasks         — what ai/TASKS.md says is still open
 *   4. record consistency       — whether the tree it left behind is coherent
 *
 * 1 and 2 are facts the harness recorded. ai/SESSION_HANDOFF.md is a claim the
 * previous model made; when they disagree, 1 and 2 win.
 *
 * Any failure exits 0 with no output: a broken resume block must never stop a
 * session from starting.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function read(relativePath) {
  const absolute = join(ROOT, relativePath);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
}

try {
  const sections = [];

  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  const head = git(["log", "-1", "--format=%h %s"]);
  sections.push(`Branch: ${branch || "?"}\nHEAD: ${head || "?"}`);

  const status = git(["status", "--porcelain"]);
  sections.push(
    status
      ? `Uncommitted changes (${status.split(/\r?\n/).filter(Boolean).length} files):\n${status}`
      : "Uncommitted changes: none — the working tree is clean.",
  );

  const journal = read("ai/SESSION_JOURNAL.md")
    .split(/\r?\n/)
    .filter((line) => line.startsWith("- 2"));
  if (journal.length > 0) {
    sections.push(
      `Session journal, last ${Math.min(15, journal.length)} of ${journal.length} entries (hook-written, PROJECT_RULES §21.2):\n${journal.slice(-15).join("\n")}`,
    );
  }

  const unfinished = read("ai/TASKS.md")
    .split(/\r?\n/)
    .filter((line) => /^\|\s*TASK-\d{4}\s*\|/.test(line))
    .filter((line) =>
      /\|\s*(IMPLEMENTING|TESTING|REVIEW|BLOCKED|QUESTIONS_PENDING|DESIGNING)\s*\|/.test(line),
    )
    .map((line) => {
      const cells = line.split("|").map((cell) => cell.trim());
      return `  ${cells[1]} [${cells[4]}] ${cells[2]}`;
    });
  if (unfinished.length > 0) {
    sections.push(`Tasks not finished (ai/TASKS.md):\n${unfinished.join("\n")}`);
  }

  let recordsLine = "Record consistency: not checked (node or script unavailable).";
  try {
    execFileSync("node", [join(ROOT, "scripts", "check-records.mjs")], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });
    recordsLine = "Record consistency: `npm run records` passes.";
  } catch {
    recordsLine =
      "Record consistency: **`npm run records` FAILS** — the records contradict each other. Run it and fix before doing anything else (PROJECT_RULES §21).";
  }
  sections.push(recordsLine);

  sections.push(
    "Resume order: trust the uncommitted diff and the journal first, then ai/SESSION_HANDOFF.md (a claim the previous model made), then ai/CURRENT_STATE.md.",
  );

  const context = `GEOGES Panel — session resume block\n\n${sections.join("\n\n")}`;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context },
      suppressOutput: true,
    }),
  );
} catch {
  // A resume block that breaks startup would defeat its own purpose.
}

process.exit(0);
