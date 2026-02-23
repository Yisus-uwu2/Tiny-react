/**
 * TarjetaVital — Tarjeta animada para mostrar un signo vital individual.
 * Incluye pulso, fade on-change y spring al presionar.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colores } from '../constantes/colores';

interface PropsTarjetaVital {
  titulo: string;
  valor: string | number;
  unidad: string;
  icono: string;
  degradado: string[];
  fondoClaro: string;
  subtitulo?: string;
  alPresionar?: () => void;
  pulso?: boolean;
}

export const TarjetaVital: React.FC<PropsTarjetaVital> = ({
  titulo,
  valor,
  unidad,
  icono,
  degradado,
  fondoClaro,
  subtitulo,
  alPresionar,
  pulso = false,
}) => {
  const animEscala = useRef(new Animated.Value(1)).current;
  const animFade   = useRef(new Animated.Value(1)).current;
  const animPress  = useRef(new Animated.Value(1)).current;

  // Animación de latido
  useEffect(() => {
    if (pulso) {
      const animacion = Animated.loop(
        Animated.sequence([
          Animated.timing(animEscala, { toValue: 1.18, duration: 360, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(animEscala, { toValue: 1,    duration: 480, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
          Animated.delay(400),
        ])
      );
      animacion.start();
      return () => animacion.stop();
    }
  }, [pulso]);

  // Fade suave al cambiar valor
  useEffect(() => {
    Animated.sequence([
      Animated.timing(animFade, { toValue: 0.4, duration: 100, useNativeDriver: true }),
      Animated.timing(animFade, { toValue: 1,   duration: 200, useNativeDriver: true }),
    ]).start();
  }, [valor]);

  const alPresionarEntrada  = () => Animated.spring(animPress, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  const alPresionarSalida = () => Animated.spring(animPress, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

  return (
    <TouchableOpacity
      onPress={alPresionar}
      onPressIn={alPresionarEntrada}
      onPressOut={alPresionarSalida}
      activeOpacity={1}
    >
      <Animated.View style={[estilos.tarjeta, { backgroundColor: fondoClaro, transform: [{ scale: animPress }] }]}>
        <View style={estilos.encabezado}>
          <LinearGradient colors={degradado as [string, string]} style={estilos.circuloIcono} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Animated.Text style={[estilos.icono, pulso && { transform: [{ scale: animEscala }] }]}>
              {icono}
            </Animated.Text>
          </LinearGradient>
          <Text style={estilos.titulo}>{titulo}</Text>
        </View>
        <Animated.View style={{ opacity: animFade }}>
          <View style={estilos.filaValor}>
            <Text style={[estilos.valor, { color: degradado[0] }]}>{valor}</Text>
            <Text style={[estilos.unidad, { color: degradado[0] }]}>{unidad}</Text>
          </View>
        </Animated.View>
        {subtitulo && <Text style={estilos.subtitulo}>{subtitulo}</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
};

const estilos = StyleSheet.create({
  tarjeta: {
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  circuloIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icono: { fontSize: 18 },
  titulo: {
    fontSize: 13,
    fontWeight: '600',
    color: Colores.textoMedio,
    flex: 1,
  },
  filaValor: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  valor: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 38,
  },
  unidad: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  subtitulo: {
    fontSize: 11,
    color: Colores.textoClaro,
    marginTop: 6,
    fontWeight: '500',
  },
});
