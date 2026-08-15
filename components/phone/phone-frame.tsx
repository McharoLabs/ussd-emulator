"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Power } from "lucide-react";
import { HomeScreen } from "./home-screen";
import { PhoneApp } from "./phone-app";
import { EmulatorToolbar } from "./emulator-toolbar";
import { useUssd } from "@/components/ussd-provider";

type Screen = "home" | "phone";
type PowerState = "on" | "off" | "booting" | "powering-off";

interface PhoneFrameProps {
  onClose: () => void;
}

const TRANSITION_DURATION = 1000 * 10;

function NavBar({
  onBack,
  onHome,
}: {
  onBack: () => void;
  onHome: () => void;
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
          <path d="M12 4 4 12l8 8 8 8 1.4-1.4L7.8 13H20v-2H7.8l5.6-5.6z" />
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
  );
}

function TransformerAnimation({ shuttingDown }: { shuttingDown: boolean }) {
  const letters = "TRANSFORMER SQUAD".split("");

  return (
    <div
      className={`relative flex h-full w-full overflow-hidden bg-black ${
        shuttingDown ? "animate-[screenPulse_4s_ease-in-out_infinite]" : ""
      }`}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-3xl animate-[corePulse_3s_ease-in-out_infinite]" />

        <div className="absolute left-[-30%] top-[15%] h-32 w-[160%] rotate-[-25deg] bg-emerald-400/[0.04] blur-2xl animate-[scanMove_5s_linear_infinite]" />

        <div className="absolute left-[-30%] top-[70%] h-20 w-[160%] rotate-[18deg] bg-cyan-400/[0.03] blur-2xl animate-[scanMoveReverse_7s_linear_infinite]" />
      </div>

      {/* Moving grid */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div
          className="absolute inset-[-50%] animate-[gridRotate_20s_linear_infinite]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Particle field */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 70 }).map((_, index) => {
          const left = (index * 37) % 100;
          const top = (index * 61) % 100;
          const delay = (index % 15) * 0.18;

          return (
            <span
              key={index}
              className="absolute h-[2px] w-[2px] rounded-full bg-white/60 animate-[particleFloat_4s_ease-in-out_infinite]"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      {/* Central reactor */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/20 animate-[reactorSpin_8s_linear_infinite]" />

        <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20 border-dashed animate-[reactorSpinReverse_6s_linear_infinite]" />

        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 animate-[reactorPulse_2s_ease-in-out_infinite]" />
      </div>

      {/* Main logo */}
      <div className="relative z-10 m-auto flex w-full flex-col items-center justify-center">
        <div className="mb-8 flex flex-wrap justify-center px-6">
          {letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className={`
                inline-block min-w-[0.32em]
                text-xl font-black tracking-[0.08em]
                text-white
                drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]
                animate-[letterAssemble_5s_cubic-bezier(.2,.8,.2,1)_both]
              `}
              style={{
                animationDelay: `${index * 0.13}s`,
              }}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </div>

        {/* Horizontal energy line */}
        <div className="relative h-px w-56 overflow-hidden bg-white/10">
          <div className="absolute inset-y-0 left-[-30%] w-1/3 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[energySweep_2s_linear_infinite]" />
        </div>

        {/* Subtitle */}
        <div className="mt-6 overflow-hidden">
          <p className="text-[9px] font-medium uppercase tracking-[0.45em] text-white/40 animate-[subtitleReveal_3s_ease-out_1.8s_both]">
            {shuttingDown ? "SYSTEM SHUTTING DOWN" : "SYSTEM INITIALIZING"}
          </p>
        </div>

        {/* Status */}
        <div className="mt-5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />

          <span className="text-[8px] uppercase tracking-[0.35em] text-emerald-400/60">
            {shuttingDown ? "POWERING DOWN" : "BOOT SEQUENCE"}
          </span>
        </div>
      </div>

      {/* Corner HUD */}
      <div className="absolute left-4 top-4 text-[7px] uppercase tracking-[0.3em] text-white/20">
        TS // CORE
      </div>

      <div className="absolute right-4 top-4 text-[7px] uppercase tracking-[0.3em] text-white/20">
        5554
      </div>

      <div className="absolute bottom-4 left-4 text-[7px] uppercase tracking-[0.3em] text-white/20">
        SYSTEM
      </div>

      <div className="absolute bottom-4 right-4 text-[7px] uppercase tracking-[0.3em] text-white/20">
        ONLINE
      </div>

      <style jsx>{`
        @keyframes letterAssemble {
          0% {
            opacity: 0;
            transform: translate3d(
                calc((var(--random-x, 1) * 120px)),
                calc((var(--random-y, 1) * 180px)),
                0
              )
              rotate(180deg) scale(2.5);
            filter: blur(12px);
          }

          25% {
            opacity: 0.3;
            filter: blur(6px);
          }

          60% {
            opacity: 0.8;
            transform: translate3d(0, 0, 0) rotate(-8deg) scale(1.15);
            filter: blur(1px);
          }

          80% {
            transform: translate3d(0, 0, 0) rotate(3deg) scale(0.98);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
            filter: blur(0);
          }
        }

        @keyframes energySweep {
          0% {
            transform: translateX(-100%);
          }

          100% {
            transform: translateX(400%);
          }
        }

        @keyframes corePulse {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(0.8);
          }

          50% {
            opacity: 0.8;
            transform: scale(1.25);
          }
        }

        @keyframes reactorPulse {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.2;
          }

          50% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 0.7;
          }
        }

        @keyframes reactorSpin {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }

          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes reactorSpinReverse {
          from {
            transform: translate(-50%, -50%) rotate(360deg);
          }

          to {
            transform: translate(-50%, -50%) rotate(0deg);
          }
        }

        @keyframes scanMove {
          0% {
            transform: translateX(-30%) rotate(-25deg);
          }

          100% {
            transform: translateX(30%) rotate(-25deg);
          }
        }

        @keyframes scanMoveReverse {
          0% {
            transform: translateX(30%) rotate(18deg);
          }

          100% {
            transform: translateX(-30%) rotate(18deg);
          }
        }

        @keyframes gridRotate {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes particleFloat {
          0%,
          100% {
            transform: translate(0, 0) scale(0.5);
            opacity: 0.1;
          }

          50% {
            transform: translate(8px, -18px) scale(1.5);
            opacity: 0.8;
          }
        }

        @keyframes subtitleReveal {
          from {
            opacity: 0;
            transform: translateY(12px);
            letter-spacing: 1em;
          }

          to {
            opacity: 1;
            transform: translateY(0);
            letter-spacing: 0.45em;
          }
        }

        @keyframes screenPulse {
          0%,
          100% {
            filter: brightness(1);
          }

          50% {
            filter: brightness(0.55);
          }
        }
      `}</style>
    </div>
  );
}

function PoweredOffScreen() {
  return <div className="h-full w-full bg-black" />;
}

export function PhoneFrame({ onClose }: PhoneFrameProps) {
  const [screen, setScreen] = useState<Screen>("home");
  const [power, setPower] = useState<PowerState>("booting");

  const { reset, stage } = useUssd();

  const powerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * Initial boot.
   */
  useEffect(() => {
    powerTimer.current = setTimeout(() => {
      setPower("on");
    }, TRANSITION_DURATION);

    return () => {
      if (powerTimer.current) {
        clearTimeout(powerTimer.current);
      }
    };
  }, []);

  const goHome = useCallback(() => {
    if (stage !== "idle") {
      reset();
    }

    setScreen("home");
  }, [reset, stage]);

  const goBack = useCallback(() => {
    if (stage !== "idle") {
      reset();
      return;
    }

    setScreen("home");
  }, [reset, stage]);

  const openApp = useCallback((key: string) => {
    if (key === "phone") {
      setScreen("phone");
    }
  }, []);

  const togglePower = useCallback(() => {
    /*
     * ON → POWERING OFF → OFF
     */
    if (power === "on") {
      if (stage !== "idle") {
        reset();
      }

      setScreen("home");

      if (powerTimer.current) {
        clearTimeout(powerTimer.current);
      }

      setPower("powering-off");

      powerTimer.current = setTimeout(() => {
        setPower("off");
      }, TRANSITION_DURATION);

      return;
    }

    /*
     * OFF → BOOTING → ON
     */
    if (power === "off") {
      if (powerTimer.current) {
        clearTimeout(powerTimer.current);
      }

      setPower("booting");

      powerTimer.current = setTimeout(() => {
        setPower("on");
      }, TRANSITION_DURATION);
    }
  }, [power, reset, stage]);

  const powered = power === "on";

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
          {power === "booting" ? (
            <TransformerAnimation shuttingDown={false} />
          ) : power === "powering-off" ? (
            <TransformerAnimation shuttingDown />
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

              <NavBar onBack={goBack} onHome={goHome} />
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
  );
}
