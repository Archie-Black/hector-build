import { describe, expect, it } from "vitest";
import { otelReady, span, tracePayload } from "./otel";

describe("opentelemetry", () => {
  it("is silent when no collector is configured", () => {
    expect(otelReady()).toBe(false);
  });

  it("builds a valid OTLP span", () => {
    const p = tracePayload("GET /api/v1/v01d/cloud", 1_000, 1_040, true);
    const span = p.resourceSpans[0].scopeSpans[0].spans[0];
    expect(span.traceId).toHaveLength(32);
    expect(span.spanId).toHaveLength(16);
    expect(span.status.code).toBe(1);
    expect(span.name).toBe("GET /api/v1/v01d/cloud");
  });

  it("does not throw if the collector is missing", async () => {
    await expect(span("test", async () => 7)).resolves.toBe(7);
  });
});
