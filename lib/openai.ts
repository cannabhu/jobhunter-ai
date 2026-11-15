import OpenAI, { APIError } from "openai";

// One retry covers a transient blip; the SDK default of two retries just delays a quota or auth failure.
// The timeout stops a stalled call from leaving a button spinning for the SDK's 10-minute default.
const OPENAI_TIMEOUT_MS = 45_000;
const OPENAI_MAX_RETRIES = 1;
const QUOTA_CODES = new Set(["insufficient_quota", "credit_balance_exhausted"]);

/** Shared by every GPT-4o call in the app. Server context only. */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: OPENAI_TIMEOUT_MS,
  maxRetries: OPENAI_MAX_RETRIES,
});

/** One line that says what went wrong, without the response headers and cookies an APIError carries. */
export function describeOpenAIError(error: APIError): string {
  const code = error.code ?? error.type ?? "unknown";
  const hint = QUOTA_CODES.has(code) ? " — the OpenAI account is out of credits" : "";
  return `OpenAI call failed: status=${error.status ?? "none"} code=${code} requestId=${error.requestID ?? "none"}${hint}. ${error.message}`;
}

export { APIError };
