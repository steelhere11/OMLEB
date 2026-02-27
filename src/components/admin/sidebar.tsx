"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

interface SidebarProps {
  userName: string;
  userEmail: string;
}

const navItems = [
  {
    label: "Clientes",
    href: "/admin/clientes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: "Sucursales",
    href: "/admin/sucursales",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Equipos",
    href: "/admin/equipos",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Folios",
    href: "/admin/folios",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    label: "Usuarios",
    href: "/admin/usuarios",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "Reportes",
    href: "/admin/reportes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
  };

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [popoverOpen]);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar-bg">
      {/* Header — 50px */}
      <div className="flex h-[50px] shrink-0 items-center gap-2.5 px-4">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] bg-admin-surface-elevated">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-text-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="text-[13px] font-bold tracking-[-0.025em] text-text-0">OMLEB</span>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "relative flex items-center gap-2.5 rounded-[5px] px-2 py-[5px] text-[13px] font-medium transition-colors duration-[80ms]",
                    active
                      ? "bg-admin-surface-elevated text-text-0"
                      : "text-text-2 hover:bg-admin-surface-hover hover:text-text-1",
                  ].join(" ")}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 h-3.5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                  )}
                  <span className={active ? "opacity-85" : "opacity-50"}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-sidebar-border" />

      {/* Account button + popover */}
      <div className="relative p-2">
        <button
          ref={triggerRef}
          onClick={() => setPopoverOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-[5px] px-2 py-[5px] text-left transition-colors duration-[80ms] hover:bg-admin-surface-hover"
        >
          {/* Avatar */}
          <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-admin-surface-elevated text-[10px] font-bold text-text-1">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="flex-1 truncate text-[13px] font-medium text-text-1">
            {userName}
          </span>
          {/* Chevron */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={[
              "h-3 w-3 shrink-0 text-text-3 transition-transform duration-100",
              popoverOpen ? "rotate-180" : "",
            ].join(" ")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Popover */}
        {popoverOpen && (
          <div
            ref={popoverRef}
            className="absolute bottom-full left-2 right-2 mb-1.5 animate-popover-in rounded-[6px] border border-admin-border bg-admin-surface p-1 shadow-lg"
          >
            {/* User info */}
            <div className="px-2.5 py-2">
              <p className="truncate text-[13px] font-medium text-text-0">{userName}</p>
              <p className="truncate text-[12px] text-text-2">{userEmail}</p>
            </div>

            {/* Divider */}
            <div className="mx-1 my-1 border-t border-admin-border-subtle" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-[13px] text-text-2 transition-colors duration-[80ms] hover:bg-status-error/10 hover:text-status-error"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesion
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-11 items-center border-b border-sidebar-border bg-sidebar-bg px-3 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-[5px] p-1.5 text-text-2 transition-colors duration-[80ms] hover:bg-admin-surface-hover hover:text-text-1"
          aria-label="Abrir menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-2.5 text-[13px] font-bold tracking-[-0.025em] text-text-0">OMLEB</span>
      </div>

      {/* Mobile overlay / drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full w-[228px] shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[228px] border-r border-sidebar-border bg-sidebar-bg md:block">
        {sidebarContent}
      </aside>
    </>
  );
}
