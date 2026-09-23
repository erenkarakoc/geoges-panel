import { describe, expect, it, vi } from "vitest";
import { createRunSearchAsUser } from "./run-search-as-user";

const identity = { userId: "0192f0c1-0110-7000-8000-000000000001", actingRoleId: null };

describe("read-only search transaction", () => {
  it("binds all inputs, establishes the timeout before searching and commits", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ answer: { hits: [] } }] });
    const release = vi.fn();
    const run = createRunSearchAsUser({ connect: async () => ({ query, release }) });
    const text = "'; delete from core.search_row; --";
    expect(await run(identity, text, ["sit.site"])).toEqual({ hits: [] });
    expect(query.mock.calls).toEqual([
      ["begin read only; set local statement_timeout = '15s'"],
      [
        "select core.search_request($1::uuid, $2::uuid, $3::text, $4::text[]) as answer",
        [identity.userId, null, text, ["sit.site"]],
      ],
      ["commit"],
    ]);
    expect(release).toHaveBeenCalledExactlyOnceWith();
  });

  it.each([false, true])("cleans up failed queries; broken rollback=%s", async (brokenRollback) => {
    const query = vi.fn(async (sql: string) => {
      if (sql.startsWith("select core") || (sql === "rollback" && brokenRollback))
        throw new Error("connection or query failed");
      return { rows: [] };
    });
    const release = vi.fn();
    const run = createRunSearchAsUser({ connect: async () => ({ query, release }) });
    await expect(run(identity, "sogut")).rejects.toThrow("connection or query failed");
    expect(query.mock.calls.at(-1)).toEqual(["rollback"]);
    expect(query.mock.calls.some(([sql]) => sql === "commit")).toBe(false);
    expect(release.mock.calls).toEqual(brokenRollback ? [[true]] : [[]]);
  });

  it("rejects malformed identity before acquiring a connection", async () => {
    const connect = vi.fn();
    await expect(
      createRunSearchAsUser({ connect })({ ...identity, userId: "bad" }, "x"),
    ).rejects.toThrow("not a UUID");
    expect(connect).not.toHaveBeenCalled();
  });
});
