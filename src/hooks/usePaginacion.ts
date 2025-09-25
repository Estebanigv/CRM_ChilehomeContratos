import { useState, useMemo } from 'react'

interface UsePaginacionProps<T> {
  datos: T[]
  elementosPorPaginaInicial?: number
}

export function usePaginacion<T>({ datos, elementosPorPaginaInicial = 10 }: UsePaginacionProps<T>) {
  const [paginaActual, setPaginaActual] = useState(1)
  const [elementosPorPagina, setElementosPorPagina] = useState(elementosPorPaginaInicial)

  const datosCalculados = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina
    const fin = inicio + elementosPorPagina
    const datosPaginados = datos.slice(inicio, fin)
    const totalPaginas = Math.ceil(datos.length / elementosPorPagina)

    return {
      datosPaginados,
      totalPaginas,
      indiceInicio: inicio + 1,
      indiceFin: Math.min(fin, datos.length),
      totalElementos: datos.length
    }
  }, [datos, paginaActual, elementosPorPagina])

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= datosCalculados.totalPaginas) {
      setPaginaActual(nuevaPagina)
    }
  }

  const cambiarElementosPorPagina = (cantidad: number) => {
    setElementosPorPagina(cantidad)
    setPaginaActual(1)
  }

  return {
    ...datosCalculados,
    paginaActual,
    elementosPorPagina,
    cambiarPagina,
    cambiarElementosPorPagina
  }
}