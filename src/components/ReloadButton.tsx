'use client'

export default function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="mt-4 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
    >
      Recargar Aplicación
    </button>
  )
}