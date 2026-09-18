#!/usr/bin/env node
/**
 * Record consistency validator (PROJECT_RULES §21, D-075, CHG-005).
 *
 * The state system under /ai and /docs only works if its records agree with each
 * other. Keeping them in agreement by remembering to do it does not work — an
 * audit on 2026-09-17 found nine contradictions. This program asserts the
 * invariants instead.
 *
 *   npm run records            normal run (used by `npm run check`)
 *   npm run records -- --strict   commit gate (used by .githooks/pre-commit)
 *
 * Strict mode additionally requires that a record modified in the working tree
 * carries today's `Last updated:` stamp.
 *
 * No dependencies on purpose: this must run before anything is installed.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const STRICT = process.argv.includes("--strict");
const VERBOSE = process.argv.includes("--verbose");

const problems = [];
// `warnings` always print — they are few and each one wants acting on.
// `notes` are the forward references a design-first repository is full of
// (REQ files Phase 01 has not written yet). They are counted, not listed,
// unless --verbose: a gate that prints forty lines on every commit stops
// being read, and an unread gate is the same as no gate.
const notes = [];
const warnings = [];

function fail(file, line, message, fix) {
  problems.push({ file, line, message, fix });
}

function read(relative) {
  const absolute = join(ROOT, relative);
  if (!existsSync(absolute)) return null;
  return readFileSync(absolute, "utf8");
}

/** Every line of a file, as { number, text }. */
function lines(content) {
  return content.split(/\r?\n/).map((text, index) => ({ number: index + 1, text }));
}

/** Markdown files under /ai and /docs, plus the root records. */
function recordFiles() {
  const found = [];
  const walk = (relative) => {
    const absolute = join(ROOT, relative);
    if (!existsSync(absolute)) return;
    for (const entry of readdirSync(absolute)) {
      const child = join(relative, entry).replaceAll("\\", "/");
      if (statSync(join(ROOT, child)).isDirectory()) walk(child);
      else if (entry.endsWith(".md")) found.push(child);
    }
  };
  walk("ai");
  walk("docs");
  for (const entry of readdirSync(ROOT)) {
    if (entry.endsWith(".md")) found.push(entry);
  }
  return found;
}

const FILES = recordFiles();
const CONTENT = new Map(FILES.map((file) => [file, read(file) ?? ""]));

// ---------------------------------------------------------------------------
// 1. Tasks: unique ids, recognised heading, known status
// ---------------------------------------------------------------------------

const TASK_STATUSES = new Set([
  "NOT_STARTED",
  "DISCOVERY",
  "QUESTIONS_PENDING",
  "DESIGNING",
  "READY_FOR_IMPLEMENTATION",
  "IMPLEMENTING",
  "TESTING",
  "REVIEW",
  "BLOCKED",
  "DEFERRED",
  "DONE",
]);

const HEADING_PREFIXES = ["PHASE ", "MILESTONE ", "CHG-"];

const definedTasks = new Map(); // id -> { file, line }

