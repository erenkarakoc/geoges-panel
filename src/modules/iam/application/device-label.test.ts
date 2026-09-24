import { describe, expect, it } from "vitest";

import { deviceLabel } from "@/modules/iam/application/device-label";

describe("deviceLabel", () => {
  it("names the phone and its browser", () => {
    expect(
      deviceLabel(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("iPhone · Safari");
    expect(
      deviceLabel(
        "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
      ),
    ).toBe("Android · Chrome");
  });

  it("tells the browsers that all claim to be Safari or Chrome apart", () => {
    const windows = (tail: string) =>
      deviceLabel(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ${tail}`);
    expect(windows("Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0")).toBe("Windows · Edge");
    expect(windows("Chrome/125.0.0.0 Safari/537.36 OPR/110.0.0.0")).toBe("Windows · Opera");
    expect(windows("Chrome/125.0.0.0 Safari/537.36")).toBe("Windows · Chrome");
    expect(deviceLabel("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/127.0")).toBe(
      "Mac · Firefox",
    );
  });

  it("says so plainly when it cannot tell", () => {
    expect(deviceLabel(null)).toBe("Bilinmeyen cihaz");
    expect(deviceLabel("")).toBe("Bilinmeyen cihaz");
    expect(deviceLabel("curl/8.6.0")).toBe("Bilinmeyen cihaz");
  });
});
