// Función para convertir números a palabras en español
export const numeroATexto = (numero: number): string => {
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (numero === 0) return 'cero';
  if (numero === 100) return 'cien';
  if (numero === 1000) return 'mil';
  if (numero === 1000000) return 'un millón';

  let resultado = '';

  // Procesar millones
  if (numero >= 1000000) {
    const millones = Math.floor(numero / 1000000);
    if (millones === 1) {
      resultado += 'un millón ';
    } else {
      resultado += numeroATexto(millones) + ' millones ';
    }
    numero %= 1000000;
  }

  // Procesar miles
  if (numero >= 1000) {
    const miles = Math.floor(numero / 1000);
    if (miles === 1) {
      resultado += 'mil ';
    } else {
      resultado += numeroATexto(miles) + ' mil ';
    }
    numero %= 1000;
  }

  // Procesar centenas
  if (numero >= 100) {
    const cent = Math.floor(numero / 100);
    resultado += centenas[cent] + ' ';
    numero %= 100;
  }

  // Procesar decenas y unidades
  if (numero >= 20) {
    const dec = Math.floor(numero / 10);
    resultado += decenas[dec];
    numero %= 10;
    if (numero > 0) {
      resultado += ' y ' + unidades[numero];
    }
  } else if (numero >= 10) {
    resultado += especiales[numero - 10];
  } else if (numero > 0) {
    resultado += unidades[numero];
  }

  return resultado.trim();
}

// Función para formatear montos en texto
export const formatearMontoEnTexto = (monto: number): string => {
  const texto = numeroATexto(monto);
  return texto.charAt(0).toUpperCase() + texto.slice(1) + ' pesos';
}

// Función para formatear fechas en español
export const formatearFechaTexto = (fecha: string | Date): string => {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const dia = fechaObj.getDate();
  const mes = meses[fechaObj.getMonth()];
  const año = fechaObj.getFullYear();

  return `${dia} de ${mes} de ${año}`;
}