{
  const file = "ai/TASKS.md";
  const content = CONTENT.get(file) ?? "";
  let heading = null;
  for (const { number, text } of lines(content)) {
    const headingMatch = text.match(/^##\s+(.*)$/);
    if (headingMatch) {
      heading = headingMatch[1].trim();
      continue;
    }
    const row = text.match(/^\|\s*(TASK-\d{4})\s*\|([^|]*)\|([^|]*)\|([^|]*)\|/);
    if (!row) continue;
    const [, id, , tier, status] = row;

    // Six columns: ID · Title · Tier · Status · Depends on · Notes. A stray `|`
    // splits the notes into a seventh cell that no reader or tool expects.
    const cells = text
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|").length;
    if (cells !== 6) {
      fail(
        file,
        number,
        `${id} has ${cells} columns, expected 6`,
        "merge the extra cell into Notes, or escape a literal | as \\|",
      );
    }

    if (definedTasks.has(id)) {
      fail(
        file,
        number,
        `${id} is defined twice (first at line ${definedTasks.get(id).line})`,
        "give the second one a new id, or merge the rows",
      );
    } else {
      definedTasks.set(id, { file, line: number });
    }

    if (!heading || !HEADING_PREFIXES.some((prefix) => heading.startsWith(prefix))) {
      fail(
        file,
        number,
        `${id} sits under the heading "${heading ?? "(none)"}", which names no phase, milestone or change request`,
        "move the row under the heading of the phase/milestone whose scope it delivers (PROJECT_RULES §21.1)",
      );
    }

    const cleanStatus = status.trim();
    if (!TASK_STATUSES.has(cleanStatus)) {
      fail(
        file,
        number,
        `${id} has status "${cleanStatus}", which is not in the PROJECT_RULES §4 vocabulary`,
        `use one of: ${[...TASK_STATUSES].join(", ")}`,
      );
    }

    const cleanTier = tier.trim();
    if (!["T1", "T2", "T3"].includes(cleanTier)) {
      fail(file, number, `${id} has tier "${cleanTier}"`, "use T1, T2 or T3 (PROJECT_RULES §5)");
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Roadmap: phase statuses come from the agreed vocabulary
// ---------------------------------------------------------------------------

const PHASE_STATUSES = new Set([
  "NOT_STARTED",
  "DISCOVER",
  "QUESTIONS_PENDING",
  "DESIGNING",
  "PARTIALLY_DONE",
  "IN_PROGRESS",
  "DONE",
]);

{
  const file = "ai/MASTER_ROADMAP.md";
  const content = CONTENT.get(file) ?? "";
  for (const { number, text } of lines(content)) {
    // Phase ids are two digits, optionally with a letter for an inserted step (09R).
    const row = text.match(/^\|\s*(\d{2}[A-Z]?)\s*\|[^|]*\|[^|]*\|\s*([A-Z_]+)\s*\|/);
    if (!row) continue;
    if (!PHASE_STATUSES.has(row[2])) {
      fail(
        file,
        number,
        `Phase ${row[1]} has status "${row[2]}"`,
        `use one of: ${[...PHASE_STATUSES].join(", ")} (PROJECT_RULES §9)`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Every change request in DECISIONS.md is in the roadmap's change register
// ---------------------------------------------------------------------------

{
  const decisions = read("ai/DECISIONS.md") ?? "";
  const roadmap = read("ai/MASTER_ROADMAP.md") ?? "";
  for (const { number, text } of lines(decisions)) {
    const match = text.match(/^###\s+(CHG-\d{3})\b/);
    if (!match) continue;
    if (!roadmap.includes(match[1])) {
      fail(
        "ai/DECISIONS.md",
        number,
        `${match[1]} is analysed here but does not appear in ai/MASTER_ROADMAP.md`,
        "add it to the roadmap's change register in the same session it is approved (PROJECT_RULES §9, D-071)",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Decisions: unique ids
// ---------------------------------------------------------------------------

const definedDecisions = new Map();

{
  const file = "ai/DECISIONS.md";
  for (const { number, text } of lines(CONTENT.get(file) ?? "")) {
    const row = text.match(/^\|\s*(D-\d{3})\s*\|/);
    if (!row) continue;
    const id = row[1];
    if (definedDecisions.has(id)) {
      fail(
        file,
        number,
        `${id} is defined twice (first at line ${definedDecisions.get(id).line})`,
        "decision ids are never reused (ID_STANDARDS)",
      );
    } else {
      definedDecisions.set(id, { file, line: number });
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Open questions: every OQ named in CURRENT_STATE exists
// ---------------------------------------------------------------------------

// Any OQ id that the open-questions file mentions at all counts as known: the file
// also records deliberate numbering gaps (OQ-018, OQ-019), and a record may cite one.
const definedQuestions = new Set(
  [...(read("ai/OPEN_QUESTIONS.md") ?? "").matchAll(/\b(OQ-\d{3})\b/g)].map((m) => m[1]),
);

// ---------------------------------------------------------------------------
// 6. Cross references: every id and path mentioned anywhere is defined
// ---------------------------------------------------------------------------

const adrFiles = existsSync(join(ROOT, "docs/decisions"))
  ? readdirSync(join(ROOT, "docs/decisions"))
  : [];
const definedAdrs = new Set(
  adrFiles.map((name) => name.match(/^(ADR-\d{3})/)?.[1]).filter(Boolean),
);

const PATH_PATTERN = /`([A-Za-z0-9_.@-]+(?:\/[A-Za-z0-9_.@*[\]-]+)+\/?)`/g;

/** Top-level entries of this repository; a cited path outside them is not ours to verify. */
const TOP_LEVEL = new Set(readdirSync(ROOT).filter((entry) => entry !== "node_modules"));

/** Paths git has deleted at some point — citing one of these is a stale reference. */
const DELETED_PATHS = (() => {
  const log = git(["log", "--diff-filter=D", "--name-only", "--format="]);
  const deleted = new Set(
    log
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
  for (const path of [...deleted]) {
    if (existsSync(join(ROOT, path))) deleted.delete(path); // deleted then restored
  }
  return deleted;
})();

/** Requirement ids defined as `### REQ-XXX-NNN` headings in docs/requirements/REQ-*.md. */
const definedRequirements = new Set(
  FILES.filter((name) => /^docs\/requirements\/REQ-[A-Z]{2,3}\.md$/.test(name)).flatMap((name) =>
    [...(CONTENT.get(name) ?? "").matchAll(/^###\s+(REQ-[A-Z]{2,3}-\d{3})\b/gm)].map((m) => m[1]),
  ),
);

for (const file of FILES) {
  const content = CONTENT.get(file) ?? "";
  // A file may describe ids it does not define (the ID standard's examples, the REQ template).
  const isStandard = file.startsWith("docs/standards/") || file === "docs/requirements/README.md";

  for (const { number, text } of lines(content)) {
    if (text.trimStart().startsWith(">") || isStandard) continue;

    for (const match of text.matchAll(/\b(D-\d{3})\b/g)) {
      if (!definedDecisions.has(match[1])) {
        fail(
          file,
          number,
          `${match[1]} is referenced but not defined in ai/DECISIONS.md`,
          "add the decision row or correct the reference",
        );
      }
    }

    for (const match of text.matchAll(/\b(REQ-[A-Z]{2,3}-\d{3})\b/g)) {
      if (!definedRequirements.has(match[1])) {
        fail(
          file,
          number,
          `${match[1]} is referenced but no docs/requirements/REQ-*.md defines it`,
          "write the requirement or correct the reference",
        );
      }
    }
  }
}

for (const file of FILES) {
  const content = CONTENT.get(file) ?? "";
  // A file may describe ids it does not define (e.g. the ID standard's examples).
  const isStandard = file.startsWith("docs/standards/");

  for (const { number, text } of lines(content)) {
    if (text.trimStart().startsWith(">")) continue; // quoted source material

    for (const match of text.matchAll(/\b(ADR-\d{3})\b/g)) {
      if (!definedAdrs.has(match[1]) && !isStandard) {
        fail(
          file,
          number,
          `${match[1]} is referenced but no file matches docs/decisions/${match[1]}-*.md`,
          "create the ADR or correct the reference",
        );
      }
    }

    for (const match of text.matchAll(/\b(TASK-\d{4})\b/g)) {
      if (!definedTasks.has(match[1]) && !isStandard) {
        fail(
          file,
          number,
          `${match[1]} is referenced but not defined in ai/TASKS.md`,
          "add the task row or correct the reference",
        );
      }
    }

    if (file === "ai/CURRENT_STATE.md") {
      for (const match of text.matchAll(/\b(OQ-\d{3})\b/g)) {
        if (!definedQuestions.has(match[1])) {
          fail(
            file,
            number,
            `${match[1]} is referenced but not defined in ai/OPEN_QUESTIONS.md`,
            "add the question row or correct the reference",
          );
        }
      }
    }

    for (const match of text.matchAll(PATH_PATTERN)) {
      const candidate = match[1];
      if (candidate.includes("*") || candidate.includes("[")) continue; // glob
      if (candidate.startsWith("../")) continue; // deliberately out of scope (ADR-007)
      // Only paths rooted in a directory this repository actually has are ours;
      // everything else is an upstream repo, a URL or a path on someone's machine.
      const firstSegment = candidate.split("/")[0];
      if (!TOP_LEVEL.has(firstSegment)) continue;
      const target = candidate.replace(/\/$/, "");
      if (existsSync(join(ROOT, target))) continue;

      // A path that git has deleted is a stale reference — the record still points
      // at something that was removed or renamed, which is the failure this check
      // exists for. A path that never existed is a forward reference to work the
      // roadmap has not reached yet, which is normal in a design-first project.
      // A record that describes the removal is allowed to name what it removed.
      const describesRemoval =
        /\b(removed?|deleted?|no longer exists|replaced by|silindi|kaldırıld)/i.test(text);
      if (DELETED_PATHS.has(target) && !describesRemoval) {
        fail(
          file,
          number,
          `cites \`${candidate}\`, which was deleted from the repository`,
          "point at what replaced it, or say in the line that it no longer exists",
        );
      } else {
        notes.push(`${file}:${number} cites \`${candidate}\`, which does not exist yet`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 7. "Last updated" stamps must not predate the file's last commit
// ---------------------------------------------------------------------------

function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const dirty = new Set(
  git(["status", "--porcelain"])
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replaceAll("\\", "/")),
);

// Local date, not UTC: the stamps in the records are written in local time, and a
// session that runs late in the evening would otherwise be told its stamp is wrong.
const today = (() => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
})();

for (const file of FILES.filter((name) => name.startsWith("ai/"))) {
  const content = CONTENT.get(file) ?? "";
  const stamp = content.match(/Last updated:\s*(\d{4}-\d{2}-\d{2})/);
  if (!stamp) continue;

  const lastCommit = git(["log", "-1", "--format=%cs", "--", file]);
  if (lastCommit && stamp[1] < lastCommit) {
    fail(
      file,
      1,
      `"Last updated: ${stamp[1]}" predates the file's last commit (${lastCommit})`,
      "set the stamp to the date of the change",
    );
  }

  if (dirty.has(file) && stamp[1] !== today) {
    const message = `"Last updated: ${stamp[1]}" but the file has uncommitted changes (today is ${today})`;
    if (STRICT) fail(file, 1, message, "update the stamp before committing");
    else warnings.push(`${file}: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// 8. The guards themselves must be in place
// ---------------------------------------------------------------------------

if (!existsSync(join(ROOT, "ai/SESSION_JOURNAL.md"))) {
  fail(
    "ai/SESSION_JOURNAL.md",
    1,
    "the session journal is missing",
    "create it; it is written by the PostToolUse hook (PROJECT_RULES §21.2)",
  );
}

if (git(["config", "core.hooksPath"]) !== ".githooks") {
  warnings.push(
    "pre-commit gate is not enabled in this clone — run: git config core.hooksPath .githooks",
  );
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

for (const warning of warnings) console.log(`warn   ${warning}`);

if (notes.length > 0) {
  if (VERBOSE) for (const note of notes) console.log(`note   ${note}`);
  else
    console.log(
      `note   ${notes.length} forward reference(s) to files the roadmap has not reached yet — npm run records -- --verbose`,
    );
}

if (problems.length === 0) {
  console.log(
    `records OK — ${FILES.length} files, ${definedTasks.size} tasks, ${definedDecisions.size} decisions`,
  );
  process.exit(0);
}

console.error("");
for (const { file, line, message, fix } of problems) {
  console.error(`${file}:${line}`);
  console.error(`  ${message}`);
  console.error(`  fix: ${fix}`);
  console.error("");
}
console.error(`${problems.length} record problem(s). See ai/PROJECT_RULES.md §21.`);
process.exit(1);
