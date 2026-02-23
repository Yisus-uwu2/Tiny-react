/**
 * PantallaEstadisticas — Análisis de salud interactivo.
 * Cada sección es expandible con detalle clínico contextual.
 * El análisis inteligente se despliega desde el widget de bienestar.
 */
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity,
  Animated, LayoutAnimation, Platform, UIManager, Easing, RefreshControl,
} from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { useDatosSensor } from '../hooks/useDatosSensor';
import { Colores } from '../constantes/colores';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: ANCHO_PANTALLA } = Dimensions.get('window');
const ANIM_CONFIG = LayoutAnimation.create(
  280,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity,
);

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

const desviacion = (arr: number[]) => {
  if (arr.length < 2) return 0;
  const prom = promedio(arr, 2);
  return Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - prom, 2), 0) / arr.length);
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
  detalle: string;
}

// ── Hook para toggle animado ────────────────────────────────────
const useToggle = (inicial = false): [boolean, () => void] => {
  const [abierto, setAbierto] = useState(inicial);
  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(ANIM_CONFIG);
    setAbierto(prev => !prev);
  }, []);
  return [abierto, toggle];
};

// ── Pantalla principal ──────────────────────────────────────────

export default function PantallaEstadisticas() {
  const { datos, historial } = useDatosSensor();
  const [periodo, setPeriodo] = useState<Periodo>('24h');

  // Estados de expansión
  const [bienestarAbierto, toggleBienestar] = useToggle();
  const [tendenciasAbierto, toggleTendencias] = useToggle();
  const [zonasAbierto, toggleZonas] = useToggle();
  const [actividadAbierto, toggleActividad] = useToggle();
  const [eventosAbierto, toggleEventos] = useToggle();

  // Animaciones
  const animEntrada = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(animEntrada, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }).start();
  }, []);

  // Pulso del punto en vivo
  const animPulso = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(animPulso, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(animPulso, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);

  // Entrada escalonada de secciones inferiores
  const animResto = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.spring(animResto, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }),
    ]).start();
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
  const calcularZonas = (arr: number[], normalMin: number, normalMax: number, alertaMin: number, alertaMax: number) => {
    let normal = 0, precaucion = 0, alerta = 0;
    arr.forEach(v => {
      if (v >= normalMin && v <= normalMax) normal++;
      else if (v < alertaMin || v > alertaMax) alerta++;
      else precaucion++;
    });
    const total = arr.length || 1;
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
        const esBajo = h.ritmoCardiaco < 100;
        lista.push({
          hora: h.hora,
          tipo: h.ritmoCardiaco < 90 || h.ritmoCardiaco > 180 ? 'alerta' : 'precaución',
          signo: 'Ritmo cardíaco',
          valor: `${h.ritmoCardiaco} bpm`,
          icono: '❤️',
          color: Colores.corazon,
          detalle: esBajo
            ? `El ritmo cardíaco de ${h.ritmoCardiaco} bpm está por debajo del rango normal neonatal (100–160 bpm). La bradicardia neonatal puede requerir evaluación si es persistente.`
            : `El ritmo cardíaco de ${h.ritmoCardiaco} bpm supera el rango normal neonatal (100–160 bpm). La taquicardia puede estar asociada a actividad, llanto o fiebre.`,
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
          detalle: `Una SpO₂ de ${h.oxigeno}% está por debajo del umbral ideal (≥95%). Valores inferiores a 93% requieren atención inmediata. Verifique la posición del sensor y la vía aérea.`,
        });
      }
      if (h.temperatura < 36.5 || h.temperatura > 37.5) {
        const esBaja = h.temperatura < 36.5;
        lista.push({
          hora: h.hora,
          tipo: h.temperatura < 35.5 || h.temperatura > 38.0 ? 'alerta' : 'precaución',
          signo: 'Temperatura',
          valor: `${h.temperatura}°C`,
          icono: '🌡️',
          color: Colores.temperatura,
          detalle: esBaja
            ? `Temperatura de ${h.temperatura}°C. La hipotermia neonatal (<36.5°C) puede comprometer funciones metabólicas. Asegure un ambiente térmico adecuado.`
            : `Temperatura de ${h.temperatura}°C. La hipertermia neonatal (>37.5°C) puede indicar infección, sobrecalentamiento ambiental o deshidratación.`,
        });
      }
    });
    return lista.slice(-10).reverse();
  }, [datosCorte]);

  // ── Insights de salud
  const insights = useMemo(() => {
    const lista: { icono: string; titulo: string; texto: string; color: string; recomendacion: string }[] = [];

    const desviacionRC = desviacion(datosRC);
    if (desviacionRC < 8) {
      lista.push({
        icono: '💚',
        titulo: 'Ritmo cardíaco estable',
        texto: `Variabilidad baja (±${Math.round(desviacionRC)} bpm). Indica un estado fisiológico equilibrado y confortable.`,
        color: Colores.seguro,
        recomendacion: 'Continúe manteniendo un ambiente tranquilo. La estabilidad cardíaca es indicador de bienestar neonatal.',
      });
    } else if (desviacionRC > 15) {
      lista.push({
        icono: '💛',
        titulo: 'Variabilidad cardíaca elevada',
        texto: `Desviación de ±${Math.round(desviacionRC)} bpm. Puede reflejar ciclos de sueño-vigilia o episodios de llanto.`,
        color: Colores.advertencia,
        recomendacion: 'Observe si coincide con cambios de actividad. Si es persistente sin causa aparente, consulte al pediatra.',
      });
    }

    const minO2 = datosO2.length ? Math.min(...datosO2) : 98;
    const maxO2 = datosO2.length ? Math.max(...datosO2) : 98;
    if (minO2 >= 96) {
      lista.push({
        icono: '🫁',
        titulo: 'Función respiratoria óptima',
        texto: `SpO₂ sostenida entre ${minO2}% y ${maxO2}%. La oxigenación se ha mantenido consistentemente en niveles saludables.`,
        color: Colores.seguro,
        recomendacion: 'No se requieren acciones. La oxigenación es adecuada para el desarrollo neonatal.',
      });
    } else if (minO2 < 94) {
      lista.push({
        icono: '⚠️',
        titulo: 'Oxigenación a vigilar',
        texto: `Se registraron valores de SpO₂ de ${minO2}%. Los neonatos requieren ≥95% para una oxigenación tisular adecuada.`,
        color: Colores.peligro,
        recomendacion: 'Verifique la posición del sensor oxímetro. Si los valores persisten bajo 94%, contacte a su profesional de salud.',
      });
    }

    const maxTemp = datosTemp.length ? Math.max(...datosTemp) : 36.8;
    const minTemp = datosTemp.length ? Math.min(...datosTemp) : 36.8;
    if (maxTemp <= 37.5 && minTemp >= 36.5) {
      lista.push({
        icono: '🌟',
        titulo: 'Termorregulación adecuada',
        texto: `Rango registrado: ${minTemp.toFixed(1)}°C – ${maxTemp.toFixed(1)}°C. Se mantiene dentro de los parámetros de normotermia neonatal.`,
        color: Colores.seguro,
        recomendacion: 'La termorregulación es correcta. Mantenga la temperatura ambiental entre 22–26°C.',
      });
    } else if (maxTemp > 37.8) {
      lista.push({
        icono: '🔥',
        titulo: 'Temperatura elevada',
        texto: `Máxima registrada: ${maxTemp.toFixed(1)}°C. Supera el umbral de normotermia neonatal (36.5–37.5°C).`,
        color: Colores.peligro,
        recomendacion: 'Retire exceso de ropa o coberturas. Si la temperatura supera 38°C o persiste más de 30 minutos, consulte al pediatra.',
      });
    } else if (minTemp < 36.0) {
      lista.push({
        icono: '❄️',
        titulo: 'Riesgo de hipotermia',
        texto: `Mínima registrada: ${minTemp.toFixed(1)}°C. La hipotermia neonatal compromete funciones metabólicas y respiratorias.`,
        color: Colores.peligro,
        recomendacion: 'Aplique contacto piel con piel y asegure un ambiente cálido. Si persiste bajo 36°C, busque atención médica.',
      });
    }

    if (actividadDist.dormido > 50) {
      lista.push({
        icono: '😴',
        titulo: 'Patrón de sueño prolongado',
        texto: `El bebé ha estado dormido el ${actividadDist.dormido}% del tiempo analizado. Los neonatos duermen entre 16–17 horas diarias.`,
        color: Colores.oxigeno,
        recomendacion: 'Es un patrón normal en las primeras semanas. Asegúrese de que se alimente cada 2–3 horas durante el sueño.',
      });
    } else if (actividadDist.llorando > 20) {
      lista.push({
        icono: '👶',
        titulo: 'Períodos de llanto frecuentes',
        texto: `Llanto detectado en el ${actividadDist.llorando}% del período. El llanto persistente puede afectar la frecuencia cardíaca y oxigenación.`,
        color: Colores.advertencia,
        recomendacion: 'Verifique alimentación, pañal, posición y temperatura ambiental. El cólico es causa común en los primeros 3 meses.',
      });
    }

    if (tendenciaRC === 'estable' && tendenciaO2 === 'estable' && tendenciaTemp === 'estable') {
      lista.push({
        icono: '📊',
        titulo: 'Estabilidad general confirmada',
        texto: 'Los tres indicadores principales mantienen una tendencia estable sin variaciones significativas.',
        color: Colores.primario,
        recomendacion: 'No se requieren acciones. El bebé muestra un estado fisiológico consistente y saludable.',
      });
    }

    return lista;
  }, [datosRC, datosO2, datosTemp, actividadDist, tendenciaRC, tendenciaO2, tendenciaTemp]);

  // ── Datos de detalle para tendencias
  const detalleTendencias = useMemo(() => [
    {
      icono: '❤️', titulo: 'Frecuencia cardíaca', color: Colores.corazon,
      actual: datos.ritmoCardiaco, unidad: 'bpm', decimales: 0, sparkDatos: datosRC,
      prom: promedio(datosRC), max: datosRC.length ? Math.max(...datosRC) : 0,
      min: datosRC.length ? Math.min(...datosRC) : 0, desv: Math.round(desviacion(datosRC)),
      tendencia: tendenciaRC,
      rangoNormal: '100–160 bpm',
      explicacion: 'La frecuencia cardíaca neonatal es naturalmente más elevada que en adultos. Varía según el estado de actividad: reposo, vigilia tranquila o llanto.',
      queSignifica: tendenciaRC === 'estable'
        ? 'La estabilidad indica un sistema cardiovascular que funciona de manera consistente.'
        : tendenciaRC === 'subiendo'
        ? 'Una tendencia ascendente puede estar asociada a mayor actividad, fiebre o estrés. Vigile si coincide con otros cambios.'
        : 'Una tendencia descendente puede indicar mayor tiempo en reposo o sueño. Es normal si los valores permanecen en rango.',
    },
    {
      icono: '💧', titulo: 'Saturación de oxígeno', color: Colores.oxigeno,
      actual: datos.oxigeno, unidad: '%', decimales: 1, sparkDatos: datosO2,
      prom: promedio(datosO2, 1), max: datosO2.length ? Math.max(...datosO2) : 0,
      min: datosO2.length ? Math.min(...datosO2) : 0, desv: parseFloat(desviacion(datosO2).toFixed(1)),
      tendencia: tendenciaO2,
      rangoNormal: '95–100%',
      explicacion: 'La SpO₂ mide el porcentaje de hemoglobina saturada con oxígeno. En neonatos, valores ≥95% son considerados normales.',
      queSignifica: tendenciaO2 === 'estable'
        ? 'Oxigenación constante. La función pulmonar y el intercambio gaseoso son adecuados.'
        : tendenciaO2 === 'bajando'
        ? 'Una tendencia descendente requiere atención. Puede indicar obstrucción de vía aérea, congestión nasal o posición inadecuada.'
        : 'El incremento en SpO₂ es positivo si venía de valores subóptimos. Indica mejoría en la ventilación.',
    },
    {
      icono: '🌡️', titulo: 'Temperatura corporal', color: Colores.temperatura,
      actual: datos.temperatura, unidad: '°C', decimales: 1, sparkDatos: datosTemp,
      prom: promedio(datosTemp, 1), max: datosTemp.length ? parseFloat(Math.max(...datosTemp).toFixed(1)) : 0,
      min: datosTemp.length ? parseFloat(Math.min(...datosTemp).toFixed(1)) : 0,
      desv: parseFloat(desviacion(datosTemp).toFixed(2)),
      tendencia: tendenciaTemp,
      rangoNormal: '36.5–37.5°C',
      explicacion: 'Los neonatos tienen capacidad limitada de termorregulación. La temperatura depende del ambiente, la ropa y el contacto corporal.',
      queSignifica: tendenciaTemp === 'estable'
        ? 'La termorregulación es adecuada. El ambiente y la vestimenta mantienen al bebé en normotermia.'
        : tendenciaTemp === 'subiendo'
        ? 'El aumento de temperatura puede ser por exceso de abrigo, ambiente cálido o inicio de proceso infeccioso.'
        : 'El descenso puede indicar exposición a frío o insuficiente abrigo. Asegure un ambiente térmico neutro.',
    },
  ], [datos, datosRC, datosO2, datosTemp, tendenciaRC, tendenciaO2, tendenciaTemp]);

  // Info de zonas expandible
  const infoZonas = [
    {
      icono: '❤️', etiqueta: 'Ritmo cardíaco', zonas: zonasRC, color: Colores.corazon,
      explicacion: 'Normal: 100–160 bpm. Precaución: 90–100 o 160–170 bpm. Alerta: <90 o >170 bpm.',
      contexto: 'El ritmo cardíaco neonatal varía con la actividad. Durante el sueño profundo puede descender hacia el límite inferior, mientras que el llanto puede elevarlo temporalmente.',
    },
    {
      icono: '💧', etiqueta: 'Oxigenación', zonas: zonasO2, color: Colores.oxigeno,
      explicacion: 'Normal: ≥95%. Precaución: 93–95%. Alerta: <93%.',
      contexto: 'La saturación de oxígeno es un indicador directo de la función respiratoria. Descensos transitorios pueden ocurrir durante la alimentación o el sueño, pero deben recuperarse rápidamente.',
    },
    {
      icono: '🌡️', etiqueta: 'Temperatura', zonas: zonasTemp, color: Colores.temperatura,
      explicacion: 'Normal: 36.5–37.5°C. Precaución: 36.0–36.5°C o 37.5–38.0°C. Alerta: <35.5°C o >38.0°C.',
      contexto: 'La capacidad de termorregulación neonatal es inmadura. Es importante mantener un ambiente entre 22–26°C y evitar corrientes de aire o exposición solar directa.',
    },
  ];

  // Info de actividades expandible
  const infoActividades = [
    {
      icono: '😴', etiqueta: 'Dormido', porcentaje: actividadDist.dormido, color: '#8B5CF6',
      descripcion: 'FC < 125 bpm. Estado de reposo fisiológico con bajo gasto metabólico.',
      detalle: 'Los neonatos sanos duermen entre 16–17 horas diarias en ciclos de 2–4 horas. El sueño es esencial para el desarrollo neurológico y la liberación de hormona de crecimiento.',
    },
    {
      icono: '😊', etiqueta: 'Tranquilo', porcentaje: actividadDist.tranquilo, color: Colores.seguro,
      descripcion: 'FC 125–135 bpm. Vigilia tranquila con actividad motora mínima.',
      detalle: 'Estado ideal para la interacción y el aprendizaje sensorial. El bebé está alerta pero calmado, con signos vitales estables.',
    },
    {
      icono: '🙌', etiqueta: 'Activo', porcentaje: actividadDist.activo, color: Colores.actividad,
      descripcion: 'FC 135–150 bpm. Movimiento activo, posiblemente alimentándose.',
      detalle: 'Períodos de actividad motora, succión o exploración. La frecuencia cardíaca se eleva moderadamente como respuesta fisiológica normal.',
    },
    {
      icono: '😢', etiqueta: 'Llorando', porcentaje: actividadDist.llorando, color: Colores.peligro,
      descripcion: 'FC > 150 bpm. Llanto activo con elevación de frecuencia cardíaca.',
      detalle: 'El llanto es la principal forma de comunicación neonatal. Puede indicar hambre, incomodidad, cólico o necesidad de contacto. El llanto prolongado puede afectar temporalmente la SpO₂.',
    },
  ];

  const [refrescando, setRefrescando] = useState(false);
  const alRefrescar = useCallback(() => {
    setRefrescando(true);
    setTimeout(() => setRefrescando(false), 1200);
  }, []);

  return (
    <ScrollView
      style={e.contenedor}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 36 }}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} tintColor={Colores.primario} colors={[Colores.primario]} />
      }
    >

      {/* ── ENCABEZADO ── */}
      <View style={e.zonaEncabezado}>
        <View style={e.espacioSuperior} />
        <View style={e.filaEncabezado}>
          <View>
            <Text style={e.tituloEncabezado}>Estadísticas</Text>
            <Text style={e.subtituloEncabezado}>Análisis detallado de salud</Text>
          </View>
          <Animated.View style={[e.puntoVivo, {
            backgroundColor: datos.conectado ? Colores.seguro : Colores.peligro,
            opacity: animPulso.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
            transform: [{ scale: animPulso.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }],
          }]}>
            <View style={[e.puntoVivoInterno, { backgroundColor: datos.conectado ? Colores.seguro : Colores.peligro }]} />
          </Animated.View>
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

      {/* ── BARRA RESUMEN ── */}
      <View style={e.barraResumen}>
        <View style={[e.chipResumen, { backgroundColor: colorPuntaje + '18' }]}>
          <Text style={[e.chipResumenTexto, { color: colorPuntaje }]}>🏥 {puntajeGeneral}/100</Text>
        </View>
        <View style={[e.chipResumen, { backgroundColor: (tendenciaRC === 'estable' && tendenciaO2 === 'estable' && tendenciaTemp === 'estable' ? Colores.seguro : Colores.advertencia) + '18' }]}>
          <Text style={[e.chipResumenTexto, { color: tendenciaRC === 'estable' && tendenciaO2 === 'estable' && tendenciaTemp === 'estable' ? Colores.seguroOscuro : Colores.advertenciaOscuro }]}>
            {tendenciaRC === 'estable' && tendenciaO2 === 'estable' && tendenciaTemp === 'estable' ? '→ Estable' : '↕ Variable'}
          </Text>
        </View>
        <View style={[e.chipResumen, { backgroundColor: Colores.seguro + '18' }]}>
          <Text style={[e.chipResumenTexto, { color: Colores.seguroOscuro }]}>✓ {zonasRC.normal}% normal</Text>
        </View>
      </View>

      {/* ═══════════════════════════════════════════════════════
          1. BIENESTAR + INSIGHTS (expandible)
          ═══════════════════════════════════════════════════════ */}
      <TouchableOpacity activeOpacity={0.85} onPress={toggleBienestar}>
        <Animated.View style={[e.tarjetaPuntaje, {
          opacity: animEntrada,
          transform: [{ translateY: animEntrada.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <View style={e.filaPuntajeCompacta}>
            <CirculoPuntaje puntaje={puntajeGeneral} color={colorPuntaje} />
            <View style={e.infoPuntaje}>
              <View style={e.filaTituloChevron}>
                <Text style={e.tituloPuntaje}>Índice de bienestar</Text>
                <Text style={e.chevron}>{bienestarAbierto ? '▲' : '▼'}</Text>
              </View>
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

          {!bienestarAbierto && (
            <View style={e.pistaExpandir}>
              <Text style={e.textoExpandir}>Toca para ver análisis inteligente</Text>
            </View>
          )}

          {/* ── Insights expandidos ── */}
          {bienestarAbierto && (
            <View style={e.contenedorInsights}>
              <View style={e.divisorInsight} />
              <View style={e.encabezadoInsights}>
                <Text style={e.tituloInsightsSeccion}>🧠  Análisis inteligente</Text>
                <Text style={e.subtituloInsights}>Evaluación basada en los datos del período</Text>
              </View>
              {insights.map((insight, i) => (
                <View key={i} style={[e.tarjetaInsight, { borderLeftColor: insight.color }]}>
                  <View style={e.filaInsightTop}>
                    <Text style={e.iconoInsight}>{insight.icono}</Text>
                    <Text style={[e.tituloInsight, { color: insight.color }]}>{insight.titulo}</Text>
                  </View>
                  <Text style={e.textoInsight}>{insight.texto}</Text>
                  <View style={[e.cajaRecomendacion, { backgroundColor: insight.color + '08', borderColor: insight.color + '20' }]}>
                    <Text style={e.etiquetaRecomendacion}>💡 Recomendación</Text>
                    <Text style={e.textoRecomendacion}>{insight.recomendacion}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={{ opacity: animResto, transform: [{ translateY: animResto.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      {/* ═══════════════════════════════════════════════════════
          2. TENDENCIAS (expandible)
          ═══════════════════════════════════════════════════════ */}
      <View style={e.seccion}>
        <TouchableOpacity activeOpacity={0.7} onPress={toggleTendencias}>
          <View style={e.encabezadoSeccionTocable}>
            <View>
              <Text style={e.tituloSeccion}>Tendencias</Text>
              <Text style={e.subtituloSeccion}>Comparativa del período</Text>
            </View>
            <View style={e.badgeExpandir}>
              <Text style={e.textoChevronBadge}>{tendenciasAbierto ? 'Menos ▲' : 'Detalle ▼'}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={e.filaTendencias}>
          {detalleTendencias.map(dt => (
            <TarjetaTendenciaCompacta
              key={dt.titulo}
              icono={dt.icono}
              titulo={dt.titulo.split(' ')[0]}
              valor={dt.actual}
              unidad={dt.unidad}
              prom={dt.prom}
              tendencia={dt.tendencia}
              color={dt.color}
              decimales={dt.decimales}
              sparkDatos={dt.sparkDatos}
            />
          ))}
        </View>

        {tendenciasAbierto && (
          <View style={e.detalleExpandido}>
            {detalleTendencias.map((dt, i) => (
              <View key={i} style={[e.tarjetaDetalleTendencia, { borderLeftColor: dt.color }]}>
                <View style={e.filaDetalleTendenciaTop}>
                  <Text style={e.iconoDetalleTendencia}>{dt.icono}</Text>
                  <Text style={[e.tituloDetalleTendencia, { color: dt.color }]}>{dt.titulo}</Text>
                </View>
                <Text style={e.textoExplicacion}>{dt.explicacion}</Text>

                <View style={e.filaStatsDetalle}>
                  <StatMini etiqueta="Promedio" valor={`${dt.prom}`} unidad={dt.unidad} color={dt.color} />
                  <StatMini etiqueta="Máximo" valor={`${dt.max}`} unidad={dt.unidad} color={Colores.peligro} />
                  <StatMini etiqueta="Mínimo" valor={`${dt.min}`} unidad={dt.unidad} color={Colores.oxigeno} />
                  <StatMini etiqueta="Desv." valor={`±${dt.desv}`} unidad={dt.unidad} color={Colores.textoMedio} />
                </View>

                <View style={e.filaRangoNormal}>
                  <Text style={e.etiquetaRango}>Rango normal:</Text>
                  <Text style={[e.valorRango, { color: dt.color }]}>{dt.rangoNormal}</Text>
                </View>

                <View style={[e.cajaQueSignifica, { backgroundColor: dt.color + '08', borderColor: dt.color + '20' }]}>
                  <Text style={e.etiquetaQueSignifica}>📋 ¿Qué significa esta tendencia?</Text>
                  <Text style={e.textoQueSignifica}>{dt.queSignifica}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ═══════════════════════════════════════════════════════
          3. TIEMPO EN ZONAS (expandible)
          ═══════════════════════════════════════════════════════ */}
      <View style={e.seccion}>
        <TouchableOpacity activeOpacity={0.7} onPress={toggleZonas}>
          <View style={e.encabezadoSeccionTocable}>
            <View>
              <Text style={e.tituloSeccion}>Tiempo en zonas</Text>
              <Text style={e.subtituloSeccion}>% en cada nivel</Text>
            </View>
            <View style={e.badgeExpandir}>
              <Text style={e.textoChevronBadge}>{zonasAbierto ? 'Menos ▲' : 'Detalle ▼'}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={e.tarjetaZonas}>
          {infoZonas.map((iz, i) => (
            <View key={i}>
              {i > 0 && <View style={e.divisorZonas} />}
              <BarraZonas etiqueta={iz.etiqueta} icono={iz.icono} zonas={iz.zonas} />
            </View>
          ))}
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

        {zonasAbierto && (
          <View style={e.detalleExpandido}>
            {infoZonas.map((iz, i) => (
              <View key={i} style={[e.tarjetaDetalleZona, { borderLeftColor: iz.color }]}>
                <View style={e.filaDetalleZonaTop}>
                  <Text style={e.iconoDetalleZona}>{iz.icono}</Text>
                  <Text style={[e.tituloDetalleZona, { color: iz.color }]}>{iz.etiqueta}</Text>
                </View>
                <View style={e.cajaRangos}>
                  <Text style={e.textoRangos}>{iz.explicacion}</Text>
                </View>
                <Text style={e.textoContexto}>{iz.contexto}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ═══════════════════════════════════════════════════════
          4. PATRÓN DE ACTIVIDAD (expandible)
          ═══════════════════════════════════════════════════════ */}
      <View style={e.seccion}>
        <TouchableOpacity activeOpacity={0.7} onPress={toggleActividad}>
          <View style={e.encabezadoSeccionTocable}>
            <View>
              <Text style={e.tituloSeccion}>Patrón de actividad</Text>
              <Text style={e.subtituloSeccion}>Basado en ritmo cardíaco</Text>
            </View>
            <View style={e.badgeExpandir}>
              <Text style={e.textoChevronBadge}>{actividadAbierto ? 'Menos ▲' : 'Detalle ▼'}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={e.tarjetaActividad}>
          <View style={e.filaActividadPrincipal}>
            <GraficoDonut distribucion={actividadDist} />
            <View style={e.listaActividad}>
              {infoActividades.map((ia, i) => (
                <ItemActividad key={i} icono={ia.icono} etiqueta={ia.etiqueta} porcentaje={ia.porcentaje} color={ia.color} />
              ))}
            </View>
          </View>
        </View>

        {actividadAbierto && (
          <View style={e.detalleExpandido}>
            <View style={e.tarjetaDetalleActividad}>
              <Text style={e.tituloDetalleActividad}>📖 Guía de estados de actividad</Text>
              <Text style={e.introActividad}>
                El estado de actividad se estima a partir de la frecuencia cardíaca. Cada estado tiene características fisiológicas y necesidades diferentes.
              </Text>
              {infoActividades.map((ia, i) => (
                <View key={i} style={e.filaDetalleActividad}>
                  <View style={[e.barraColorActividad, { backgroundColor: ia.color }]} />
                  <View style={e.contenidoDetalleActividad}>
                    <View style={e.filaEtiquetaActividad}>
                      <Text style={e.emojiDetalleActividad}>{ia.icono}</Text>
                      <Text style={[e.nombreDetalleActividad, { color: ia.color }]}>{ia.etiqueta}</Text>
                      <Text style={[e.porcentajeDetalleActividad, { color: ia.color }]}>{ia.porcentaje}%</Text>
                    </View>
                    <Text style={e.descripcionEstado}>{ia.descripcion}</Text>
                    <Text style={e.detalleEstado}>{ia.detalle}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* ═══════════════════════════════════════════════════════
          5. EVENTOS RECIENTES (expandible)
          ═══════════════════════════════════════════════════════ */}
      <View style={e.seccion}>
        <TouchableOpacity activeOpacity={0.7} onPress={toggleEventos}>
          <View style={e.encabezadoSeccionTocable}>
            <View>
              <Text style={e.tituloSeccion}>Eventos recientes</Text>
              <Text style={e.subtituloSeccion}>
                {eventos.length === 0 ? 'Sin lecturas fuera de rango' : `${eventos.length} lectura${eventos.length > 1 ? 's' : ''} fuera de rango`}
              </Text>
            </View>
            {eventos.length > 0 && (
              <View style={e.badgeExpandir}>
                <Text style={e.textoChevronBadge}>{eventosAbierto ? 'Menos ▲' : 'Detalle ▼'}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {eventos.length === 0 ? (
          <View style={e.tarjetaSinEventos}>
            <Text style={e.iconoSinEventos}>✅</Text>
            <Text style={e.tituloSinEventos}>Todo en orden</Text>
            <Text style={e.textoSinEventos}>
              No se han detectado lecturas fuera de rango durante este período. Los signos vitales se han mantenido dentro de los parámetros normales.
            </Text>
          </View>
        ) : (
          <View style={e.tarjetaEventos}>
            {(eventosAbierto ? eventos : eventos.slice(0, 3)).map((ev, i, arr) => (
              <EventoItem key={`${ev.hora}-${ev.signo}-${i}`} evento={ev} esUltimo={i === arr.length - 1} expandido={eventosAbierto} />
            ))}
            {!eventosAbierto && eventos.length > 3 && (
              <TouchableOpacity style={e.botonVerMas} onPress={toggleEventos} activeOpacity={0.7}>
                <Text style={e.textoVerMas}>Ver {eventos.length - 3} evento{eventos.length - 3 > 1 ? 's' : ''} más ▼</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      </Animated.View>
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
  const offset = circ - lleno;

  // Animación de llenado: strokeDashoffset va de circ → offset
  const animOffset = useRef(new Animated.Value(circ)).current;
  useEffect(() => {
    animOffset.setValue(circ);
    Animated.timing(animOffset, { toValue: offset, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [puntaje]);

  // Animación del número
  const opNum = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    opNum.setValue(0);
    Animated.timing(opNum, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }).start();
  }, [puntaje]);

  return (
    <View style={e.envolturioCirculo}>
      <Svg width={tam} height={tam}>
        <Circle cx={cx} cy={cy} r={radio} fill="none" stroke={Colores.borde} strokeWidth={9} />
        <AnimatedCircle
          cx={cx} cy={cy} r={radio}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeDasharray={`${circ}`}
          strokeDashoffset={animOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${cx},${cy}`}
        />
      </Svg>
      <Animated.View style={[e.centroCirculo, { opacity: opNum }]}>
        <Text style={[e.numeroPuntaje, { color }]}>{puntaje}</Text>
        <Text style={[e.etiquetaPuntajeCirculo, { color: color + 'AA' }]}>/100</Text>
      </Animated.View>
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

function TarjetaTendenciaCompacta({
  icono, titulo, valor, unidad, prom, tendencia, color, decimales, sparkDatos,
}: {
  icono: string; titulo: string; valor: number; unidad: string;
  prom: number; tendencia: 'subiendo' | 'bajando' | 'estable';
  color: string; decimales: number; sparkDatos?: number[];
}) {
  const flechas = { subiendo: '↑', bajando: '↓', estable: '→' };
  const colorTendencia = tendencia === 'estable' ? Colores.seguro
    : tendencia === 'subiendo' ? Colores.advertencia
    : Colores.oxigeno;

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
        <Text style={[e.diffTendencia, { color: colorTendencia }]}>{diffStr}</Text>
        <Text style={e.vsPromedio}>vs prom</Text>
      </View>
      <View style={[e.badgeTendencia, { backgroundColor: colorTendencia + '15' }]}>
        <Text style={[e.textoTendencia, { color: colorTendencia }]}>
          {flechas[tendencia]}
        </Text>
      </View>
      {sparkDatos && sparkDatos.length >= 2 && (() => {
        const mn = Math.min(...sparkDatos), mx = Math.max(...sparkDatos), rg = mx - mn || 1;
        const pts = sparkDatos.map((v, i) => `${(i / (sparkDatos.length - 1)) * 50},${16 - ((v - mn) / rg) * 12 - 2}`).join(' ');
        return (
          <Svg width={50} height={16} style={{ marginTop: 6, alignSelf: 'center', opacity: 0.5 }}>
            <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );
      })()}
    </View>
  );
}

function StatMini({ etiqueta, valor, unidad, color }: { etiqueta: string; valor: string; unidad: string; color: string }) {
  return (
    <View style={e.statMini}>
      <Text style={[e.valorStatMini, { color }]}>{valor}</Text>
      <Text style={e.unidadStatMini}>{unidad}</Text>
      <Text style={e.etiquetaStatMini}>{etiqueta}</Text>
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

  const animDonut = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    animDonut.setValue(0);
    Animated.spring(animDonut, { toValue: 1, useNativeDriver: true, tension: 40, friction: 8 }).start();
  }, [distribucion.dormido, distribucion.tranquilo, distribucion.activo, distribucion.llorando]);

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
      <Animated.View style={{
        transform: [
          { scale: animDonut },
          { rotate: animDonut.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) },
        ],
        opacity: animDonut,
      }}>
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
      </Animated.View>
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

function EventoItem({ evento, esUltimo, expandido }: { evento: EventoSalud; esUltimo: boolean; expandido: boolean }) {
  const [detalleVisible, setDetalleVisible] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        LayoutAnimation.configureNext(ANIM_CONFIG);
        setDetalleVisible(prev => !prev);
      }}
    >
      <View style={e.filaEvento}>
        <View style={e.lineaTiempo}>
          <View style={[
            e.puntoTimeline,
            { backgroundColor: evento.tipo === 'alerta' ? Colores.peligro : Colores.advertencia },
          ]} />
          {!esUltimo && <View style={e.lineaTimeline} />}
        </View>
        <View style={[e.contenidoEvento, esUltimo && { paddingBottom: 4 }]}>
          <View style={e.filaEventoSuperior}>
            <Text style={e.horaEvento}>{evento.hora}</Text>
            <View style={[e.badgeTipo, {
              backgroundColor: evento.tipo === 'alerta' ? Colores.peligro + '15' : Colores.advertencia + '15',
            }]}>
              <Text style={[e.textoBadgeTipo, {
                color: evento.tipo === 'alerta' ? Colores.peligro : Colores.advertencia,
              }]}>
                {evento.tipo === 'alerta' ? '⚠ Alerta' : '⚡ Precaución'}
              </Text>
            </View>
          </View>
          <Text style={e.descripcionEvento}>
            {evento.icono} {evento.signo}: <Text style={{ color: evento.color, fontWeight: '800' }}>{evento.valor}</Text>
            {!detalleVisible && <Text style={e.textoTocaDetalle}>  ▸</Text>}
          </Text>
          {detalleVisible && (
            <View style={[e.cajaDetalleEvento, { borderColor: evento.color + '30' }]}>
              <Text style={e.textoDetalleEvento}>{evento.detalle}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
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
  subtituloSeccion: { fontSize: 12, color: Colores.textoClaro, fontWeight: '500', marginTop: 1 },

  // Encabezado tocable con chevron
  encabezadoSeccionTocable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeExpandir: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colores.primario + '10',
  },
  textoChevronBadge: { fontSize: 11, fontWeight: '700', color: Colores.primario },

  // Puntuación de bienestar
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
  filaTituloChevron: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tituloPuntaje: { fontSize: 16, fontWeight: '800', color: Colores.textoOscuro },
  chevron: { fontSize: 12, color: Colores.textoClaro, marginLeft: 4 },
  insigniaPuntaje: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, borderWidth: 1, alignSelf: 'flex-start' },
  textoPuntajeInsignia: { fontSize: 12, fontWeight: '700' },

  pistaExpandir: { alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colores.divisor },
  textoExpandir: { fontSize: 12, fontWeight: '600', color: Colores.primario },

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

  // Insights (dentro de bienestar)
  contenedorInsights: { marginTop: 8 },
  divisorInsight: { height: 1, backgroundColor: Colores.divisor, marginBottom: 14 },
  encabezadoInsights: { marginBottom: 12 },
  tituloInsightsSeccion: { fontSize: 15, fontWeight: '800', color: Colores.textoOscuro },
  subtituloInsights: { fontSize: 11, fontWeight: '500', color: Colores.textoClaro, marginTop: 2 },
  tarjetaInsight: {
    backgroundColor: Colores.fondo,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  filaInsightTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  iconoInsight: { fontSize: 18 },
  tituloInsight: { fontSize: 14, fontWeight: '800' },
  textoInsight: { fontSize: 13, color: Colores.textoMedio, fontWeight: '500', lineHeight: 19 },
  cajaRecomendacion: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  etiquetaRecomendacion: { fontSize: 11, fontWeight: '700', color: Colores.textoOscuro, marginBottom: 4 },
  textoRecomendacion: { fontSize: 12, fontWeight: '500', color: Colores.textoMedio, lineHeight: 17 },

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

  // Detalle expandido general
  detalleExpandido: { marginTop: 12, gap: 10 },

  // Detalle tendencias
  tarjetaDetalleTendencia: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  filaDetalleTendenciaTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  iconoDetalleTendencia: { fontSize: 20 },
  tituloDetalleTendencia: { fontSize: 15, fontWeight: '800' },
  textoExplicacion: { fontSize: 13, color: Colores.textoMedio, fontWeight: '500', lineHeight: 19, marginBottom: 12 },
  filaStatsDetalle: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, paddingVertical: 10, backgroundColor: Colores.fondo, borderRadius: 12 },
  statMini: { alignItems: 'center' },
  valorStatMini: { fontSize: 15, fontWeight: '800' },
  unidadStatMini: { fontSize: 9, fontWeight: '600', color: Colores.textoClaro, marginTop: -1 },
  etiquetaStatMini: { fontSize: 10, fontWeight: '600', color: Colores.textoClaro, marginTop: 2 },
  filaRangoNormal: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  etiquetaRango: { fontSize: 12, fontWeight: '600', color: Colores.textoClaro },
  valorRango: { fontSize: 13, fontWeight: '800' },
  cajaQueSignifica: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  etiquetaQueSignifica: { fontSize: 12, fontWeight: '700', color: Colores.textoOscuro, marginBottom: 4 },
  textoQueSignifica: { fontSize: 12, fontWeight: '500', color: Colores.textoMedio, lineHeight: 17 },

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

  // Detalle zonas
  tarjetaDetalleZona: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  filaDetalleZonaTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  iconoDetalleZona: { fontSize: 18 },
  tituloDetalleZona: { fontSize: 14, fontWeight: '800' },
  cajaRangos: {
    backgroundColor: Colores.fondo,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  textoRangos: { fontSize: 12, fontWeight: '600', color: Colores.textoOscuro, lineHeight: 17 },
  textoContexto: { fontSize: 12, fontWeight: '500', color: Colores.textoMedio, lineHeight: 17 },

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

  // Detalle actividad
  tarjetaDetalleActividad: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tituloDetalleActividad: { fontSize: 15, fontWeight: '800', color: Colores.textoOscuro, marginBottom: 6 },
  introActividad: { fontSize: 12, fontWeight: '500', color: Colores.textoClaro, lineHeight: 17, marginBottom: 14 },
  filaDetalleActividad: { flexDirection: 'row', marginBottom: 14, gap: 10 },
  barraColorActividad: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
  contenidoDetalleActividad: { flex: 1 },
  filaEtiquetaActividad: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  emojiDetalleActividad: { fontSize: 16 },
  nombreDetalleActividad: { fontSize: 14, fontWeight: '800', flex: 1 },
  porcentajeDetalleActividad: { fontSize: 14, fontWeight: '800' },
  descripcionEstado: { fontSize: 11, fontWeight: '600', color: Colores.textoOscuro, marginBottom: 4 },
  detalleEstado: { fontSize: 12, fontWeight: '500', color: Colores.textoMedio, lineHeight: 17 },

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
  textoTocaDetalle: { fontSize: 11, color: Colores.textoClaro },
  cajaDetalleEvento: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colores.fondo,
    borderWidth: 1,
  },
  textoDetalleEvento: { fontSize: 12, fontWeight: '500', color: Colores.textoMedio, lineHeight: 17 },

  botonVerMas: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: Colores.divisor,
    marginTop: 4,
  },
  textoVerMas: { fontSize: 12, fontWeight: '700', color: Colores.primario },

  // Barra resumen
  barraResumen: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 16 },
  chipResumen: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14, alignItems: 'center' },
  chipResumenTexto: { fontSize: 11, fontWeight: '700' },
});
