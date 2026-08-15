"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Power } from "lucide-react"
import { HomeScreen } from "./home-screen"
import { PhoneApp } from "./phone-app"
import { EmulatorToolbar } from "./emulator-toolbar"
import { useUssd } from "@/components/ussd-provider"

type Screen = "home" | "phone"
type PowerState = "on" | "off" | "booting" | "powering-off"

interface PhoneFrameProps {
  onClose: () => void
}

function NavBar({
  onBack,
  onHome,
}: {
  onBack: () => void
  onHome: () => void
}) {
  return (
    <div className="flex h-11 items-center justify-around bg-black">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex h-full w-16 items-center justify-center text-white/90 active:opacity-60"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          className="fill-current"
        >
          <path d="M12 4 4 12l8 8 1.4-1.4L7.8 13H20v-2H7.8l5.6-5.6z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onHome}
        aria-label="Home"
        className="flex h-full w-16 items-center justify-center text-white/90 active:opacity-60"
      >
        <span className="h-4 w-4 rounded-full border-2 border-white/90" />
      </button>

      <button
        type="button"
        aria-label="Recent apps"
        className="flex h-full w-16 items-center justify-center text-white/90 active:opacity-60"
      >
        <span className="h-3.5 w-3.5 rounded-[3px] border-2 border-white/90" />
      </button>
    </div>
  )
}

function BootScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 bg-black">
      <span className="text-lg font-medium tracking-[0.2em] text-white/90">
        ANDROID
      </span>

      <div className="flex gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" />
      </div>
    </div>
  )
}

function PowerOffScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-black">
      <Power
        className="h-12 w-12 animate-pulse text-neutral-500"
        strokeWidth={1.5}
      />

      <div className="text-center">
        <p className="text-sm font-medium text-neutral-300">
          Powering off
        </p>

        <div className="mt-3 flex justify-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" />
        </div>
      </div>
    </div>
  )
}

function PoweredOffScreen() {
  return <div className="h-full w-full bg-black" />
}

export function PhoneFrame({ onClose }: PhoneFrameProps) {
  const [screen, setScreen] = useState<Screen>("home")

  // Actual phone power state.
  const [power, setPower] = useState<PowerState>("booting")

  const { reset, stage } = useUssd()

  const powerTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initial emulator boot.
  useEffect(() => {
    powerTimer.current = setTimeout(() => {
      setPower("on")
    }, 1800)

    return () => {
      if (powerTimer.current) {
        clearTimeout(powerTimer.current)
      }
    }
  }, [])

  const goHome = useCallback(() => {
    if (stage !== "idle") {
      reset()
    }

    setScreen("home")
  }, [reset, stage])

  const goBack = useCallback(() => {
    if (stage !== "idle") {
      reset()
      return
    }

    setScreen("home")
  }, [reset, stage])

  const openApp = useCallback((key: string) => {
    if (key === "phone") {
      setScreen("phone")
    }
  }, [])

  const togglePower = useCallback(() => {
    /*
     * POWER OFF
     *
     * ON
     *   ↓
     * POWERING OFF
     *   ↓ 1.8s
     * OFF
     */
    if (power === "on") {
      if (stage !== "idle") {
        reset()
      }

      setScreen("home")
      setPower("powering-off")

      if (powerTimer.current) {
        clearTimeout(powerTimer.current)
      }

      powerTimer.current = setTimeout(() => {
        setPower("off")
      }, 1800)

      return
    }

    /*
     * POWER ON
     *
     * OFF
     *   ↓
     * BOOTING
     *   ↓ 1.8s
     * ON
     */
    if (power === "off") {
      setPower("booting")

      if (powerTimer.current) {
        clearTimeout(powerTimer.current)
      }

      powerTimer.current = setTimeout(() => {
        setPower("on")
      }, 1800)

      return
    }

    // Ignore power button while transitioning.
  }, [power, reset, stage])

  const powered = power === "on"

  return (
    <div className="flex items-start gap-3">
      {/* Device */}
      <div className="relative rounded-[2.75rem] bg-neutral-900 p-2.5 shadow-2xl ring-1 ring-black/40">
        {/* Top chin */}
        <div className="flex h-9 items-center justify-center gap-6">
          <span className="h-2 w-2 rounded-full bg-neutral-700 ring-1 ring-neutral-600" />
          <span className="h-1.5 w-16 rounded-full bg-neutral-700" />
        </div>

        {/* Screen */}
        <div className="h-[660px] w-[312px] overflow-hidden rounded-md bg-black">
          {power === "powering-off" ? (
            <PowerOffScreen />
          ) : power === "booting" ? (
            <BootScreen />
          ) : power === "off" ? (
            <PoweredOffScreen />
          ) : (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1 overflow-hidden">
                {screen === "home" ? (
                  <HomeScreen onOpenApp={openApp} />
                ) : (
                  <PhoneApp />
                )}
              </div>

              <NavBar
                onBack={goBack}
                onHome={goHome}
              />
            </div>
          )}
        </div>

        {/* Bottom chin */}
        <div className="flex h-8 items-center justify-center">
          <span className="h-1 w-24 rounded-full bg-neutral-700" />
        </div>

        {/* Side buttons */}
        <span className="absolute -right-1 top-28 h-16 w-1 rounded-r bg-neutral-800" />
        <span className="absolute -right-1 top-48 h-10 w-1 rounded-r bg-neutral-800" />
      </div>

      {/* Toolbar */}
      <EmulatorToolbar
        powered={powered}
        onPower={togglePower}
        onBack={powered ? goBack : undefined}
        onHome={powered ? goHome : undefined}
      />
    </div>
  )
}