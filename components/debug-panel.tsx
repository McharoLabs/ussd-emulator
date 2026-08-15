"use client"

import { useEffect, useRef } from "react"
import { ArrowUpRight, ArrowDownLeft, Info, TriangleAlert, Trash2 } from "lucide-react"
import { useUssd } from "@/components/ussd-provider"
import type { LogDirection, LogEntry, LogSection } from "@/lib/ussd-types"

const META: Record<
  LogDirection,
  { label: string; icon: typeof Info; className: string; dot: string }
> = {
  request: { label: "REQUEST", icon: ArrowUpRight, className: "text-sky-300", dot: "bg-sky-400" },
  response: {
    label: "RESPONSE",
    icon: ArrowDownLeft,
    className: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  error: { label: "ERROR", icon: TriangleAlert, className: "text-red-300", dot: "bg-red-400" },
  info: { label: "INFO", icon: Info, className: "text-amber-300", dot: "bg-amber-400" },
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

// Pretty-print a single-line XML string into indented lines.
function prettyXml(input: string): string {
  const xml = input.replace(/>\s*</g, "><").trim()
  if (!xml.startsWith("<")) return input
  const tokens = xml.match(/<[^>]+>|[^<]+/g) || []
  const lines: string[] = []
  let indent = 0
  const pad = () => "  ".repeat(Math.max(indent, 0))

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].trim()
    if (!t) continue

    if (t.startsWith("<?")) {
      lines.push(pad() + t)
    } else if (t.startsWith("</")) {
      indent = Math.max(indent - 1, 0)
      lines.push(pad() + t)
    } else if (t.startsWith("<") && t.endsWith("/>")) {
      lines.push(pad() + t)
    } else if (t.startsWith("<")) {
      const next = (tokens[i + 1] ?? "").trim()
      const nextNext = (tokens[i + 2] ?? "").trim()
      // inline simple <tag>value</tag>
      if (next && !next.startsWith("<") && nextNext.startsWith("</")) {
        lines.push(pad() + t + next + nextNext)
        i += 2
      } else {
        lines.push(pad() + t)
        indent++
      }
    } else {
      lines.push(pad() + t)
    }
  }
  return lines.join("\n")
}

function highlight(line: string, key: number) {
  const parts = line.split(/(<\/?[^>]*>)/g).filter((p) => p !== "")
  return (
    <span key={key}>
      {parts.map((p, i) =>
        p.startsWith("<") ? (
          <span key={i} className="text-sky-300">
            {p}
          </span>
        ) : (
          <span key={i} className="text-amber-200">
            {p}
          </span>
        ),
      )}
      {"\n"}
    </span>
  )
}

function SectionBlock({ section }: { section: LogSection }) {
  const body =
    section.kind === "xml" ? prettyXml(section.content) : section.content
  return (
    <div className="mt-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
        {section.label}
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-neutral-800 bg-black/60 px-3 py-2 leading-relaxed text-neutral-300">
        {section.kind === "xml"
          ? body.split("\n").map((line, i) => highlight(line, i))
          : body}
      </pre>
    </div>
  )
}

function LogItem({ entry }: { entry: LogEntry }) {
  const m = META[entry.direction]
  const Icon = m.icon
  return (
    <div className="border-b border-neutral-800/70 px-4 py-3 font-mono text-xs">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${m.dot}`} />
        <Icon className={`h-3.5 w-3.5 ${m.className}`} />
        <span className={`font-semibold tracking-wide ${m.className}`}>{m.label}</span>
        <span className="truncate text-neutral-400">{entry.title}</span>
        <span className="ml-auto shrink-0 text-neutral-600">{fmtTime(entry.timestamp)}</span>
      </div>

      {entry.meta ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(entry.meta).map(([k, v]) => (
            <span
              key={k}
              className="rounded bg-neutral-800/80 px-1.5 py-0.5 text-[10px] text-neutral-400"
            >
              <span className="text-neutral-500">{k}:</span>{" "}
              <span className="text-neutral-200">{String(v)}</span>
            </span>
          ))}
        </div>
      ) : null}

      {entry.sections?.map((s, i) => <SectionBlock key={i} section={s} />)}

      {!entry.sections && entry.body ? (
        <pre className="mt-2 whitespace-pre-wrap break-words leading-relaxed text-neutral-300">
          {entry.body}
        </pre>
      ) : null}
    </div>
  )
}

export function DebugPanel() {
  const { logs, clearLogs } = useUssd()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [logs])

  return (
    <div className="flex h-full min-h-[420px] flex-col bg-[#1b1b1b]">
      <div className="flex shrink-0 items-center gap-2 border-b border-neutral-800 bg-[#232323] px-4 py-2.5">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-mono text-[11px] text-neutral-400">
            {logs.length} {logs.length === 1 ? "entry" : "entries"}
          </span>
        </span>
        <button
          type="button"
          onClick={clearLogs}
          disabled={logs.length === 0}
          className="ml-auto flex items-center gap-1.5 rounded-md border border-neutral-700 px-2.5 py-1 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear logs
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-neutral-600">
            <p className="font-mono text-sm text-neutral-500">$ awaiting USSD traffic…</p>
            <p className="text-xs text-neutral-600">
              Dial a shortcode in the emulator to capture requests and responses.
            </p>
          </div>
        ) : (
          logs.map((entry) => <LogItem key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  )
}
