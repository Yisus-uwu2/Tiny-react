/**
 * PantallaCarga — Pantalla de carga con animación ECG y latido.
 * Navega automáticamente a la pantalla principal tras 2.5 segundos.
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Colores } from '../constantes/colores';

const { width } = Dimensions.get('window');

export default function PantallaCarga({ navigation }: any) {
  const aparicion       = useRef(new Animated.Value(0)).current;
  const escalaEntrada   = useRef(new Animated.Value(0.8)).current;
  const latido          = useRef(new Animated.Value(1)).current;
  const progresoECG     = useRef(new Animated.Value(0)).current;
  const opacidadTexto   = useRef(new Animated.Value(0)).current;
  const deslizarArriba  = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(aparicion, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(escalaEntrada, { toValue: 1, useNativeDriver: true, tension: 40, friction: 8 }),
    ]).start();

    const animLatido = Animated.loop(
      Animated.sequence([
        Animated.timing(latido, { toValue: 1.2, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(latido, { toValue: 1,   duration: 400, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
        Animated.delay(500),
      ])
    );
    animLatido.start();

    const animECG = Animated.loop(
      Animated.timing(progresoECG, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: false })
    );
    animECG.start();

    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(opacidadTexto, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(deslizarArriba, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start();

    const temporizador = setTimeout(() => navigation.replace('Principal'), 2500);

    return () => {
      clearTimeout(temporizador);
      animLatido.stop();
      animECG.stop();
    };
  }, []);

  return (
    <View style={s.contenedor}>
      <LinearGradient colors={['#F5F3FF', '#EDE9FE']} style={s.degradado}>
        <Animated.View style={[s.tarjeta, { opacity: aparicion, transform: [{ scale: escalaEntrada }] }]}>
          {/* Logo */}
          <View style={s.filaLogo}>
            <Text style={s.logoTiny}>Tiny</Text>
            <Text style={s.logoCare}>Care</Text>
            <Animated.Text style={[s.iconoCorazon, { transform: [{ scale: latido }] }]}>❤️</Animated.Text>
          </View>

          {/* Línea ECG */}
          <View style={s.contenedorECG}>
            <AnimacionECG progreso={progresoECG} />
          </View>

          <ActivityIndicator size="large" color={Colores.primario} style={s.spinner} />

          <Animated.Text style={[s.textoCarga, { opacity: opacidadTexto, transform: [{ translateY: deslizarArriba }] }]}>
            Cargando tu experiencia neonatal...
          </Animated.Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

function AnimacionECG({ progreso }: { progreso: Animated.Value }) {
  const anchoECG = width * 0.65;
  const altoECG  = 60;

  const pathECG = `
    M 0 30 L ${anchoECG * 0.15} 30 L ${anchoECG * 0.2} 30
    L ${anchoECG * 0.25} 10 L ${anchoECG * 0.3} 50
    L ${anchoECG * 0.35} 5  L ${anchoECG * 0.4} 55
    L ${anchoECG * 0.45} 25 L ${anchoECG * 0.5} 30
    L ${anchoECG * 0.55} 30 L ${anchoECG * 0.6} 30
    L ${anchoECG * 0.65} 20 L ${anchoECG * 0.7} 40
    L ${anchoECG * 0.75} 15 L ${anchoECG * 0.8} 45
    L ${anchoECG * 0.85} 28 L ${anchoECG * 0.9} 30
    L ${anchoECG} 30
  `;

  const puntoX = progreso.interpolate({ inputRange: [0, 1], outputRange: [0, anchoECG] });

  return (
    <View style={{ width: anchoECG, height: altoECG }}>
      <Svg width={anchoECG} height={altoECG}>
        <Path d={pathECG} fill="none" stroke={Colores.seguro} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      </Svg>
      <Animated.View
        style={{
          position: 'absolute', left: puntoX, top: 25, width: 10, height: 10, borderRadius: 5,
          backgroundColor: Colores.seguro, marginLeft: -5,
          shadowColor: Colores.seguro, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4,
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { flex: 1 },
  degradado: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tarjeta: {
    backgroundColor: '#FFFFFF', borderRadius: 32, paddingHorizontal: 32, paddingVertical: 40, alignItems: 'center', minWidth: 280,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
  },
  filaLogo: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  logoTiny: { fontSize: 32, fontWeight: '800', color: Colores.primarioClaro, letterSpacing: 1.5 },
  logoCare: { fontSize: 36, fontWeight: '900', color: Colores.textoOscuro, letterSpacing: 1.5 },
  iconoCorazon: { fontSize: 32, marginLeft: 10 },
  contenedorECG: { marginBottom: 28, alignItems: 'center' },
  spinner: { marginBottom: 20 },
  textoCarga: { fontSize: 14, color: Colores.textoMedio, fontWeight: '500', letterSpacing: 0.5, textAlign: 'center' },
});
