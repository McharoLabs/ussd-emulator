// Shared types for the USSD emulator flow.

// Response `type` semantics used by most gateways:
//   2 = CONTINUE  -> the session stays open, user must reply
//   anything else -> END (final message, session closes)
export const USSD_CONTINUE = "2"

export interface UssdApiRequest {
  sessionid: string
  // 1 = new session (dialing the shortcode), 2 = continuation (user input)
  type: 1 | 2
  msg: string
  // optional per-request overrides
  imsi?: string
  msisdn?: string
}

export interface UssdParsed {
  type: string | null
  msg: string
}

export interface UssdApiResponse {
  ok: boolean
  status: number
  statusText: string
  durationMs: number
  endpoint: string
  requestXml: string
  responseXml: string
  parsed: UssdParsed
  error?: string
}

export type LogDirection = "request" | "response" | "error" | "info"

export interface LogSection {
  label: string
  content: string
  // "xml" gets pretty-printed + highlighted, "text" is shown as-is
  kind: "xml" | "text"
}

export interface LogEntry {
  id: string
  direction: LogDirection
  timestamp: number
  title: string
  body?: string
  sections?: LogSection[]
  meta?: Record<string, string | number>
}
