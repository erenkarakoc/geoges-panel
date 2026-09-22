import { NextResponse } from "next/server";

import { DOC_RULE_MESSAGES, DocumentError } from "@/modules/doc";

/**
 * Shared answer shape of the document routes (TASK-0107). Errors carry a Turkish message; a
 * malformed id is "not found" like a hidden one, so nothing about other people's documents
 * leaks. Responses are never cached: they are one person's view.
 */
const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export async function handle(work: () => Promise<Response>): Promise<Response> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof DocumentError) return json({ error: error.message }, error.status);
    const { code, hint } = error as { code?: string; hint?: string };
    if (code === "22P02") return json({ error: "Belge bulunamadı." }, 404);
    if (hint && DOC_RULE_MESSAGES[hint]) return json({ error: DOC_RULE_MESSAGES[hint] }, 400);
    if (error instanceof SyntaxError) return json({ error: "İstek okunamadı." }, 400);
    throw error;
  }
}

/** Reads a JSON body as an object; anything else is a bad request. */
export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new SyntaxError("body");
  return body as Record<string, unknown>;
}

export const text = (value: unknown) => (typeof value === "string" ? value : "");

export function fileInfo(value: unknown) {
  const file = (value ?? {}) as Record<string, unknown>;
  return { name: text(file.name), type: text(file.type), size: Number(file.size) || 0 };
}
