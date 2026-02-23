/**
 * NavegadorApp — Navegación principal de TinyCare.
 * Stack: Registro → Carga → Tabs principales.
 * Tab bar estilo Instagram: solo íconos, relleno al seleccionar.
 */
import React, { useRef, useEffect } from 'react';
import { StyleSheet, Platform, View, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colores } from '../constantes/colores';

// Pantallas
import PantallaRegistro from '../pantallas/PantallaRegistro';
import PantallaCarga from '../pantallas/PantallaCarga';
import PantallaInicio from '../pantallas/PantallaInicio';
import PantallaSignosVitales from '../pantallas/PantallaSignosVitales';
import PantallaTemperatura from '../pantallas/PantallaTemperatura';
import PantallaEstadisticas from '../pantallas/PantallaEstadisticas';
import PantallaPerfil from '../pantallas/PantallaPerfil';
import PantallaMercado from '../pantallas/PantallaMercado';
import PantallaConfiguracion from '../pantallas/PantallaConfiguracion';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Mapa de íconos y colores por pestaña
const ICONOS_TAB: Record<string, {
  outline: keyof typeof Ionicons.glyphMap;
  filled: keyof typeof Ionicons.glyphMap;
  color: string;
}> = {
  Inicio: { outline: 'home-outline', filled: 'home', color: '#8B5CF6' },  // morado
  Vitales: { outline: 'heart-outline', filled: 'heart', color: '#EF4444' },  // rojo
  Estadísticas: { outline: 'stats-chart-outline', filled: 'stats-chart', color: '#3B82F6' },  // azul
  Mercado: { outline: 'bag-outline', filled: 'bag', color: '#22C55E' },  // verde
  Perfil: { outline: 'person-outline', filled: 'person', color: '#F59E0B' },  // amarillo
};

const COLOR_INACTIVO = '#B0B0C0';

/** Ícono animado con indicador de punto al enfocar */
function IconoTab({ focused, cfg }: { focused: boolean; cfg: typeof ICONOS_TAB[string] }) {
  const escala = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const opPunto = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(escala, { toValue: focused ? 1 : 0.9, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(opPunto, { toValue: focused ? 1 : 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [focused]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <Ionicons
          name={focused ? cfg.filled : cfg.outline}
          size={25}
          color={focused ? cfg.color : COLOR_INACTIVO}
        />
      </Animated.View>
      <Animated.View style={[estilosTab.indicadorPunto, { backgroundColor: cfg.color, opacity: opPunto }]} />
    </View>
  );
}

// ── Tabs principales ────────────────────────────────────────────

function TabsPrincipales() {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => {
          const cfg = ICONOS_TAB[route.name];
          return <IconoTab focused={focused} cfg={cfg} />;
        },
        tabBarInactiveTintColor: COLOR_INACTIVO,
        tabBarStyle: estilosTab.barra,
      })}
    >
      <Tab.Screen name="Perfil" component={PantallaPerfil} />
      <Tab.Screen name="Mercado" component={PantallaMercado} />
      <Tab.Screen name="Inicio" component={PantallaInicio} />
      <Tab.Screen name="Vitales" component={PantallaSignosVitales} />
      <Tab.Screen name="Estadísticas" component={PantallaEstadisticas} />
    </Tab.Navigator>
  );
}

const estilosTab = StyleSheet.create({
  barra: {
    backgroundColor: Colores.fondoTarjeta,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 92 : 68,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    paddingTop: 12,
    elevation: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  indicadorPunto: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});

// ── Navegador raíz ──────────────────────────────────────────────
import { supabase } from '../../lib/supabase';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { ActivityIndicator } from 'react-native';

import PantallaSignup from '../pantallas/PantallaSignup';
import PantallaLogin from '../pantallas/PantallaLogin';

export default function NavegadorApp() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [cargando, setCargando] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });

    supabase.auth.onAuthStateChange((_event: AuthChangeEvent, currentSession: Session | null) => {
      setSession(currentSession);
    });
  }, []);

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EDE9FE' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {session && session.user ? (
            // Si el usuario está autenticado, muestra la app normal y el registro del bebé si es necesario
            <>
              <Stack.Screen name="Principal" component={TabsPrincipales} />
              <Stack.Screen name="Registro" component={PantallaRegistro} />
              <Stack.Screen name="Carga" component={PantallaCarga} />
            </>
          ) : (
            // Flujo de Autenticación
            <>
              <Stack.Screen name="Signup" component={PantallaSignup} />
              <Stack.Screen name="Login" component={PantallaLogin} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
