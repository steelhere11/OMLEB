"use client";

import { useActionState } from "react";
import Image from "next/image";
import { login, type AuthState } from "@/app/actions/auth";

interface LoginShellProps {
  subtitle: string;
  placeholderEmail: string;
}

export function LoginShell({ subtitle, placeholderEmail }: LoginShellProps) {
  const [state, formAction, isPending] = useActionState<
    AuthState | null,
    FormData
  >(login, null);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0b0b0f] px-4 py-8 font-[family-name:var(--font-dm-sans)]">
      {/* Geometric pattern background — interlocking rounded squares at 3% opacity */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden="true"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="geo"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <rect
                x="8"
                y="8"
                width="32"
                height="32"
                rx="6"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
              <rect
                x="20"
                y="20"
                width="32"
                height="32"
                rx="6"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
              <rect
                x="40"
                y="8"
                width="32"
                height="32"
                rx="6"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
              <rect
                x="8"
                y="40"
                width="32"
                height="32"
                rx="6"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geo)" />
        </svg>
      </div>

      {/* Soft radial glow behind card */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.48 0.15 250 / 0.08) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[380px] rounded-[10px] border border-white/[0.08] bg-white/[0.04] p-8 backdrop-blur-sm">
        {/* Logo + Wordmark */}
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="OMLEB"
            width={64}
            height={64}
            className="mb-4 brightness-0 invert opacity-90"
            priority
          />
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-white/90">
            OMLEB
          </h1>
          <p className="mt-1 text-[13px] font-medium tracking-wide text-white/40">
            {subtitle}
          </p>
        </div>

        {/* Form */}
        <form action={formAction} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40"
            >
              Correo electronico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={placeholderEmail}
              required
              className="block w-full rounded-[6px] border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-white/90 placeholder:text-white/20 outline-none transition-colors focus:border-white/20 focus:ring-1 focus:ring-white/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40"
            >
              Contrasena
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="block w-full rounded-[6px] border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-white/90 placeholder:text-white/20 outline-none transition-colors focus:border-white/20 focus:ring-1 focus:ring-white/10"
            />
            {state?.error && (
              <p className="mt-1.5 text-[12px] text-red-400">{state.error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center rounded-[6px] border border-[oklch(0.55_0.15_250)] bg-transparent px-4 py-2.5 text-[14px] font-semibold text-[oklch(0.65_0.12_250)] transition-colors hover:bg-[oklch(0.55_0.15_250_/_0.1)] active:bg-[oklch(0.55_0.15_250_/_0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              "Iniciar Sesion"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
