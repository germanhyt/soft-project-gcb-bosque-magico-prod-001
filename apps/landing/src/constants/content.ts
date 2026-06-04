export const TURNOS = [
  { value: 'turno_1', label: 'Turno 1 - 9:00 a.m. - 12:00 m.' },
  { value: 'turno_2', label: 'Turno 2 - 2:00 p.m. - 5:00 p.m.' },
  { value: 'turno_3', label: 'Turno 3 - 7:00 p.m. - 10:00 p.m.' },
] as const;

export const PAQUETES = ['Básico', 'Estándar', 'Premium'] as const;

export const BENEFICIOS = [
  'Espacio privado por turno con atención planificada',
  'Ambiente natural, cálido y seguro para niños',
  'Shows, catering y extras en un solo flujo',
  'Equipo comercial que te acompaña hasta confirmar fecha',
];

export const SHOWS = [
  { nombre: 'Magia Chispeante', detalle: 'Rutina mágica e interacción con niños.' },
  { nombre: 'Show Mimo', detalle: 'Música, baile y adivinanzas en vivo.' },
  { nombre: 'Burbujas Fantásticas', detalle: 'Variedad de burbujas y cápsula especial.' },
  { nombre: 'Silent Disco', detalle: 'DJ con auriculares y luces para bailar.' },
];

export const CATERING = [
  { nombre: 'Popcorn', detalle: 'Mínimo 18 unidades por evento.' },
  { nombre: 'Algodón de azúcar', detalle: 'Ideal para fiestas infantiles.' },
  { nombre: 'Gelatina', detalle: 'Porciones individuales.' },
  { nombre: 'Arroz con leche', detalle: 'Clásico favorito de los pequeños.' },
];

export const FAQ = [
  {
    pregunta: '¿Cuántos niños incluye la tarifa base?',
    respuesta: 'La capacidad base es de 10 a 25 niños. Del 26 al 35 se aplica un adicional por niño.',
  },
  {
    pregunta: '¿Cómo separo la fecha?',
    respuesta: 'Con un adelanto referencial de S/ 500. El saldo se cancela antes del evento.',
  },
  {
    pregunta: '¿Puedo traer torta o decoración externa?',
    respuesta: 'Consulta con el equipo las políticas de alimentos y decoración permitidos.',
  },
  {
    pregunta: '¿La cotización en línea es definitiva?',
    respuesta: 'Es una estimación. El equipo confirma disponibilidad y detalle final al contactarte.',
  },
];

export const TERMINOS = [
  'Adelanto de S/ 500 para reservar fecha.',
  'Saldo cancelado antes del inicio del evento.',
  'Garantía referencial de S/ 500.',
  'Modificaciones con al menos 14 días calendario de anticipación.',
  'Respeto estricto del horario del turno reservado.',
];
