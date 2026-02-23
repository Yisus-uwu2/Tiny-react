/**
 * PantallaInicio — Dashboard principal de TinyCare.
 * Header limpio, tarjeta hero bebé, vitales separados, seguimiento avanzado.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Easing,
  TouchableOpacity, Platform, Modal, Pressable, Vibration, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Polyline, Polygon, Defs, LinearGradient as SvgLinearGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
import { useDatosSensor } from '../hooks/useDatosSensor';
import { Colores } from '../constantes/colores';

// ── Config ──────────────────────────────────────────────────────

const configActividad: Record<string, { emoji: string; etiqueta: string; color: string; fondo: string }> = {
  dormido:   { emoji: '😴', etiqueta: 'Dormida',   color: '#8B5CF6', fondo: '#EDE9FE' },
  tranquilo: { emoji: '😊', etiqueta: 'Tranquila', color: '#22C55E', fondo: '#DCFCE7' },
  activo:    { emoji: '🤸', etiqueta: 'Activa',    color: '#F59E0B', fondo: '#FEF3C7' },
  llorando:  { emoji: '😢', etiqueta: 'Llorando',  color: '#EF4444', fondo: '#FEE2E2' },
};

const configEstado: Record<string, { color: string; oscuro: string; etiqueta: string; desc: string; icono: string }> = {
  normal:       { color: '#22C55E', oscuro: '#16A34A', etiqueta: 'Todo bien',  desc: 'Signos vitales en rango normal', icono: '✓' },
  'precaución': { color: '#F59E0B', oscuro: '#B45309', etiqueta: 'Precaución', desc: 'Revisa los signos vitales del bebé', icono: '!' },
  alerta:       { color: '#EF4444', oscuro: '#DC2626', etiqueta: 'Alerta',     desc: 'Se requiere atención inmediata', icono: '⚠' },
};

// ── Seguimiento avanzado ────────────────────────────────────────

interface Tracker {
  id: string;
  emoji: string;
  etiqueta: string;
  color: string;
  fondo: string;
  gradiente: [string, string];
  registros: Date[];        // historial de registros
  activo: boolean;          // sueño en curso
  alarmaMin: number;        // minutos para alarma (sueño)
  alarmaActiva: boolean;
}

const TRACKERS_INICIAL: Tracker[] = [
  { id: 'biberon', emoji: '🍼', etiqueta: 'Biberón',  color: '#8B5CF6', fondo: '#EDE9FE', gradiente: ['#A78BFA', '#7C3AED'], registros: [], activo: false, alarmaMin: 0, alarmaActiva: false },
  { id: 'panal',   emoji: '🧷', etiqueta: 'Pañal',    color: '#F59E0B', fondo: '#FEF3C7', gradiente: ['#FCD34D', '#D97706'], registros: [], activo: false, alarmaMin: 0, alarmaActiva: false },
  { id: 'sueno',   emoji: '😴', etiqueta: 'Sueño',    color: '#3B82F6', fondo: '#DBEAFE', gradiente: ['#60A5FA', '#2563EB'], registros: [], activo: false, alarmaMin: 90, alarmaActiva: false },
];

const DURACIONES_SUENO = [30, 45, 60, 90, 120]; // minutos
const METAS_TRACKER: Record<string, number> = { biberon: 8, panal: 10, sueno: 5 };

function formatContador(desde: Date | null): string {
  if (!desde) return '0:00';
  const segs = Math.floor((Date.now() - desde.getTime()) / 1000);
  const h = Math.floor(segs / 3600);
  const m = Math.floor((segs % 3600) / 60);
  const s = segs % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTiempoDesde(desde: Date | null): string {
  if (!desde) return 'Sin registros';
  const mins = Math.floor((Date.now() - desde.getTime()) / 60_000);
  if (mins < 1) return 'Justo ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `Hace ${h}h ${m}m` : `Hace ${h}h`;
}

function formatCountdown(inicioSueno: Date, alarmaMin: number): string {
  const finMs = inicioSueno.getTime() + alarmaMin * 60_000;
  const restante = Math.max(0, Math.floor((finMs - Date.now()) / 1000));
  if (restante <= 0) return '¡Despertar!';
  const m = Math.floor(restante / 60);
  const s = restante % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Componente principal ────────────────────────────────────────

export default function PantallaInicio({ navigation }: any) {
  const { datos, historial } = useDatosSensor();
  const [trackers, setTrackers] = useState(TRACKERS_INICIAL);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [, tick] = useState(0);

  const [refrescando, setRefrescando] = useState(false);
  const alRefrescar = useCallback(() => {
    setRefrescando(true);
    setTimeout(() => setRefrescando(false), 1200);
  }, []);

  // Animaciones
  const anims = [0, 1, 2, 3, 4].map(() => useRef(new Animated.Value(0)).current);
  const anillo1 = useRef(new Animated.Value(0)).current;
  const anillo2 = useRef(new Animated.Value(0)).current;
  const animBrillo = useRef(new Animated.Value(1)).current;

  // Animación del menú flotante
  const animMenu = useRef(new Animated.Value(0)).current;

  const abrirMenu = useCallback((id: string) => {
    setMenuAbierto(id);
    setMenuVisible(true);
    animMenu.setValue(0);
    Animated.spring(animMenu, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }, [animMenu]);

  const cerrarMenu = useCallback(() => {
    Animated.timing(animMenu, { toValue: 0, duration: 200, useNativeDriver: true, easing: Easing.in(Easing.ease) }).start(() => {
      setMenuVisible(false);
      setMenuAbierto(null);
      setConfirmacion(null);
    });
  }, [animMenu]);

  // Navegación a vitales con pestaña específica
  const irAVitales = useCallback((pestana: 'corazon' | 'oxigeno' | 'temp') => {
    navigation.navigate('Vitales', { pestana });
  }, [navigation]);

  useEffect(() => {
    Animated.stagger(100, anims.map(a =>
      Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 })
    )).start();

    const pulso = (anim: Animated.Value, demora: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(demora),
        Animated.timing(anim, { toValue: 1, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]));
    pulso(anillo1, 0).start();
    pulso(anillo2, 550).start();
  }, []);

  useEffect(() => {
    if (datos.estado === 'alerta') {
      const b = Animated.loop(Animated.sequence([
        Animated.timing(animBrillo, { toValue: 0.45, duration: 550, useNativeDriver: true }),
        Animated.timing(animBrillo, { toValue: 1,    duration: 550, useNativeDriver: true }),
      ]));
      b.start();
      return () => b.stop();
    } else { animBrillo.setValue(1); }
  }, [datos.estado]);

  // Tick cada segundo (para cronómetros)
  useEffect(() => {
    const hay = trackers.some(t => t.activo || t.alarmaActiva);
    if (!hay) return;
    const id = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [trackers]);

  // Tick cada 30s para tiempos relativos
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Animación del toast de confirmación
  const animToast = useRef(new Animated.Value(0)).current;

  // Scroll para header colapsable
  const scrollY = useRef(new Animated.Value(0)).current;
  const opacidadSaludo = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: 'clamp' });

  const mostrarConfirmacion = useCallback((texto: string) => {
    setConfirmacion(texto);
    animToast.setValue(0);
    Animated.sequence([
      Animated.spring(animToast, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.delay(1400),
      Animated.timing(animToast, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setConfirmacion(null));
  }, [animToast]);

  const registrar = useCallback((trackerId: string) => {
    setTrackers(prev => prev.map(t => {
      if (t.id !== trackerId) return t;
      return { ...t, registros: [...t.registros, new Date()] };
    }));
    Vibration.vibrate(30);
    const nombres: Record<string, string> = { biberon: '🍼 Biberón registrado', panal: '🧷 Pañal registrado' };
    mostrarConfirmacion(nombres[trackerId] ?? 'Registrado');
  }, [mostrarConfirmacion]);

  const toggleSueno = useCallback(() => {
    setTrackers(prev => prev.map(t => {
      if (t.id !== 'sueno') return t;
      const nuevoActivo = !t.activo;
      return {
        ...t,
        activo: nuevoActivo,
        alarmaActiva: nuevoActivo && t.alarmaMin > 0,
        registros: nuevoActivo ? [...t.registros, new Date()] : t.registros,
      };
    }));
    Vibration.vibrate(30);
  }, []);

  const setAlarmaSueno = useCallback((min: number) => {
    setTrackers(prev => prev.map(t => {
      if (t.id !== 'sueno') return t;
      return { ...t, alarmaMin: min, alarmaActiva: t.activo && min > 0 };
    }));
  }, []);

  const ahora = new Date();
  const hora = ahora.getHours();
  const saludo = hora < 12 ? '🌅 ¡Buenos días!' : hora < 18 ? '☀️ ¡Buenas tardes!' : '🌙 ¡Buenas noches!';

  const actividad = configActividad[datos.actividad] ?? configActividad.tranquilo;
  const estado    = configEstado[datos.estado]        ?? configEstado.normal;

  const entrada = (i: number) => ({
    opacity: anims[i],
    transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  });

  const trackerSueno = trackers.find(t => t.id === 'sueno')!;
  const ultimoSueno = trackerSueno.registros.length > 0 ? trackerSueno.registros[trackerSueno.registros.length - 1] : null;

  // Datos para sparklines
  const datosRC = historial.slice(-8).map(h => h.ritmoCardiaco);
  const datosO2 = historial.slice(-8).map(h => h.oxigeno);
  const datosTemp = historial.slice(-8).map(h => h.temperatura);

  return (
    <View style={{ flex: 1, backgroundColor: Colores.fondo }}>
      <Animated.ScrollView
        style={s.contenedor}
        contentContainerStyle={s.contenido}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} tintColor={Colores.primario} colors={[Colores.primario]} />
        }
      >

        {/* ── HEADER LIMPIO ── */}
        <Animated.View style={[s.header, entrada(0)]}>
          <View>
            <Animated.Text style={[s.saludo, { opacity: opacidadSaludo }]}>{saludo}</Animated.Text>
            <Text style={s.titulo}>TinyCare</Text>
          </View>
          <View style={[s.chip, { backgroundColor: datos.conectado ? Colores.seguro + '22' : Colores.peligro + '22' }]}>
            <View style={[s.puntoConexion, { backgroundColor: datos.conectado ? Colores.seguroOscuro : Colores.peligroOscuro }]} />
            <Text style={[s.textoChip, { color: datos.conectado ? Colores.seguroOscuro : Colores.peligroOscuro }]}>
              {datos.conectado ? 'Conectado' : 'Sin señal'}
            </Text>
          </View>
        </Animated.View>

        {/* ── TARJETA HERO BEBÉ ── */}
        <Animated.View style={[s.tarjetaHero, { backgroundColor: actividad.fondo }, entrada(1)]}>
          <View style={s.filaAvatar}>
            <View style={[s.circuloAvatar, { borderColor: actividad.color + '50', backgroundColor: '#FFFFFF' }]}>
              <Text style={s.emojiBebe}>👶</Text>
            </View>
            <View style={s.infoBebe}>
              <Text style={s.nombreBebe}>Sofía</Text>
              <Text style={s.edadBebe}>3 meses · 12 días</Text>
            </View>
          </View>

          {/* Estado de actividad prominente */}
          <View style={[s.bloqueActividad, { backgroundColor: actividad.color + '18' }]}>
            <Text style={s.actividadEmoji}>{actividad.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.actividadTitulo, { color: actividad.color }]}>{actividad.etiqueta}</Text>
              <Text style={s.actividadDesc}>
                {datos.actividad === 'dormido' ? 'El bebé está descansando tranquilamente'
                  : datos.actividad === 'tranquilo' ? 'Todo en calma, sin novedades'
                  : datos.actividad === 'activo' ? 'Movimiento detectado, alerta y despierta'
                  : 'Se detectó llanto, revisa al bebé'}
              </Text>
            </View>
          </View>

          {datos.estado !== 'normal' && (
            <Animated.View style={[s.cajaEstado, { backgroundColor: estado.color + '14', borderColor: estado.color + '40' }, { opacity: animBrillo }]}>
              <View style={[s.fondoIconoEstado, { backgroundColor: estado.color }]}>
                <Text style={s.iconoEstado}>{estado.icono}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.etiquetaEstado, { color: estado.oscuro }]}>{estado.etiqueta}</Text>
                <Text style={s.descEstado}>{estado.desc}</Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── SIGNOS VITALES ── */}
        <Animated.View style={[s.encabezadoSeccion, entrada(2)]}>
          <Text style={s.tituloSeccion}>Signos vitales</Text>
        </Animated.View>

        <Animated.View style={[s.fila, entrada(2)]}>
          {/* Ritmo cardíaco */}
          <TarjetaSensorAnimada onPress={() => irAVitales('corazon')} style={{ flex: 1 }}>
            <View style={s.superiorTarjeta}>
              <View style={s.envolturioAnillos}>
                <Animated.View style={[s.anillo, {
                  transform: [{ scale: anillo1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
                  opacity: anillo1.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.2, 0] }),
                }]} />
                <Animated.View style={[s.anillo, {
                  transform: [{ scale: anillo2.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
                  opacity: anillo2.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.2, 0] }),
                }]} />
                <LinearGradient colors={Colores.gradienteCorazon as [string, string]} style={s.fondoIcono} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={s.iconoTarjeta}>❤️</Text>
                </LinearGradient>
              </View>
              <View style={[s.badge, estaEnRango(datos.ritmoCardiaco, 100, 160) ? s.badgeVerde : s.badgeRoja]}>
                <Text style={[s.badgeTexto, estaEnRango(datos.ritmoCardiaco, 100, 160) ? s.badgeTextoVerde : s.badgeTextoRoja]}>
                  {estaEnRango(datos.ritmoCardiaco, 100, 160) ? 'Normal' : 'Revisar'}
                </Text>
              </View>
            </View>
            <ValorAnimado valor={datos.ritmoCardiaco} estilo={[s.valor, { color: Colores.corazonOscuro }]} />
            <Text style={[s.unidad, { color: Colores.corazonOscuro }]}>lpm</Text>
            <Text style={s.etiquetaTarjeta}>Ritmo cardíaco</Text>
            <Sparkline datos={datosRC} color={Colores.corazon} ancho={120} alto={28} />
            <BarraSensor valor={datos.ritmoCardiaco} min={100} max={160} color={Colores.corazon} />
          </TarjetaSensorAnimada>
          <View style={{ width: 12 }} />
          {/* Oxigenación */}
          <TarjetaSensorAnimada onPress={() => irAVitales('oxigeno')} style={{ flex: 1 }}>
            <View style={s.superiorTarjeta}>
              <LinearGradient colors={Colores.gradienteOxigeno as [string, string]} style={s.fondoIcono} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={s.iconoTarjeta}>💧</Text>
              </LinearGradient>
              <View style={[s.badge, estaEnRango(datos.oxigeno, 95, 100) ? s.badgeVerde : s.badgeRoja]}>
                <Text style={[s.badgeTexto, estaEnRango(datos.oxigeno, 95, 100) ? s.badgeTextoVerde : s.badgeTextoRoja]}>
                  {estaEnRango(datos.oxigeno, 95, 100) ? 'Normal' : 'Revisar'}
                </Text>
              </View>
            </View>
            <ValorAnimado valor={datos.oxigeno} estilo={[s.valor, { color: Colores.oxigenoOscuro }]} />
            <Text style={[s.unidad, { color: Colores.oxigenoOscuro }]}>%</Text>
            <Text style={s.etiquetaTarjeta}>Oxigenación</Text>
            <Sparkline datos={datosO2} color={Colores.oxigeno} ancho={120} alto={28} />
            <BarraSensor valor={datos.oxigeno} min={95} max={100} color={Colores.oxigeno} />
          </TarjetaSensorAnimada>
        </Animated.View>

        {/* Temperatura */}
        <Animated.View style={entrada(2)}>
          <TarjetaSensorAnimada onPress={() => irAVitales('temp')} style={s.tarjetaAnchaExterna}>
            <View style={s.superiorAncha}>
              <View style={s.izquierdaAncha}>
                <LinearGradient colors={Colores.gradienteTemperatura as [string, string]} style={s.fondoIcono} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={s.iconoTarjeta}>🌡️</Text>
                </LinearGradient>
                <View style={{ marginLeft: 14 }}>
                  <Text style={s.etiquetaTarjeta}>Temperatura</Text>
                  <View style={[s.badge, { marginTop: 5 }, estaEnRango(datos.temperatura, 36.5, 37.5) ? s.badgeVerde : s.badgeRoja]}>
                    <Text style={[s.badgeTexto, estaEnRango(datos.temperatura, 36.5, 37.5) ? s.badgeTextoVerde : s.badgeTextoRoja]}>
                      {estaEnRango(datos.temperatura, 36.5, 37.5) ? 'Normal' : 'Revisar'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                <ValorAnimado valor={datos.temperatura} decimales={1} estilo={[s.valor, s.valorAncho, { color: Colores.temperaturaOscuro }]} />
                <Text style={[s.unidad, { color: Colores.temperaturaOscuro, marginBottom: 4 }]}>°C</Text>
              </View>
            </View>
            <Sparkline datos={datosTemp} color={Colores.temperatura} ancho={200} alto={28} />
            <BarraSensor valor={datos.temperatura} min={36.5} max={37.5} color={Colores.temperatura} />
          </TarjetaSensorAnimada>
        </Animated.View>

        {/* ── SEGUIMIENTO ── */}
        <Animated.View style={[s.encabezadoSeccion, entrada(3)]}>
          <Text style={s.tituloSeccion}>Seguimiento</Text>
        </Animated.View>

        <Animated.View style={[s.filaSeguimiento, entrada(3)]}>
          {trackers.map(t => {
            const ultimo = t.registros.length > 0 ? t.registros[t.registros.length - 1] : null;
            const esSueno = t.id === 'sueno';

            return (
              <TouchableOpacity
                key={t.id}
                style={s.tarjetaTracker}
                activeOpacity={0.85}
                onPress={() => abrirMenu(t.id)}
              >
                <LinearGradient colors={t.gradiente} style={s.trackerGradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                    <Svg width={52} height={52} style={{ position: 'absolute' }}>
                      <SvgCircle cx={26} cy={26} r={22} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={3} />
                      <SvgCircle cx={26} cy={26} r={22} fill="none" stroke="#FFF" strokeWidth={3}
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        strokeDashoffset={2 * Math.PI * 22 * (1 - Math.min(1, t.registros.length / (METAS_TRACKER[t.id] || 8)))}
                        strokeLinecap="round" rotation={-90} origin="26,26" />
                    </Svg>
                    <Text style={s.trackerEmoji}>{t.emoji}</Text>
                  </View>

                  {/* Contador principal */}
                  {esSueno && t.activo ? (
                    <>
                      <Text style={s.trackerContador}>{formatContador(ultimo)}</Text>
                      {t.alarmaActiva && ultimo && (
                        <View style={s.countdownBadge}>
                          <Text style={s.countdownTexto}>⏰ {formatCountdown(ultimo, t.alarmaMin)}</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={s.trackerContador}>{t.registros.length}</Text>
                  )}

                  <Text style={s.trackerEtiqueta}>{t.etiqueta}</Text>
                  <Text style={s.trackerUltimo}>
                    {esSueno && t.activo ? 'En curso…' : formatTiempoDesde(ultimo)}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        <View style={{ height: 36 }} />
      </Animated.ScrollView>

      {/* ── MENÚ FLOTANTE ANIMADO ── */}
      <Modal visible={menuVisible} transparent animationType="none" onRequestClose={cerrarMenu} statusBarTranslucent>
        <View style={s.overlay}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={StyleSheet.absoluteFill} onPress={cerrarMenu} />
          <Animated.View style={[s.menuFlotante, {
            transform: [{ translateY: animMenu.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }],
            opacity: animMenu,
          }]}>
          <Pressable onPress={() => {}}>
            {menuAbierto && (() => {
              const t = trackers.find(tr => tr.id === menuAbierto)!;
              const ultimo = t.registros.length > 0 ? t.registros[t.registros.length - 1] : null;
              const esSueno = t.id === 'sueno';

              return (
                <>
                  {/* Header del menú */}
                  <View style={s.menuHeader}>
                    <View style={[s.menuIcono, { backgroundColor: t.fondo }]}>
                      <Text style={{ fontSize: 28 }}>{t.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.menuTitulo}>{t.etiqueta}</Text>
                      <Text style={s.menuSubtitulo}>
                        {t.registros.length} registros hoy · {formatTiempoDesde(ultimo)}
                      </Text>
                    </View>
                  </View>

                  <View style={s.menuDivisor} />

                  {/* Acciones según tipo */}
                  {esSueno ? (
                    <>
                      {/* Toggle sueño */}
                      <TouchableOpacity
                        style={[s.menuAccion, { backgroundColor: t.activo ? '#FEE2E2' : t.fondo }]}
                        onPress={() => { toggleSueno(); cerrarMenu(); }}
                      >
                        <Text style={s.menuAccionEmoji}>{t.activo ? '⏹' : '▶️'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.menuAccionTitulo, t.activo && { color: '#DC2626' }]}>
                            {t.activo ? 'Detener sueño' : 'Iniciar sueño'}
                          </Text>
                          <Text style={s.menuAccionDesc}>
                            {t.activo ? 'Registrar que despertó' : 'Comenzar a cronometrar'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Selector de alarma */}
                      <View style={s.menuSeccion}>
                        <Text style={s.menuSeccionTitulo}>⏰ Alarma para despertar</Text>
                        <Text style={s.menuSeccionDesc}>Te avisará cuando sea hora de despertar a la bebé</Text>
                        <View style={s.filaDuraciones}>
                          {DURACIONES_SUENO.map(m => (
                            <TouchableOpacity
                              key={m}
                              style={[
                                s.botonDuracion,
                                t.alarmaMin === m && { backgroundColor: t.color },
                              ]}
                              onPress={() => setAlarmaSueno(t.alarmaMin === m ? 0 : m)}
                            >
                              <Text style={[
                                s.textoDuracion,
                                t.alarmaMin === m && { color: '#FFF' },
                              ]}>
                                {m < 60 ? `${m}m` : `${m / 60}h${m % 60 > 0 ? ` ${m % 60}m` : ''}`}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Estado actual si está activo */}
                      {t.activo && ultimo && (
                        <View style={[s.menuEstadoActivo, { backgroundColor: t.fondo }]}>
                          <Text style={s.menuEstadoEmoji}>😴</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[s.menuEstadoTitulo, { color: t.color }]}>Durmiendo…</Text>
                            <Text style={s.menuEstadoTiempo}>{formatContador(ultimo)}</Text>
                          </View>
                          {t.alarmaActiva && (
                            <View style={s.menuCountdown}>
                              <Text style={[s.menuCountdownTexto, { color: t.color }]}>
                                ⏰ {formatCountdown(ultimo, t.alarmaMin)}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Registrar rápido */}
                      <TouchableOpacity
                        style={[s.menuAccion, { backgroundColor: t.fondo }]}
                        onPress={() => registrar(t.id)}
                      >
                        <Text style={s.menuAccionEmoji}>✅</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.menuAccionTitulo}>Registrar ahora</Text>
                          <Text style={s.menuAccionDesc}>
                            {t.id === 'biberon' ? 'Anotar toma de biberón' : 'Anotar cambio de pañal'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Info adicional */}
                      <View style={s.menuSeccion}>
                        <Text style={s.menuSeccionTitulo}>📊 Hoy</Text>
                        <View style={s.menuStats}>
                          <View style={s.menuStat}>
                            <Text style={[s.menuStatValor, { color: t.color }]}>{t.registros.length}</Text>
                            <Text style={s.menuStatLabel}>Total</Text>
                          </View>
                          <View style={s.menuStatDivisor} />
                          <View style={s.menuStat}>
                            <Text style={[s.menuStatValor, { color: t.color }]}>
                              {t.registros.length >= 2
                                ? `${Math.round((t.registros[t.registros.length - 1].getTime() - t.registros[t.registros.length - 2].getTime()) / 60_000)}m`
                                : '—'}
                            </Text>
                            <Text style={s.menuStatLabel}>Intervalo</Text>
                          </View>
                          <View style={s.menuStatDivisor} />
                          <View style={s.menuStat}>
                            <Text style={[s.menuStatValor, { color: t.color }]}>
                              {formatTiempoDesde(ultimo)}
                            </Text>
                            <Text style={s.menuStatLabel}>Último</Text>
                          </View>
                        </View>
                      </View>

                      {/* Historial reciente */}
                      {t.registros.length > 0 && (
                        <View style={s.menuSeccion}>
                          <Text style={s.menuSeccionTitulo}>🕐 Historial reciente</Text>
                          {t.registros.slice(-3).reverse().map((reg, idx) => (
                            <View key={idx} style={s.menuHistItem}>
                              <View style={[s.menuHistDot, { backgroundColor: t.color }]} />
                              <Text style={s.menuHistTexto}>
                                {reg.getHours().toString().padStart(2, '0')}:{reg.getMinutes().toString().padStart(2, '0')}
                              </Text>
                              <Text style={s.menuHistTiempo}>{formatTiempoDesde(reg)}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  )}

                  {/* Cerrar */}
                  <TouchableOpacity style={s.menuCerrar} onPress={cerrarMenu}>
                    <Text style={s.menuCerrarTexto}>Cerrar</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* ── TOAST DE CONFIRMACIÓN FLOTANTE (Modal propio para estar encima) ── */}
      <Modal visible={confirmacion !== null} transparent animationType="none" statusBarTranslucent>
        <View style={s.toastOverlay} pointerEvents="box-none">
          <Animated.View style={[s.toastCard, {
            opacity: animToast,
            transform: [{ scale: animToast.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
          }]} pointerEvents="none">
            <View style={s.toastCheck}>
              <Text style={s.toastCheckTexto}>✓</Text>
            </View>
            <Text style={s.toastTexto}>{confirmacion}</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ── Componentes auxiliares ───────────────────────────────────────

/** Tarjeta con micro-animación de escala al presionar */
function TarjetaSensorAnimada({ onPress, style, children }: { onPress: () => void; style?: any; children: React.ReactNode }) {
  const escala = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(escala, { toValue: 0.96, useNativeDriver: true, tension: 120, friction: 8 }).start();
  const onPressOut = () => Animated.spring(escala, { toValue: 1, useNativeDriver: true, tension: 40, friction: 6 }).start();
  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={style}>
      <Animated.View style={[s.tarjetaSensor, { transform: [{ scale: escala }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

/** Valor numérico con animación count-up */
function ValorAnimado({ valor, decimales = 0, estilo }: { valor: number; decimales?: number; estilo?: any }) {
  const [display, setDisplay] = useState(valor);
  const anim = useRef(new Animated.Value(valor)).current;
  useEffect(() => {
    const listener = anim.addListener(({ value: v }) => {
      setDisplay(decimales > 0 ? parseFloat(v.toFixed(decimales)) : Math.round(v));
    });
    return () => anim.removeListener(listener);
  }, [decimales]);
  useEffect(() => {
    Animated.timing(anim, { toValue: valor, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [valor]);
  return <Text style={estilo}>{decimales > 0 ? display.toFixed(decimales) : display}</Text>;
}

/** Sparkline SVG con relleno degradado */
function Sparkline({ datos, color, ancho, alto }: { datos: number[]; color: string; ancho: number; alto: number }) {
  if (datos.length < 2) return null;
  const min = Math.min(...datos);
  const max = Math.max(...datos);
  const rango = max - min || 1;
  const puntos = datos.map((v, i) => `${(i / (datos.length - 1)) * ancho},${alto - ((v - min) / rango) * (alto - 4) - 2}`).join(' ');
  const areaPoints = `0,${alto} ${puntos} ${ancho},${alto}`;
  const gradId = `spk_${color.replace('#', '')}`;
  return (
    <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
      <Svg width={ancho} height={alto}>
        <Defs>
          <SvgLinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.3} />
            <Stop offset="1" stopColor={color} stopOpacity={0.02} />
          </SvgLinearGradient>
        </Defs>
        <Polygon points={areaPoints} fill={`url(#${gradId})`} />
        <Polyline points={puntos} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

// ── Utilidades ──────────────────────────────────────────────────

const estaEnRango = (v: number, min: number, max: number) => v >= min && v <= max;

function BarraSensor({ valor, min, max, color }: { valor: number; min: number; max: number; color: string }) {
  const rango  = max - min;
  const lo     = min - rango * 0.35;
  const hi     = max + rango * 0.35;
  const pct    = Math.max(0, Math.min(1, (valor - lo) / (hi - lo)));
  const normal = estaEnRango(valor, min, max);
  const zonaL  = ((min - lo) / (hi - lo)) * 100;
  const zonaR  = (1 - (max - lo) / (hi - lo)) * 100;
  return (
    <View style={{ marginTop: 12 }}>
      <View style={barra.pista}>
        <View style={[barra.zona, { left: `${zonaL}%`, right: `${zonaR}%`, backgroundColor: color + '30' }]} />
        <View style={[barra.punto, { left: `${pct * 100}%`, backgroundColor: normal ? color : '#F87171' }]} />
      </View>
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────────

const barra = StyleSheet.create({
  pista: { height: 4, backgroundColor: Colores.bordeSutil, borderRadius: 2, position: 'relative', overflow: 'visible' },
  zona:  { position: 'absolute', top: 0, bottom: 0, borderRadius: 2 },
  punto: { position: 'absolute', top: -4, width: 12, height: 12, borderRadius: 6, marginLeft: -6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 3, elevation: 3 },
});

const s = StyleSheet.create({
  contenedor: { flex: 1 },
  contenido:  { paddingBottom: 36 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 46, paddingBottom: 16, paddingHorizontal: 20,
  },
  saludo: { fontSize: 13, color: Colores.textoClaro, fontWeight: '500' },
  titulo: { fontSize: 28, fontWeight: '900', color: Colores.textoOscuro, letterSpacing: -0.5 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  puntoConexion: { width: 7, height: 7, borderRadius: 4 },
  textoChip: { fontSize: 12, fontWeight: '700' },

  // Hero bebé
  tarjetaHero: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 22, overflow: 'hidden',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
  },
  filaAvatar: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  circuloAvatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FEF3C7', borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  emojiBebe: { fontSize: 36 },
  infoBebe: { marginLeft: 16, flex: 1, gap: 3 },
  nombreBebe: { fontSize: 24, fontWeight: '900', color: Colores.textoOscuro, letterSpacing: -0.5 },
  edadBebe: { fontSize: 13, color: Colores.textoMedio, fontWeight: '500' },
  bloqueActividad: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 18, borderRadius: 20,
  },
  actividadEmoji: { fontSize: 38 },
  actividadTitulo: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  actividadDesc: { fontSize: 13, color: Colores.textoMedio, fontWeight: '500', marginTop: 2 },

  cajaEstado: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 16, borderWidth: 1.5, marginTop: 16 },
  fondoIconoEstado: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconoEstado: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  etiquetaEstado: { fontSize: 18, fontWeight: '800' },
  descEstado: { fontSize: 12, color: Colores.textoMedio, marginTop: 2, fontWeight: '500' },

  // Sección
  encabezadoSeccion: { paddingHorizontal: 20, marginTop: 26, marginBottom: 12 },
  tituloSeccion: { fontSize: 18, fontWeight: '800', color: Colores.textoOscuro },

  // Vitales
  fila: { flexDirection: 'row', paddingHorizontal: 16 },
  tarjetaSensor: {
    backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  superiorTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  fondoIcono: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconoTarjeta: { fontSize: 22 },
  valor: { fontSize: 42, fontWeight: '900', letterSpacing: -1.5, lineHeight: 46 },
  unidad: { fontSize: 14, fontWeight: '600', opacity: 0.8 },
  etiquetaTarjeta: { fontSize: 12, color: Colores.textoMedio, fontWeight: '600', marginTop: 3 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  badgeVerde: { backgroundColor: Colores.seguro + '22' },
  badgeRoja: { backgroundColor: Colores.peligro + '22' },
  badgeTexto: { fontSize: 11, fontWeight: '700' },
  badgeTextoVerde: { color: Colores.seguroOscuro },
  badgeTextoRoja: { color: Colores.peligroOscuro },
  envolturioAnillos: { position: 'relative', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  anillo: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: Colores.corazon + '22' },
  tarjetaAncha: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: Colores.fondoTarjeta, borderRadius: 22, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    overflow: 'hidden',
  },
  tarjetaAnchaExterna: {
    marginHorizontal: 16, marginTop: 12,
  },
  superiorAncha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  izquierdaAncha: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  valorAncho: { fontSize: 48 },

  // Seguimiento
  filaSeguimiento: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  tarjetaTracker: { flex: 1, borderRadius: 22, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  trackerGradiente: { paddingVertical: 20, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', height: 170 },
  trackerEmoji: { fontSize: 32 },
  trackerContador: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', marginTop: 6, letterSpacing: -1 },
  trackerEtiqueta: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  trackerUltimo: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  countdownBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  countdownTexto: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  // Modal / Menú flotante
  overlay: { flex: 1, justifyContent: 'flex-end' } as any,
  menuFlotante: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  menuIcono: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  menuTitulo: { fontSize: 20, fontWeight: '900', color: Colores.textoOscuro },
  menuSubtitulo: { fontSize: 13, color: Colores.textoClaro, fontWeight: '500', marginTop: 2 },
  menuDivisor: { height: 1, backgroundColor: Colores.bordeSutil, marginVertical: 16 },

  menuAccion: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, marginBottom: 10,
  },
  menuAccionEmoji: { fontSize: 22 },
  menuAccionTitulo: { fontSize: 16, fontWeight: '700', color: Colores.textoOscuro },
  menuAccionDesc: { fontSize: 12, color: Colores.textoClaro, marginTop: 1 },

  menuSeccion: { marginTop: 6, marginBottom: 10 },
  menuSeccionTitulo: { fontSize: 14, fontWeight: '700', color: Colores.textoOscuro, marginBottom: 4 },
  menuSeccionDesc: { fontSize: 12, color: Colores.textoClaro, marginBottom: 10 },

  menuStats: { flexDirection: 'row', backgroundColor: Colores.fondoSecundario, borderRadius: 16, padding: 14 },
  menuStat: { flex: 1, alignItems: 'center' },
  menuStatValor: { fontSize: 20, fontWeight: '900' },
  menuStatLabel: { fontSize: 11, color: Colores.textoClaro, fontWeight: '600', marginTop: 2 },
  menuStatDivisor: { width: 1, backgroundColor: Colores.bordeSutil, marginHorizontal: 6 },

  menuHistItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  menuHistDot: { width: 8, height: 8, borderRadius: 4 },
  menuHistTexto: { fontSize: 15, fontWeight: '700', color: Colores.textoOscuro },
  menuHistTiempo: { fontSize: 12, color: Colores.textoClaro, fontWeight: '500' },

  filaDuraciones: { flexDirection: 'row', gap: 8 },
  botonDuracion: { flex: 1, backgroundColor: Colores.bordeSutil, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  textoDuracion: { fontSize: 14, fontWeight: '700', color: Colores.textoMedio },

  menuEstadoActivo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, marginTop: 10 },
  menuEstadoEmoji: { fontSize: 28 },
  menuEstadoTitulo: { fontSize: 15, fontWeight: '800' },
  menuEstadoTiempo: { fontSize: 22, fontWeight: '900', color: Colores.textoOscuro },
  menuCountdown: { backgroundColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  menuCountdownTexto: { fontSize: 14, fontWeight: '800' },

  menuCerrar: { marginTop: 10, alignItems: 'center', paddingVertical: 14 },
  menuCerrarTexto: { fontSize: 16, fontWeight: '700', color: Colores.textoClaro },

  toastOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
  },
  toastCard: {
    backgroundColor: '#FFFFFF', borderRadius: 28, paddingVertical: 32, paddingHorizontal: 40,
    alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 20,
  },
  toastCheck: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colores.seguro,
    alignItems: 'center', justifyContent: 'center',
  },
  toastCheckTexto: { fontSize: 34, fontWeight: '900', color: '#FFFFFF' },
  toastTexto: { fontSize: 17, fontWeight: '800', color: Colores.textoOscuro, textAlign: 'center' },
});
