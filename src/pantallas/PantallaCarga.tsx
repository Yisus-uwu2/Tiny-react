/**
 * PantallaCarga — Pantalla de carga con animaciones de partículas,
 * pulso cardíaco y transición suave al resto de la app.
 */
import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Colores } from '../constantes/colores';

const { width: W, height: H } = Dimensions.get('window');

const NUM_PARTICULAS = 14;

function Particula({ delay, x, size, dur, color }: { delay: number; x: number; size: number; dur: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const opac = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opac, { toValue: 1, duration: dur * 0.2, useNativeDriver: true }),
            Animated.timing(opac, { toValue: 0, duration: dur * 0.8, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute', left: x, bottom: 0,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, opacity: opac,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(H * 0.7 + Math.random() * H * 0.25)] }) },
                    { scale: anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 1, 0.3] }) }],
      }}
    />
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function AnillosPulso() {
  const rings = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    rings.forEach((r, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 600),
          Animated.timing(r, { toValue: 1, duration: 2000, easing: Easing.out(Easing.quad), useNativeDriver: false }),
          Animated.timing(r, { toValue: 0, duration: 0, useNativeDriver: false }),
        ]),
      ).start();
    });
  }, []);
  return (
    <Svg width={200} height={200} style={{ position: 'absolute' }}>
      <Defs>
        <RadialGradient id="g" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={Colores.primario} stopOpacity="0.12" />
          <Stop offset="100%" stopColor={Colores.primario} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {rings.map((r, i) => (
        <AnimatedCircle
          key={i} cx={100} cy={100} fill="none" stroke={Colores.primarioClaro}
          r={r.interpolate({ inputRange: [0, 1], outputRange: [30, 95] })}
          strokeWidth={r.interpolate({ inputRange: [0, 0.3, 1], outputRange: [3, 2, 0.5] })}
          opacity={r.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.7, 0] })}
        />
      ))}
    </Svg>
  );
}

function LineaECG() {
  const dash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(dash, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: false }),
    ).start();
  }, []);
  const AnimPath = Animated.createAnimatedComponent(Path);
  const ecg = 'M 0 30 L 30 30 L 38 30 L 42 10 L 48 50 L 54 20 L 58 35 L 62 30 L 100 30 L 108 30 L 112 12 L 118 48 L 122 22 L 126 34 L 130 30 L 170 30 L 174 30 L 178 8 L 184 52 L 190 18 L 194 36 L 198 30 L 240 30';
  return (
    <Svg width={240} height={60} style={{ marginTop: 36, opacity: 0.65 }}>
      <AnimPath d={ecg} stroke={Colores.primario} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="240"
        strokeDashoffset={dash.interpolate({ inputRange: [0, 1], outputRange: [240, -240] })}
      />
    </Svg>
  );
}

export default function PantallaCarga({ navigation }: any) {
  const escalaLogo = useRef(new Animated.Value(0)).current;
  const opTexto = useRef(new Animated.Value(0)).current;
  const escalaCorazon = useRef(new Animated.Value(1)).current;
  const opFade = useRef(new Animated.Value(1)).current;
  const yLogo = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(escalaLogo, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(yLogo, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
        Animated.timing(opTexto, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(escalaCorazon, { toValue: 1.15, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(escalaCorazon, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(120),
        Animated.timing(escalaCorazon, { toValue: 1.12, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(escalaCorazon, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(800),
      ]),
    ).start();

    const timer = setTimeout(() => {
      Animated.timing(opFade, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        navigation.replace('Principal');
      });
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  const particulas = useMemo(() => {
    const colores = [Colores.primarioClaro, Colores.corazon + '55', Colores.oxigeno + '55', Colores.seguro + '44', '#E9D5FF88'];
    return Array.from({ length: NUM_PARTICULAS }, (_, i) => ({
      key: i,
      delay: Math.random() * 2500,
      x: Math.random() * W,
      size: 5 + Math.random() * 12,
      dur: 3000 + Math.random() * 2500,
      color: colores[i % colores.length],
    }));
  }, []);

  return (
    <Animated.View style={[s.container, { opacity: opFade }]}>
      <LinearGradient colors={['#2D1B69', '#4C1D95', Colores.primario]} locations={[0, 0.5, 1]} style={s.bg}>
        {/* Partículas flotantes */}
        {particulas.map((p, i) => <Particula key={i} delay={p.delay} x={p.x} size={p.size} dur={p.dur} color={p.color} />)}

        {/* Anillos de pulso */}
        <AnillosPulso />

        {/* Logo principal */}
        <Animated.View style={{ alignItems: 'center', transform: [{ scale: escalaLogo }, { translateY: yLogo }] }}>
          <View style={s.logoBg}>
            <Animated.Text style={[s.logoEmoji, { transform: [{ scale: escalaCorazon }] }]}>💜</Animated.Text>
          </View>
        </Animated.View>

        {/* Texto */}
        <Animated.View style={[s.textoWrap, { opacity: opTexto }]}>
          <Text style={s.marca}>TinyCare</Text>
          <Text style={s.subtitulo}>Cuidado inteligente para tu bebé</Text>
        </Animated.View>

        {/* ECG */}
        <LineaECG />

        {/* Indicador inferior */}
        <Animated.View style={[s.cargandoWrap, { opacity: opTexto }]}>
          <View style={s.dots}>
            {[0, 1, 2].map(i => <PuntoCargando key={i} delay={i * 250} />)}
          </View>
          <Text style={s.cargandoText}>Preparando monitoreo...</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

function PuntoCargando({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.delay(750 - delay),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#E9D5FF', marginHorizontal: 4,
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
      }}
    />
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  logoBg: {
    width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#A78BFA', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 12,
  },
  logoEmoji: { fontSize: 46 },

  textoWrap: { alignItems: 'center', marginTop: 24 },
  marca: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtitulo: { fontSize: 14, color: '#D4BFFF', fontWeight: '500', marginTop: 6 },

  cargandoWrap: { position: 'absolute', bottom: 80, alignItems: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cargandoText: { fontSize: 12, color: '#C4B5FD', fontWeight: '600', letterSpacing: 0.5 },
});
