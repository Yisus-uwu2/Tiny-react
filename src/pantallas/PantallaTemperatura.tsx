/**
 * PantallaTemperatura — Monitoreo de temperatura corporal del bebé.
 * Incluye termómetro SVG, historial, guía y recomendaciones.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline, Line, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { useDatosSensor } from '../hooks/useDatosSensor';
import { Colores } from '../constantes/colores';

const { width } = Dimensions.get('window');

export default function PantallaTemperatura() {
  const { datos, historial } = useDatosSensor();
  const temps = historial.map(h => h.temperatura);
  const actual = datos.temperatura;
  const promedio = parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1));
  const maxima = Math.max(...temps);
  const minima = Math.min(...temps);

  const estado =
    actual > 38.0  ? { etiqueta: 'Fiebre alta',           color: Colores.peligro,     emoji: '🔴' }
  : actual > 37.5  ? { etiqueta: 'Temperatura elevada',   color: Colores.advertencia, emoji: '🟡' }
  : actual >= 36.5 ? { etiqueta: 'Temperatura normal',    color: Colores.seguro,      emoji: '🟢' }
  : actual >= 36.0 ? { etiqueta: 'Ligeramente baja',      color: Colores.advertencia, emoji: '🟡' }
  :                   { etiqueta: 'Hipotermia leve',       color: Colores.peligro,     emoji: '🔴' };

  const llenadoTermometro = Math.max(0, Math.min(1, (actual - 34) / 6));

  return (
    <ScrollView style={s.contenedor} showsVerticalScrollIndicator={false}>
      {/* Encabezado */}
      <LinearGradient colors={['#FB923C', '#EA580C']} style={s.encabezado} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={s.tituloEncabezado}>Temperatura</Text>
        <Text style={s.subtituloEncabezado}>Monitoreo corporal continuo de Sofía</Text>
      </LinearGradient>

      {/* Lectura principal */}
      <View style={s.panelPrincipal}>
        <View style={s.envolturioTermometro}>
          <Termometro llenado={llenadoTermometro} valor={actual} />
        </View>

        <View style={s.cajaLectura}>
          <Text style={s.valorTemp}>
            <Text style={s.numeroTemp}>{actual.toFixed(1)}</Text>
            <Text style={s.unidadTemp}> °C</Text>
          </Text>
          <View style={[s.pildoraEstado, { backgroundColor: estado.color + '22', borderColor: estado.color + '44' }]}>
            <Text style={s.emojiEstado}>{estado.emoji}</Text>
            <Text style={[s.etiquetaEstado, { color: estado.color }]}>{estado.etiqueta}</Text>
          </View>

          <View style={s.filaStats}>
            <CajaEstadistica icono="📊" etiqueta="Promedio" valor={`${promedio}°C`} />
            <CajaEstadistica icono="⬆️" etiqueta="Máxima"   valor={`${maxima.toFixed(1)}°C`} />
            <CajaEstadistica icono="⬇️" etiqueta="Mínima"   valor={`${minima.toFixed(1)}°C`} />
          </View>
        </View>
      </View>

      {/* Guía de escala */}
      <View style={s.seccionEscala}>
        <Text style={s.tituloSeccion}>Guía de temperatura corporal</Text>
        {rangosEscala.map((r, i) => (
          <View key={i} style={s.filaEscala}>
            <View style={[s.puntoEscala, { backgroundColor: r.color }]} />
            <Text style={s.rangoEscala}>{r.rango}</Text>
            <Text style={s.descEscala}>{r.desc}</Text>
          </View>
        ))}
      </View>

      {/* Gráfico */}
      <View style={s.seccionGrafico}>
        <Text style={s.tituloSeccion}>Historial de temperatura</Text>
        <GraficoTemp datos={temps} />
      </View>

      {/* Consejos */}
      <View style={s.seccionConsejos}>
        <Text style={s.tituloSeccion}>🌡️ Recomendaciones</Text>
        {consejosTemp.map((tip, i) => (
          <View key={i} style={s.filaConsejo}>
            <Text style={s.viñeta}>•</Text>
            <Text style={s.textoConsejo}>{tip}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ── Componentes internos ─────────────────────────────────────

function Termometro({ llenado, valor }: { llenado: number; valor: number }) {
  const alturaTotal = 160;
  const alturaLlenado = llenado * alturaTotal;
  const radioBase = 16;
  const anchoTubo = 14;
  const cx = 30;
  const arribaT = 10;
  const abajoT = arribaT + alturaTotal;
  const colorLlenado = valor > 37.8 ? Colores.peligro : valor < 36.3 ? Colores.oxigeno : Colores.temperatura;

  return (
    <Svg width={60} height={alturaTotal + radioBase * 2 + 10}>
      <Rect x={cx - anchoTubo / 2} y={arribaT} width={anchoTubo} height={alturaTotal} rx={anchoTubo / 2} fill={Colores.borde} />
      <Rect
        x={cx - anchoTubo / 2 + 2}
        y={arribaT + (alturaTotal - alturaLlenado)}
        width={anchoTubo - 4}
        height={alturaLlenado}
        rx={(anchoTubo - 4) / 2}
        fill={colorLlenado}
      />
      <Circle cx={cx} cy={abajoT + radioBase - 4} r={radioBase} fill={colorLlenado} />
      <Circle cx={cx} cy={abajoT + radioBase - 4} r={radioBase - 4} fill={colorLlenado} fillOpacity={0.5} />
      {[34, 36, 37.5, 38, 40].map((v) => {
        const rel = Math.max(0, Math.min(1, (v - 34) / 6));
        const y = arribaT + alturaTotal - rel * alturaTotal;
        return <Line key={v} x1={cx + anchoTubo / 2} y1={y} x2={cx + anchoTubo / 2 + 6} y2={y} stroke={Colores.textoClaro} strokeWidth={1} />;
      })}
    </Svg>
  );
}

function CajaEstadistica({ icono, etiqueta, valor }: { icono: string; etiqueta: string; valor: string }) {
  return (
    <View style={s.cajaEstadistica}>
      <Text style={s.iconoEstadistica}>{icono}</Text>
      <Text style={s.valorEstadistica}>{valor}</Text>
      <Text style={s.etiquetaEstadistica}>{etiqueta}</Text>
    </View>
  );
}

function GraficoTemp({ datos }: { datos: number[] }) {
  if (!datos || datos.length < 2) return null;
  const anchoG = width - 48;
  const altoG  = 120;
  const pH = 8; const pV = 12;
  const innerW = anchoG - pH * 2;
  const innerH = altoG - pV * 2;
  const minG = 35.5;
  const maxG = 38.5;
  const rango = maxG - minG;
  const aX = (i: number) => pH + (i / (datos.length - 1)) * innerW;
  const aY = (v: number) => pV + innerH - ((v - minG) / rango) * innerH;
  const puntos = datos.map((v, i) => `${aX(i)},${aY(v)}`).join(' ');
  const normalMinY = aY(36.5);
  const normalMaxY = aY(37.5);

  return (
    <View style={[s.contenedorGrafico, { width: anchoG, height: altoG }]}>
      <Svg width={anchoG} height={altoG}>
        <Line x1={pH} y1={normalMaxY} x2={pH + innerW} y2={normalMaxY} stroke={Colores.temperatura} strokeWidth={1} strokeDasharray="4,3" strokeOpacity={0.5} />
        <Line x1={pH} y1={normalMinY} x2={pH + innerW} y2={normalMinY} stroke={Colores.temperatura} strokeWidth={1} strokeDasharray="4,3" strokeOpacity={0.5} />
        <Polyline points={puntos} fill="none" stroke={Colores.temperatura} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={aX(datos.length - 1)} cy={aY(datos[datos.length - 1])} r={5} fill={Colores.temperatura} />
      </Svg>
    </View>
  );
}

// ── Datos estáticos ─────────────────────────────────────────────

const rangosEscala = [
  { rango: '< 36.0 °C',     desc: 'Hipotermia',            color: Colores.oxigeno },
  { rango: '36.0–36.4 °C',  desc: 'Temperatura baja',      color: Colores.advertencia },
  { rango: '36.5–37.5 °C',  desc: 'Normal ✓',              color: Colores.seguro },
  { rango: '37.6–38.0 °C',  desc: 'Temperatura elevada',   color: Colores.advertencia },
  { rango: '> 38.0 °C',     desc: 'Fiebre',                color: Colores.peligro },
];

const consejosTemp = [
  'Mantén al bebé en un ambiente con temperatura entre 20–22 °C.',
  'Evita abrigar demasiado al bebé, especialmente durante el sueño.',
  'Si la temperatura supera 38 °C, consulta con el pediatra.',
  'El sensor debe estar en contacto directo con la piel del bebé.',
  'Las mediciones pueden variar ligeramente si el bebé se mueve.',
];

// ── Estilos ──────────────────────────────────────────────────────

const s = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondo },
  encabezado: { paddingTop: 55, paddingBottom: 24, paddingHorizontal: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  tituloEncabezado: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtituloEncabezado: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },

  panelPrincipal: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 20, gap: 16, alignItems: 'center' },
  envolturioTermometro: { alignItems: 'center' },
  cajaLectura: { flex: 1, gap: 10 },
  valorTemp: { flexDirection: 'row', alignItems: 'flex-end' },
  numeroTemp: { fontSize: 52, fontWeight: '900', color: Colores.temperatura, lineHeight: 58 },
  unidadTemp: { fontSize: 20, fontWeight: '700', color: Colores.temperatura },
  pildoraEstado: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  emojiEstado: { fontSize: 14 },
  etiquetaEstado: { fontSize: 13, fontWeight: '700' },
  filaStats: { flexDirection: 'row', gap: 8 },
  cajaEstadistica: { flex: 1, backgroundColor: Colores.fondoTarjeta, borderRadius: 12, padding: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  iconoEstadistica: { fontSize: 14 },
  valorEstadistica: { fontSize: 14, fontWeight: '800', color: Colores.textoOscuro },
  etiquetaEstadistica: { fontSize: 10, color: Colores.textoClaro },

  seccionEscala: { paddingHorizontal: 20, marginTop: 8 },
  tituloSeccion: { fontSize: 16, fontWeight: '800', color: Colores.textoOscuro, marginBottom: 12 },
  filaEscala: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colores.divisor },
  puntoEscala: { width: 10, height: 10, borderRadius: 5 },
  rangoEscala: { width: 110, fontSize: 13, fontWeight: '700', color: Colores.textoOscuro },
  descEscala: { flex: 1, fontSize: 13, color: Colores.textoMedio },

  seccionGrafico: { paddingHorizontal: 20, marginTop: 16 },
  contenedorGrafico: { backgroundColor: Colores.fondoTarjeta, borderRadius: 16, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },

  seccionConsejos: { margin: 20, backgroundColor: '#FFF0E5', borderRadius: 20, padding: 16 },
  filaConsejo: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  viñeta: { color: Colores.temperatura, fontSize: 16, lineHeight: 20 },
  textoConsejo: { flex: 1, color: Colores.textoMedio, fontSize: 13, lineHeight: 20 },
});
