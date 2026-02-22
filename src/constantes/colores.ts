/**
 * Paleta de colores de TinyCare.
 * Cada propiedad está nombrada en español para mayor claridad del equipo.
 */
export const Colores = {
  // ── Fondos ──
  fondo: '#FFF8F5',
  fondoTarjeta: '#FFFFFF',
  fondoTarjeta2: '#F9F5FF',

  // ── Marca ──
  primario: '#8B5CF6',
  primarioClaro: '#C4B5FD',
  primarioOscuro: '#6D28D9',
  secundario: '#F472B6',

  // ── Signos vitales ──
  corazon: '#FF6B8A',
  corazonClaro: '#FFE4EC',
  oxigeno: '#38BDF8',
  oxigenoClaro: '#E0F5FF',
  temperatura: '#FB923C',
  temperaturaClaro: '#FFF0E5',
  actividad: '#34D399',
  actividadClaro: '#D9F7EE',

  // ── Estados ──
  seguro: '#4ADE80',
  advertencia: '#FBBF24',
  peligro: '#F87171',

  // ── Texto ──
  textoOscuro: '#2D2D4E',
  textoMedio: '#6B6B8A',
  textoClaro: '#A8A8C0',
  textoBlanco: '#FFFFFF',

  // ── Bordes / divisores ──
  borde: '#EDE9FE',
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
