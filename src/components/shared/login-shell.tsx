"use client";

import { useActionState } from "react";
import Image from "next/image";
import { login, type AuthState } from "@/app/actions/auth";

interface LoginShellProps {
  subtitle: string;
  placeholderEmail: string;
  variant?: "dark" | "light";
}

export function LoginShell({ subtitle, placeholderEmail, variant = "dark" }: LoginShellProps) {
  const [state, formAction, isPending] = useActionState<
    AuthState | null,
    FormData
  >(login, null);

  const dark = variant === "dark";

  return (
    <div
      className={[
        "relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8 font-[family-name:var(--font-dm-sans)]",
        dark ? "bg-[#0b0b0f]" : "bg-tech-bg",
      ].join(" ")}
    >
      {/* Tiled OMLEB logo background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/logo.png)",
          backgroundSize: "120px",
          backgroundRepeat: "repeat",
          opacity: dark ? 0.03 : 0.04,
          filter: dark ? "brightness(0) invert(1)" : undefined,
        }}
        aria-hidden="true"
      />

      {/* Soft radial glow behind card */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: dark
            ? "radial-gradient(circle, oklch(0.48 0.15 250 / 0.08) 0%, transparent 70%)"
            : "radial-gradient(circle, oklch(0.55 0.15 250 / 0.06) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className={[
          "relative z-10 w-full max-w-[380px] rounded-[10px] border p-8",
          dark
            ? "border-white/[0.08] bg-white/[0.04] backdrop-blur-sm"
            : "border-tech-border bg-tech-surface shadow-sm",
        ].join(" ")}
      >
        {/* Logo + Wordmark */}
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="OMLEB"
            width={64}
            height={64}
            className={[
              "mb-4",
              dark ? "brightness-0 invert opacity-90" : "",
            ].join(" ")}
            priority
          />
          <h1
            className={[
              "text-[28px] font-bold tracking-[-0.02em]",
              dark ? "text-white/90" : "text-tech-text-primary",
            ].join(" ")}
          >
            OMLEB
          </h1>
          <p
            className={[
              "mt-1 text-[13px] font-medium tracking-wide",
              dark ? "text-white/40" : "text-tech-text-muted",
            ].join(" ")}
          >
            {subtitle}
          </p>
        </div>

        {/* Form */}
        <form action={formAction} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className={[
                "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em]",
                dark ? "text-white/40" : "text-tech-text-muted",
              ].join(" ")}
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
              className={[
                "block w-full rounded-[6px] border px-3.5 py-2.5 text-[14px] outline-none transition-colors",
                dark
                  ? "border-white/[0.08] bg-white/[0.04] text-white/90 placeholder:text-white/20 focus:border-white/20 focus:ring-1 focus:ring-white/10"
                  : "border-tech-border bg-tech-bg text-tech-text-primary placeholder:text-tech-text-muted focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30",
              ].join(" ")}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className={[
                "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em]",
                dark ? "text-white/40" : "text-tech-text-muted",
              ].join(" ")}
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
              className={[
                "block w-full rounded-[6px] border px-3.5 py-2.5 text-[14px] outline-none transition-colors",
                dark
                  ? "border-white/[0.08] bg-white/[0.04] text-white/90 placeholder:text-white/20 focus:border-white/20 focus:ring-1 focus:ring-white/10"
                  : "border-tech-border bg-tech-bg text-tech-text-primary placeholder:text-tech-text-muted focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30",
              ].join(" ")}
            />
            {state?.error && (
              <p className="mt-1.5 text-[12px] text-red-400">{state.error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={[
              "flex w-full items-center justify-center rounded-[6px] px-4 py-2.5 text-[14px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              dark
                ? "border border-[oklch(0.55_0.15_250)] bg-transparent text-[oklch(0.65_0.12_250)] hover:bg-[oklch(0.55_0.15_250_/_0.1)] active:bg-[oklch(0.55_0.15_250_/_0.15)]"
                : "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700",
            ].join(" ")}
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
