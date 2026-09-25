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

  it("does not abort a request that has already answered", async () => {
    // Aborting a finished request stopped nothing and made Chrome 153 report an unhandled
    // "aborted without reason" on every navigation.
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const request = vi.fn<typeof fetch>((_url, init) => {
      signal = init?.signal ?? undefined;
      return Promise.resolve(Response.json({ groups: [], corrected: null }));
    });
    const cancel = startRecordSearch("done", vi.fn(), vi.fn(), request);
    await vi.runAllTimersAsync();
    cancel();
    expect(signal?.aborted).toBe(false);
  });

  it("stops a request that is still on its way, with a reason of its own", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const request = vi.fn<typeof fetch>((_url, init) => {
      signal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(signal?.reason));
      });
    });
    const failed = vi.fn();
    const cancel = startRecordSearch("slow", vi.fn(), failed, request);
    await vi.advanceTimersByTimeAsync(200);
    cancel();
    await vi.runAllTimersAsync();
    expect(signal?.aborted).toBe(true);
    expect((signal?.reason as DOMException).name).toBe("AbortError");
    // A search that was replaced is not a failure the person should hear about.
    expect(failed).not.toHaveBeenCalled();
  });

  it("never aborts a request that was never sent", () => {
    vi.useFakeTimers();
    const request = vi.fn<typeof fetch>();
    const cancel = startRecordSearch("typed", vi.fn(), vi.fn(), request);
    cancel();
    expect(request).not.toHaveBeenCalled();
  });

  it("lets go of an error body nobody will read", async () => {
    vi.useFakeTimers();
    const released = vi.fn();
    const body = new ReadableStream({ cancel: released });
    startRecordSearch(
      "query",
      vi.fn(),
      vi.fn(),
      vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status: 500 })),
    );
    await vi.runAllTimersAsync();
    expect(released).toHaveBeenCalledOnce();
  });
});
