"use client"

import { useState } from "react"
import { StatusBar } from "./status-bar"
import { Dialpad } from "./dialpad"
import { UssdDialog } from "./ussd-dialog"
import { useUssd } from "@/components/ussd-provider"

export function PhoneApp() {
  const [number, setNumber] = useState("")
  const { dial, stage } = useUssd()

  const dialogOpen = stage !== "idle"

  const handleCall = () => {
    if (!number) return
    void dial(number)
    setNumber("")
  }

  return (
    <div className="relative flex h-full flex-col bg-white">
      <div className="bg-white text-neutral-800">
        <StatusBar dark />
      </div>

      <div className="flex items-center px-5 py-3">
        <h1 className="text-lg font-medium text-neutral-700">Phone</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        <Dialpad
          value={number}
          onKey={(d) => setNumber((n) => n + d)}
          onDelete={() => setNumber((n) => n.slice(0, -1))}
          onCall={handleCall}
          disabled={dialogOpen}
        />
      </div>

      <UssdDialog />
    </div>
  )
}
