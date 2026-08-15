"use client"

import { useEffect, useState } from "react"
import { Wifi, BatteryFull, Settings } from "lucide-react"

function SignalBars() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true" className="fill-current">
      <rect x="0" y="8" width="3" height="4" rx="0.5" />
      <rect x="4.5" y="5" width="3" height="7" rx="0.5" />
      <rect x="9" y="2.5" width="3" height="9.5" rx="0.5" />
      <rect x="13" y="0" width="3" height="12" rx="0.5" opacity="0.4" />
    </svg>
  )
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const [time, setTime] = useState("")

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      )
    update()
    const id = setInterval(update, 10_000)
    return () => clearInterval(id)
  }, [])

  const color = dark ? "text-neutral-900" : "text-white"

  return (
    <div className={`flex items-center justify-between px-4 pt-2 text-xs font-medium ${color}`}>
      <div className="flex items-center gap-1.5">
        <span className="tabular-nums">{time || "11:26"}</span>
        <Settings className="h-3 w-3" strokeWidth={2} />
      </div>
      <div className="flex items-center gap-1.5">
        <SignalBars />
        <Wifi className="h-3.5 w-3.5" strokeWidth={2.5} />
        <BatteryFull className="h-4 w-4" strokeWidth={2} />
      </div>
    </div>
  )
}
