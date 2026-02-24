export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-6 text-center">
      {/* WiFi-off icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12v.01"
          />
          <line
            x1="4"
            y1="4"
            x2="20"
            y2="20"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h1 className="mb-3 text-xl font-bold text-gray-900">
        Sin conexion a internet
      </h1>

      <p className="max-w-sm text-base text-gray-500">
        Verifica tu conexion e intenta de nuevo. La aplicacion se recargara
        automaticamente cuando vuelvas a estar en linea.
      </p>
    </div>
  );
}
