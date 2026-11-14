import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export const loggerProvider =
  token && host
    ? new LoggerProvider({
        resource: resourceFromAttributes({ "service.name": "job-rider" }),
        processors: [
          new BatchLogRecordProcessor({
            exporter: new OTLPLogExporter({
              url: `${host.replace(/\/$/, "")}/i/v1/logs`,
              timeoutMillis: 2000,
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
          }),
        ],
      })
    : undefined;

if (!loggerProvider && process.env.NODE_ENV !== "production") {
  const missingVariable = token
    ? "NEXT_PUBLIC_POSTHOG_HOST"
    : "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN";

  console.warn(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

// This logger is intentionally separate from the global provider so only logs added here are exported.
export const posthogLogger = loggerProvider?.getLogger("job-rider.posthog");

// Next.js loads this module through its instrumentation hook. Do not register globally.
export function register() {}

export { SeverityNumber };
