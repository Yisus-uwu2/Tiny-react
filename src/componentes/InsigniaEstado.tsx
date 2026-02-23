/**
 * InsigniaEstado — Indicador visual del estado del bebé.
 * Incluye animación de pulso y parpadeo para estado de alerta.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface PropsInsigniaEstado {
  estado: 'normal' | 'precaución' | 'alerta';
  mostrarEtiqueta?: boolean;
  tamaño?: 'pequeño' | 'grande';
}

const configuracion = {
  normal:       { color: '#4ADE80', fondo: '#D9F7EE', borde: '#86EFAC', etiqueta: 'Todo bien' },
  'precaución': { color: '#F59E0B', fondo: '#FEF3C7', borde: '#FCD34D', etiqueta: 'Precaución' },
  alerta:       { color: '#F87171', fondo: '#FEE2E2', borde: '#FCA5A5', etiqueta: 'Alerta' },
};

export const InsigniaEstado: React.FC<PropsInsigniaEstado> = ({
  estado,
  mostrarEtiqueta = true,
  tamaño = 'pequeño',
}) => {
  const cfg = configuracion[estado] ?? configuracion.normal;
  const animEscala = useRef(new Animated.Value(1)).current;
  const animOpacidad = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (estado === 'alerta') {
      const pulso = Animated.loop(
        Animated.sequence([
          Animated.timing(animEscala, { toValue: 1.08, duration: 480, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animEscala, { toValue: 1,    duration: 480, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      const parpadeo = Animated.loop(
        Animated.sequence([
          Animated.timing(animOpacidad, { toValue: 0.5, duration: 500, useNativeDriver: true }),
          Animated.timing(animOpacidad, { toValue: 1,   duration: 500, useNativeDriver: true }),
        ])
      );
      pulso.start();
      parpadeo.start();
      return () => { pulso.stop(); parpadeo.stop(); };
    } else {
      animEscala.setValue(1);
      animOpacidad.setValue(1);
    }
  }, [estado]);

  const esGrande = tamaño === 'grande';

  return (
    <Animated.View
      style={[
        estilos.insignia,
        { backgroundColor: cfg.fondo, borderColor: cfg.borde },
        esGrande && estilos.insigniaGrande,
        estado === 'alerta' && { opacity: animOpacidad, transform: [{ scale: animEscala }] },
      ]}
    >
      <View style={[estilos.punto, { backgroundColor: cfg.color }, esGrande && estilos.puntoGrande]} />
      {mostrarEtiqueta && (
        <Text style={[estilos.etiqueta, { color: cfg.color }, esGrande && estilos.etiquetaGrande]}>
          {cfg.etiqueta}
        </Text>
      )}
    </Animated.View>
  );
};

const estilos = StyleSheet.create({
  insignia: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 5,
  },
  insigniaGrande: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  punto: { width: 7, height: 7, borderRadius: 4 },
  puntoGrande: { width: 11, height: 11, borderRadius: 6 },
  etiqueta: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  etiquetaGrande: { fontSize: 15, fontWeight: '800' },
});
