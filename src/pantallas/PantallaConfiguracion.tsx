/**
 * PantallaConfiguracion — Ajustes y preferencias de TinyCare.
 * Tarjetas de configuración con animaciones escalonadas.
 */
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Alert, BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colores } from '../constantes/colores';

interface ItemConfiguracion {
  icono: string;
  titulo: string;
  subtitulo: string;
  color: string;
  accion?: () => void;
}

export default function PantallaConfiguracion() {
  const anims = useRef(Array.from({ length: 9 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(70, anims.map(a =>
      Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 })
    )).start();
  }, []);

  const entrada = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
  });

  const items: ItemConfiguracion[] = [
    { icono: '👶', titulo: 'Información del bebé',   subtitulo: 'Nombre, fecha de nacimiento, peso, etc.',     color: Colores.primario },
    { icono: '📡', titulo: 'Sensores conectados',    subtitulo: 'Ver y administrar sensores activos.',         color: '#A855F7' },
    { icono: '🔔', titulo: 'Configurar alertas',     subtitulo: 'Personaliza notificaciones y umbrales.',      color: '#FB923C' },
    { icono: '🎨', titulo: 'Personalización',        subtitulo: 'Colores, temas y preferencias visuales.',     color: '#14B8A6' },
    { icono: '🔒', titulo: 'Seguridad',              subtitulo: 'Contraseñas y acceso seguro.',                color: '#F87171' },
    { icono: '🎧', titulo: 'Soporte',                subtitulo: 'Ayuda y contacto con el equipo.',             color: '#6366F1' },
    { icono: '🗂️', titulo: 'Datos',                   subtitulo: 'Gestiona y limpia registros.',               color: '#6B7280' },
    {
      icono: '🚪', titulo: 'Salir', subtitulo: 'Cerrar app por completo.', color: '#DC2626',
      accion: () => Alert.alert(
        'Cerrar aplicación',
        '¿Estás seguro de que quieres cerrar TinyCare?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]
      ),
    },
  ];

  return (
    <ScrollView style={s.contenedor} showsVerticalScrollIndicator={false}>
      <Animated.View style={entrada(anims[0])}>
        <LinearGradient colors={['#6B7280', '#374151']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.encabezado}>
          <Text style={s.tituloEncabezado}>Configuración</Text>
          <Text style={s.subtituloEncabezado}>Ajustes y preferencias de TinyCare</Text>
        </LinearGradient>
      </Animated.View>

      <View style={s.listaContenedor}>
        {items.map((item, i) => (
          <Animated.View key={i} style={entrada(anims[Math.min(i + 1, anims.length - 1)])}>
            <TarjetaConfiguracion item={item} />
          </Animated.View>
        ))}
      </View>

      <View style={s.piePagina}>
        <Text style={s.pieEmoji}>🌟</Text>
        <Text style={s.pieTitulo}>TinyCare</Text>
        <Text style={s.pieVersion}>v1.0.0 · React Native</Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function TarjetaConfiguracion({ item }: { item: ItemConfiguracion }) {
  const animPresion = useRef(new Animated.Value(1)).current;
  const alPresionar  = () => Animated.spring(animPresion, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const alSoltar     = () => Animated.spring(animPresion, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: animPresion }] }}>
      <TouchableOpacity style={s.tarjeta} onPressIn={alPresionar} onPressOut={alSoltar} onPress={item.accion || (() => {})} activeOpacity={0.9}>
        <View style={[s.iconoTarjeta, { backgroundColor: item.color + '18' }]}>
          <Text style={s.emojiTarjeta}>{item.icono}</Text>
        </View>
        <View style={s.contenidoTarjeta}>
          <Text style={s.tituloTarjeta}>{item.titulo}</Text>
          <Text style={s.subtituloTarjeta}>{item.subtitulo}</Text>
        </View>
        <Text style={s.flechaTarjeta}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondo },

  encabezado: { paddingTop: 55, paddingBottom: 24, paddingHorizontal: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  tituloEncabezado: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtituloEncabezado: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },

  listaContenedor: { padding: 18, gap: 10 },

  tarjeta: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  iconoTarjeta: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  emojiTarjeta: { fontSize: 24 },
  contenidoTarjeta: { flex: 1, gap: 3 },
  tituloTarjeta: { fontSize: 16, fontWeight: '700', color: Colores.textoOscuro },
  subtituloTarjeta: { fontSize: 12, color: Colores.textoClaro, fontWeight: '500' },
  flechaTarjeta: { fontSize: 22, color: Colores.textoClaro, fontWeight: '300' },

  piePagina: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  pieEmoji: { fontSize: 24 },
  pieTitulo: { fontSize: 16, fontWeight: '800', color: Colores.textoOscuro },
  pieVersion: { fontSize: 11, color: Colores.textoClaro, fontStyle: 'italic' },
});
