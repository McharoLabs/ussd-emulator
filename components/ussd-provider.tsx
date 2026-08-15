"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  USSD_CONTINUE,
  type LogEntry,
  type UssdApiResponse,
} from "@/lib/ussd-types"

const SESSION_TIMEOUT_SECONDS = Number(
  process.env.NEXT_PUBLIC_USSD_SESSION_TIMEOUT || "120",
)

export type UssdStage =
  | "idle" // no active session
  | "dialing" // request in flight for the first shortcode
  | "sending" // request in flight for a continuation
  | "prompt" // waiting for user input (response type = CONTINUE)
  | "ended" // final message, session closed
  | "timeout" // session timed out
  | "error" // network / gateway error

interface UssdState {
  stage: UssdStage
  message: string
  sessionId: string | null
  expectsInput: boolean
}

interface UssdContextValue extends UssdState {
  logs: LogEntry[]
  dial: (shortcode: string) => Promise<void>
  reply: (input: string) => Promise<void>
  cancel: () => void
  reset: () => void
  clearLogs: () => void
}

const UssdContext = createContext<UssdContextValue | null>(null)

function makeSessionId(): string {
  // numeric session id similar to the sample `089983467`
  return Math.floor(100_000_000 + Math.random() * 900_000_000).toString()
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function UssdProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UssdState>({
    stage: "idle",
    message: "",
    sessionId: null,
    expectsInput: false,
  })
  const [logs, setLogs] = useState<LogEntry[]>([])

  const sessionRef = useRef<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLogs((prev) => [
      ...prev,
      { ...entry, id: uid(), timestamp: Date.now() },
    ])
  }, [])

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  const reset = useCallback(() => {
    clearTimer()
    sessionRef.current = null
    setState({ stage: "idle", message: "", sessionId: null, expectsInput: false })
  }, [clearTimer])

  const armTimeout = useCallback(() => {
    clearTimer()
    timeoutRef.current = setTimeout(() => {
      addLog({
        direction: "info",
        title: "Session timed out",
        body: `No input received within ${SESSION_TIMEOUT_SECONDS}s. The USSD session was closed.`,
        meta: { sessionid: sessionRef.current ?? "-" },
      })
      sessionRef.current = null
      setState((s) => ({
        ...s,
        stage: "timeout",
        expectsInput: false,
        message: "Your session has timed out. Please try again.",
      }))
    }, SESSION_TIMEOUT_SECONDS * 1000)
  }, [addLog, clearTimer])

  const send = useCallback(
    async (msg: string, type: 1 | 2, sessionid: string) => {
      addLog({
        direction: "request",
        title: type === 1 ? "USSD initiation (type 1)" : "User input (type 2)",
        sections: [
          {
            label: "Request body",
            kind: "xml",
            content: `<ussd><sessionid>${sessionid}</sessionid><type>${type}</type><msg>${msg}</msg></ussd>`,
          },
        ],
        meta: { sessionid, type, msg },
      })

      let data: UssdApiResponse
      try {
        const res = await fetch("/api/ussd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionid, type, msg }),
        })
        data = (await res.json()) as UssdApiResponse
      } catch (e) {
        const message = e instanceof Error ? e.message : "Network error"
        addLog({ direction: "error", title: "Client fetch failed", body: message })
        clearTimer()
        sessionRef.current = null
        setState((s) => ({
          ...s,
          stage: "error",
          expectsInput: false,
          message: "Connection problem. Could not reach the emulator backend.",
        }))
        return
      }

      // log the exact XML request the server sent + raw response
      addLog({
        direction: data.error ? "error" : "response",
        title: data.error
          ? "Gateway error"
          : `Gateway response ${data.status || ""} ${data.statusText}`.trim(),
        sections: [
          { label: "Endpoint", kind: "text", content: `POST ${data.endpoint}` },
          { label: "Sent (application/xml)", kind: "xml", content: data.requestXml },
          data.error
            ? { label: "Error", kind: "text", content: data.error }
            : {
                label: "Received (application/xml)",
                kind: "xml",
                content: data.responseXml || "(empty response)",
              },
        ],
        meta: {
          status: data.status,
          durationMs: `${data.durationMs}ms`,
          responseType: data.parsed.type ?? "-",
        },
      })

      if (data.error) {
        clearTimer()
        sessionRef.current = null
        setState((s) => ({
          ...s,
          stage: "error",
          expectsInput: false,
          message: data.error as string,
        }))
        return
      }

      const { type: respType, msg: respMsg } = data.parsed

      if (respType === USSD_CONTINUE) {
        // session continues, expect input
        armTimeout()
        setState({
          stage: "prompt",
          message: respMsg,
          sessionId: sessionid,
          expectsInput: true,
        })
      } else if (respType !== null) {
        // a valid but non-continue type ends the session normally
        clearTimer()
        sessionRef.current = null
        setState({
          stage: "ended",
          message: respMsg || "Session ended.",
          sessionId: sessionid,
          expectsInput: false,
        })
      } else {
        // no parsable USSD <type> in the body -> treat as a gateway problem
        clearTimer()
        sessionRef.current = null
        setState({
          stage: "error",
          message: data.ok
            ? "Unexpected response from the USSD gateway (no <type> field)."
            : `USSD gateway returned HTTP ${data.status} ${data.statusText}.`,
          sessionId: sessionid,
          expectsInput: false,
        })
      }
    },
    [addLog, armTimeout, clearTimer],
  )

  const dial = useCallback(
    async (shortcode: string) => {
      const sessionid = makeSessionId()
      sessionRef.current = sessionid
      addLog({
        direction: "info",
        title: "New session started",
        body: `Dialing ${shortcode}`,
        meta: { sessionid },
      })
      setState({
        stage: "dialing",
        message: `Running USSD code\u2026`,
        sessionId: sessionid,
        expectsInput: false,
      })
      await send(shortcode, 1, sessionid)
    },
    [addLog, send],
  )

  const reply = useCallback(
    async (input: string) => {
      const sessionid = sessionRef.current
      if (!sessionid) {
        addLog({
          direction: "error",
          title: "No active session",
          body: "Tried to send input but the session had already closed (likely timed out).",
        })
        setState((s) => ({
          ...s,
          stage: "timeout",
          expectsInput: false,
          message: "Your session has expired. Please dial again.",
        }))
        return
      }
      clearTimer()
      setState((s) => ({ ...s, stage: "sending", expectsInput: false, message: "Sending\u2026" }))
      await send(input, 2, sessionid)
    },
    [addLog, clearTimer, send],
  )

  const cancel = useCallback(() => {
    if (sessionRef.current) {
      addLog({
        direction: "info",
        title: "Session cancelled by user",
        body: "USSD dialog dismissed.",
        meta: { sessionid: sessionRef.current },
      })
    }
    reset()
  }, [addLog, reset])

  const value = useMemo<UssdContextValue>(
    () => ({
      ...state,
      logs,
      dial,
      reply,
      cancel,
      reset,
      clearLogs,
    }),
    [state, logs, dial, reply, cancel, reset, clearLogs],
  )

  return <UssdContext.Provider value={value}>{children}</UssdContext.Provider>
}

export function useUssd() {
  const ctx = useContext(UssdContext)
  if (!ctx) throw new Error("useUssd must be used within a UssdProvider")
  return ctx
}
