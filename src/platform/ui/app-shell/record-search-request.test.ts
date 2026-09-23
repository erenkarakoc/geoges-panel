import { afterEach, describe, expect, it, vi } from "vitest";
import { startRecordSearch } from "./record-search-request";

afterEach(() => vi.useRealTimers());
describe("record search requests", () => {
  it("debounces typing without sending cancelled queries", async () => {
    vi.useFakeTimers();
    const request = vi.fn<typeof fetch>();
    const cancel = startRecordSearch("söğüt", vi.fn(), vi.fn(), request);
    cancel();
    await vi.runAllTimersAsync();
    expect(request).not.toHaveBeenCalled();
  });
  it("ignores late results after cancellation even if fetch ignores abort", async () => {
    vi.useFakeTimers();
    let resolve!: (value: Response) => void;
    const request = vi.fn<typeof fetch>(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const receive = vi.fn();
    const failed = vi.fn();
    const cancel = startRecordSearch("old", receive, failed, request);
    await vi.advanceTimersByTimeAsync(200);
    cancel();
    resolve(Response.json({ groups: [], corrected: null }));
    await vi.runAllTimersAsync();
    expect(receive).not.toHaveBeenCalled();
    expect(failed).not.toHaveBeenCalled();
  });
  it("encodes query text and disables caching", async () => {
    vi.useFakeTimers();
    const answer = { groups: [], corrected: "sogut" };
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(answer));
    const receive = vi.fn();
    startRecordSearch("Söğüt & x", receive, vi.fn(), request);
    await vi.runAllTimersAsync();
    expect(request).toHaveBeenCalledWith(
      "/api/search?q=S%C3%B6%C4%9F%C3%BCt%20%26%20x",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(receive).toHaveBeenCalledWith(answer);
  });
  it("reports a failed request without publishing results", async () => {
    vi.useFakeTimers();
    const receive = vi.fn();
    const failed = vi.fn();
    startRecordSearch(
      "query",
      receive,
      failed,
      vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await vi.runAllTimersAsync();
    expect(failed).toHaveBeenCalledOnce();
    expect(receive).not.toHaveBeenCalled();
  });
});
