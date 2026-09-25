import { describe, expect, it } from "vitest";

import { reportEndText, reportStepText } from "@/modules/wfl/domain/report-text";

const technical = /[a-z]+_[a-z]+|would|waiting until/;

describe("what a dry run's step did, in Turkish", () => {
  it("says what the engine's own word means", () => {
    expect(reportStepText({ outcome: "sent", status: "done", stepId: "n1", type: "notify" })).toBe(
      "bildirimi gönderdi",
    );
    expect(
      reportStepText({ outcome: "true", status: "done", stepId: "c1", type: "condition" }),
    ).toBe("koşul sağlandı");
  });

  it("names what the step is about, when the catalog knows its name", () => {
    const said = reportStepText(
      { about: "zz-izin", outcome: "would_subflow", status: "done", stepId: "s1", type: "subflow" },
      new Map([["zz-izin", "İzin akışı"]]),
    );
    expect(said).toBe("başka bir akışa devreder (İzin akışı)");
  });

  it("leaves out a code nobody can read instead of showing it", () => {
    const said = reportStepText({
      about: "doc.document",
      outcome: "would_create",
      status: "done",
      stepId: "r1",
      type: "record",
    });
    expect(said).toBe("taslak kayıt oluşturur");
    expect(said).not.toMatch(technical);
  });

  it("falls back to a sentence for a word it has never seen", () => {
    expect(
      reportStepText({ outcome: "brand_new_word", status: "failed", stepId: "x1", type: "task" }),
    ).toBe("akışı durdurdu");
    expect(
      reportStepText({ outcome: "brand_new_word", status: "done", stepId: "x1", type: "task" }),
    ).toBe("tamamlandı");
  });

  it("says when a step would act, in the reader's own clock", () => {
    const said = reportStepText({
      at: "2026-09-25T06:00:00.000Z",
      outcome: "would_wait",
      status: "waiting",
      stepId: "w1",
      type: "wait",
    });
    expect(said.startsWith("bekler · ")).toBe(true);
    expect(said).not.toMatch(/T06:00/);
  });

  it("says where the run ended up", () => {
    expect(reportEndText("done")).toBe("Akış sonuna kadar yürüdü.");
    expect(reportEndText("failed")).toBe("Akış tamamlanamadı.");
    expect(reportEndText(null)).toBeNull();
  });
});
