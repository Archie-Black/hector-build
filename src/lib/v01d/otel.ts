/** OpenTelemetry OTLP/HTTP. No-op unless OTEL_EXPORTER_OTLP_ENDPOINT is set. */

function endpoint() {
  if (typeof process === "undefined") return "";
  return (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "").replace(/\/$/, "");
}

function serviceName() {
  if (typeof process === "undefined") return "osv01d";
  return process.env.OTEL_SERVICE_NAME || "osv01d";
}

function hex(bytes: number) {
  const b = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < bytes; i++) b[i] = Math.floor(Math.random() * 256);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function otelReady() {
  return Boolean(endpoint());
}

export function tracePayload(name: string, startMs: number, endMs: number, ok: boolean) {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: "service.name", value: { stringValue: serviceName() } },
            { key: "service.namespace", value: { stringValue: "osv01d" } },
          ],
        },
        scopeSpans: [
          {
            scope: { name: "hector" },
            spans: [
              {
                traceId: hex(16),
                spanId: hex(8),
                name,
                kind: 2,
                startTimeUnixNano: String(BigInt(startMs) * 1000000n),
                endTimeUnixNano: String(BigInt(endMs) * 1000000n),
                status: { code: ok ? 1 : 2 },
              },
            ],
          },
        ],
      },
    ],
  };
}

async function push(path: string, body: unknown) {
  const base = endpoint();
  if (!base) return;
  try {
    await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* collector down: never block the request */
  }
}

export async function span<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  try {
    const out = await fn();
    void push("/v1/traces", tracePayload(name, t0, Date.now(), true));
    return out;
  } catch (err) {
    void push("/v1/traces", tracePayload(name, t0, Date.now(), false));
    throw err;
  }
}
