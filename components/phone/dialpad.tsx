"use client"

import { Phone, Delete } from "lucide-react"

const KEYS: { digit: string; letters?: string }[] = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
]

interface DialpadProps {
  value: string
  onKey: (digit: string) => void
  onDelete: () => void
  onCall: () => void
  disabled?: boolean
}

export function Dialpad({ value, onKey, onDelete, onCall, disabled }: DialpadProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* number display - flexible, shrinks first */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-6">
        <span className="w-full break-all text-center text-4xl font-light tracking-wide text-neutral-800">
          {value || <span className="text-neutral-300">Dial a code</span>}
        </span>
      </div>

      {/* keypad - fixed, never clipped */}
      <div className="shrink-0 px-7">
        <div className="grid grid-cols-3 gap-y-1">
          {KEYS.map((k) => (
            <button
              key={k.digit}
              type="button"
              onClick={() => onKey(k.digit)}
              disabled={disabled}
              className="mx-auto flex h-14 w-14 flex-col items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-40"
              aria-label={`Key ${k.digit}`}
            >
              <span className="text-[26px] font-normal leading-none">{k.digit}</span>
              {k.letters ? (
                <span className="mt-0.5 text-[8px] font-semibold tracking-[0.15em] text-neutral-500">
                  {k.letters}
                </span>
              ) : (
                <span className="mt-0.5 h-[8px]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* call row - fixed */}
      <div className="relative flex shrink-0 items-center justify-center pb-5 pt-3">
        <button
          type="button"
          onClick={onCall}
          disabled={disabled || !value}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00a15b] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Call"
        >
          <Phone className="h-6 w-6" fill="currentColor" strokeWidth={0} />
        </button>

        {value && !disabled ? (
          <button
            type="button"
            onClick={onDelete}
            className="absolute right-9 flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 active:bg-neutral-200"
            aria-label="Delete last digit"
          >
            <Delete className="h-6 w-6" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
