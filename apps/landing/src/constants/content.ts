export const TURNOS = [
  { value: 'turno_1', label: 'Turno 1 - 9:00 a.m. - 12:00 m.' },
  { value: 'turno_2', label: 'Turno 2 - 2:00 p.m. - 5:00 p.m.' },
  { value: 'turno_3', label: 'Turno 3 - 7:00 p.m. - 10:00 p.m.' },
] as const;

export const PAQUETES = ['Básico', 'Estándar', 'Premium', 'Personalizado'] as const;

export const BENEFICIOS = [
  'Espacio privado por turno con atención planificada',
  'Ambiente natural, cálido y seguro para niños',
  'Shows, catering y extras en un solo flujo',
  'Equipo comercial que te acompaña hasta confirmar fecha',
];

export const SHOWS = [
  { nombre: 'Magia Chispeante', detalle: 'Rutina mágica e interacción con los niños.' },
  { nombre: 'Show Mimo', detalle: 'Música, baile y adivinanzas en vivo.' },
  { nombre: 'Burbujas Fantásticas', detalle: 'Variedad de burbujas y cápsula especial.' },
  { nombre: 'Show de Ciencia', detalle: 'Experimentos divertidos y educativos.' },
  { nombre: 'Show Competijuegos', detalle: 'Dinámicas y retos para todo el grupo.' },
  { nombre: 'Show Globoflexia', detalle: 'Figuras y sorpresas con globos.' },
  { nombre: 'Silent Disco', detalle: 'DJ con auriculares y luces para bailar.' },
  { nombre: 'Cine al aire libre', detalle: 'Proyección pensada para fiestas infantiles.' },
];

export const CATERING = [
  { nombre: 'Popcorn', detalle: 'S/ 10 por porción · mínimo 18 unidades por evento.' },
  { nombre: 'Algodón de azúcar', detalle: 'S/ 10 por porción · mínimo 18 unidades.' },
  { nombre: 'Manzanas acarameladas', detalle: 'S/ 10 por porción · mínimo 18 unidades.' },
  { nombre: 'Mazamorra morada', detalle: 'S/ 6 por porción · mínimo 18 unidades.' },
  { nombre: 'Gelatina', detalle: 'S/ 5 por porción · mínimo 18 unidades.' },
  { nombre: 'Arroz con leche', detalle: 'S/ 6 por porción · mínimo 18 unidades.' },
];

export const FAQ = [
  {
    pregunta: '¿Cuántos niños incluye la tarifa base?',
    respuesta: 'La capacidad base es de hasta 20 niños por show. Del 21 al 30 se aplican cargos adicionales según show y servicios extra.',
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
