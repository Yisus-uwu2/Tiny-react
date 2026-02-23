/**
 * PantallaCarga — Splash minimalista con logo TinyCare SVG animado.
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { Colores } from '../constantes/colores';
import { babyService } from '../../services/babies';

const { width: W, height: H } = Dimensions.get('window');

const AnimPath = Animated.createAnimatedComponent(Path);

// ── Colores del logo ──
const LOGO = {
  corazon: '#F4A9A8',
  ecg: '#6DD5C0',
};

// ── Logo SVG animado (corazón + ECG) ──
function LogoAnimado() {
  const drawHeart = useRef(new Animated.Value(0)).current;
  const drawEcg = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(drawHeart, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(drawEcg, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]).start();

    // Pulso suave después de que el logo termine de dibujarse
    const t = setTimeout(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(pulso, { toValue: 1.04, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(1200),
      ])).start();
    }, 1900);
    return () => clearTimeout(t);
  }, []);

  // Heart path — más redondeado y amigable
  const heartD = 'M 80 130 C 80 130 20 88 20 50 C 20 30 34 16 54 16 C 66 16 74 24 80 34 C 86 24 94 16 106 16 C 126 16 140 30 140 50 C 140 88 80 130 80 130 Z';
  // ECG — curvas suaves tipo onda cardíaca
  const ecgD = 'M 10 42 Q 28 42 36 42 Q 40 42 44 22 Q 48 2 52 42 Q 54 56 56 42 Q 58 34 62 42 Q 66 42 150 42';

  return (
    <Animated.View style={{ transform: [{ scale: pulso }] }}>
      <Svg width={170} height={155} viewBox="0 0 160 150">
        <Defs>
          <SvgGrad id="heartGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFB7B7" />
            <Stop offset="100%" stopColor="#F08A8A" />
          </SvgGrad>
          <SvgGrad id="ecgGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#7EDFCB" />
            <Stop offset="100%" stopColor="#4DC9A8" />
          </SvgGrad>
        </Defs>
        {/* Relleno sutil del corazón */}
        <AnimPath
          d={heartD} fill="rgba(255,180,180,0.08)" stroke="none"
          opacity={drawHeart.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] })}
        />
        {/* Corazón — trazo con gradiente */}
        <AnimPath
          d={heartD} fill="none" stroke="url(#heartGrad)" strokeWidth={3}
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={400}
          strokeDashoffset={drawHeart.interpolate({ inputRange: [0, 1], outputRange: [400, 0] })}
        />
        {/* Línea ECG — curva suave */}
        <AnimPath
          d={ecgD} fill="none" stroke="url(#ecgGrad)" strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={200}
          strokeDashoffset={drawEcg.interpolate({ inputRange: [0, 1], outputRange: [200, 0] })}
        />
      </Svg>
    </Animated.View>
  );
}

// ── Pantalla principal ──
export default function PantallaCarga({ navigation }: any) {
  const escalaLogo = useRef(new Animated.Value(0)).current;
  const opTexto = useRef(new Animated.Value(0)).current;
  const opFade = useRef(new Animated.Value(1)).current;
  const yLogo = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(escalaLogo, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(yLogo, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
        Animated.timing(opTexto, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    const checkBabyAndNavigate = async () => {
      try {
        const babies = await babyService.getBabies();
        if (babies && babies.length > 0) {
          navigation.replace('Principal');
        } else {
          navigation.replace('Registro');
        }
      } catch (error) {
        console.error('Error fetching babies:', error);
        navigation.replace('Registro');
      }
    };

    const timer = setTimeout(() => {
      Animated.timing(opFade, { toValue: 0, duration: 450, useNativeDriver: true }).start(() => {
        checkBabyAndNavigate();
      });
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[st.container, { opacity: opFade }]}>
      <LinearGradient colors={['#1E1245', '#2D1B69', '#4C1D95']} locations={[0, 0.45, 1]} style={st.bg}>
        {/* Logo animado */}
        <Animated.View style={[st.logoWrap, { opacity: escalaLogo, transform: [{ scale: escalaLogo }, { translateY: yLogo }] }]}>
          <LogoAnimado />
        </Animated.View>

        {/* Texto */}
        <Animated.View style={[st.textoWrap, { opacity: opTexto }]}>
          <Text style={st.marca}>
            <Text style={st.marcaTiny}>Tiny</Text>
            <Text style={st.marcaCare}>Care</Text>
          </Text>
          <Text style={st.subtitulo}>Acompañando a tu bebé, en cada latido</Text>
        </Animated.View>

        {/* Indicador inferior */}
        <Animated.View style={[st.cargandoWrap, { opacity: opTexto }]}>
          <View style={st.dots}>
            {[0, 1, 2].map(i => <PuntoCargando key={i} delay={i * 250} />)}
          </View>
          <Text style={st.cargandoText}>Preparando monitoreo...</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

function PuntoCargando({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.delay(750 - delay),
    ])).start();
  }, []);
  return (
    <Animated.View style={{
      width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#D4BFFF', marginHorizontal: 4,
      opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
    }} />
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  logoWrap: { alignItems: 'center', marginBottom: 8 },

  textoWrap: { alignItems: 'center', marginTop: 12 },
  marca: { fontSize: 44, fontWeight: '900', letterSpacing: -0.5 },
  marcaTiny: { color: '#FFFFFF' },
  marcaCare: { color: '#F4A9A8' },
  subtitulo: { fontSize: 13, color: '#C4B5FD', fontWeight: '500', marginTop: 8, fontStyle: 'italic' },

  cargandoWrap: { position: 'absolute', bottom: 80, alignItems: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cargandoText: { fontSize: 12, color: '#B4A5E0', fontWeight: '600', letterSpacing: 0.4 },
});
