"use client"

import { Phone, MessageSquare } from "lucide-react"
import { StatusBar } from "./status-bar"

function PlayStoreIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden="true">
      <path fill="#00c3ff" d="M7 4.5v39l21-19.5z" />
      <path fill="#00e676" d="M7 4.5 33 20l6-5.5L11 3z" />
      <path fill="#ff3d00" d="M7 43.5 33 28l6 5.5L11 45z" />
      <path fill="#ffea00" d="M33 20l6.5 4-6.5 4-5-4z" />
    </svg>
  )
}

function ChromeIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
      <circle cx="24" cy="24" r="20" fill="#fff" />
      <circle cx="24" cy="24" r="8.5" fill="#1a73e8" />
      <path fill="#ea4335" d="M24 4a20 20 0 0 1 17.3 10H24a10 10 0 0 0-8.6 4.9L7 9.9A20 20 0 0 1 24 4z" />
      <path fill="#4caf50" d="M6.7 10.4 15.4 25a10 10 0 0 0 9.9 9L20 43.7A20 20 0 0 1 6.7 10.4z" />
      <path fill="#ffc107" d="M41.3 14A20 20 0 0 1 25.3 43.9L32.6 30A10 10 0 0 0 33 15z" />
    </svg>
  )
}

const DOCK = [
  {
    key: "phone",
    label: "Phone",
    bg: "bg-[#00a15b]",
    icon: <Phone className="h-6 w-6 text-white" fill="currentColor" strokeWidth={0} />,
  },
  {
    key: "messages",
    label: "Messages",
    bg: "bg-[#1a73e8]",
    icon: <MessageSquare className="h-6 w-6 text-white" fill="currentColor" strokeWidth={0} />,
  },
  { key: "play", label: "Play Store", bg: "bg-white", icon: <PlayStoreIcon /> },
  { key: "chrome", label: "Chrome", bg: "bg-white", icon: <ChromeIcon /> },
] as const

export function HomeScreen({ onOpenApp }: { onOpenApp: (key: string) => void }) {
  const date = new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })

  return (
    <div
      className="relative flex h-full flex-col bg-cover bg-center"
      style={{ backgroundImage: "url(/wallpaper.png)" }}
    >
      <StatusBar />

      {/* date widget */}
      <div className="pt-6 text-center">
        <p className="text-lg font-medium text-white drop-shadow">{date}</p>
      </div>

      <div className="flex-1" />

      {/* Google search pill */}
      <div className="mb-4 px-5">
        <div className="flex items-center gap-3 rounded-full bg-white/95 px-5 py-3 shadow-lg">
          <span
            className="text-lg font-bold"
            style={{
              background: "linear-gradient(90deg,#4285f4,#ea4335,#fbbc05,#34a853)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            G
          </span>
          <span className="flex-1 text-sm text-neutral-500">Search</span>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4285f4]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ea4335]" />
          </div>
        </div>
      </div>

      {/* dock */}
      <div className="flex items-end justify-around px-6 pb-5">
        {DOCK.map((app) => (
          <button
            key={app.key}
            type="button"
            onClick={() => onOpenApp(app.key)}
            className="flex flex-col items-center gap-1.5"
            aria-label={`Open ${app.label}`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-transform active:scale-90 ${app.bg}`}
            >
              {app.icon}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
