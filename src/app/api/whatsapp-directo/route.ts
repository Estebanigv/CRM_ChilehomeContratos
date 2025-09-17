import { NextRequest, NextResponse } from 'next/server'
import { crmApi } from '@/lib/crmApi'

export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp Directo - Endpoint funcionando',
    telefono: '+56963348909',
    ejemplo: {
      POST: '/api/whatsapp-directo',
      body: { tipo: 'test' }
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo = 'test' } = body

    // Credenciales directas
    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
    const token = process.env.WHATSAPP_BUSINESS_TOKEN
    // Obtener listas de números según el tipo de mensaje
    const ejecutivosStr = process.env.WHATSAPP_EJECUTIVOS || '56963348909'
    const gerenciaStr = process.env.WHATSAPP_GERENCIA || '56963348909'
    const administracionStr = process.env.WHATSAPP_ADMINISTRACION || '56963348909'

    // Definir destinatarios según el tipo de mensaje
    let destinatarios: string[] = []

    switch (tipo) {
      case 'ranking_ejecutivos_semanal':
      case 'ranking_ejecutivos_personalizado':
      case 'resumen_diario':
      case 'resumen_semanal':
        // Mensajes de gestión van a todos: ejecutivos + gerencia + administración
        destinatarios = [
          ...ejecutivosStr.split(','),
          ...gerenciaStr.split(','),
          ...administracionStr.split(',')
        ]
        break
      case 'nueva_venta_crm':
      case 'contrato_validado':
      case 'entregas_ok':
        // Notificaciones de ventas van principalmente a ejecutivos y gerencia
        destinatarios = [
          ...ejecutivosStr.split(','),
          ...gerenciaStr.split(',')
        ]
        break
      case 'rating_ok':
      case 'rechazos':
        // Métricas van principalmente a gerencia y administración
        destinatarios = [
          ...gerenciaStr.split(','),
          ...administracionStr.split(',')
        ]
        break
      case 'saludo_matutino':
      case 'saludo':
        // Saludos van a todos
        destinatarios = [
          ...ejecutivosStr.split(','),
          ...gerenciaStr.split(','),
          ...administracionStr.split(',')
        ]
        break
      default:
        // Para pruebas específicas, usar número específico si se proporciona
        destinatarios = body.telefono ? [body.telefono] : ['56963348909']
    }

    // Eliminar duplicados y números vacíos
    destinatarios = [...new Set(destinatarios)].filter(num => num.trim().length > 0)

    if (!phoneId || !token) {
      return NextResponse.json({
        success: false,
        error: 'Credenciales WhatsApp no configuradas'
      }, { status: 500 })
    }

    // Mensajes según tipo
    let mensaje = ''
    switch (tipo) {
      case 'ranking_ejecutivos_semanal':
      case 'ranking_ejecutivos_personalizado': {
        // Obtener datos reales del CRM
        let fechaInicioPeriodo: string;
        let fechaFinPeriodo: string;
        const fechaActual = new Date().toLocaleDateString('es-CL');

        // Determinar período según el tipo
        let periodoTexto = '';
        if (tipo === 'ranking_ejecutivos_semanal') {
          const fechaInicioDate = new Date();
          fechaInicioDate.setDate(fechaInicioDate.getDate() - 7);
          fechaInicioPeriodo = fechaInicioDate.toISOString().split('T')[0];
          fechaFinPeriodo = new Date().toISOString().split('T')[0];
          periodoTexto = `Semana del ${fechaInicioDate.toLocaleDateString('es-CL')} al ${fechaActual}`;
        } else {
          // Para ranking personalizado, usar fechas del body si están disponibles
          const { fechaInicio, fechaFin } = body;
          if (fechaInicio && fechaFin) {
            fechaInicioPeriodo = fechaInicio;
            fechaFinPeriodo = fechaFin;
            periodoTexto = `Del ${new Date(fechaInicio).toLocaleDateString('es-CL')} al ${new Date(fechaFin).toLocaleDateString('es-CL')}`;
          } else {
            fechaInicioPeriodo = '2025-09-01';
            fechaFinPeriodo = new Date().toISOString().split('T')[0];
            periodoTexto = `Del 01/09/2025 al ${fechaActual}`;
          }
        }

        try {
          // Obtener ventas reales del CRM para el período
          const ventasDelPeriodo = await crmApi.obtenerVentas(undefined, fechaInicioPeriodo, fechaFinPeriodo);

          // Agrupar ventas por ejecutivo y calcular estadísticas
          const ventasPorEjecutivo = new Map();
          let totalVentas = 0;
          let totalMontoVentas = 0;

          ventasDelPeriodo.forEach(venta => {
            // Validar que la venta tenga ejecutivo y datos válidos
            if (!venta.ejecutivo_nombre || venta.ejecutivo_nombre === 'null' || venta.ejecutivo_nombre === '') {
              return; // Saltar ventas sin ejecutivo válido
            }

            const ejecutivo = venta.ejecutivo_nombre;
            if (!ventasPorEjecutivo.has(ejecutivo)) {
              ventasPorEjecutivo.set(ejecutivo, {
                nombre: ejecutivo,
                ventas: 0,
                montoTotal: 0,
                ventasIds: []
              });
            }
            const datos = ventasPorEjecutivo.get(ejecutivo);
            datos.ventas += 1;

            // Validar valor_total antes de convertir
            const valorVenta = venta.valor_total;
            let montoVenta = 0;
            if (valorVenta !== null && valorVenta !== undefined && valorVenta !== '') {
              montoVenta = typeof valorVenta === 'number' ? valorVenta : parseInt(valorVenta) || 0;
            }

            datos.montoTotal += montoVenta;
            datos.ventasIds.push(venta.id);
            totalVentas += 1;
            totalMontoVentas += montoVenta;
          });

          // Convertir a array y ordenar por número de ventas
          const ejecutivos = Array.from(ventasPorEjecutivo.values())
            .sort((a, b) => b.ventas - a.ventas)
            .slice(0, 5) // Top 5
            .map(ejecutivo => ({
              nombre: ejecutivo.nombre,
              ventas: ejecutivo.ventas,
              porcentaje: totalVentas > 0 ? (ejecutivo.ventas / totalVentas * 100) : 0,
              montoTotal: ejecutivo.montoTotal
            }));

          console.log(`📊 Datos reales del CRM para WhatsApp:`, {
            periodo: periodoTexto,
            totalVentas,
            ejecutivos: ejecutivos.length,
            fechaInicio: fechaInicioPeriodo,
            fechaFin: fechaFinPeriodo
          });

          // Generar ranking message con datos reales del CRM
          if (ejecutivos.length > 0) {
            mensaje = `🏆 *RANKING DE EJECUTIVOS DE VENTAS*\n`;
            mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            mensaje += `📅 *PERÍODO DE ANÁLISIS*\n`;
            mensaje += `   ${periodoTexto}\n`;
            mensaje += `   Generado el: ${fechaActual}\n\n`;

            mensaje += `📊 *RESUMEN EJECUTIVO*\n`;
            mensaje += `   • Total de Ventas: ${totalVentas}\n`;
            mensaje += `   • Ejecutivos Activos: ${ejecutivos.length}\n`;
            mensaje += `   • Promedio por Ejecutivo: ${ejecutivos.length > 0 ? Math.round(totalVentas / ejecutivos.length) : 0} ventas\n`;
            mensaje += `   • Monto Total: $${totalMontoVentas.toLocaleString('es-CL')}\n\n`;

            mensaje += `🥇 *TOP ${ejecutivos.length} EJECUTIVOS*\n`;
            mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            ejecutivos.forEach((ejecutivo, index) => {
              const posicion = index + 1;
              const emoji = posicion === 1 ? '🥇' : posicion === 2 ? '🥈' : posicion === 3 ? '🥉' : '📍';
              const barraProgreso = '█'.repeat(Math.round(ejecutivo.porcentaje / 5)) + '░'.repeat(20 - Math.round(ejecutivo.porcentaje / 5));
              const porcentajeFormateado = ejecutivo.porcentaje.toFixed(1);

              mensaje += `${emoji} *${posicion}. ${ejecutivo.nombre}*\n`;
              mensaje += `   📈 Ventas: ${ejecutivo.ventas} (${porcentajeFormateado}%)\n`;
              mensaje += `   💰 Monto: $${ejecutivo.montoTotal.toLocaleString('es-CL')}\n`;
              mensaje += `   ${barraProgreso} ${porcentajeFormateado}%\n\n`;
            });

            mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            mensaje += `📈 *ANÁLISIS DE RENDIMIENTO*\n\n`;

            if (ejecutivos.length >= 2) {
              const mejorEjecutivo = ejecutivos[0];
              const segundoEjecutivo = ejecutivos[1];
              const diferencia = mejorEjecutivo.ventas - segundoEjecutivo.ventas;

              mensaje += `🎯 *Líder del Período:* ${mejorEjecutivo.nombre}\n`;
              mensaje += `   • Ventas realizadas: ${mejorEjecutivo.ventas}\n`;
              mensaje += `   • Ventaja sobre segundo lugar: ${diferencia} ventas\n\n`;
            } else if (ejecutivos.length === 1) {
              mensaje += `🎯 *Único Ejecutivo Activo:* ${ejecutivos[0].nombre}\n`;
              mensaje += `   • Ventas realizadas: ${ejecutivos[0].ventas}\n\n`;
            }

            mensaje += `📊 *Distribución de Ventas:*\n`;
            const top3Porcentaje = ejecutivos.slice(0, 3).reduce((sum, ej) => sum + ej.porcentaje, 0);
            mensaje += `   • Top 3 concentra: ${Math.round(top3Porcentaje)}% del total\n`;
            mensaje += `   • Promedio individual: ${ejecutivos.length > 0 ? Math.round(totalVentas / ejecutivos.length) : 0} ventas\n\n`;
          } else {
            mensaje = `🏆 *RANKING DE EJECUTIVOS DE VENTAS*\n\n`;
            mensaje += `📅 *PERÍODO DE ANÁLISIS*\n`;
            mensaje += `   ${periodoTexto}\n`;
            mensaje += `   Generado el: ${fechaActual}\n\n`;
            mensaje += `⚠️ *No se encontraron ventas para el período seleccionado*\n\n`;
            mensaje += `📊 Puede que no haya ventas registradas en estas fechas o que el CRM esté temporalmente inaccesible.\n\n`;
          }

          mensaje += `🏠 *ChileHome Contratos*\n`;
          mensaje += `Sistema de Gestión CRM - ${fechaActual}`;

        } catch (error) {
          console.error('❌ Error obteniendo datos del CRM para WhatsApp:', error);

          // Mensaje de error con información útil
          mensaje = `🏆 *RANKING DE EJECUTIVOS DE VENTAS*\n\n`;
          mensaje += `📅 *PERÍODO DE ANÁLISIS*\n`;
          mensaje += `   ${periodoTexto}\n`;
          mensaje += `   Generado el: ${fechaActual}\n\n`;
          mensaje += `❌ *Error Temporal del Sistema*\n\n`;
          mensaje += `📊 No se pudieron obtener los datos del CRM en este momento.\n`;
          mensaje += `🔄 Por favor, intenta nuevamente en unos minutos.\n\n`;
          mensaje += `🏠 *ChileHome Contratos*\n`;
          mensaje += `Sistema de Gestión CRM - ${fechaActual}`;
        }
        break;
      }
      case 'resumen_diario': {
        try {
          // Obtener ventas del día actual
          const hoy = new Date().toISOString().split('T')[0];
          const ventasDelDia = await crmApi.obtenerVentas(undefined, hoy, hoy);

          const totalVentasHoy = ventasDelDia.length;
          const montoTotalHoy = ventasDelDia.reduce((sum, venta) => {
            const valorVenta = venta.valor_total;
            if (valorVenta === null || valorVenta === undefined || valorVenta === '') {
              return sum;
            }
            return sum + (typeof valorVenta === 'number' ? valorVenta : parseInt(valorVenta) || 0);
          }, 0);

          // Encontrar mejor ejecutivo del día
          const ventasPorEjecutivo = new Map();
          ventasDelDia.forEach(venta => {
            const ejecutivo = venta.ejecutivo_nombre;
            ventasPorEjecutivo.set(ejecutivo, (ventasPorEjecutivo.get(ejecutivo) || 0) + 1);
          });

          const mejorEjecutivo = Array.from(ventasPorEjecutivo.entries())
            .sort((a, b) => b[1] - a[1])[0];

          const promedioVenta = totalVentasHoy > 0 ? Math.round(montoTotalHoy / totalVentasHoy) : 0;

          mensaje = `📊 RESUMEN DIARIO - ${new Date().toLocaleDateString('es-CL')}\n\n`;
          mensaje += `• ${totalVentasHoy} ventas nuevas registradas\n`;
          mensaje += `• $${montoTotalHoy.toLocaleString('es-CL')} total del día\n`;
          if (mejorEjecutivo) {
            mensaje += `• Mejor ejecutivo: ${mejorEjecutivo[0]} (${mejorEjecutivo[1]} ventas)\n`;
          }
          mensaje += `• Promedio: $${promedioVenta.toLocaleString('es-CL')} por venta\n\n`;
          mensaje += totalVentasHoy > 5 ? '¡Excelente día de trabajo! 🚀' :
                    totalVentasHoy > 0 ? '¡Buen trabajo equipo! 💪' :
                    'Día tranquilo, ¡mañana será mejor! 🌟';
        } catch (error) {
          mensaje = `📊 RESUMEN DIARIO - ${new Date().toLocaleDateString('es-CL')}\n\n❌ Error obteniendo datos del CRM\n🔄 Reintenta en unos minutos`;
        }
        break;
      }
      case 'resumen_semanal': {
        try {
          // Obtener ventas de la última semana
          const hoy = new Date();
          const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
          const fechaInicio = hace7Dias.toISOString().split('T')[0];
          const fechaFin = hoy.toISOString().split('T')[0];

          const ventasSemana = await crmApi.obtenerVentas(undefined, fechaInicio, fechaFin);

          const totalVentasSemana = ventasSemana.length;
          const montoTotalSemana = ventasSemana.reduce((sum, venta) => {
            const valorVenta = venta.valor_total;
            if (valorVenta === null || valorVenta === undefined || valorVenta === '') {
              return sum;
            }
            return sum + (typeof valorVenta === 'number' ? valorVenta : parseInt(valorVenta) || 0);
          }, 0);

          // Top ejecutivo de la semana
          const ventasPorEjecutivo = new Map();
          ventasSemana.forEach(venta => {
            const ejecutivo = venta.ejecutivo_nombre;
            ventasPorEjecutivo.set(ejecutivo, (ventasPorEjecutivo.get(ejecutivo) || 0) + 1);
          });

          const topEjecutivo = Array.from(ventasPorEjecutivo.entries())
            .sort((a, b) => b[1] - a[1])[0];

          const promedioSemanal = totalVentasSemana > 0 ? Math.round(montoTotalSemana / totalVentasSemana) : 0;

          mensaje = '📈 RESUMEN SEMANAL\n\n';
          mensaje += `• ${totalVentasSemana} ventas esta semana\n`;
          mensaje += `• $${montoTotalSemana.toLocaleString('es-CL')} total semanal\n`;
          if (topEjecutivo) {
            mensaje += `🏆 Top ejecutivo: ${topEjecutivo[0]} (${topEjecutivo[1]} ventas)\n`;
          }
          mensaje += `📊 Promedio: $${promedioSemanal.toLocaleString('es-CL')} por venta\n\n`;
          mensaje += totalVentasSemana > 20 ? '¡Gran semana equipo! 💪' :
                    totalVentasSemana > 10 ? '¡Buena semana! 👍' :
                    '¡La próxima semana será mejor! 🚀';
        } catch (error) {
          mensaje = '📈 RESUMEN SEMANAL\n\n❌ Error obteniendo datos del CRM\n🔄 Reintenta en unos minutos';
        }
        break;
      }
      case 'nueva_venta_crm': {
        try {
          // Obtener la venta más reciente del día
          const hoy = new Date().toISOString().split('T')[0];
          const ventasDelDia = await crmApi.obtenerVentas(undefined, hoy, hoy);

          if (ventasDelDia.length > 0) {
            const ventaReciente = ventasDelDia[ventasDelDia.length - 1];

            mensaje = '🎉 NUEVA VENTA INGRESADA AL CRM\n\n';
            mensaje += `👤 Cliente: ${ventaReciente.cliente_nombre}\n`;
            const montoVenta = ventaReciente.valor_total;
            let montoFormateado = 0;
            if (montoVenta !== null && montoVenta !== undefined && montoVenta !== '') {
              montoFormateado = typeof montoVenta === 'number' ? montoVenta : parseInt(montoVenta) || 0;
            }
            mensaje += `💰 Monto: $${montoFormateado.toLocaleString('es-CL')}\n`;
            mensaje += `🏠 Modelo: ${ventaReciente.modelo_casa}\n`;
            mensaje += `👨‍💼 Ejecutivo: ${ventaReciente.ejecutivo_nombre}\n`;
            mensaje += `📍 Dirección: ${ventaReciente.direccion_entrega}\n`;
            mensaje += `📅 Fecha: ${new Date().toLocaleDateString('es-CL')}\n\n`;
            mensaje += '¡Felicitaciones! 🎊';
          } else {
            mensaje = '🎉 SISTEMA DE VENTAS\n\n📊 No hay ventas nuevas hoy\n🔄 Sistema funcionando correctamente';
          }
        } catch (error) {
          mensaje = '🎉 SISTEMA DE VENTAS\n\n❌ Error obteniendo datos del CRM\n🔄 Reintenta en unos minutos';
        }
        break;
      }
      case 'rating_ok': {
        try {
          // Obtener métricas de satisfacción basadas en entregas exitosas
          const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const hoy = new Date().toISOString().split('T')[0];
          const ventasRecientes = await crmApi.obtenerVentas(undefined, hace30Dias, hoy);

          const entregasOK = ventasRecientes.filter(venta =>
            venta.estado_crm === 'Entrega OK' || venta.estado_crm === 'Confirmación de entrega'
          );

          const totalProcesos = ventasRecientes.filter(venta =>
            venta.estado_crm !== 'Pre-ingreso'
          ).length;

          const satisfaccion = totalProcesos > 0 ? ((entregasOK.length / totalProcesos) * 100).toFixed(1) : '0';

          mensaje = '⭐ RATING DE SATISFACCIÓN\n\n';
          mensaje += `📅 Últimos 30 días\n`;
          mensaje += `✅ Entregas exitosas: ${entregasOK.length}\n`;
          mensaje += `📊 Procesos totales: ${totalProcesos}\n`;
          mensaje += `⭐ Rating de satisfacción: ${satisfaccion}%\n\n`;

          // Análisis por ejecutivo para el rating
          const ratingPorEjecutivo = new Map();
          ventasRecientes.forEach(venta => {
            const ejecutivo = venta.ejecutivo_nombre;
            if (!ratingPorEjecutivo.has(ejecutivo)) {
              ratingPorEjecutivo.set(ejecutivo, { total: 0, exitosas: 0 });
            }
            const datos = ratingPorEjecutivo.get(ejecutivo);
            datos.total += 1;
            if (venta.estado_crm === 'Entrega OK' || venta.estado_crm === 'Confirmación de entrega') {
              datos.exitosas += 1;
            }
          });

          mensaje += '🏆 Rating por ejecutivo:\n';
          Array.from(ratingPorEjecutivo.entries())
            .map(([ejecutivo, datos]) => ({
              ejecutivo,
              rating: datos.total > 0 ? ((datos.exitosas / datos.total) * 100).toFixed(1) : '0'
            }))
            .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
            .slice(0, 3)
            .forEach(({ejecutivo, rating}) => {
              mensaje += `• ${ejecutivo}: ${rating}%\n`;
            });

          const nivelRating = parseFloat(satisfaccion);
          mensaje += nivelRating >= 90 ? '\n🌟 ¡Excelente calidad de servicio!' :
                    nivelRating >= 75 ? '\n👍 Buena calidad de servicio' :
                    '\n⚠️ Oportunidad de mejora en el servicio';

        } catch (error) {
          mensaje = '⭐ RATING DE SATISFACCIÓN\n\n❌ Error obteniendo datos del CRM\n🔄 Reintenta en unos minutos';
        }
        break;
      }
      case 'contrato_validado': {
        try {
          // Obtener ventas recientes con contratos validados
          const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const hoy = new Date().toISOString().split('T')[0];
          const ventasRecientes = await crmApi.obtenerVentas(undefined, hace7Dias, hoy);

          // Filtrar solo contratos validados (que tienen número de contrato)
          const contratosValidados = ventasRecientes.filter(venta =>
            venta.numero_contrato && venta.numero_contrato !== '0'
          );

          if (contratosValidados.length > 0) {
            const contratoReciente = contratosValidados[contratosValidados.length - 1];

            mensaje = '✅ CONTRATO VALIDADO\n\n';
            mensaje += `👤 Cliente: ${contratoReciente.cliente_nombre}\n`;
            const valorContrato = contratoReciente.valor_total;
            let valorFormateado = 0;
            if (valorContrato !== null && valorContrato !== undefined && valorContrato !== '') {
              valorFormateado = typeof valorContrato === 'number' ? valorContrato : parseInt(valorContrato) || 0;
            }
            mensaje += `💰 Valor: $${valorFormateado.toLocaleString('es-CL')}\n`;
            mensaje += `📋 Contrato: ${contratoReciente.numero_contrato}\n`;
            mensaje += `👨‍💼 Ejecutivo: ${contratoReciente.ejecutivo_nombre}\n`;
            mensaje += `📅 Fecha entrega: ${contratoReciente.fecha_entrega}\n`;
            mensaje += `🚚 Estado: ${contratoReciente.estado_crm}\n\n`;
            mensaje += '¡Proceso completado! ✨';
          } else {
            mensaje = '✅ SISTEMA DE CONTRATOS\n\n📋 No hay contratos validados recientemente\n🔄 Sistema funcionando correctamente';
          }
        } catch (error) {
          mensaje = '✅ SISTEMA DE CONTRATOS\n\n❌ Error obteniendo datos del CRM\n🔄 Reintenta en unos minutos';
        }
        break;
      }
      case 'entregas_ok': {
        try {
          // Obtener ventas con estado "Entrega OK"
          const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const hoy = new Date().toISOString().split('T')[0];
          const ventasRecientes = await crmApi.obtenerVentas(undefined, hace30Dias, hoy);

          const entregasOK = ventasRecientes.filter(venta =>
            venta.estado_crm === 'Entrega OK' || venta.estado_crm === 'Confirmación de entrega'
          );

          const totalEntregas = entregasOK.length;
          const montoEntregado = entregasOK.reduce((sum, venta) => {
            const valorVenta = venta.valor_total;
            if (valorVenta === null || valorVenta === undefined || valorVenta === '') {
              return sum;
            }
            return sum + (typeof valorVenta === 'number' ? valorVenta : parseInt(valorVenta) || 0);
          }, 0);

          mensaje = '🚚 REPORTE DE ENTREGAS\n\n';
          mensaje += `📅 Últimos 30 días\n`;
          mensaje += `✅ Entregas completadas: ${totalEntregas}\n`;
          mensaje += `💰 Valor entregado: $${montoEntregado.toLocaleString('es-CL')}\n\n`;

          if (entregasOK.length > 0) {
            mensaje += `🏆 Últimas entregas exitosas:\n`;
            entregasOK.slice(-3).forEach((entrega, index) => {
              mensaje += `${index + 1}. ${entrega.cliente_nombre} - ${entrega.modelo_casa}\n`;
            });
          }

          mensaje += '\n🎉 ¡Excelente trabajo equipo de logística!';
        } catch (error) {
          mensaje = '🚚 REPORTE DE ENTREGAS\n\n❌ Error obteniendo datos del CRM\n🔄 Reintenta en unos minutos';
        }
        break;
      }
      case 'rechazos': {
        try {
          // Obtener ventas con estado de rechazo
          const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const hoy = new Date().toISOString().split('T')[0];
          const ventasRecientes = await crmApi.obtenerVentas(undefined, hace30Dias, hoy);

          const rechazos = ventasRecientes.filter(venta =>
            venta.estado_crm === 'Rechazo' || venta.estado_crm.toLowerCase().includes('rechaz')
          );

          const totalRechazos = rechazos.length;
          const totalVentas = ventasRecientes.length;
          const tasaRechazo = totalVentas > 0 ? ((totalRechazos / totalVentas) * 100).toFixed(1) : '0';

          mensaje = '❌ REPORTE DE RECHAZOS\n\n';
          mensaje += `📅 Últimos 30 días\n`;
          mensaje += `❌ Total rechazos: ${totalRechazos}\n`;
          mensaje += `📊 Tasa de rechazo: ${tasaRechazo}%\n`;
          mensaje += `📈 Total ventas: ${totalVentas}\n\n`;

          if (totalRechazos > 0) {
            // Analizar motivos de rechazo si están en observaciones
            const motivosComunes = new Map();
            rechazos.forEach(rechazo => {
              if (rechazo.observaciones_crm) {
                const obs = rechazo.observaciones_crm.toLowerCase();
                if (obs.includes('precio')) motivosComunes.set('Precio', (motivosComunes.get('Precio') || 0) + 1);
                if (obs.includes('tiempo') || obs.includes('plazo')) motivosComunes.set('Plazos', (motivosComunes.get('Plazos') || 0) + 1);
                if (obs.includes('calidad')) motivosComunes.set('Calidad', (motivosComunes.get('Calidad') || 0) + 1);
              }
            });

            if (motivosComunes.size > 0) {
              mensaje += '📋 Motivos principales:\n';
              Array.from(motivosComunes.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .forEach(([motivo, cantidad]) => {
                  mensaje += `• ${motivo}: ${cantidad} casos\n`;
                });
            }
          }

          mensaje += totalRechazos < 5 ? '\n✅ Tasa de rechazo dentro del rango normal' :
                    '\n⚠️ Revisar procesos para reducir rechazos';
        } catch (error) {
          mensaje = '❌ REPORTE DE RECHAZOS\n\n❌ Error obteniendo datos del CRM\n🔄 Reintenta en unos minutos';
        }
        break;
      }
      case 'saludo_matutino':
        mensaje = '🌅 ¡Buenos días equipo ChileHome!\n\n💪 Es un nuevo día lleno de oportunidades\n📈 Meta de hoy: Superar las 5 ventas\n🎯 Recordatorio: Seguimiento de clientes pendientes\n☕ Que tengan un excelente día\n\n¡Vamos por un día increíble! 🚀'
        break
      case 'saludo':
        mensaje = '🌅 ¡Buenos días desde ChileHome! Que tengas un excelente día lleno de oportunidades. 💪'
        break
      case 'venta':
        mensaje = '🎉 ¡NUEVA VENTA REGISTRADA!\n\n👤 Cliente: María González\n💰 Monto: $2.400.000\n🏠 Modelo: Casa 54m²\n👔 Ejecutivo: Carlos Ruiz\n\n¡Excelente trabajo! 🚀'
        break
      case 'contrato':
        mensaje = '✅ ¡CONTRATO VALIDADO!\n\n👤 Cliente: Pedro Martínez\n💰 Valor: $3.200.000\n📄 Contrato: #3156\n🚚 Entrega: 15/11/2024\n\nListo para producción 🏗️'
        break
      case 'test_simple':
        mensaje = `Prueba simple - ${new Date().toLocaleTimeString('es-CL')}`
        break
      default:
        mensaje = `🧪 Prueba WhatsApp desde API - ${new Date().toLocaleTimeString('es-CL')}\n\nSistema funcionando correctamente ✅\n\nChileHome Contratos 🏠`
    }

    console.log(`📱 WHATSAPP MASIVO - Enviando a ${destinatarios.length} destinatarios`)
    console.log(`👥 Números: ${destinatarios.join(', ')}`)
    console.log(`💬 Mensaje: ${mensaje.substring(0, 100)}...`)

    // Para mensajes de ranking, usar técnica de sesión (template + texto libre)
    const esRanking = tipo.includes('ranking') || tipo.includes('resumen');

    if (esRanking) {
      console.log('🎯 Enviando ranking con técnica de sesión...')

      // Enviar a todos los destinatarios usando sesión
      const enviosPromises = destinatarios.map(async (numero) => {
        try {
          // 1. Enviar template primero para abrir sesión
          const templateResponse = await fetch(
            `https://graph.facebook.com/v18.0/${phoneId}/messages`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: numero,
                type: 'template',
                template: {
                  name: 'hello_world',
                  language: {
                    code: 'en_US'
                  }
                }
              }),
              signal: AbortSignal.timeout(10000)
            }
          )

          const templateResult = await templateResponse.json()

          if (!templateResponse.ok) {
            console.error(`❌ Error template a ${numero}:`, templateResult)
            return {
              numero,
              success: false,
              error: templateResult.error?.message || 'Error con template'
            }
          }

          // 2. Esperar un momento para procesar el template
          await new Promise(resolve => setTimeout(resolve, 2000))

          // 3. Enviar el mensaje real de ranking
          const textResponse = await fetch(
            `https://graph.facebook.com/v18.0/${phoneId}/messages`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: numero,
                type: 'text',
                text: {
                  body: mensaje
                }
              }),
              signal: AbortSignal.timeout(10000)
            }
          )

          const textResult = await textResponse.json()

          if (!textResponse.ok) {
            console.error(`❌ Error texto a ${numero}:`, textResult)
            return {
              numero,
              success: false,
              error: textResult.error?.message || 'Error enviando ranking'
            }
          }

          console.log(`✅ Ranking enviado exitosamente a: ${numero}`)
          return {
            numero,
            success: true,
            messageId: textResult.messages?.[0]?.id,
            templateId: templateResult.messages?.[0]?.id
          }
        } catch (error) {
          console.error(`💥 Error crítico enviando a ${numero}:`, error)
          return {
            numero,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          }
        }
      })

      // Esperar todos los envíos de sesión
      const resultados = await Promise.all(enviosPromises)

      // Analizar resultados
      const exitosos = resultados.filter(r => r.success)
      const fallidos = resultados.filter(r => !r.success)

      console.log(`📊 Resumen envío con sesión: ${exitosos.length} exitosos, ${fallidos.length} fallidos`)

      if (fallidos.length > 0) {
        console.error('❌ Envíos fallidos:', fallidos)
      }

      return NextResponse.json({
        success: true,
        mensaje: 'Envío masivo con sesión completado',
        tipo,
        metodo: 'sesion_template',
        estadisticas: {
          total: destinatarios.length,
          exitosos: exitosos.length,
          fallidos: fallidos.length,
          destinatarios: destinatarios
        },
        resultados: {
          exitosos: exitosos.map(r => ({ numero: r.numero, messageId: r.messageId, templateId: r.templateId })),
          fallidos: fallidos.map(r => ({ numero: r.numero, error: r.error }))
        },
        timestamp: new Date().toISOString()
      })
    }

    // Para mensajes no-ranking, usar método normal
    const enviosPromises = destinatarios.map(async (numero) => {
      try {
        const whatsappResponse = await fetch(
          `https://graph.facebook.com/v18.0/${phoneId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: numero,
              type: 'text',
              text: {
                body: mensaje
              }
            }),
            signal: AbortSignal.timeout(10000) // 10 segundos
          }
        )

        const responseData = await whatsappResponse.json()

        if (!whatsappResponse.ok) {
          console.error(`❌ Error enviando a ${numero}:`, responseData)
          return {
            numero,
            success: false,
            error: responseData.error?.message || 'Error desconocido'
          }
        }

        console.log(`✅ Enviado exitosamente a: ${numero}`)
        return {
          numero,
          success: true,
          messageId: responseData.messages?.[0]?.id
        }
      } catch (error) {
        console.error(`💥 Error crítico enviando a ${numero}:`, error)
        return {
          numero,
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      }
    })

    // Esperar todos los envíos
    const resultados = await Promise.all(enviosPromises)

    // Analizar resultados
    const exitosos = resultados.filter(r => r.success)
    const fallidos = resultados.filter(r => !r.success)

    console.log(`📊 Resumen envío: ${exitosos.length} exitosos, ${fallidos.length} fallidos`)

    if (fallidos.length > 0) {
      console.error('❌ Envíos fallidos:', fallidos)
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Envío masivo completado',
      tipo,
      estadisticas: {
        total: destinatarios.length,
        exitosos: exitosos.length,
        fallidos: fallidos.length,
        destinatarios: destinatarios
      },
      resultados: {
        exitosos: exitosos.map(r => ({ numero: r.numero, messageId: r.messageId })),
        fallidos: fallidos.map(r => ({ numero: r.numero, error: r.error }))
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 Error crítico:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}