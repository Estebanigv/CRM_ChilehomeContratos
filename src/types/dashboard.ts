export interface MetricasPeriodo {
  totalVentas: number
  montoTotal: number
  promedioVenta: number
  ventasPendientes: number
  ventasCompletadas: number
  ventasRechazadas: number
  tasaConversion: number
  tiempoPromedioResolucion: number
  ventasPorDia: number
  metaCumplida: boolean
  porcentajeMeta: number
}

export interface MetricasEjecutivo {
  nombre: string
  ventas: number
  monto: number
  promedio: number
  pendientes: number
  completadas: number
  rechazadas: number
  tasaExito: number
  ranking: number
}

export interface PipelineEtapa {
  etapa: string
  cantidad: number
  valor: number
  porcentaje: number
  dias_promedio: number
}

export interface TendenciasData {
  crecimientoVentas: number
  crecimientoMonto: number
  mejorDia: string
  peorDia: string
  tendencia: 'subiendo' | 'bajando' | 'estable'
}

export interface PrediccionesData {
  proximaSemana: number
  proximoMes: number
  finDeMes: number
  probabilidadMeta: number
}

export interface DashboardData {
  metricas: MetricasPeriodo
  ejecutivos: MetricasEjecutivo[]
  pipeline: PipelineEtapa[]
  tendencias: TendenciasData
  predicciones: PrediccionesData
  distribucionEstados: Record<string, number>
}