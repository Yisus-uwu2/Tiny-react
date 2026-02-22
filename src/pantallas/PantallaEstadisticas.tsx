/**
 * PantallaEstadisticas — Pantalla de análisis de salud.
 * Contenido diferenciado: tendencias, distribución por zonas,
 * patrón de actividad, timeline de eventos e insights de salud.
 */
import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useDatosSensor } from '../hooks/useDatosSensor';
import { Colores } from '../constantes/colores';

const { width: ANCHO_PANTALLA } = Dimensions.get('window');

type Periodo = '1h' | '6h' | '24h';
const PERIODOS: { clave: Periodo; etiqueta: string }[] = [
  { clave: '1h',  etiqueta: 'Última hora' },
  { clave: '6h',  etiqueta: '6 horas' },
  { clave: '24h', etiqueta: '24 horas' },
];

// ── Utilidades ──────────────────────────────────────────────────

const promedio = (arr: number[], dec = 0) => {
  if (!arr.length) return 0;
  const v = arr.reduce((a, b) => a + b, 0) / arr.length;
  return dec > 0 ? parseFloat(v.toFixed(dec)) : Math.round(v);
};

const calcularTendencia = (datos: number[]): 'subiendo' | 'bajando' | 'estable' => {
  if (datos.length < 3) return 'estable';
  const mitad = Math.floor(datos.length / 2);
  const promPrimera = promedio(datos.slice(0, mitad), 1);
  const promSegunda = promedio(datos.slice(mitad), 1);
  const diff = promSegunda - promPrimera;
  const umbral = promPrimera * 0.015;
  if (diff > umbral) return 'subiendo';
  if (diff < -umbral) return 'bajando';
  return 'estable';
};

type Actividad = 'dormido' | 'tranquilo' | 'activo' | 'llorando';
const obtenerActividad = (rc: number): Actividad => {
  if (rc < 125) return 'dormido';
  if (rc < 135) return 'tranquilo';
  if (rc < 150) return 'activo';
  return 'llorando';
};

interface EventoSalud {
  hora: string;
  tipo: 'alerta' | 'precaución';
  signo: string;
  valor: string;
  icono: string;
  color: string;
}

// ── Pantalla principal ──────────────────────────────────────────

