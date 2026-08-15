"use client"

import { useEffect, useState } from "react"
import {
  Bug,
  Wifi,
  Volume2,
  BatteryFull,
  Search,
  Smartphone,
  TerminalSquare,
} from "lucide-react"
import { UssdProvider } from "@/components/ussd-provider"
import { PhoneFrame } from "@/components/phone/phone-frame"
import { DebugPanel } from "@/components/debug-panel"

function TopPanel() {
  const [clock, setClock] = useState("")

  useEffect(() => {
    const update = () =>
      setClock(
        new Date().toLocaleDateString([], {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      )

    update()

    const id = setInterval(update, 10_000)

    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex h-7 shrink-0 items-center justify-between bg-[#1d1d1d] px-3 text-xs font-medium text-neutral-200">
      <span className="flex items-center gap-1">
        <span className="grid grid-cols-3 gap-[2px]" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="h-[3px] w-[3px] rounded-[1px] bg-neutral-400"
            />
          ))}
        </span>

        Activities
      </span>

      <span className="tabular-nums text-neutral-100">
        {clock || "USSD Emulator"}
      </span>

      <span className="flex items-center gap-2 text-neutral-300">
        <Wifi className="h-3.5 w-3.5" />
        <Volume2 className="h-3.5 w-3.5" />
        <BatteryFull className="h-4 w-4" />
      </span>
    </div>
  )
}

function Dock({
  debug,
  emulatorVisible,
  onToggleDebug,
  onToggleEmulator,
}: {
  debug: boolean
  emulatorVisible: boolean
  onToggleDebug: () => void
  onToggleEmulator: () => void
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-3 bg-black/30 px-2 py-3 backdrop-blur">
      {/* Show / hide emulator window ONLY */}
      <button
        type="button"
        onClick={onToggleEmulator}
        aria-pressed={emulatorVisible}
        aria-label={
          emulatorVisible
            ? "Hide emulator"
            : "Show emulator"
        }
        className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-md ring-1 transition-colors ${
          emulatorVisible
            ? "bg-gradient-to-br from-[#77216f] to-[#E95420] text-white ring-white/10"
            : "bg-[#2b2b2b] text-neutral-500 ring-white/10 hover:bg-[#383838] hover:text-neutral-300"
        }`}
      >
        <Smartphone className="h-6 w-6" />
      </button>

      {/* Debug */}
      <button
        type="button"
        onClick={onToggleDebug}
        aria-pressed={debug}
        aria-label="Toggle debug console"
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl shadow-md ring-1 transition-colors ${
          debug
            ? "bg-[#E95420] text-white ring-white/20"
            : "bg-[#2b2b2b] text-neutral-300 ring-white/10 hover:bg-[#383838]"
        }`}
      >
        <TerminalSquare className="h-6 w-6" />

        {debug ? (
          <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white" />
        ) : null}
      </button>
    </div>
  )
}

function WindowChrome({
  title,
  icon,
  accent = false,
  children,
  onClose,
}: {
  title: string
  icon: React.ReactNode
  accent?: boolean
  children: React.ReactNode
  onClose?: () => void
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-black/40 shadow-2xl">
      <div
        className={`flex h-9 shrink-0 items-center gap-2 px-3 ${
          accent
            ? "bg-[#300a24] text-neutral-200"
            : "bg-[#3a3a3a] text-neutral-200"
        }`}
      >
        {icon}

        <span className="text-xs font-medium">
          {title}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-neutral-500/60" />

          <span className="h-3 w-3 rounded-full bg-neutral-500/60" />

          <button
            type="button"
            onClick={onClose}
            disabled={!onClose}
            aria-label={onClose ? "Close window" : undefined}
            className={`h-3 w-3 rounded-full bg-[#E95420] ${
              onClose
                ? "cursor-pointer hover:opacity-70"
                : "cursor-default"
            }`}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export default function Page() {
  const [debug, setDebug] = useState(false)

  /*
   * ONLY controls whether the emulator is visually shown.
   *
   * It has NOTHING to do with phone power.
   */
  const [emulatorVisible, setEmulatorVisible] = useState(true)

  return (
    <UssdProvider>
      <main className="flex h-screen w-full flex-col overflow-hidden bg-[#2c001e]">
        <TopPanel />

        <div className="flex min-h-0 flex-1">
          <Dock
            debug={debug}
            emulatorVisible={emulatorVisible}
            onToggleDebug={() => setDebug((d) => !d)}
            onToggleEmulator={() =>
              setEmulatorVisible((visible) => !visible)
            }
          />

          <div className="min-h-0 flex-1 overflow-hidden bg-gradient-to-br from-[#2c001e] via-[#5b1652] to-[#772953] p-4 sm:p-6 lg:p-8">
            <div
              className={`mx-auto flex w-full max-w-6xl flex-col items-center gap-6 ${
                debug
                  ? "lg:flex-row lg:items-stretch lg:justify-center"
                  : "lg:items-center"
              }`}
            >
              {/* EMULATOR */}
              {/*
               * PhoneFrame is ALWAYS mounted.
               *
               * We only hide its WINDOW visually.
               * This preserves:
               * - power state
               * - current screen
               * - boot state
               * - USSD state
               */}
              <div
                className={`shrink-0 ${
                  emulatorVisible ? "" : "hidden"
                }`}
              >
                <WindowChrome
                  title="Android Emulator - Pixel 2 :5554"
                  accent
                  icon={
                    <Smartphone className="h-4 w-4 text-[#E95420]" />
                  }
                  onClose={() => setEmulatorVisible(false)}
                >
                  <div className="bg-[#1e1e1e] p-4">
                    <PhoneFrame
                      onClose={() => setEmulatorVisible(false)}
                    />
                  </div>
                </WindowChrome>
              </div>

              {/* DEBUG CONSOLE */}
              {debug ? (
                <div className="flex h-[calc(100vh-7rem)] min-h-0 w-full min-w-0 flex-1 lg:max-w-2xl">
                  <WindowChrome
                    title="Debug Console - USSD traffic"
                    icon={
                      <TerminalSquare className="h-4 w-4 text-emerald-400" />
                    }
                    onClose={() => setDebug(false)}
                  >
                    <DebugPanel />
                  </WindowChrome>
                </div>
              ) : null}
            </div>

            {!debug ? (
              <p className="mx-auto mt-6 flex max-w-6xl items-center justify-center gap-2 text-xs text-white/50">
                <Bug className="h-3.5 w-3.5" />

                Open the Debug console from the dock to inspect USSD
                requests and responses.

                <Search className="h-3.5 w-3.5" />
              </p>
            ) : null}
          </div>
        </div>
      </main>
    </UssdProvider>
  )
}