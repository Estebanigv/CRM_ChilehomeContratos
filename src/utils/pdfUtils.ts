interface EjecutivoRanking {
  nombre: string
  cantidadVentas: number
  montoTotal: number
}

export const generarPDFRanking = (ranking: EjecutivoRanking[], periodoTexto: string, totalVentas: number) => {
  const contenidoPDF = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ranking de Ejecutivos - ${periodoTexto}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .periodo { color: #2563eb; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .posicion { text-align: center; font-weight: bold; }
        .monto { text-align: right; font-weight: bold; }
        .ranking-1 { background-color: #fef3c7; }
        .ranking-2 { background-color: #f3f4f6; }
        .ranking-3 { background-color: #fed7aa; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Ranking de Ejecutivos por Ventas</h1>
        <p>Período: <span class="periodo">${periodoTexto}</span></p>
        <p>Total de ventas: <strong>${totalVentas}</strong> | Ejecutivos activos: <strong>${ranking.length}</strong></p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Posición</th>
            <th>Ejecutivo</th>
            <th>Cantidad de Ventas</th>
            <th>Monto Total (CLP)</th>
            <th>Promedio por Venta (CLP)</th>
            <th>% del Total</th>
          </tr>
        </thead>
        <tbody>
          ${ranking.map((ejecutivo, index) => {
            const posicion = index + 1
            const porcentaje = totalVentas > 0 ? (ejecutivo.cantidadVentas / totalVentas * 100).toFixed(1) : '0.0'
            const promedio = ejecutivo.montoTotal / ejecutivo.cantidadVentas
            const claseRanking = posicion === 1 ? 'ranking-1' : posicion === 2 ? 'ranking-2' : posicion === 3 ? 'ranking-3' : ''

            return `
              <tr class="${claseRanking}">
                <td class="posicion">${posicion}</td>
                <td>${ejecutivo.nombre}</td>
                <td style="text-align: center;">${ejecutivo.cantidadVentas}</td>
                <td class="monto">$${ejecutivo.montoTotal.toLocaleString('es-CL')}</td>
                <td class="monto">$${promedio.toLocaleString('es-CL')}</td>
                <td style="text-align: center;">${porcentaje}%</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>

      <div style="margin-top: 30px; font-size: 12px; color: #666;">
        <p>Reporte generado el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL')}</p>
      </div>
    </body>
    </html>
  `

  const ventanaImpresion = window.open('', '_blank')
  if (ventanaImpresion) {
    ventanaImpresion.document.write(contenidoPDF)
    ventanaImpresion.document.close()
    ventanaImpresion.focus()
    ventanaImpresion.print()
  }
}