import { describe, expect, it, vi } from "vitest";
import { ensureSearchExtensions } from "./db-extensions.mjs";

describe("search infrastructure prerequisites", () => {
  it("creates missing dependencies on an empty server", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    await ensureSearchExtensions({ query });
    expect(query.mock.calls.slice(1).map(([sql]) => sql)).toEqual([
      "create schema if not exists extensions",
      "create extension if not exists pg_trgm with schema extensions",
      "create extension if not exists intarray with schema extensions",
      "create extension if not exists btree_gist with schema extensions",
    ]);
  });
  it("does not alter an already configured provider", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: ["pg_trgm", "intarray", "btree_gist"].map((extname) => ({
        extname,
        nspname: "extensions",
      })),
    });
    await ensureSearchExtensions({ query });
    expect(query).toHaveBeenCalledOnce();
  });
  it("refuses to silently move an existing extension", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ extname: "pg_trgm", nspname: "public" }] });
    await expect(ensureSearchExtensions({ query })).rejects.toThrow("review its dependencies");
    expect(query).toHaveBeenCalledOnce();
  });
});
