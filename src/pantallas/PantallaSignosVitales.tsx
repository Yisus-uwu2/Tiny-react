/**
 * PantallaSignosVitales — Monitoreo detallado de signos vitales.
 * Selector de pestañas tipo píldora animada, gráfico detallado con
 * cuadrícula, zona normal y puntos de datos.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity,
  Animated, Easing, Modal, Pressable, Platform,
} from 'react-native';
import Svg, {
  Polyline, Line, Circle, Rect, Text as SvgText,
  Defs, LinearGradient as SvgGrad, Stop,
} from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { useDatosSensor, PuntoHistorial } from '../hooks/useDatosSensor';
import { Colores } from '../constantes/colores';

const { width: ANCHO_PANTALLA } = Dimensions.get('window');

// ── Tipos ────────────────────────────────────────────────────────
type Pestaña = 'corazon' | 'oxigeno' | 'temp';

const PESTAÑAS: { clave: Pestaña; emoji: string; etiqueta: string; color: string }[] = [
  { clave: 'corazon', emoji: '❤️', etiqueta: 'Corazón',  color: Colores.corazon },
  { clave: 'oxigeno', emoji: '💧', etiqueta: 'Oxígeno',  color: Colores.oxigeno },
  { clave: 'temp',    emoji: '🌡️', etiqueta: 'Temp.',    color: Colores.temperatura },
];

// ── Pantalla principal ──────────────────────────────────────────
export default function PantallaSignosVitales({ route }: any) {
  const pestanaInicial: Pestaña = route?.params?.pestana ?? 'corazon';
  const { datos, historial } = useDatosSensor();
  const [pestañaActiva, setPestañaActiva] = useState<Pestaña>(pestanaInicial);
  const [detalleVisible, setDetalleVisible] = useState(false);

  // Animación del panel de detalle
  const animDetalle = useRef(new Animated.Value(0)).current;

  const abrirDetalle = useCallback(() => {
    setDetalleVisible(true);
    animDetalle.setValue(0);
    Animated.spring(animDetalle, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }, [animDetalle]);

  const cerrarDetalle = useCallback(() => {
    Animated.timing(animDetalle, { toValue: 0, duration: 200, useNativeDriver: true, easing: Easing.in(Easing.ease) }).start(() => {
      setDetalleVisible(false);
    });
  }, [animDetalle]);

  // Sincronizar cuando llegan nuevos params de navegación
  useEffect(() => {
    if (route?.params?.pestana) {
      setPestañaActiva(route.params.pestana);
    }
  }, [route?.params?.pestana]);

  // Animación de la píldora deslizante
  const animDeslizamiento = useRef(new Animated.Value(0)).current;
  const indicePestaña = PESTAÑAS.findIndex(t => t.clave === pestañaActiva);

  useEffect(() => {
    Animated.spring(animDeslizamiento, {
      toValue: indicePestaña,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [indicePestaña]);

  // Entrada
  const animEntrada = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(animEntrada, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }).start();
  }, []);

  // Pulso para valor principal (solo corazón)
  const animPulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (pestañaActiva === 'corazon') {
      const bucle = Animated.loop(
        Animated.sequence([
          Animated.timing(animPulso, { toValue: 1.06, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(animPulso, { toValue: 1,    duration: 500, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
          Animated.delay(300),
        ])
      );
      bucle.start();
      return () => bucle.stop();
    } else {
      animPulso.setValue(1);
    }
  }, [pestañaActiva]);

  const configPestaña = {
    corazon: {
      datosGrafico: historial.map(h => h.ritmoCardiaco),
      horas: historial.map(h => h.hora),
      actual: datos.ritmoCardiaco,
      unidad: 'bpm',
      etiqueta: 'Ritmo cardíaco',
      color: Colores.corazon,
      colorClaro: Colores.corazonClaro,
      degradado: Colores.gradienteCorazon as [string, string],
      normalMin: 100,
      normalMax: 160,
      icono: '❤️',
      decimales: 0,
    },
    oxigeno: {
      datosGrafico: historial.map(h => h.oxigeno),
      horas: historial.map(h => h.hora),
      actual: datos.oxigeno,
      unidad: '%',
      etiqueta: 'Oxigenación SpO₂',
      color: Colores.oxigeno,
      colorClaro: Colores.oxigenoClaro,
      degradado: Colores.gradienteOxigeno as [string, string],
      normalMin: 95,
      normalMax: 100,
      icono: '💧',
      decimales: 1,
    },
    temp: {
      datosGrafico: historial.map(h => h.temperatura),
      horas: historial.map(h => h.hora),
      actual: datos.temperatura,
      unidad: '°C',
      etiqueta: 'Temperatura',
      color: Colores.temperatura,
      colorClaro: Colores.temperaturaClaro,
      degradado: Colores.gradienteTemperatura as [string, string],
      normalMin: 36.5,
      normalMax: 37.5,
      icono: '🌡️',
      decimales: 1,
    },
  };

  const cfg = configPestaña[pestañaActiva];
  const prom = cfg.datosGrafico.reduce((a, b) => a + b, 0) / (cfg.datosGrafico.length || 1);
  const valorMax = Math.max(...cfg.datosGrafico);
  const valorMin = Math.min(...cfg.datosGrafico);
  const enRango = cfg.actual >= cfg.normalMin && cfg.actual <= cfg.normalMax;

  const colorEstado = enRango ? Colores.seguro : Colores.peligro;
  const etiquetaEstado = enRango ? 'Normal' : 'Revisar';

  return (
    <>
    <ScrollView style={es.contenedor} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>

      {/* ── ENCABEZADO LIMPIO ── */}
      <View style={es.zonaEncabezado}>
        <View style={es.espacioSuperior} />
        <View style={es.filaEncabezado}>
          <View>
            <Text style={es.tituloEncabezado}>Signos vitales</Text>
            <Text style={es.subtituloEncabezado}>Monitoreo en tiempo real</Text>
          </View>
          <View style={[es.puntoVivo, { backgroundColor: datos.conectado ? Colores.seguro : Colores.peligro }]}>
            <View style={[es.puntoVivoInterno, { backgroundColor: datos.conectado ? Colores.seguro : Colores.peligro }]} />
          </View>
        </View>
      </View>

      {/* ── PESTAÑAS TIPO PÍLDORA ── */}
      <View style={es.contenedorPildora}>
        <View style={es.pistaPildora}>
          <Animated.View
            style={[
              es.indicadorPildora,
              {
                backgroundColor: PESTAÑAS[indicePestaña].color + '20',
                borderColor: PESTAÑAS[indicePestaña].color + '40',
                transform: [{
                  translateX: animDeslizamiento.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [2, (ANCHO_PANTALLA - 56) / 3 + 2, ((ANCHO_PANTALLA - 56) / 3) * 2 + 2],
                  }),
                }],
              },
            ]}
          />
          {PESTAÑAS.map((tab) => {
            const activa = pestañaActiva === tab.clave;
            return (
              <TouchableOpacity
                key={tab.clave}
                style={es.tabPildora}
                onPress={() => setPestañaActiva(tab.clave)}
                activeOpacity={0.7}
              >
                <Text style={es.emojiPildora}>{tab.emoji}</Text>
                <Text style={[es.etiquetaPildora, activa && { color: tab.color, fontWeight: '800' }]}>
                  {tab.etiqueta}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── MÉTRICA PRINCIPAL ── */}
      <Animated.View style={[es.tarjetaMetrica, { opacity: animEntrada, transform: [{ translateY: animEntrada.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <View style={es.parteSuperiorMetrica}>
          <View style={es.metricaPrincipal}>
            <Animated.Text style={[es.valorMetrica, { color: cfg.color, transform: [{ scale: animPulso }] }]}>
              {cfg.decimales > 0 ? cfg.actual.toFixed(cfg.decimales) : cfg.actual}
            </Animated.Text>
            <Text style={[es.unidadMetrica, { color: cfg.color }]}>{cfg.unidad}</Text>
          </View>
          <View style={[es.pildoraEstado, { backgroundColor: colorEstado + '18', borderColor: colorEstado + '40' }]}>
            <View style={[es.puntoEstado, { backgroundColor: colorEstado }]} />
            <Text style={[es.textoEstado, { color: colorEstado }]}>{etiquetaEstado}</Text>
          </View>
        </View>

        <Text style={[es.etiquetaMetrica, { color: cfg.color + 'AA' }]}>{cfg.etiqueta}</Text>

        {/* Fila de estadísticas */}
        <View style={es.filaEstadisticas}>
          <CajaEstadistica etiqueta="Promedio" valor={cfg.decimales > 0 ? prom.toFixed(1) : Math.round(prom).toString()} unidad={cfg.unidad} color={cfg.color} icono="⌀" />
          <View style={es.divisorEstadistica} />
          <CajaEstadistica etiqueta="Máximo" valor={cfg.decimales > 0 ? valorMax.toFixed(1) : valorMax.toString()} unidad={cfg.unidad} color={Colores.peligro} icono="▲" />
          <View style={es.divisorEstadistica} />
          <CajaEstadistica etiqueta="Mínimo" valor={cfg.decimales > 0 ? valorMin.toFixed(1) : valorMin.toString()} unidad={cfg.unidad} color={Colores.oxigeno} icono="▼" />
        </View>

        {/* Barra de rango normal */}
        <View style={es.envolturioRango}>
          <Text style={es.etiquetaRango}>Rango normal: {cfg.normalMin}–{cfg.normalMax} {cfg.unidad}</Text>
          <BarraRango actual={cfg.actual} min={cfg.normalMin} max={cfg.normalMax} color={cfg.color} />
        </View>
      </Animated.View>

      {/* ── GRÁFICO DETALLADO ── */}
      <TouchableOpacity activeOpacity={0.8} onPress={abrirDetalle}>
        <View style={es.seccionGrafico}>
          <View style={es.encabezadoGrafico}>
            <Text style={es.tituloSeccion}>Historial</Text>
            <Text style={[es.subtituloGrafico, { color: cfg.color }]}>Toca para ver detalle ▸</Text>
          </View>
          <GraficoDetallado
            datos={cfg.datosGrafico}
            horas={cfg.horas}
            color={cfg.color}
            degradado={cfg.degradado}
            normalMin={cfg.normalMin}
            normalMax={cfg.normalMax}
            unidad={cfg.unidad}
            decimales={cfg.decimales}
          />
        </View>
      </TouchableOpacity>

      {/* ── CONSEJOS ── */}
      <View style={[es.tarjetaConsejos, { borderLeftColor: cfg.color }]}>
        <Text style={es.tituloConsejos}>
          {cfg.icono} {pestañaActiva === 'corazon' ? 'Sobre el ritmo cardíaco' : pestañaActiva === 'oxigeno' ? 'Sobre la oxigenación' : 'Sobre la temperatura'} en bebés
        </Text>
        {(pestañaActiva === 'corazon' ? consejosCorazon : pestañaActiva === 'oxigeno' ? consejosOxigeno : consejosTemp).map((consejo, i) => (
          <View key={i} style={es.filaConsejo}>
            <View style={[es.viñetaConsejo, { backgroundColor: cfg.color }]} />
            <Text style={es.textoConsejo}>{consejo}</Text>
          </View>
        ))}
      </View>
    </ScrollView>

    {/* ── MODAL DETALLE MÉDICO ── */}
    <Modal visible={detalleVisible} transparent animationType="none" statusBarTranslucent onRequestClose={cerrarDetalle}>
      <View style={esDetalle.overlay}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrarDetalle} />
        <Animated.View style={[esDetalle.panel, {
          transform: [{ translateY: animDetalle.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
          opacity: animDetalle,
        }]}>
          <PanelDetalleMedico
            historial={historial}
            pestana={pestañaActiva}
            cfg={cfg}
            onCerrar={cerrarDetalle}
          />
        </Animated.View>
      </View>
    </Modal>
    </>
  );
}

// ── Sub-componentes ─────────────────────────────────────────────

function CajaEstadistica({ etiqueta, valor, unidad, color, icono }: { etiqueta: string; valor: string; unidad: string; color: string; icono: string }) {
  return (
    <View style={es.cajaEstadistica}>
      <Text style={[es.iconoEstadistica, { color: color + '80' }]}>{icono}</Text>
      <Text style={[es.valorEstadistica, { color }]}>{valor}<Text style={es.unidadEstadistica}> {unidad}</Text></Text>
      <Text style={es.etiquetaEstadistica}>{etiqueta}</Text>
    </View>
  );
}

function BarraRango({ actual, min, max, color }: { actual: number; min: number; max: number; color: string }) {
  const rango = max - min;
  const lo = min - rango * 0.5;
  const hi = max + rango * 0.5;
  const pct = Math.max(0, Math.min(1, (actual - lo) / (hi - lo)));
  const normalL = ((min - lo) / (hi - lo)) * 100;
  const normalR = (1 - (max - lo) / (hi - lo)) * 100;
  const enRango = actual >= min && actual <= max;

  return (
    <View style={es.pistaRango}>
      <View style={[es.rangoNormal, { left: `${normalL}%`, right: `${normalR}%`, backgroundColor: color + '22' }]} />
      <View style={[es.puntoRango, {
        left: `${pct * 100}%`,
        backgroundColor: enRango ? color : Colores.peligro,
        shadowColor: enRango ? color : Colores.peligro,
      }]} />
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

  const anchoGrafico = ANCHO_PANTALLA - 48;
  const altoGrafico = 240;
  const margenIzq = 46;
  const margenDer = 34;
  const margenSup = 32;
  const margenInf = 34;
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

  const ticksY: number[] = [];
  for (let i = 0; i <= 4; i++) ticksY.push(yMin + (rangoY / 4) * i);

  const pasoX = Math.max(1, Math.floor(datos.length / 6));
  const etiquetasX: { i: number; txt: string }[] = [];
  for (let i = 0; i < datos.length; i += pasoX) etiquetasX.push({ i, txt: horas[i] || '' });
  if (etiquetasX[etiquetasX.length - 1]?.i !== datos.length - 1) {
    etiquetasX.push({ i: datos.length - 1, txt: horas[datos.length - 1] || '' });
  }

  const yNormalMin = aY(normalMin);
  const yNormalMax = aY(normalMax);
  const puntos = datos.map((v, i) => `${aX(i)},${aY(v)}`).join(' ');
  const areaLlena = datos.map((v, i) => `${aX(i)},${aY(v)}`).join(' ')
    + ` ${aX(datos.length - 1)},${margenSup + altoInterno} ${aX(0)},${margenSup + altoInterno}`;

  return (
    <View style={[es.tarjetaGraficoDetallado, { width: anchoGrafico }]}>
      <Svg width={anchoGrafico} height={altoGrafico}>
        <Defs>
          <SvgGrad id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.01} />
          </SvgGrad>
        </Defs>

        {ticksY.map((tick, i) => (
          <Line key={`g${i}`} x1={margenIzq} y1={aY(tick)} x2={margenIzq + anchoInterno} y2={aY(tick)} stroke={Colores.borde} strokeWidth={0.8} />
        ))}
        {ticksY.map((tick, i) => (
          <SvgText key={`ey${i}`} x={margenIzq - 6} y={aY(tick) + 4} fontSize={10} fill={Colores.textoClaro} textAnchor="end" fontWeight="600">
            {decimales > 0 ? tick.toFixed(1) : Math.round(tick)}
          </SvgText>
        ))}
        {etiquetasX.map(({ i, txt }) => (
          <SvgText key={`ex${i}`} x={aX(i)} y={altoGrafico - 6} fontSize={9} fill={Colores.textoClaro} textAnchor="middle" fontWeight="500">
            {txt}
          </SvgText>
        ))}

        <Rect x={margenIzq} y={yNormalMax} width={anchoInterno} height={Math.max(0, yNormalMin - yNormalMax)} fill={color} opacity={0.06} rx={4} />
        <Line x1={margenIzq} y1={yNormalMax} x2={margenIzq + anchoInterno} y2={yNormalMax} stroke={color} strokeWidth={1} strokeDasharray="6,4" strokeOpacity={0.45} />
        <Line x1={margenIzq} y1={yNormalMin} x2={margenIzq + anchoInterno} y2={yNormalMin} stroke={color} strokeWidth={1} strokeDasharray="6,4" strokeOpacity={0.45} />
        <SvgText x={margenIzq + anchoInterno + 2} y={yNormalMax - 3} fontSize={8} fill={color} opacity={0.7} fontWeight="700">máx</SvgText>
        <SvgText x={margenIzq + anchoInterno + 2} y={yNormalMin + 10} fontSize={8} fill={color} opacity={0.7} fontWeight="700">mín</SvgText>

        <Polyline points={areaLlena} fill="url(#areaGrad)" stroke="none" />
        <Polyline points={puntos} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {datos.map((v, i) => {
          const cx = aX(i);
          const cy = aY(v);
          const esUltimo = i === datos.length - 1;
          const fueraRango = v < normalMin || v > normalMax;
          const colorPunto = fueraRango ? Colores.peligro : color;
          return (
            <React.Fragment key={`dp${i}`}>
              <Circle cx={cx} cy={cy} r={esUltimo ? 5 : 2.5} fill={colorPunto} />
              {esUltimo && (
                <>
                  <Circle cx={cx} cy={cy} r={10} fill={colorPunto} opacity={0.15} />
                  <Circle cx={cx} cy={cy} r={16} fill={colorPunto} opacity={0.06} />
                </>
              )}
              {fueraRango && !esUltimo && (
                <Circle cx={cx} cy={cy} r={6} fill="none" stroke={Colores.peligro} strokeWidth={1.5} opacity={0.5} />
              )}
            </React.Fragment>
          );
        })}

        <Rect x={aX(datos.length - 1) - 22} y={aY(datos[datos.length - 1]) - 26} width={44} height={18} rx={9} fill={color} />
        <SvgText x={aX(datos.length - 1)} y={aY(datos[datos.length - 1]) - 13} fontSize={10} fill="#FFFFFF" textAnchor="middle" fontWeight="800">
          {decimales > 0 ? datos[datos.length - 1].toFixed(1) : datos[datos.length - 1]}
        </SvgText>
      </Svg>

      <View style={es.leyendaGrafico}>
        <View style={es.elementoLeyenda}>
          <View style={[es.lineaLeyenda, { backgroundColor: color, opacity: 0.45 }]} />
          <Text style={es.textoLeyenda}>Rango normal ({normalMin}–{normalMax})</Text>
        </View>
        <View style={es.elementoLeyenda}>
          <View style={[es.puntoLeyenda, { backgroundColor: Colores.peligro }]} />
          <Text style={es.textoLeyenda}>Fuera de rango</Text>
        </View>
      </View>
    </View>
  );
}

// ── Panel Detalle Médico ────────────────────────────────────────

function PanelDetalleMedico({
  historial,
  pestana,
  cfg,
  onCerrar,
}: {
  historial: PuntoHistorial[];
  pestana: Pestaña;
  cfg: any;
  onCerrar: () => void;
}) {
  const campo = pestana === 'corazon' ? 'ritmoCardiaco' : pestana === 'oxigeno' ? 'oxigeno' : 'temperatura';
  const valores = historial.map(p => (p as any)[campo] as number);
  const horas = historial.map(p => p.hora);

  const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores);
  const totalFuera = valores.filter(v => v < cfg.normalMin || v > cfg.normalMax).length;
  const pctFuera = Math.round((totalFuera / valores.length) * 100);

  // Calcular tendencia (regresión lineal simple)
  const n = valores.length;
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY = valores.reduce((a, b) => a + b, 0);
  const sumXY = valores.reduce((a, v, i) => a + i * v, 0);
  const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const tendencia = pendiente > 0.05 ? 'Ascendente' : pendiente < -0.05 ? 'Descendente' : 'Estable';
  const colorTendencia = pendiente > 0.05 ? '#F59E0B' : pendiente < -0.05 ? Colores.oxigeno : Colores.seguro;

  // Variación máxima entre lecturas consecutivas
  let maxVariacion = 0;
  let idxMaxVariacion = 0;
  for (let i = 1; i < valores.length; i++) {
    const diff = Math.abs(valores[i] - valores[i - 1]);
    if (diff > maxVariacion) { maxVariacion = diff; idxMaxVariacion = i; }
  }

  const dec = cfg.decimales;
  const fmt = (v: number) => dec > 0 ? v.toFixed(dec) : Math.round(v).toString();

  return (
    <ScrollView style={esDetalle.contenidoPanel} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Encabezado */}
      <View style={esDetalle.encabezado}>
        <View style={{ flex: 1 }}>
          <Text style={esDetalle.tituloPanel}>Historial detallado</Text>
          <Text style={esDetalle.subtituloPanel}>{cfg.etiqueta} · Últimas {historial.length} lecturas</Text>
        </View>
        <TouchableOpacity onPress={onCerrar} style={esDetalle.botonCerrar}>
          <Text style={esDetalle.textoCerrar}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Resumen estadístico */}
      <View style={[esDetalle.seccionResumen, { borderLeftColor: cfg.color }]}>
        <Text style={esDetalle.tituloSeccion}>Resumen estadístico</Text>
        <View style={esDetalle.gridResumen}>
          <View style={esDetalle.celdaResumen}>
            <Text style={esDetalle.etiquetaCelda}>Promedio</Text>
            <Text style={[esDetalle.valorCelda, { color: cfg.color }]}>{fmt(promedio)} <Text style={esDetalle.unidadCelda}>{cfg.unidad}</Text></Text>
          </View>
          <View style={esDetalle.celdaResumen}>
            <Text style={esDetalle.etiquetaCelda}>Máximo</Text>
            <Text style={[esDetalle.valorCelda, { color: maximo > cfg.normalMax ? Colores.peligro : cfg.color }]}>{fmt(maximo)} <Text style={esDetalle.unidadCelda}>{cfg.unidad}</Text></Text>
          </View>
          <View style={esDetalle.celdaResumen}>
            <Text style={esDetalle.etiquetaCelda}>Mínimo</Text>
            <Text style={[esDetalle.valorCelda, { color: minimo < cfg.normalMin ? Colores.peligro : cfg.color }]}>{fmt(minimo)} <Text style={esDetalle.unidadCelda}>{cfg.unidad}</Text></Text>
          </View>
          <View style={esDetalle.celdaResumen}>
            <Text style={esDetalle.etiquetaCelda}>Fuera de rango</Text>
            <Text style={[esDetalle.valorCelda, { color: totalFuera > 0 ? Colores.peligro : Colores.seguro }]}>{totalFuera} <Text style={esDetalle.unidadCelda}>({pctFuera}%)</Text></Text>
          </View>
        </View>
      </View>

      {/* Análisis de tendencia */}
      <View style={[esDetalle.tarjetaAnalisis, { borderLeftColor: colorTendencia }]}>
        <Text style={esDetalle.tituloSeccion}>Análisis de variación</Text>
        <View style={esDetalle.filaAnalisis}>
          <Text style={esDetalle.etiquetaAnalisis}>Tendencia general:</Text>
          <Text style={[esDetalle.valorAnalisis, { color: colorTendencia }]}>{tendencia}</Text>
        </View>
        <View style={esDetalle.filaAnalisis}>
          <Text style={esDetalle.etiquetaAnalisis}>Rango normal:</Text>
          <Text style={[esDetalle.valorAnalisis, { color: cfg.color }]}>{cfg.normalMin}–{cfg.normalMax} {cfg.unidad}</Text>
        </View>
        <View style={esDetalle.filaAnalisis}>
          <Text style={esDetalle.etiquetaAnalisis}>Variación máxima:</Text>
          <Text style={esDetalle.valorAnalisis}>
            {fmt(maxVariacion)} {cfg.unidad}
            <Text style={esDetalle.textoSutil}> (entre {horas[idxMaxVariacion - 1]} y {horas[idxMaxVariacion]})</Text>
          </Text>
        </View>
        <View style={esDetalle.filaAnalisis}>
          <Text style={esDetalle.etiquetaAnalisis}>Desv. estándar:</Text>
          <Text style={[esDetalle.valorAnalisis, { color: cfg.color }]}>
            {(Math.sqrt(valores.reduce((s, v) => s + Math.pow(v - promedio, 2), 0) / n)).toFixed(dec > 0 ? dec : 1)} {cfg.unidad}
          </Text>
        </View>
      </View>

      {/* Registro por lectura */}
      <View style={esDetalle.seccionRegistro}>
        <Text style={esDetalle.tituloSeccion}>Registro de lecturas</Text>
        <Text style={esDetalle.subtituloRegistro}>Cada lectura cada ~30 min</Text>

        {/* Encabezado de tabla */}
        <View style={esDetalle.filaTablaEncabezado}>
          <Text style={[esDetalle.celdaTabla, esDetalle.celdaHora, esDetalle.textoEncabezado]}>Hora</Text>
          <Text style={[esDetalle.celdaTabla, esDetalle.celdaValor, esDetalle.textoEncabezado]}>Valor</Text>
          <Text style={[esDetalle.celdaTabla, esDetalle.celdaCambio, esDetalle.textoEncabezado]}>Cambio</Text>
          <Text style={[esDetalle.celdaTabla, esDetalle.celdaEstado, esDetalle.textoEncabezado]}>Estado</Text>
        </View>

        {historial.slice().reverse().map((punto, idx) => {
          const idxOriginal = historial.length - 1 - idx;
          const valor = (punto as any)[campo] as number;
          const anterior = idxOriginal > 0 ? (historial[idxOriginal - 1] as any)[campo] as number : null;
          const cambio = anterior !== null ? valor - anterior : 0;
          const fueraRango = valor < cfg.normalMin || valor > cfg.normalMax;
          const esUltimo = idx === 0;

          return (
            <View key={idx} style={[esDetalle.filaTabla, esUltimo && esDetalle.filaUltima, fueraRango && esDetalle.filaAlerta]}>
              <Text style={[esDetalle.celdaTabla, esDetalle.celdaHora]}>{punto.hora}</Text>
              <Text style={[esDetalle.celdaTabla, esDetalle.celdaValor, { color: fueraRango ? Colores.peligro : Colores.textoOscuro, fontWeight: '700' }]}>
                {fmt(valor)} <Text style={esDetalle.unidadTabla}>{cfg.unidad}</Text>
              </Text>
              <View style={[esDetalle.celdaTabla, esDetalle.celdaCambio, { flexDirection: 'row', alignItems: 'center' }]}>
                {anterior !== null ? (
                  <Text style={[esDetalle.textoCambio, { color: cambio > 0 ? '#F59E0B' : cambio < 0 ? Colores.oxigeno : Colores.textoClaro }]}>
                    {cambio > 0 ? '▲' : cambio < 0 ? '▼' : '•'} {fmt(Math.abs(cambio))}
                  </Text>
                ) : (
                  <Text style={[esDetalle.textoCambio, { color: Colores.textoClaro }]}>—</Text>
                )}
              </View>
              <View style={[esDetalle.celdaTabla, esDetalle.celdaEstado]}>
                <View style={[esDetalle.badgeEstado, { backgroundColor: fueraRango ? Colores.peligro + '20' : Colores.seguro + '20' }]}>
                  <Text style={[esDetalle.textoBadge, { color: fueraRango ? Colores.peligro : Colores.seguro }]}>
                    {fueraRango ? '!' : '✓'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Nota médica */}
      <View style={esDetalle.notaMedica}>
        <Text style={esDetalle.tituloNota}>Nota</Text>
        <Text style={esDetalle.textoNota}>
          En el periodo monitoreado, {totalFuera === 0
            ? `todos los valores se mantuvieron dentro del rango normal (${cfg.normalMin}–${cfg.normalMax} ${cfg.unidad}). Sin hallazgos clínicos relevantes.`
            : `se registraron ${totalFuera} lectura${totalFuera > 1 ? 's' : ''} fuera del rango normal (${cfg.normalMin}–${cfg.normalMax} ${cfg.unidad}), representando el ${pctFuera}% de las mediciones. Se recomienda seguimiento continuo.`
          }
        </Text>
        <Text style={esDetalle.textoNota}>
          Tendencia general: {tendencia.toLowerCase()}. Valor promedio: {fmt(promedio)} {cfg.unidad}.
        </Text>
      </View>

      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

// ── Datos ─────────────────────────────────────────────────────────

const consejosCorazon = [
  'El rango normal para bebés de 0–3 meses es de 100–160 bpm.',
  'Durante el sueño es normal que baje a ~100 bpm.',
  'Al llorar o moverse puede superar momentáneamente los 160 bpm.',
  'Valores constantes fuera de rango requieren atención médica.',
];

const consejosOxigeno = [
  'La saturación de O₂ normal en bebés es 95–100%.',
  'Valores persistentes por debajo del 93% requieren evaluación médica.',
  'La oximetría puede variar si el sensor se mueve demasiado.',
  'Una buena circulación y postura ayudan a mantener niveles óptimos.',
];

const consejosTemp = [
  'La temperatura corporal normal en bebés es 36.5–37.5 °C.',
  'Mantén al bebé en un ambiente con temperatura entre 20–22 °C.',
  'Si la temperatura supera 38 °C, consulta con el pediatra.',
  'Evita abrigar demasiado al bebé, especialmente durante el sueño.',
  'El sensor debe estar en contacto directo con la piel del bebé.',
];

// ── Estilos ───────────────────────────────────────────────────────

const ALTO_PILDORA = 48;
const ANCHO_PILDORA_INTERNO = (ANCHO_PANTALLA - 56 - 4) / 3;

const es = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondo },

  zonaEncabezado: { backgroundColor: Colores.fondo, paddingHorizontal: 20 },
  espacioSuperior: { height: 54 },
  filaEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tituloEncabezado: { fontSize: 26, fontWeight: '900', color: Colores.textoOscuro, letterSpacing: -0.5 },
  subtituloEncabezado: { fontSize: 13, color: Colores.textoClaro, fontWeight: '500', marginTop: 2 },
  puntoVivo: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', opacity: 0.3 },
  puntoVivoInterno: { width: 12, height: 12, borderRadius: 6 },

  contenedorPildora: { paddingHorizontal: 24, marginTop: 18, marginBottom: 16 },
  pistaPildora: {
    flexDirection: 'row', backgroundColor: 'rgba(139,92,246,0.06)', borderRadius: ALTO_PILDORA / 2,
    height: ALTO_PILDORA, alignItems: 'center', borderWidth: 1, borderColor: Colores.borde, position: 'relative', paddingHorizontal: 2,
  },
  indicadorPildora: {
    position: 'absolute', width: ANCHO_PILDORA_INTERNO, height: ALTO_PILDORA - 6,
    borderRadius: (ALTO_PILDORA - 6) / 2, borderWidth: 1.5, top: 2,
  },
  tabPildora: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: ALTO_PILDORA, gap: 5, zIndex: 2 },
  emojiPildora: { fontSize: 15 },
  etiquetaPildora: { fontSize: 13, fontWeight: '600', color: Colores.textoClaro },

  tarjetaMetrica: {
    marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 4, marginBottom: 16,
  },
  parteSuperiorMetrica: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  metricaPrincipal: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  valorMetrica: { fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 56 },
  unidadMetrica: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  etiquetaMetrica: { fontSize: 13, fontWeight: '600', marginTop: 2, marginBottom: 16 },
  pildoraEstado: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  puntoEstado: { width: 8, height: 8, borderRadius: 4 },
  textoEstado: { fontSize: 13, fontWeight: '700' },

  filaEstadisticas: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F8FC', borderRadius: 16, padding: 14, marginBottom: 14,
  },
  cajaEstadistica: { flex: 1, alignItems: 'center', gap: 2 },
  iconoEstadistica: { fontSize: 12, fontWeight: '800' },
  valorEstadistica: { fontSize: 17, fontWeight: '800' },
  unidadEstadistica: { fontSize: 11, fontWeight: '500', color: Colores.textoClaro },
  etiquetaEstadistica: { fontSize: 10, color: Colores.textoClaro, fontWeight: '600' },
  divisorEstadistica: { width: 1, height: 28, backgroundColor: Colores.borde },

  envolturioRango: { gap: 6 },
  etiquetaRango: { fontSize: 11, color: Colores.textoClaro, fontWeight: '600' },
  pistaRango: { height: 6, backgroundColor: '#F0EDF5', borderRadius: 3, position: 'relative', overflow: 'visible' },
  rangoNormal: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3 },
  puntoRango: {
    position: 'absolute', top: -4, width: 14, height: 14, borderRadius: 7, marginLeft: -7,
    borderWidth: 2.5, borderColor: '#FFFFFF', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 3,
  },

  seccionGrafico: { paddingHorizontal: 20, marginBottom: 16, alignItems: 'center' },
  encabezadoGrafico: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, paddingHorizontal: 4, gap: 12 },
  tituloSeccion: { fontSize: 17, fontWeight: '800', color: Colores.textoOscuro },
  subtituloGrafico: { fontSize: 12, color: Colores.textoClaro, fontWeight: '500' },
  tarjetaGraficoDetallado: {
    backgroundColor: '#FFFFFF', borderRadius: 20, paddingTop: 4, paddingBottom: 12, paddingHorizontal: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    alignSelf: 'center', overflow: 'visible',
  },
  leyendaGrafico: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8, paddingBottom: 2 },
  elementoLeyenda: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  lineaLeyenda: { width: 14, height: 2, borderRadius: 1 },
  puntoLeyenda: { width: 8, height: 8, borderRadius: 4 },
  textoLeyenda: { fontSize: 10, color: Colores.textoClaro, fontWeight: '500' },

  tarjetaConsejos: {
    marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18,
    borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  tituloConsejos: { fontSize: 14, fontWeight: '800', color: Colores.textoOscuro, marginBottom: 12 },
  filaConsejo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  viñetaConsejo: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  textoConsejo: { flex: 1, fontSize: 13, color: Colores.textoMedio, lineHeight: 19 },
});

// ── Estilos del Panel de Detalle ────────────────────────────────

const esDetalle = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  panel: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  contenidoPanel: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tituloPanel: {
    fontSize: 20,
    fontWeight: '900',
    color: Colores.textoOscuro,
    letterSpacing: -0.3,
  },
  subtituloPanel: {
    fontSize: 13,
    color: Colores.textoClaro,
    fontWeight: '500',
    marginTop: 3,
  },
  botonCerrar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCerrar: {
    fontSize: 16,
    fontWeight: '700',
    color: Colores.textoClaro,
  },

  // Resumen estadístico
  seccionResumen: {
    backgroundColor: '#F9F8FC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
  },
  tituloSeccion: {
    fontSize: 15,
    fontWeight: '800',
    color: Colores.textoOscuro,
    marginBottom: 12,
  },
  gridResumen: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  celdaResumen: {
    width: '47%' as any,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colores.borde,
  },
  etiquetaCelda: {
    fontSize: 11,
    color: Colores.textoClaro,
    fontWeight: '600',
    marginBottom: 4,
  },
  valorCelda: {
    fontSize: 18,
    fontWeight: '800',
  },
  unidadCelda: {
    fontSize: 12,
    fontWeight: '500',
    color: Colores.textoClaro,
  },

  // Análisis
  tarjetaAnalisis: {
    backgroundColor: '#F9F8FC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
  },
  filaAnalisis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: Colores.borde,
  },
  etiquetaAnalisis: {
    fontSize: 13,
    color: Colores.textoMedio,
    fontWeight: '500',
  },
  valorAnalisis: {
    fontSize: 13,
    fontWeight: '700',
    color: Colores.textoOscuro,
    textAlign: 'right',
    flexShrink: 1,
  },
  textoSutil: {
    fontSize: 11,
    color: Colores.textoClaro,
    fontWeight: '400',
  },

  // Registro de lecturas (tabla)
  seccionRegistro: {
    marginBottom: 14,
  },
  subtituloRegistro: {
    fontSize: 11,
    color: Colores.textoClaro,
    fontWeight: '500',
    marginTop: -8,
    marginBottom: 12,
  },
  filaTablaEncabezado: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: Colores.borde,
    backgroundColor: '#F9F8FC',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  filaTabla: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colores.borde + '60',
  },
  filaUltima: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
  },
  filaAlerta: {
    backgroundColor: '#FFF5F5',
  },
  celdaTabla: {
    justifyContent: 'center',
  },
  celdaHora: {
    width: '25%' as any,
    fontSize: 12,
    fontWeight: '600',
    color: Colores.textoMedio,
  },
  celdaValor: {
    width: '30%' as any,
    fontSize: 13,
  },
  celdaCambio: {
    width: '25%' as any,
  },
  celdaEstado: {
    width: '20%' as any,
    alignItems: 'center',
  },
  textoEncabezado: {
    fontSize: 11,
    fontWeight: '800',
    color: Colores.textoOscuro,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unidadTabla: {
    fontSize: 10,
    fontWeight: '400',
    color: Colores.textoClaro,
  },
  textoCambio: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeEstado: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  textoBadge: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Nota médica
  notaMedica: {
    backgroundColor: '#FEFCE8',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tituloNota: {
    fontSize: 14,
    fontWeight: '800',
    color: Colores.textoOscuro,
    marginBottom: 8,
  },
  textoNota: {
    fontSize: 13,
    color: Colores.textoMedio,
    lineHeight: 20,
    marginBottom: 6,
  },
});
