"use client"

import {
  Power,
  Volume2,
  Volume1,
  RotateCw,
  RotateCcw,
  Camera,
  ZoomIn,
  ChevronLeft,
  Circle,
  Square,
  MoreHorizontal,
  Minus,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface EmulatorToolbarProps {
  powered: boolean
  onPower: () => void
  onBack?: () => void
  onHome?: () => void
}

interface ToolbarItem {
  key: string
  icon: LucideIcon
  onClick?: () => void
}

export function EmulatorToolbar({
  powered,
  onPower,
  onBack,
  onHome,
}: EmulatorToolbarProps) {
  const items: ToolbarItem[] = [
    {
      key: "power",
      icon: Power,
      onClick: onPower,
    },
    {
      key: "vol-up",
      icon: Volume2,
    },
    {
      key: "vol-down",
      icon: Volume1,
    },
    {
      key: "rotate-left",
      icon: RotateCcw,
    },
    {
      key: "rotate-right",
      icon: RotateCw,
    },
    {
      key: "camera",
      icon: Camera,
    },
    {
      key: "zoom",
      icon: ZoomIn,
    },
    {
      key: "back",
      icon: ChevronLeft,
      onClick: onBack,
    },
    {
      key: "home",
      icon: Circle,
      onClick: onHome,
    },
    {
      key: "recents",
      icon: Square,
    },
    {
      key: "more",
      icon: MoreHorizontal,
    },
  ]

  return (
    <div className="flex w-11 flex-col items-center gap-1 rounded-xl border border-neutral-300/60 bg-neutral-100/90 py-2 shadow-lg backdrop-blur">
      <div className="flex w-full items-center justify-end gap-1 px-1.5 pb-1 text-neutral-400">
        <Minus className="h-3 w-3" />
        <X className="h-3 w-3" />
      </div>

      {items.map(({ key, icon: Icon, onClick }) => {
        const isPower = key === "power"

        return (
          <button
            key={key}
            type="button"
            aria-label={key}
            onClick={onClick}
            disabled={!onClick}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              !onClick
                ? "cursor-default"
                : "hover:bg-neutral-200/80"
            } ${
              isPower
                ? powered
                  ? "text-neutral-600 hover:text-neutral-900"
                  : "bg-emerald-500/15 text-emerald-600 hover:text-emerald-700"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Icon
              className="h-[18px] w-[18px]"
              strokeWidth={1.75}
            />
          </button>
        )
      })}
    </div>
  )
}