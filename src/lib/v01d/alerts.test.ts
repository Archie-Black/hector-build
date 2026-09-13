import { describe, expect, it } from "vitest";
import { ingest, sayAlerts } from "./alerts";

describe("prometheus alerts", () => {
  it("keeps firing, drops resolved, speaks plainly", () => {
    ingest({
      alerts: [
        {
          status: "firing",
          labels: { alertname: "WebsiteDown", severity: "page" },
          annotations: { summary: "The website process is down." },
        },
      ],
    });
    expect(sayAlerts()).toMatch(/website process is down/i);
    ingest({
      alerts: [
        {
          status: "resolved",
          labels: { alertname: "WebsiteDown", severity: "page" },
          annotations: { summary: "The website process is down." },
        },
      ],
    });
    expect(sayAlerts()).toMatch(/No website alerts/);
  });
});
