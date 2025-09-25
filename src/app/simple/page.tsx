'use client'

export default function SimplePage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold text-black mb-4">✅ Página Simple</h1>
      <p className="text-gray-700 mb-4">Si ves esto, Next.js está funcionando correctamente.</p>

      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <h2 className="font-semibold text-blue-900 mb-2">Estado del Sistema:</h2>
        <ul className="text-blue-800 space-y-1">
          <li>✅ Next.js: Funcionando</li>
          <li>✅ React: Funcionando</li>
          <li>✅ TailwindCSS: Funcionando</li>
          <li>✅ Tiempo: {new Date().toLocaleString()}</li>
        </ul>
      </div>

      <div className="space-x-4">
        <a
          href="/dashboard"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Ir al Dashboard
        </a>
        <a
          href="/dashboard-crm"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Ir al CRM
        </a>
      </div>
    </div>
  )
}