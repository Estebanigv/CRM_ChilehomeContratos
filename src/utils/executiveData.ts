import { Venta } from '@/types'

// Datos reales de ejecutivos según imagen proporcionada
export const EXECUTIVES_DATA = {
  chilehome: [
    { name: 'Maria Jose Rodriguez', initials: 'MJ', sales: '+56 9 64007492' },
    { name: 'Jose Javier Call Venezuela', initials: 'JJ', sales: '+56 9 11173442' },
    { name: 'Ana Maria Gonzalez', initials: 'AM', sales: '+56 9 19673449' },
    { name: 'Julieta Carrasco', initials: 'JC', sales: '+56 9 33396658' },
    { name: 'Johana Morales Ovalle', initials: 'JM', sales: '+56 9 46371730' },
    { name: 'Victoria Herrera', initials: 'VH', sales: '+56 9 63910698' },
    { name: 'Maria Alejandra', initials: 'MA', sales: '+56 9 99648858' },
    { name: 'Jose Luis', initials: 'JL', sales: '+56 9 82458411' },
    { name: 'Andrea', initials: 'A', sales: '+56 9 30855982' }
  ],
  construmatter: [
    { name: 'Mauricio Reyes Rivera', initials: 'MR', sales: '+56 9 25209369' },
    { name: 'Gloria Codina', initials: 'GC', sales: '+56 9 84841164' },
    { name: 'Rodolfo', initials: 'R', sales: '+56 9 74823410' },
    { name: 'Claudia Huenteo', initials: 'CH', sales: '+56 9 93110552' },
    { name: 'Paola', initials: 'P', sales: '+56 9 35209111' },
    { name: 'Rocio Barrios', initials: 'RB', sales: '+56 9 95508841' },
    { name: 'Milene Sepulveda', initials: 'MS', sales: '+56 9 62346030' },
    { name: 'Esteban', initials: 'E', sales: '+56 9 47955512' }
  ]
}

// Función auxiliar para comparar nombres de forma flexible
export const matchExecutiveName = (ejecutivoNombre: string, listaEjecutivos: string[]) => {
  const nombre = ejecutivoNombre.toLowerCase().trim()
  return listaEjecutivos.some(ejecutivo => {
    const ejecutivoLower = ejecutivo.toLowerCase()
    // Buscar coincidencias parciales en cualquier parte del nombre
    const palabrasEjecutivo = ejecutivoLower.split(' ')
    const palabrasNombre = nombre.split(' ')

    // Si alguna palabra del ejecutivo coincide con alguna palabra del nombre
    return palabrasEjecutivo.some(palabra =>
      palabrasNombre.some(nombrePalabra =>
        nombrePalabra.includes(palabra) || palabra.includes(nombrePalabra)
      )
    )
  })
}

// Obtener listas de nombres para filtrado
export const getExecutiveNames = () => {
  return {
    chilehome: EXECUTIVES_DATA.chilehome.map(exec => exec.name.toLowerCase()),
    construmatter: EXECUTIVES_DATA.construmatter.map(exec => exec.name.toLowerCase())
  }
}

// Calcular métricas por ejecutivo
export const calculateExecutiveMetrics = (ventas: Venta[]) => {
  const names = getExecutiveNames()

  // Métricas ChileHome
  const chilehomeMetrics = EXECUTIVES_DATA.chilehome.map(executive => {
    const executiveVentas = ventas.filter(v => {
      const ejecutivo = v.ejecutivo_nombre?.toLowerCase() || ''
      const empresa = v.empresa?.toLowerCase() || ''
      return empresa.includes('chilehome') ||
             matchExecutiveName(ejecutivo, [executive.name.toLowerCase()])
    })

    const totalVentas = executiveVentas.length
    const montoTotal = executiveVentas.reduce((sum, v) => {
      const valor = typeof v.valor_total === 'number'
        ? v.valor_total
        : parseFloat(v.valor_total?.toString()?.replace(/\D/g, '') || '0')
      return sum + valor
    }, 0)

    return {
      ...executive,
      company: 'ChileHome',
      totalVentas,
      montoTotal,
      promedio: totalVentas > 0 ? montoTotal / totalVentas : 0
    }
  })

  // Métricas Construmatter
  const construmatterMetrics = EXECUTIVES_DATA.construmatter.map(executive => {
    const executiveVentas = ventas.filter(v => {
      const ejecutivo = v.ejecutivo_nombre?.toLowerCase() || ''
      const empresa = v.empresa?.toLowerCase() || ''
      return empresa.includes('construmatter') ||
             matchExecutiveName(ejecutivo, [executive.name.toLowerCase()])
    })

    const totalVentas = executiveVentas.length
    const montoTotal = executiveVentas.reduce((sum, v) => {
      const valor = typeof v.valor_total === 'number'
        ? v.valor_total
        : parseFloat(v.valor_total?.toString()?.replace(/\D/g, '') || '0')
      return sum + valor
    }, 0)

    return {
      ...executive,
      company: 'Construmatter',
      totalVentas,
      montoTotal,
      promedio: totalVentas > 0 ? montoTotal / totalVentas : 0
    }
  })

  return {
    chilehome: chilehomeMetrics,
    construmatter: construmatterMetrics,
    all: [...chilehomeMetrics, ...construmatterMetrics]
  }
}

// Calcular totales por empresa
export const calculateCompanyTotals = (ventas: Venta[]) => {
  const names = getExecutiveNames()

  const chilehomeVentas = ventas.filter(v => {
    const ejecutivo = v.ejecutivo_nombre?.toLowerCase() || ''
    const empresa = v.empresa?.toLowerCase() || ''
    return empresa.includes('chilehome') ||
           matchExecutiveName(ejecutivo, names.chilehome) ||
           (!empresa && !v.ejecutivo_nombre) // Ventas sin empresa ni ejecutivo asignadas a ChileHome por defecto
  })

  const construmatterVentas = ventas.filter(v => {
    const ejecutivo = v.ejecutivo_nombre?.toLowerCase() || ''
    const empresa = v.empresa?.toLowerCase() || ''
    return empresa.includes('construmatter') ||
           matchExecutiveName(ejecutivo, names.construmatter)
  })

  const chilehomeTotal = chilehomeVentas.reduce((sum, v) => {
    const valor = typeof v.valor_total === 'number'
      ? v.valor_total
      : parseFloat(v.valor_total?.toString()?.replace(/\D/g, '') || '0')
    return sum + valor
  }, 0)

  const construmatterTotal = construmatterVentas.reduce((sum, v) => {
    const valor = typeof v.valor_total === 'number'
      ? v.valor_total
      : parseFloat(v.valor_total?.toString()?.replace(/\D/g, '') || '0')
    return sum + valor
  }, 0)

  return {
    chilehome: {
      ventas: chilehomeVentas.length,
      monto: chilehomeTotal,
      porcentaje: ventas.length > 0 ? (chilehomeVentas.length / ventas.length * 100).toFixed(1) : '0'
    },
    construmatter: {
      ventas: construmatterVentas.length,
      monto: construmatterTotal,
      porcentaje: ventas.length > 0 ? (construmatterVentas.length / ventas.length * 100).toFixed(1) : '0'
    }
  }
}