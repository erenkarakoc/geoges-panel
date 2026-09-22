import { describe, expect, it } from "vitest";

import {
  sendFile,
  UploadRefusedError,
  UploadStalledError,
  type UploadTransport,
} from "./resumable-upload";

const PART = 4;

/** A server that stores parts, keeps its own offset and fails on the calls it is told to. */
function fakeServer(
  size: number,
  failOn: (call: number, offset: number) => Error | null = () => null,
) {
  let received = 0;
  let calls = 0;
  const sent: number[] = [];
  const transport: UploadTransport = {
    async state() {
      return { receivedBytes: received, status: "open" };
    },
    async putPart(_id, offset, part) {
      calls += 1;
      const failure = failOn(calls, offset);
      if (failure) throw failure;
      if (offset !== received) return { status: 409, receivedBytes: received };
      sent.push(offset);
      received += part.size;
      return { status: 200, receivedBytes: received };
    },
    async complete() {
      if (received !== size) throw new UploadRefusedError(400, "Yükleme tamamlanmadı.");
      return { versionId: "v1" };
    },
  };
  return { transport, sent, setReceived: (n: number) => (received = n) };
}

const file = (size: number) => new Blob([new Uint8Array(size)]);
const start = (size: number, receivedBytes = 0) => ({
  uploadId: "u1",
  partSize: PART,
  sizeBytes: size,
  receivedBytes,
});
const quick = { sleep: async () => {}, isOnline: () => true };

describe("sending a file in parts (SPIKE-15)", () => {
  it("sends every part once and completes", async () => {
    const server = fakeServer(10);
    const progress: number[] = [];
    const result = await sendFile(file(10), start(10), server.transport, {
      ...quick,
      onProgress: (n) => progress.push(n),
    });
    expect(result).toEqual({ versionId: "v1" });
    expect(server.sent).toEqual([0, 4, 8]);
    expect(progress).toEqual([0, 4, 8, 10]);
  });

  it("continues from the server's offset after a 409", async () => {
    const server = fakeServer(10);
    server.setReceived(8);
    await sendFile(file(10), start(10, 4), server.transport, quick);
    expect(server.sent).toEqual([8]);
  });

  it("asks where to continue after a dropped connection and resends nothing twice", async () => {
    // The second part reaches the server but the answer is lost.
    let lostOnce = false;
    const server = fakeServer(10);
    const inner = server.transport.putPart;
    server.transport.putPart = async (id, offset, part) => {
      const answer = await inner(id, offset, part);
      if (offset === 4 && !lostOnce) {
        lostOnce = true;
        throw new TypeError("Failed to fetch");
      }
      return answer;
    };
    await sendFile(file(10), start(10), server.transport, quick);
    expect(server.sent).toEqual([0, 4, 8]);
  });

  it("waits for the connection while offline without using up its retries", async () => {
    let online = false;
    let waited = 0;
    const server = fakeServer(8, (call) =>
      call <= 20 && !online ? new TypeError("offline") : null,
    );
    await sendFile(file(8), start(8), server.transport, {
      sleep: async () => {},
      maxFailures: 2,
      isOnline: () => online,
      waitOnline: async () => {
        waited += 1;
        if (waited === 3) online = true;
      },
    });
    expect(waited).toBe(3);
    expect(server.sent).toEqual([0, 4]);
  });

  it("stops after repeated failures while online, and resumes later from the same upload", async () => {
    const server = fakeServer(8, (call) => (call >= 2 && call <= 5 ? new TypeError("5xx") : null));
    await expect(
      sendFile(file(8), start(8), server.transport, { ...quick, maxFailures: 3 }),
    ).rejects.toBeInstanceOf(UploadStalledError);
    const resumed = await sendFile(
      file(8),
      start(8, (await server.transport.state("u1")).receivedBytes),
      server.transport,
      quick,
    );
    expect(resumed.versionId).toBe("v1");
    expect(server.sent).toEqual([0, 4]);
  });

  it("does not retry a refusal", async () => {
    const server = fakeServer(8, () => new UploadRefusedError(404, "Belge bulunamadı."));
    await expect(sendFile(file(8), start(8), server.transport, quick)).rejects.toThrow(
      "Belge bulunamadı.",
    );
  });
});
