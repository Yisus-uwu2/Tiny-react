/**
 * Paleta de colores de TinyCare.
 * Cada propiedad está nombrada en español para mayor claridad del equipo.
 */
export const Colores = {
  // ── Fondos ──
  fondo: '#FFF8F5',
  fondoSecundario: '#F8F7FC',
  fondoTarjeta: '#FFFFFF',
  fondoTarjeta2: '#F9F5FF',
  fondoSutil: '#F9F8FC',

  // ── Marca ──
  primario: '#8B5CF6',
  primarioClaro: '#C4B5FD',
  primarioOscuro: '#6D28D9',
  secundario: '#F472B6',

  // ── Signos vitales ──
  corazon: '#FF6B8A',
  corazonOscuro: '#FF4775',
  corazonClaro: '#FFE4EC',
  oxigeno: '#38BDF8',
  oxigenoOscuro: '#0EA5E9',
  oxigenoClaro: '#E0F5FF',
  temperatura: '#FB923C',
  temperaturaOscuro: '#EA580C',
  temperaturaClaro: '#FFF0E5',
  actividad: '#34D399',
  actividadClaro: '#D9F7EE',

  // ── Estados ──
  seguro: '#4ADE80',
  seguroOscuro: '#16A34A',
  advertencia: '#FBBF24',
  advertenciaOscuro: '#B45309',
  peligro: '#F87171',
  peligroOscuro: '#DC2626',

  // ── Texto ──
  textoOscuro: '#1A1A2E',
  textoMedio: '#6B6B8A',
  textoClaro: '#9B95B0',
  textoSutil: '#A8A8C0',
  textoBlanco: '#FFFFFF',

  // ── Bordes / divisores ──
  borde: '#EDE9FE',
  bordeSutil: '#F1F0F8',
  divisor: '#F3F0FA',

  // ── Degradados (arreglos) ──
  gradientePrimario: ['#8B5CF6', '#6D28D9'],
  gradienteRosa: ['#F472B6', '#DB2777'],
  gradienteCorazon: ['#FF6B8A', '#FF4775'],
  gradienteOxigeno: ['#38BDF8', '#0EA5E9'],
  gradienteTemperatura: ['#FB923C', '#EA580C'],
  gradienteSeguro: ['#4ADE80', '#16A34A'],
  gradienteTarjeta: ['#FFFFFF', '#F9F5FF'],
} as const;
