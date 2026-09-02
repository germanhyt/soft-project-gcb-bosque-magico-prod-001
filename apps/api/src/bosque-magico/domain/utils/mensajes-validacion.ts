import { BadRequestException, type ValidationError } from '@nestjs/common';

const ETIQUETAS: Record<string, string> = {
  precioDerechoIngresoShowExterno: 'el monto del derecho de show externo',
  precioDerechoIngresoDecoracionExterno: 'el monto del derecho de decoración externa',
  precioDerechoIngresoCarritoSnackExterno: 'el monto del derecho de carrito snack',
  precioDerechoDecoracionPersonalizada: 'el monto de decoración personalizada',
  precioSalitaLounge: 'el monto de la salita lounge',
  salitaLoungeCantidad: 'la cantidad de salita lounge',
  cantidadNinos: 'la cantidad de niños',
  horasAdicionales: 'las horas adicionales',
  paquete: 'el paquete',
  fechaEvento: 'la fecha del evento',
};

function etiqueta(property: string): string {
  return ETIQUETAS[property] ?? 'este dato';
}

function traducirConstraint(property: string, message: string): string {
  const campo = etiqueta(property);
  if (/should not exist/i.test(message)) {
    return `No se pudo aplicar ${campo}. Recarga la página e inténtalo de nuevo.`;
  }
  if (/must be a number/i.test(message) || /must be an integer/i.test(message)) {
    return `Indica un número válido en ${campo}.`;
  }
  if (/should not be empty/i.test(message) || /must be a string/i.test(message)) {
    return `Completa ${campo}.`;
  }
  if (/must be a boolean/i.test(message)) {
    return `Revisa ${campo}.`;
  }
  return message;
}

export function mensajesValidacion(errors: ValidationError[]): string[] {
  const out: string[] = [];
  for (const error of errors) {
    for (const msg of Object.values(error.constraints ?? {})) {
      out.push(traducirConstraint(error.property, msg));
    }
    if (error.children?.length) {
      out.push(...mensajesValidacion(error.children));
    }
  }
  return out.filter(Boolean);
}

export function exceptionFactoryValidacion(errors: ValidationError[]) {
  const mensajes = mensajesValidacion(errors);
  return new BadRequestException(
    mensajes.length ? mensajes : ['Revisa los datos del formulario e inténtalo de nuevo.'],
  );
}
