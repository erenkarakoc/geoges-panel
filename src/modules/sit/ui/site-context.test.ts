import { describe, expect, it } from "vitest";

import { resolveSiteRoute, siteSectionHref, siteSections } from "@/modules/sit/ui/site-context";

const now = new Date("2026-09-17T09:00:00Z");
const kavakli = { id: "kavakli", name: "Kavaklı Şantiyesi", note: "Örnek proje" };
const ilgaz = { id: "ilgaz", name: "Ilgaz Şantiyesi", note: "Örnek proje" };

describe("resolveSiteRoute", () => {
  it("opens the day section on the site address", () => {
    const route = resolveSiteRoute(kavakli, undefined, undefined, now);
    expect(route?.site.name).toBe("Kavaklı Şantiyesi");
    expect(route?.section.label).toBe("Gün");
    expect(route?.day).toBe("2026-09-17");
  });

  it("reads the section and a past day", () => {
    const route = resolveSiteRoute(ilgaz, ["dokum"], "2026-09-14", now);
    expect(route?.section.label).toBe("Döküm");
    expect(route?.day).toBe("2026-09-14");
  });

  it("falls back to today for future or broken days", () => {
    expect(resolveSiteRoute(ilgaz, ["dokum"], "2026-09-20", now)?.day).toBe("2026-09-17");
    expect(resolveSiteRoute(ilgaz, ["dokum"], "dün", now)?.day).toBe("2026-09-17");
  });

  it("rejects unknown sites, sections and deeper paths", () => {
    expect(resolveSiteRoute(null, undefined, undefined, now)).toBeNull();
    expect(resolveSiteRoute(kavakli, ["unknown"], undefined, now)).toBeNull();
    expect(resolveSiteRoute(kavakli, ["dokum", "extra"], undefined, now)).toBeNull();
  });
});

describe("siteSectionHref", () => {
  it("keeps the day section on the bare site address", () => {
    expect(siteSectionHref("kavakli", siteSections[0])).toBe("/sites/kavakli");
    expect(siteSectionHref("kavakli", siteSections[1])).toBe("/sites/kavakli/dokum");
  });
});
