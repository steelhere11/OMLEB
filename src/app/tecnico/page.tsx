export default function TecnicoFoliosPage() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      {/* Empty state icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 11v.01M12 15v.01"
          />
        </svg>
      </div>

      <h1 className="mb-2 text-xl font-bold text-gray-900">Mis Folios</h1>

      <p className="mb-2 text-base font-medium text-gray-600">
        No tienes folios asignados
      </p>

      <p className="max-w-xs text-sm text-gray-400">
        Los folios apareceran aqui cuando un administrador te asigne trabajo
      </p>
    </div>
  );
}
