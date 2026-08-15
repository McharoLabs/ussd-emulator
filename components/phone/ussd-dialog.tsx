"use client"

import { useEffect, useRef, useState } from "react"
import { useUssd } from "@/components/ussd-provider"

export function UssdDialog() {
  const { stage, message, expectsInput, reply, cancel, reset } = useUssd()
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const busy = stage === "dialing" || stage === "sending"
  const isEndState = stage === "ended" || stage === "timeout" || stage === "error"

  useEffect(() => {
    setInput("")
  }, [message])

  useEffect(() => {
    if (expectsInput) {
      const id = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [expectsInput])

  if (stage === "idle") return null

  const handleSend = () => {
    if (!input.trim() || busy) return
    void reply(input.trim())
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-[280px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-5 pt-5">
          <p className="text-sm font-medium text-neutral-500">USSD</p>
          <div className="mt-2 max-h-64 overflow-y-auto">
            {busy ? (
              <div className="flex items-center gap-3 py-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-[#1a73e8]" />
                <span className="text-[15px] text-neutral-700">{message}</span>
              </div>
            ) : (
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-neutral-800">
                {message}
              </p>
            )}
          </div>

          {expectsInput ? (
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSend()
              }}
              inputMode="numeric"
              placeholder="Reply"
              className="mt-3 w-full border-b-2 border-[#1a73e8] bg-transparent pb-1 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
            />
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-1 px-3 py-2">
          {expectsInput ? (
            <>
              <button
                type="button"
                onClick={cancel}
                className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-wide text-neutral-500 transition-colors hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={busy || !input.trim()}
                className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#1a73e8] transition-colors hover:bg-blue-50 disabled:opacity-40"
              >
                Send
              </button>
            </>
          ) : isEndState ? (
            <button
              type="button"
              onClick={reset}
              className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#1a73e8] transition-colors hover:bg-blue-50"
            >
              OK
            </button>
          ) : (
            <button
              type="button"
              onClick={cancel}
              className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-wide text-neutral-500 transition-colors hover:bg-neutral-100"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