export default function PantallaEstadisticas() {
  const { datos, historial } = useDatosSensor();
  const [periodo, setPeriodo] = useState<Periodo>('24h');

  // Animaciones
  const animEntrada = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(animEntrada, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }).start();
  }, []);

  const animPildora = useRef(new Animated.Value(2)).current;
  const indicePeriodo = PERIODOS.findIndex(p => p.clave === periodo);
  useEffect(() => {
    Animated.spring(animPildora, {
      toValue: indicePeriodo,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [indicePeriodo]);

  // Datos filtrados
  const corteMap: Record<Periodo, number> = { '1h': 2, '6h': 8, '24h': 24 };
  const datosCorte = historial.slice(-corteMap[periodo]);

  const datosRC = datosCorte.map(h => h.ritmoCardiaco);
  const datosO2 = datosCorte.map(h => h.oxigeno);
  const datosTemp = datosCorte.map(h => h.temperatura);

  // ── Puntuación de bienestar
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

  // ── Tendencias
  const tendenciaRC = calcularTendencia(datosRC);
  const tendenciaO2 = calcularTendencia(datosO2);
  const tendenciaTemp = calcularTendencia(datosTemp);

  // ── Distribución por zonas
  const calcularZonas = (datos: number[], normalMin: number, normalMax: number, alertaMin: number, alertaMax: number) => {
    let normal = 0, precaucion = 0, alerta = 0;
    datos.forEach(v => {
      if (v >= normalMin && v <= normalMax) normal++;
      else if (v < alertaMin || v > alertaMax) alerta++;
      else precaucion++;
    });
    const total = datos.length || 1;
    return {
      normal: Math.round((normal / total) * 100),
      precaucion: Math.round((precaucion / total) * 100),
      alerta: Math.round((alerta / total) * 100),
    };
  };

  const zonasRC = calcularZonas(datosRC, 100, 160, 90, 170);
  const zonasO2 = calcularZonas(datosO2, 95, 100, 93, 100);
  const zonasTemp = calcularZonas(datosTemp, 36.5, 37.5, 35.5, 38.0);

  // ── Distribución de actividad
  const actividadDist = useMemo(() => {
    const conteo: Record<Actividad, number> = { dormido: 0, tranquilo: 0, activo: 0, llorando: 0 };
    datosRC.forEach(rc => { conteo[obtenerActividad(rc)]++; });
    const total = datosRC.length || 1;
    return {
      dormido: Math.round((conteo.dormido / total) * 100),
      tranquilo: Math.round((conteo.tranquilo / total) * 100),
      activo: Math.round((conteo.activo / total) * 100),
      llorando: Math.round((conteo.llorando / total) * 100),
    };
  }, [datosRC]);

  // ── Eventos / alertas
  const eventos = useMemo((): EventoSalud[] => {
    const lista: EventoSalud[] = [];
    datosCorte.forEach(h => {
      if (h.ritmoCardiaco < 100 || h.ritmoCardiaco > 170) {
        lista.push({
          hora: h.hora,
          tipo: h.ritmoCardiaco < 90 || h.ritmoCardiaco > 180 ? 'alerta' : 'precaución',
          signo: 'Ritmo cardíaco',
          valor: `${h.ritmoCardiaco} bpm`,
          icono: '❤️',
          color: Colores.corazon,
        });
      }
      if (h.oxigeno < 95) {
        lista.push({
          hora: h.hora,
          tipo: h.oxigeno < 93 ? 'alerta' : 'precaución',
          signo: 'Oxigenación',
          valor: `${h.oxigeno}%`,
          icono: '💧',
          color: Colores.oxigeno,
        });
      }
      if (h.temperatura < 36.5 || h.temperatura > 37.5) {
        lista.push({
          hora: h.hora,
          tipo: h.temperatura < 35.5 || h.temperatura > 38.0 ? 'alerta' : 'precaución',
          signo: 'Temperatura',
          valor: `${h.temperatura}°C`,
          icono: '🌡️',
          color: Colores.temperatura,
        });
      }
    });
    return lista.slice(-8).reverse();
  }, [datosCorte]);

  // ── Insights de salud
  const insights = useMemo(() => {
    const lista: { icono: string; titulo: string; texto: string; color: string }[] = [];

    // Estabilidad del ritmo cardíaco
    const desviacionRC = datosRC.length > 1
      ? Math.sqrt(datosRC.reduce((sum, v) => sum + Math.pow(v - promedio(datosRC), 2), 0) / datosRC.length)
      : 0;
    if (desviacionRC < 8) {
      lista.push({
        icono: '💚',
        titulo: 'Ritmo cardíaco estable',
        texto: `La variabilidad del ritmo cardíaco es baja (±${Math.round(desviacionRC)} bpm), lo que indica un estado tranquilo y saludable.`,
        color: Colores.seguro,
      });
    } else if (desviacionRC > 15) {
      lista.push({
        icono: '💛',
        titulo: 'Variabilidad cardíaca alta',
        texto: `Se detectó variabilidad elevada (±${Math.round(desviacionRC)} bpm). Puede indicar períodos alternos de actividad y reposo.`,
        color: Colores.advertencia,
      });
    }

    // Oxigenación
    const minO2 = datosO2.length ? Math.min(...datosO2) : 98;
    if (minO2 >= 96) {
      lista.push({
        icono: '🫁',
        titulo: 'Oxigenación excelente',
        texto: 'La SpO₂ se ha mantenido por encima de 96% durante todo el período. Excelente función respiratoria.',
        color: Colores.seguro,
      });
    } else if (minO2 < 94) {
      lista.push({
        icono: '⚠️',
        titulo: 'Revisar oxigenación',
        texto: `Se registraron lecturas de SpO₂ de ${minO2}%. Considere verificar la posición del sensor y consultar al pediatra.`,
        color: Colores.peligro,
      });
    }

    // Temperatura
    const maxTemp = datosTemp.length ? Math.max(...datosTemp) : 36.8;
    const minTemp = datosTemp.length ? Math.min(...datosTemp) : 36.8;
    if (maxTemp <= 37.5 && minTemp >= 36.5) {
      lista.push({
        icono: '🌟',
        titulo: 'Temperatura ideal',
        texto: `La temperatura se ha mantenido en el rango ideal (${minTemp.toFixed(1)}°C – ${maxTemp.toFixed(1)}°C) durante todo el período.`,
        color: Colores.seguro,
      });
    } else if (maxTemp > 37.8) {
      lista.push({
        icono: '🔥',
        titulo: 'Temperatura elevada detectada',
        texto: `Se registró una temperatura máxima de ${maxTemp.toFixed(1)}°C. Vigile y consulte al pediatra si persiste.`,
        color: Colores.peligro,
      });
    }

    // Patrón de actividad
    if (actividadDist.dormido > 50) {
      lista.push({
        icono: '😴',
        titulo: 'Mayormente en reposo',
        texto: `El bebé ha pasado el ${actividadDist.dormido}% del tiempo dormido. Es normal en las primeras semanas de vida.`,
        color: Colores.oxigeno,
      });
    } else if (actividadDist.llorando > 20) {
      lista.push({
        icono: '👶',
        titulo: 'Períodos de llanto frecuentes',
        texto: `Se detectó llanto en el ${actividadDist.llorando}% del tiempo. Verifique alimentación, pañal y comodidad.`,
        color: Colores.advertencia,
      });
    }

    // Tendencia general
    if (tendenciaRC === 'estable' && tendenciaO2 === 'estable' && tendenciaTemp === 'estable') {
      lista.push({
        icono: '📊',
        titulo: 'Signos vitales estables',
        texto: 'Todos los indicadores muestran una tendencia estable durante el período seleccionado.',
        color: Colores.primario,
      });
    }

    return lista;
  }, [datosRC, datosO2, datosTemp, actividadDist, tendenciaRC, tendenciaO2, tendenciaTemp]);

  return (
    <ScrollView style={e.contenedor} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>

      {/* ── ENCABEZADO ── */}
      <View style={e.zonaEncabezado}>
        <View style={e.espacioSuperior} />
        <View style={e.filaEncabezado}>
          <View>
            <Text style={e.tituloEncabezado}>Estadísticas</Text>
            <Text style={e.subtituloEncabezado}>Análisis detallado de salud</Text>
          </View>
          <View style={[e.puntoVivo, { backgroundColor: datos.conectado ? Colores.seguro : Colores.peligro }]}>
            <View style={[e.puntoVivoInterno, { backgroundColor: datos.conectado ? Colores.seguro : Colores.peligro }]} />
          </View>
        </View>
      </View>

      {/* ── SELECTOR DE PERÍODO ── */}
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

      {/* ── PUNTUACIÓN DE BIENESTAR (compacto) ── */}
      <Animated.View style={[e.tarjetaPuntaje, {
        opacity: animEntrada,
        transform: [{ translateY: animEntrada.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }]}>
        <View style={e.filaPuntajeCompacta}>
          <CirculoPuntaje puntaje={puntajeGeneral} color={colorPuntaje} />
          <View style={e.infoPuntaje}>
            <Text style={e.tituloPuntaje}>Índice de bienestar</Text>
            <View style={[e.insigniaPuntaje, { backgroundColor: colorPuntaje + '18', borderColor: colorPuntaje + '40' }]}>
              <Text style={[e.textoPuntajeInsignia, { color: colorPuntaje }]}>{etiquetaPuntaje}</Text>
            </View>
            <View style={e.desgloseCompacto}>
              <BarraPuntajeMini icono="❤️" puntaje={puntajeRC} color={Colores.corazon} />
              <BarraPuntajeMini icono="💧" puntaje={puntajeO2} color={Colores.oxigeno} />
              <BarraPuntajeMini icono="🌡️" puntaje={puntajeTemp} color={Colores.temperatura} />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── TARJETAS DE TENDENCIA ── */}
      <View style={e.seccion}>
        <View style={e.encabezadoSeccion}>
          <Text style={e.tituloSeccion}>Tendencias</Text>
          <Text style={e.subtituloSeccion}>Comparativa del período</Text>
        </View>
        <View style={e.filaTendencias}>
          <TarjetaTendencia
            icono="❤️"
            titulo="FC"
            valor={datos.ritmoCardiaco}
            unidad="bpm"
            prom={promedio(datosRC)}
            tendencia={tendenciaRC}
            color={Colores.corazon}
            decimales={0}
          />
          <TarjetaTendencia
            icono="💧"
            titulo="SpO₂"
            valor={datos.oxigeno}
            unidad="%"
            prom={promedio(datosO2, 1)}
            tendencia={tendenciaO2}
            color={Colores.oxigeno}
            decimales={1}
          />
          <TarjetaTendencia
            icono="🌡️"
            titulo="Temp"
            valor={datos.temperatura}
            unidad="°C"
            prom={promedio(datosTemp, 1)}
            tendencia={tendenciaTemp}
            color={Colores.temperatura}
            decimales={1}
          />
        </View>
      </View>

      {/* ── DISTRIBUCIÓN POR ZONAS ── */}
      <View style={e.seccion}>
        <View style={e.encabezadoSeccion}>
          <Text style={e.tituloSeccion}>Tiempo en zonas</Text>
          <Text style={e.subtituloSeccion}>% en cada nivel</Text>
        </View>
        <View style={e.tarjetaZonas}>
          <BarraZonas etiqueta="Ritmo cardíaco" icono="❤️" zonas={zonasRC} />
          <View style={e.divisorZonas} />
          <BarraZonas etiqueta="Oxigenación" icono="💧" zonas={zonasO2} />
          <View style={e.divisorZonas} />
          <BarraZonas etiqueta="Temperatura" icono="🌡️" zonas={zonasTemp} />
          <View style={e.leyendaZonas}>
            <View style={e.itemLeyenda}>
              <View style={[e.puntoLeyenda, { backgroundColor: Colores.seguro }]} />
              <Text style={e.textoLeyenda}>Normal</Text>
            </View>
            <View style={e.itemLeyenda}>
              <View style={[e.puntoLeyenda, { backgroundColor: Colores.advertencia }]} />
              <Text style={e.textoLeyenda}>Precaución</Text>
            </View>
            <View style={e.itemLeyenda}>
              <View style={[e.puntoLeyenda, { backgroundColor: Colores.peligro }]} />
              <Text style={e.textoLeyenda}>Alerta</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── DISTRIBUCIÓN DE ACTIVIDAD ── */}
      <View style={e.seccion}>
        <View style={e.encabezadoSeccion}>
          <Text style={e.tituloSeccion}>Patrón de actividad</Text>
          <Text style={e.subtituloSeccion}>Basado en ritmo cardíaco</Text>
        </View>
        <View style={e.tarjetaActividad}>
          <View style={e.filaActividadPrincipal}>
            <GraficoDonut distribucion={actividadDist} />
            <View style={e.listaActividad}>
              <ItemActividad icono="😴" etiqueta="Dormido" porcentaje={actividadDist.dormido} color="#8B5CF6" />
              <ItemActividad icono="😊" etiqueta="Tranquilo" porcentaje={actividadDist.tranquilo} color={Colores.seguro} />
              <ItemActividad icono="🙌" etiqueta="Activo" porcentaje={actividadDist.activo} color={Colores.actividad} />
              <ItemActividad icono="😢" etiqueta="Llorando" porcentaje={actividadDist.llorando} color={Colores.peligro} />
            </View>
          </View>
        </View>
      </View>

      {/* ── EVENTOS / ALERTAS ── */}
      <View style={e.seccion}>
        <View style={e.encabezadoSeccion}>
          <Text style={e.tituloSeccion}>Eventos recientes</Text>
          <Text style={e.subtituloSeccion}>Lecturas fuera de rango</Text>
        </View>
        {eventos.length === 0 ? (
          <View style={e.tarjetaSinEventos}>
            <Text style={e.iconoSinEventos}>✅</Text>
            <Text style={e.tituloSinEventos}>Sin eventos</Text>
            <Text style={e.textoSinEventos}>
              No se han detectado lecturas fuera de rango en este período. ¡Todo en orden!
            </Text>
          </View>
        ) : (
          <View style={e.tarjetaEventos}>
            {eventos.map((ev, i) => (
              <View key={`${ev.hora}-${ev.signo}-${i}`}>
                <View style={e.filaEvento}>
                  <View style={e.lineaTiempo}>
                    <View style={[
                      e.puntoTimeline,
                      { backgroundColor: ev.tipo === 'alerta' ? Colores.peligro : Colores.advertencia },
                    ]} />
                    {i < eventos.length - 1 && <View style={e.lineaTimeline} />}
                  </View>
                  <View style={e.contenidoEvento}>
                    <View style={e.filaEventoSuperior}>
                      <Text style={e.horaEvento}>{ev.hora}</Text>
                      <View style={[e.badgeTipo, {
                        backgroundColor: ev.tipo === 'alerta' ? Colores.peligro + '15' : Colores.advertencia + '15',
                      }]}>
                        <Text style={[e.textoBadgeTipo, {
                          color: ev.tipo === 'alerta' ? Colores.peligro : Colores.advertencia,
                        }]}>
                          {ev.tipo === 'alerta' ? '⚠ Alerta' : '⚡ Precaución'}
                        </Text>
                      </View>
                    </View>
                    <Text style={e.descripcionEvento}>
                      {ev.icono} {ev.signo}: <Text style={{ color: ev.color, fontWeight: '800' }}>{ev.valor}</Text>
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── INSIGHTS DE SALUD ── */}
      <View style={e.seccion}>
        <View style={e.encabezadoSeccion}>
          <Text style={e.tituloSeccion}>Análisis inteligente</Text>
          <Text style={e.subtituloSeccion}>Basado en los datos</Text>
        </View>
        {insights.map((insight, i) => (
          <View key={i} style={[e.tarjetaInsight, { borderLeftColor: insight.color }]}>
            <View style={e.filaInsightTop}>
              <Text style={e.iconoInsight}>{insight.icono}</Text>
              <Text style={[e.tituloInsight, { color: insight.color }]}>{insight.titulo}</Text>
            </View>
            <Text style={e.textoInsight}>{insight.texto}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Sub-componentes ─────────────────────────────────────────────

function CirculoPuntaje({ puntaje, color }: { puntaje: number; color: string }) {
  const tam = 110;
  const radio = 44;
  const cx = tam / 2;
  const cy = tam / 2;
  const circ = 2 * Math.PI * radio;
  const lleno = (puntaje / 100) * circ;

  return (
    <View style={e.envolturioCirculo}>
      <Svg width={tam} height={tam}>
        <Circle cx={cx} cy={cy} r={radio} fill="none" stroke={Colores.borde} strokeWidth={9} />
        <Circle
          cx={cx} cy={cy} r={radio}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeDasharray={`${lleno} ${circ}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${cx},${cy}`}
        />
      </Svg>
      <View style={e.centroCirculo}>
        <Text style={[e.numeroPuntaje, { color }]}>{puntaje}</Text>
        <Text style={[e.etiquetaPuntajeCirculo, { color: color + 'AA' }]}>/100</Text>
      </View>
    </View>
  );
}

function BarraPuntajeMini({ icono, puntaje, color }: { icono: string; puntaje: number; color: string }) {
  return (
    <View style={e.filaBarraMini}>
      <Text style={e.iconoBarraMini}>{icono}</Text>
      <View style={e.pistaBarraMini}>
        <View style={[e.rellenoBarraMini, { width: `${puntaje}%`, backgroundColor: color }]} />
      </View>
      <Text style={[e.valorBarraMini, { color }]}>{puntaje}</Text>
    </View>
  );
}

function TarjetaTendencia({
  icono, titulo, valor, unidad, prom, tendencia, color, decimales,
}: {
  icono: string; titulo: string; valor: number; unidad: string;
  prom: number; tendencia: 'subiendo' | 'bajando' | 'estable';
  color: string; decimales: number;
}) {
  const flechas = { subiendo: '↑', bajando: '↓', estable: '→' };
  const colorTendencia = tendencia === 'estable' ? Colores.seguro
    : tendencia === 'subiendo' ? Colores.advertencia
    : Colores.oxigeno;
  const etiquetaTendencia = { subiendo: 'Subiendo', bajando: 'Bajando', estable: 'Estable' };

  const diff = valor - prom;
  const diffStr = diff >= 0 ? `+${decimales > 0 ? diff.toFixed(1) : Math.round(diff)}`
    : `${decimales > 0 ? diff.toFixed(1) : Math.round(diff)}`;

  return (
    <View style={[e.tarjetaTendencia, { borderTopColor: color }]}>
      <Text style={e.iconoTendencia}>{icono}</Text>
      <Text style={e.tituloTendencia}>{titulo}</Text>
      <Text style={[e.valorTendencia, { color }]}>
        {decimales > 0 ? valor.toFixed(decimales) : valor}
        <Text style={e.unidadTendencia}> {unidad}</Text>
      </Text>
      <View style={e.filaComparativa}>
        <Text style={[e.diffTendencia, { color: colorTendencia }]}>
          {diffStr}
        </Text>
        <Text style={e.vsPromedio}>vs prom</Text>
      </View>
      <View style={[e.badgeTendencia, { backgroundColor: colorTendencia + '15' }]}>
        <Text style={[e.textoTendencia, { color: colorTendencia }]}>
          {flechas[tendencia]} {etiquetaTendencia[tendencia]}
        </Text>
      </View>
    </View>
  );
}

function BarraZonas({
  etiqueta, icono, zonas,
}: {
  etiqueta: string; icono: string;
  zonas: { normal: number; precaucion: number; alerta: number };
}) {
  return (
    <View style={e.filaZona}>
      <View style={e.infoZona}>
        <Text style={e.iconoZona}>{icono}</Text>
        <Text style={e.etiquetaZona}>{etiqueta}</Text>
      </View>
      <View style={e.barraZonaContenedor}>
        <View style={e.barraZonaPista}>
          {zonas.normal > 0 && (
            <View style={[e.segmentoZona, { flex: zonas.normal, backgroundColor: Colores.seguro }]} />
          )}
          {zonas.precaucion > 0 && (
            <View style={[e.segmentoZona, { flex: zonas.precaucion, backgroundColor: Colores.advertencia }]} />
          )}
          {zonas.alerta > 0 && (
            <View style={[e.segmentoZona, { flex: zonas.alerta, backgroundColor: Colores.peligro }]} />
          )}
        </View>
        <View style={e.filaPorcentajes}>
          <Text style={[e.porcentajeZona, { color: Colores.seguro }]}>{zonas.normal}%</Text>
          {zonas.precaucion > 0 && (
            <Text style={[e.porcentajeZona, { color: Colores.advertencia }]}>{zonas.precaucion}%</Text>
          )}
          {zonas.alerta > 0 && (
            <Text style={[e.porcentajeZona, { color: Colores.peligro }]}>{zonas.alerta}%</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function GraficoDonut({ distribucion }: { distribucion: { dormido: number; tranquilo: number; activo: number; llorando: number } }) {
  const tam = 120;
  const radio = 42;
  const grosor = 14;
  const cx = tam / 2;
  const cy = tam / 2;
  const circ = 2 * Math.PI * radio;

  const colores = ['#8B5CF6', Colores.seguro, Colores.actividad, Colores.peligro];
  const valores = [distribucion.dormido, distribucion.tranquilo, distribucion.activo, distribucion.llorando];

  let acumulado = 0;
  const segmentos = valores.map((val, i) => {
    const longitud = (val / 100) * circ;
    const offset = (acumulado / 100) * circ;
    acumulado += val;
    return { longitud, offset, color: colores[i], valor: val };
  }).filter(s => s.valor > 0);

  return (
    <View style={e.envolturioDonut}>
      <Svg width={tam} height={tam}>
        <Circle cx={cx} cy={cy} r={radio} fill="none" stroke={Colores.borde} strokeWidth={grosor} />
        {segmentos.map((seg, i) => (
          <Circle
            key={i}
            cx={cx} cy={cy} r={radio}
            fill="none"
            stroke={seg.color}
            strokeWidth={grosor}
            strokeDasharray={`${seg.longitud} ${circ - seg.longitud}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="butt"
            rotation={-90}
            origin={`${cx},${cy}`}
          />
        ))}
      </Svg>
      <View style={e.centroDonut}>
        <Text style={e.emojiCentroDonut}>👶</Text>
      </View>
    </View>
  );
}

function ItemActividad({ icono, etiqueta, porcentaje, color }: { icono: string; etiqueta: string; porcentaje: number; color: string }) {
  return (
    <View style={e.filaItemActividad}>
      <View style={[e.puntoActividad, { backgroundColor: color }]} />
      <Text style={e.iconoActividad}>{icono}</Text>
      <Text style={e.etiquetaActividad}>{etiqueta}</Text>
      <Text style={[e.porcentajeActividad, { color }]}>{porcentaje}%</Text>
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

  // Sección genérica
  seccion: { paddingHorizontal: 20, marginBottom: 16 },
  encabezadoSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  tituloSeccion: { fontSize: 17, fontWeight: '800', color: Colores.textoOscuro },
  subtituloSeccion: { fontSize: 12, color: Colores.textoClaro, fontWeight: '500' },

  // Puntuación de bienestar (compacta)
  tarjetaPuntaje: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: 20,
  },
  filaPuntajeCompacta: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  infoPuntaje: { flex: 1, gap: 6 },
  tituloPuntaje: { fontSize: 16, fontWeight: '800', color: Colores.textoOscuro },
  insigniaPuntaje: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, borderWidth: 1, alignSelf: 'flex-start' },
  textoPuntajeInsignia: { fontSize: 12, fontWeight: '700' },

  desgloseCompacto: { gap: 4, marginTop: 4 },
  filaBarraMini: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconoBarraMini: { fontSize: 12, width: 18, textAlign: 'center' },
  pistaBarraMini: { flex: 1, height: 6, backgroundColor: Colores.borde, borderRadius: 3, overflow: 'hidden' },
  rellenoBarraMini: { height: '100%', borderRadius: 3 },
  valorBarraMini: { width: 24, fontSize: 11, fontWeight: '800', textAlign: 'right' },

  envolturioCirculo: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  centroCirculo: { position: 'absolute', alignItems: 'center' },
  numeroPuntaje: { fontSize: 32, fontWeight: '900', lineHeight: 36 },
  etiquetaPuntajeCirculo: { fontSize: 11, fontWeight: '600', marginTop: -2 },

  // Tendencias
  filaTendencias: { flexDirection: 'row', gap: 10 },
  tarjetaTendencia: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconoTendencia: { fontSize: 22, marginBottom: 4 },
  tituloTendencia: { fontSize: 11, fontWeight: '700', color: Colores.textoClaro, marginBottom: 4 },
  valorTendencia: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  unidadTendencia: { fontSize: 10, fontWeight: '600' },
  filaComparativa: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  diffTendencia: { fontSize: 12, fontWeight: '800' },
  vsPromedio: { fontSize: 9, color: Colores.textoClaro, fontWeight: '500' },
  badgeTendencia: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  textoTendencia: { fontSize: 10, fontWeight: '700' },

  // Zonas
  tarjetaZonas: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  filaZona: { marginBottom: 14 },
  infoZona: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  iconoZona: { fontSize: 14 },
  etiquetaZona: { fontSize: 13, fontWeight: '700', color: Colores.textoOscuro },
  barraZonaContenedor: {},
  barraZonaPista: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 2,
  },
  segmentoZona: { borderRadius: 4 },
  filaPorcentajes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  porcentajeZona: { fontSize: 10, fontWeight: '700' },
  divisorZonas: { height: 1, backgroundColor: Colores.divisor },
  leyendaZonas: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colores.divisor,
  },
  itemLeyenda: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  puntoLeyenda: { width: 8, height: 8, borderRadius: 4 },
  textoLeyenda: { fontSize: 11, fontWeight: '600', color: Colores.textoClaro },

  // Actividad
  tarjetaActividad: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  filaActividadPrincipal: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  envolturioDonut: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  centroDonut: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  emojiCentroDonut: { fontSize: 28 },
  listaActividad: { flex: 1, gap: 10 },
  filaItemActividad: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  puntoActividad: { width: 10, height: 10, borderRadius: 5 },
  iconoActividad: { fontSize: 16 },
  etiquetaActividad: { flex: 1, fontSize: 13, fontWeight: '600', color: Colores.textoMedio },
  porcentajeActividad: { fontSize: 14, fontWeight: '800' },

  // Eventos
  tarjetaEventos: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  tarjetaSinEventos: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconoSinEventos: { fontSize: 36, marginBottom: 8 },
  tituloSinEventos: { fontSize: 16, fontWeight: '800', color: Colores.textoOscuro, marginBottom: 4 },
  textoSinEventos: { fontSize: 13, color: Colores.textoClaro, textAlign: 'center', fontWeight: '500', lineHeight: 18 },
  filaEvento: { flexDirection: 'row', gap: 12 },
  lineaTiempo: { width: 20, alignItems: 'center' },
  puntoTimeline: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  lineaTimeline: { width: 2, flex: 1, backgroundColor: Colores.borde, marginVertical: 4 },
  contenidoEvento: { flex: 1, paddingBottom: 16 },
  filaEventoSuperior: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  horaEvento: { fontSize: 13, fontWeight: '800', color: Colores.textoOscuro },
  badgeTipo: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  textoBadgeTipo: { fontSize: 10, fontWeight: '700' },
  descripcionEvento: { fontSize: 13, color: Colores.textoMedio, fontWeight: '600' },

  // Insights
  tarjetaInsight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  filaInsightTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  iconoInsight: { fontSize: 18 },
  tituloInsight: { fontSize: 14, fontWeight: '800' },
  textoInsight: { fontSize: 13, color: Colores.textoMedio, fontWeight: '500', lineHeight: 19 },
});
