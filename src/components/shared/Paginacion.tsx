import React from 'react'

interface PaginacionProps {
  paginaActual: number
  totalPaginas: number
  elementosPorPagina: number
  indiceInicio: number
  indiceFin: number
  totalElementos: number
  onCambiarPagina: (pagina: number) => void
  onCambiarElementosPorPagina: (cantidad: number) => void
}

export default function Paginacion({
  paginaActual,
  totalPaginas,
  elementosPorPagina,
  indiceInicio,
  indiceFin,
  totalElementos,
  onCambiarPagina,
  onCambiarElementosPorPagina
}: PaginacionProps) {
  const generarNumerosPagina = () => {
    const paginas = []
    const maxPaginas = 5
    let inicio = Math.max(1, paginaActual - Math.floor(maxPaginas / 2))
    let fin = Math.min(totalPaginas, inicio + maxPaginas - 1)

    if (fin - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fin - maxPaginas + 1)
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(
        <button
          key={i}
          onClick={() => onCambiarPagina(i)}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${
            i === paginaActual
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
          }`}
        >
          {i}
        </button>
      )
    }

    if (fin < totalPaginas) {
      if (fin < totalPaginas - 1) {
        paginas.push(
          <span key="dots" className="px-3 text-gray-500 font-bold text-lg">...</span>
        )
      }
      paginas.push(
        <button
          key={totalPaginas}
          onClick={() => onCambiarPagina(totalPaginas)}
          className="px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors font-bold"
        >
          {totalPaginas}
        </button>
      )
    }

    return paginas
  }

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Mostrando <span className="font-bold text-blue-600">{indiceInicio} - {indiceFin}</span> de <span className="font-bold text-blue-600">{totalElementos}</span> clientes
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mostrar:</label>
        <select
          value={elementosPorPagina}
          onChange={(e) => onCambiarElementosPorPagina(parseInt(e.target.value))}
          className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">por página</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          className={`px-3 py-2 rounded-lg font-bold transition-colors ${
            paginaActual === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ←
        </button>

        {generarNumerosPagina()}

        <button
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className={`px-3 py-2 rounded-lg font-bold transition-colors ${
            paginaActual === totalPaginas
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          →
        </button>
      </div>
    </div>
  )
}