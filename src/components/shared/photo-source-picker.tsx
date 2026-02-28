"use client";

import { useEffect, useRef } from "react";

interface PhotoSourcePickerProps {
  label: string;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  onClose: () => void;
}

export function PhotoSourcePicker({
  label,
  onSelectCamera,
  onSelectGallery,
  onClose,
}: PhotoSourcePickerProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.target === backdropRef.current) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
    >
      {/* Bottom sheet */}
      <div className="w-full max-w-md animate-slide-up rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            Foto: {label.toUpperCase()}
          </h3>
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-500 active:text-gray-700"
          >
            Cancelar
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2 p-4">
          {/* Camera option */}
          <button
            onClick={onSelectCamera}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 transition-colors active:bg-gray-100"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Camara</p>
              <p className="text-xs text-gray-500">
                Tomar foto con GPS y fecha
              </p>
            </div>
          </button>

          {/* Gallery option */}
          <button
            onClick={onSelectGallery}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 transition-colors active:bg-gray-100"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-700 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Galeria</p>
              <p className="text-xs text-gray-500">
                Seleccionar foto existente
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
