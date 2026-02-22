/**
 * PantallaEstadisticas — Pantalla de estadísticas de salud.
 * Rediseñada con encabezado limpio, selector de período tipo píldora,
 * puntuación de bienestar, gráficos detallados y tabla resumen.
 */
import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity,
  Animated, Easing,
} from 'react-native';
import Svg, {
  Polyline, Line, Circle, Rect, Text as SvgText,
  Defs, LinearGradient as SvgGrad, Stop, Path,
} from 'react-native-svg';
import { useDatosSensor } from '../hooks/useDatosSensor';
import { Colores } from '../constantes/colores';

const { width: ANCHO_PANTALLA } = Dimensions.get('window');

type Periodo = '1h' | '6h' | '24h';
const PERIODOS: { clave: Periodo; etiqueta: string }[] = [
  { clave: '1h',  etiqueta: 'Última hora' },
  { clave: '6h',  etiqueta: '6 horas' },
  { clave: '24h', etiqueta: '24 horas' },
];

// ── Pantalla principal ──────────────────────────────────────────

export default function PantallaEstadisticas() {
  const { datos, historial } = useDatosSensor();
  const [periodo, setPeriodo] = useState<Periodo>('24h');

  // Animación de entrada
  const animEntrada = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(animEntrada, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }).start();
  }, []);

  // Animación del indicador del selector de período
  const animPildora = useRef(new Animated.Value(2)).current; // índice 2 = '24h'
  const indicePeriodo = PERIODOS.findIndex(p => p.clave === periodo);
  useEffect(() => {
    Animated.spring(animPildora, {
      toValue: indicePeriodo,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [indicePeriodo]);

  // Datos filtrados por período
  const corteMap: Record<Periodo, number> = { '1h': 2, '6h': 8, '24h': 24 };
  const datosCorte = historial.slice(-corteMap[periodo]);

  const datosRC = datosCorte.map(h => h.ritmoCardiaco);
  const datosO2 = datosCorte.map(h => h.oxigeno);
  const datosTemp = datosCorte.map(h => h.temperatura);
  const horas = datosCorte.map(h => h.hora);

  const promedio = (arr: number[], dec = 0) => {
    const v = arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
    return dec > 0 ? parseFloat(v.toFixed(dec)) : Math.round(v);
  };

  // ── Cálculo de puntuación de bienestar
  const puntajeRC = datos.ritmoCardiaco >= 100 && datos.ritmoCardiaco <= 160 ? 100
    : datos.ritmoCardiaco >= 90 && datos.ritmoCardiaco <= 170 ? 70 : 40;
  const puntajeO2 = datos.oxigeno >= 95 ? 100 : datos.oxigeno >= 92 ? 60 : 30;
  const puntajeTemp = datos.temperatura >= 36.5 && datos.temperatura <= 37.5 ? 100
    : datos.temperatura >= 36.0 && datos.temperatura <= 38.0 ? 65 : 30;
  const puntajeGeneral = Math.round((puntajeRC + puntajeO2 + puntajeTemp) / 3);

  const etiquetaPuntaje = puntajeGeneral >= 85 ? 'Excelente'
    : puntajeGeneral >= 65 ? 'Bueno'
    : puntajeGeneral >= 45 ? 'Regular' : 'Atención';
  const colorPuntaje = puntajeGeneral >= 85 ? Colores.seguro
    : puntajeGeneral >= 65 ? Colores.actividad
    : puntajeGeneral >= 45 ? Colores.advertencia : Colores.peligro;

  // Configuración de los 3 signos vitales para gráficos
  const signosVitales = useMemo(() => [
    {
      clave: 'rc',
      icono: '❤️',
      titulo: 'Ritmo cardíaco',
      datos: datosRC,
      horas,
      actual: datos.ritmoCardiaco,
      unidad: 'bpm',
      color: Colores.corazon,
      degradado: Colores.gradienteCorazon as [string, string],
      normalMin: 100,
      normalMax: 160,
      prom: promedio(datosRC),
      max: Math.max(...datosRC),
      min: Math.min(...datosRC),
      decimales: 0,
      puntaje: puntajeRC,
    },
    {
      clave: 'o2',
      icono: '💧',
      titulo: 'Oxigenación SpO₂',
      datos: datosO2,
      horas,
      actual: datos.oxigeno,
      unidad: '%',
      color: Colores.oxigeno,
      degradado: Colores.gradienteOxigeno as [string, string],
      normalMin: 95,
      normalMax: 100,
      prom: promedio(datosO2, 1),
      max: Math.max(...datosO2),
      min: Math.min(...datosO2),
      decimales: 1,
      puntaje: puntajeO2,
    },
    {
      clave: 'temp',
      icono: '🌡️',
      titulo: 'Temperatura',
      datos: datosTemp,
      horas,
      actual: datos.temperatura,
      unidad: '°C',
      color: Colores.temperatura,
      degradado: Colores.gradienteTemperatura as [string, string],
      normalMin: 36.5,
      normalMax: 37.5,
      prom: promedio(datosTemp, 1),
      max: parseFloat(Math.max(...datosTemp).toFixed(1)),
      min: parseFloat(Math.min(...datosTemp).toFixed(1)),
      decimales: 1,
      puntaje: puntajeTemp,
    },
  ], [datosRC, datosO2, datosTemp, datos]);

  return (
    <ScrollView style={e.contenedor} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>

      {/* ── ENCABEZADO LIMPIO ── */}
      <View style={e.zonaEncabezado}>
        <View style={e.espacioSuperior} />
        <View style={e.filaEncabezado}>
          <View>
            <Text style={e.tituloEncabezado}>Estadísticas</Text>
            <Text style={e.subtituloEncabezado}>Resumen de salud del bebé</Text>
          </View>
          <View style={[e.puntoVivo, { backgroundColor: datos.conectado ? Colores.seguro : Colores.peligro }]}>
            <View style={[e.puntoVivoInterno, { backgroundColor: datos.conectado ? Colores.seguro : Colores.peligro }]} />
          </View>
        </View>
      </View>

      {/* ── SELECTOR DE PERÍODO (PÍLDORA) ── */}
      <View style={e.contenedorPildora}>
        <View style={e.pistaPildora}>
          <Animated.View
            style={[
              e.indicadorPildora,
              {
                transform: [{
                  translateX: animPildora.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [2, (ANCHO_PANTALLA - 56) / 3 + 2, ((ANCHO_PANTALLA - 56) / 3) * 2 + 2],
                  }),
                }],
              },
            ]}
          />
          {PERIODOS.map((p) => {
            const activo = periodo === p.clave;
            return (
              <TouchableOpacity
                key={p.clave}
                style={e.tabPildora}
                onPress={() => setPeriodo(p.clave)}
                activeOpacity={0.7}
              >
                <Text style={[e.etiquetaPildora, activo && e.etiquetaPildoraActiva]}>
                  {p.etiqueta}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── PUNTUACIÓN DE BIENESTAR ── */}
      <Animated.View style={[e.tarjetaPuntaje, {
        opacity: animEntrada,
        transform: [{ translateY: animEntrada.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }]}>
        <View style={e.filaPuntajeSuperior}>
          <View>
            <Text style={e.tituloPuntaje}>Índice de bienestar</Text>
            <Text style={e.subtituloPuntaje}>Basado en signos vitales actuales</Text>
          </View>
          <View style={[e.insigniaPuntaje, { backgroundColor: colorPuntaje + '18', borderColor: colorPuntaje + '40' }]}>
            <Text style={[e.textoPuntajeInsignia, { color: colorPuntaje }]}>{etiquetaPuntaje}</Text>
          </View>
        </View>

        {/* Círculo de puntuación */}
        <View style={e.seccionCirculo}>
          <CirculoPuntaje puntaje={puntajeGeneral} color={colorPuntaje} />
        </View>

        {/* Barras de desglose */}
        <View style={e.desgloseContainer}>
          {signosVitales.map(sv => (
            <BarraPuntaje key={sv.clave} etiqueta={sv.titulo} icono={sv.icono} puntaje={sv.puntaje} color={sv.color} />
          ))}
        </View>
      </Animated.View>

      {/* ── GRÁFICOS DETALLADOS ── */}
      <View style={e.seccionGraficos}>
        <View style={e.encabezadoSeccion}>
          <Text style={e.tituloSeccion}>Historial detallado</Text>
          <Text style={e.subtituloSeccion}>Últimas {corteMap[periodo]} lecturas</Text>
        </View>

        {signosVitales.map(sv => (
          <View key={sv.clave} style={e.bloqueGrafico}>
            {/* Mini encabezado del gráfico */}
            <View style={e.encabezadoGrafico}>
              <View style={e.filaIconoTitulo}>
                <View style={[e.fondoIcono, { backgroundColor: sv.color + '15' }]}>
                  <Text style={e.emojiIcono}>{sv.icono}</Text>
                </View>
                <View>
                  <Text style={e.tituloGrafico}>{sv.titulo}</Text>
                  <Text style={[e.valorActual, { color: sv.color }]}>
                    {sv.decimales > 0 ? sv.actual.toFixed(sv.decimales) : sv.actual}
                    <Text style={e.unidadActual}> {sv.unidad}</Text>
                  </Text>
                </View>
              </View>
              <View style={e.miniEstadisticas}>
                <MiniStat etiqueta="Prom" valor={`${sv.prom}`} color={sv.color} />
                <MiniStat etiqueta="Máx" valor={`${sv.max}`} color={Colores.peligro} />
                <MiniStat etiqueta="Mín" valor={`${sv.min}`} color={Colores.oxigeno} />
              </View>
            </View>
            <GraficoDetallado
              datos={sv.datos}
              horas={sv.horas}
              color={sv.color}
              degradado={sv.degradado}
              normalMin={sv.normalMin}
              normalMax={sv.normalMax}
              unidad={sv.unidad}
              decimales={sv.decimales}
            />
          </View>
        ))}
      </View>

      {/* ── TABLA RESUMEN ── */}
      <View style={e.seccionTabla}>
        <Text style={e.tituloSeccion}>Resumen del período</Text>
        <View style={e.tabla}>
          <View style={[e.filaTabla, e.filaEncabezadoTabla]}>
            <Text style={[e.celdaTabla, e.encabezadoTabla, { flex: 2 }]}>Parámetro</Text>
            <Text style={[e.celdaTabla, e.encabezadoTabla]}>Prom.</Text>
            <Text style={[e.celdaTabla, e.encabezadoTabla]}>Máx.</Text>
            <Text style={[e.celdaTabla, e.encabezadoTabla]}>Mín.</Text>
          </View>
          {signosVitales.map(sv => (
            <View key={sv.clave} style={e.filaTabla}>
              <View style={[e.celdaTabla, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                <Text style={{ fontSize: 13 }}>{sv.icono}</Text>
                <Text style={[e.textoCelda, { color: sv.color, fontWeight: '700' }]}>{sv.titulo}</Text>
              </View>
              <Text style={[e.celdaTabla, e.textoCelda]}>{sv.prom} {sv.unidad}</Text>
              <Text style={[e.celdaTabla, e.textoCelda, { color: Colores.peligro }]}>{sv.max} {sv.unidad}</Text>
              <Text style={[e.celdaTabla, e.textoCelda, { color: Colores.oxigeno }]}>{sv.min} {sv.unidad}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ── Sub-componentes ─────────────────────────────────────────────

function MiniStat({ etiqueta, valor, color }: { etiqueta: string; valor: string; color: string }) {
  return (
    <View style={e.miniStatBox}>
      <Text style={[e.miniStatValor, { color }]}>{valor}</Text>
      <Text style={e.miniStatEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

function CirculoPuntaje({ puntaje, color }: { puntaje: number; color: string }) {
  const tam = 150;
  const radio = 60;
  const cx = tam / 2;
  const cy = tam / 2;
  const circ = 2 * Math.PI * radio;
  const lleno = (puntaje / 100) * circ;

  return (
    <View style={e.envolturioCirculo}>
      <Svg width={tam} height={tam}>
        <Circle cx={cx} cy={cy} r={radio} fill="none" stroke={Colores.borde} strokeWidth={10} />
        <Circle
          cx={cx} cy={cy} r={radio}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${lleno} ${circ}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${cx},${cy}`}
        />
      </Svg>
      <View style={e.centroCirculo}>
        <Text style={[e.numeroPuntaje, { color }]}>{puntaje}</Text>
        <Text style={[e.etiquetaPuntajeCirculo, { color: color + 'AA' }]}>/ 100</Text>
      </View>
    </View>
  );
}

function BarraPuntaje({ etiqueta, icono, puntaje, color }: { etiqueta: string; icono: string; puntaje: number; color: string }) {
  return (
    <View style={e.filaBarraPuntaje}>
      <Text style={e.iconoBarra}>{icono}</Text>
      <Text style={e.etiquetaBarra}>{etiqueta}</Text>
      <View style={e.pistaBarra}>
        <View style={[e.rellenoBarra, { width: `${puntaje}%`, backgroundColor: color }]} />
      </View>
      <Text style={[e.valorBarra, { color }]}>{puntaje}</Text>
    </View>
  );
}

function GraficoDetallado({
  datos, horas, color, degradado, normalMin, normalMax, unidad, decimales,
}: {
  datos: number[];
  horas: string[];
  color: string;
  degradado: [string, string];
  normalMin: number;
  normalMax: number;
  unidad: string;
  decimales: number;
}) {
  if (!datos || datos.length < 2) return null;

  const anchoGrafico = ANCHO_PANTALLA - 40;
  const altoGrafico = 180;
  const margenIzq = 40;
  const margenDer = 10;
  const margenSup = 14;
  const margenInf = 24;
  const anchoInterno = anchoGrafico - margenIzq - margenDer;
  const altoInterno = altoGrafico - margenSup - margenInf;

  const minDatos = Math.min(...datos, normalMin);
  const maxDatos = Math.max(...datos, normalMax);
  const relleno = (maxDatos - minDatos) * 0.18 || 2;
  const yMin = minDatos - relleno;
  const yMax = maxDatos + relleno;
  const rangoY = yMax - yMin;

  const aX = (i: number) => margenIzq + (i / (datos.length - 1)) * anchoInterno;
  const aY = (v: number) => margenSup + altoInterno - ((v - yMin) / rangoY) * altoInterno;

  // Ticks del eje Y (4 líneas)
  const ticksY: number[] = [];
  for (let i = 0; i <= 3; i++) ticksY.push(yMin + (rangoY / 3) * i);

  // Etiquetas del eje X
  const pasoX = Math.max(1, Math.floor(datos.length / 5));
  const etiquetasX: { i: number; txt: string }[] = [];
  for (let i = 0; i < datos.length; i += pasoX) etiquetasX.push({ i, txt: horas[i] || '' });
  if (etiquetasX[etiquetasX.length - 1]?.i !== datos.length - 1) {
    etiquetasX.push({ i: datos.length - 1, txt: horas[datos.length - 1] || '' });
  }

  const yNormalMin = aY(normalMin);
  const yNormalMax = aY(normalMax);
  const puntos = datos.map((v, i) => `${aX(i)},${aY(v)}`).join(' ');
  const areaLlena = puntos + ` ${aX(datos.length - 1)},${margenSup + altoInterno} ${aX(0)},${margenSup + altoInterno}`;

  return (
    <View style={[e.tarjetaGrafico, { width: anchoGrafico }]}>
      <Svg width={anchoGrafico} height={altoGrafico}>
        <Defs>
          <SvgGrad id={`areaGrad_${color}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.01} />
          </SvgGrad>
        </Defs>

        {/* Líneas de cuadrícula */}
        {ticksY.map((tick, i) => (
          <Line key={`g${i}`} x1={margenIzq} y1={aY(tick)} x2={margenIzq + anchoInterno} y2={aY(tick)} stroke={Colores.borde} strokeWidth={0.7} />
        ))}

        {/* Etiquetas eje Y */}
        {ticksY.map((tick, i) => (
          <SvgText key={`ey${i}`} x={margenIzq - 5} y={aY(tick) + 4} fontSize={9} fill={Colores.textoClaro} textAnchor="end" fontWeight="600">
            {decimales > 0 ? tick.toFixed(1) : Math.round(tick)}
          </SvgText>
        ))}

        {/* Etiquetas eje X */}
        {etiquetasX.map(({ i, txt }) => (
          <SvgText key={`ex${i}`} x={aX(i)} y={altoGrafico - 4} fontSize={8} fill={Colores.textoClaro} textAnchor="middle" fontWeight="500">
            {txt}
          </SvgText>
        ))}

        {/* Zona normal */}
        <Rect x={margenIzq} y={yNormalMax} width={anchoInterno} height={Math.max(0, yNormalMin - yNormalMax)} fill={color} opacity={0.06} rx={3} />
        <Line x1={margenIzq} y1={yNormalMax} x2={margenIzq + anchoInterno} y2={yNormalMax} stroke={color} strokeWidth={0.8} strokeDasharray="5,3" strokeOpacity={0.4} />
        <Line x1={margenIzq} y1={yNormalMin} x2={margenIzq + anchoInterno} y2={yNormalMin} stroke={color} strokeWidth={0.8} strokeDasharray="5,3" strokeOpacity={0.4} />

        {/* Relleno bajo la línea */}
        <Polyline points={areaLlena} fill={`url(#areaGrad_${color})`} stroke="none" />

        {/* Línea principal */}
        <Polyline points={puntos} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Puntos */}
        {datos.map((v, i) => {
          const esUltimo = i === datos.length - 1;
          const fueraRango = v < normalMin || v > normalMax;
          const colorPunto = fueraRango ? Colores.peligro : color;
          return (
            <React.Fragment key={`p${i}`}>
              <Circle cx={aX(i)} cy={aY(v)} r={esUltimo ? 4 : 2} fill={colorPunto} />
              {esUltimo && <Circle cx={aX(i)} cy={aY(v)} r={9} fill={colorPunto} opacity={0.12} />}
              {fueraRango && !esUltimo && (
                <Circle cx={aX(i)} cy={aY(v)} r={5} fill="none" stroke={Colores.peligro} strokeWidth={1.2} opacity={0.4} />
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

// ── Estilos ─────────────────────────────────────────────────────

const ALTO_PILDORA = 44;
const ANCHO_TAB = (ANCHO_PANTALLA - 56 - 4) / 3;

const e = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondo },

  // Encabezado
  zonaEncabezado: { backgroundColor: Colores.fondo, paddingHorizontal: 20 },
  espacioSuperior: { height: 54 },
  filaEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tituloEncabezado: { fontSize: 26, fontWeight: '900', color: Colores.textoOscuro, letterSpacing: -0.5 },
  subtituloEncabezado: { fontSize: 13, color: Colores.textoClaro, fontWeight: '500', marginTop: 2 },
  puntoVivo: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', opacity: 0.3 },
  puntoVivoInterno: { width: 12, height: 12, borderRadius: 6 },

  // Selector de período
  contenedorPildora: { paddingHorizontal: 24, marginTop: 18, marginBottom: 16 },
  pistaPildora: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderRadius: ALTO_PILDORA / 2,
    height: ALTO_PILDORA,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colores.borde,
    position: 'relative',
    paddingHorizontal: 2,
  },
  indicadorPildora: {
    position: 'absolute',
    width: ANCHO_TAB,
    height: ALTO_PILDORA - 6,
    borderRadius: (ALTO_PILDORA - 6) / 2,
    backgroundColor: Colores.primario + '18',
    borderWidth: 1.5,
    borderColor: Colores.primario + '40',
    top: 2,
  },
  tabPildora: { flex: 1, alignItems: 'center', justifyContent: 'center', height: ALTO_PILDORA, zIndex: 2 },
  etiquetaPildora: { fontSize: 13, fontWeight: '600', color: Colores.textoClaro },
  etiquetaPildoraActiva: { color: Colores.primario, fontWeight: '800' },

  // Tarjeta de puntuación
  tarjetaPuntaje: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: 16,
  },
  filaPuntajeSuperior: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  tituloPuntaje: { fontSize: 17, fontWeight: '800', color: Colores.textoOscuro },
  subtituloPuntaje: { fontSize: 12, color: Colores.textoClaro, fontWeight: '500', marginTop: 2 },
  insigniaPuntaje: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1 },
  textoPuntajeInsignia: { fontSize: 12, fontWeight: '700' },

  seccionCirculo: { alignItems: 'center', marginVertical: 8 },
  envolturioCirculo: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  centroCirculo: { position: 'absolute', alignItems: 'center' },
  numeroPuntaje: { fontSize: 44, fontWeight: '900', lineHeight: 48 },
  etiquetaPuntajeCirculo: { fontSize: 13, fontWeight: '600', marginTop: -2 },

  desgloseContainer: { gap: 8, marginTop: 8 },
  filaBarraPuntaje: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconoBarra: { fontSize: 14, width: 20, textAlign: 'center' },
  etiquetaBarra: { width: 100, fontSize: 12, color: Colores.textoMedio, fontWeight: '600' },
  pistaBarra: { flex: 1, height: 8, backgroundColor: Colores.borde, borderRadius: 4, overflow: 'hidden' },
  rellenoBarra: { height: '100%', borderRadius: 4 },
  valorBarra: { width: 28, fontSize: 12, fontWeight: '800', textAlign: 'right' },

  // Gráficos
  seccionGraficos: { paddingHorizontal: 20, marginBottom: 8 },
  encabezadoSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  tituloSeccion: { fontSize: 17, fontWeight: '800', color: Colores.textoOscuro },
  subtituloSeccion: { fontSize: 12, color: Colores.textoClaro, fontWeight: '500' },

  bloqueGrafico: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  encabezadoGrafico: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  filaIconoTitulo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fondoIcono: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emojiIcono: { fontSize: 18 },
  tituloGrafico: { fontSize: 13, fontWeight: '700', color: Colores.textoOscuro },
  valorActual: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  unidadActual: { fontSize: 11, fontWeight: '600' },
  miniEstadisticas: { flexDirection: 'row', gap: 10 },
  miniStatBox: { alignItems: 'center' },
  miniStatValor: { fontSize: 13, fontWeight: '800' },
  miniStatEtiqueta: { fontSize: 9, color: Colores.textoClaro, fontWeight: '600' },

  tarjetaGrafico: { alignSelf: 'center' },

  // Tabla resumen
  seccionTabla: { paddingHorizontal: 20, marginTop: 4, marginBottom: 8 },
  tabla: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  filaTabla: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colores.divisor,
    alignItems: 'center',
  },
  filaEncabezadoTabla: { backgroundColor: Colores.fondoTarjeta2 },
  celdaTabla: { flex: 1, justifyContent: 'center' },
  encabezadoTabla: { fontSize: 11, fontWeight: '700', color: Colores.textoOscuro, textAlign: 'center' },
  textoCelda: { fontSize: 11, color: Colores.textoMedio, textAlign: 'center', fontWeight: '600' },
});
