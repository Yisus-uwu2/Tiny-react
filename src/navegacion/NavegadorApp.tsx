/**
 * NavegadorApp — Navegación principal de TinyCare.
 * Stack: Registro → Carga → Tabs principales.
 * Tab bar estilo Instagram: solo íconos, relleno al seleccionar.
 */
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Pantallas
import PantallaRegistro      from '../pantallas/PantallaRegistro';
import PantallaCarga          from '../pantallas/PantallaCarga';
import PantallaInicio         from '../pantallas/PantallaInicio';
import PantallaSignosVitales  from '../pantallas/PantallaSignosVitales';
import PantallaTemperatura    from '../pantallas/PantallaTemperatura';
import PantallaEstadisticas   from '../pantallas/PantallaEstadisticas';
import PantallaPerfil         from '../pantallas/PantallaPerfil';
import PantallaMercado        from '../pantallas/PantallaMercado';
import PantallaConfiguracion  from '../pantallas/PantallaConfiguracion';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// Mapa de íconos y colores por pestaña
const ICONOS_TAB: Record<string, {
  outline: keyof typeof Ionicons.glyphMap;
  filled: keyof typeof Ionicons.glyphMap;
  color: string;
}> = {
  Inicio:        { outline: 'home-outline',        filled: 'home',        color: '#8B5CF6' },  // morado
  Vitales:       { outline: 'heart-outline',        filled: 'heart',       color: '#EF4444' },  // rojo
  Estadísticas:  { outline: 'stats-chart-outline',  filled: 'stats-chart', color: '#3B82F6' },  // azul
  Mercado:       { outline: 'bag-outline',          filled: 'bag',         color: '#22C55E' },  // verde
  Perfil:        { outline: 'person-outline',       filled: 'person',      color: '#F59E0B' },  // amarillo
};

const COLOR_INACTIVO = '#B0B0C0';

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
          return (
            <Ionicons
              name={focused ? cfg.filled : cfg.outline}
              size={focused ? 27 : 25}
              color={focused ? cfg.color : COLOR_INACTIVO}
            />
          );
        },
        tabBarInactiveTintColor: COLOR_INACTIVO,
        tabBarStyle: estilosTab.barra,
      })}
    >
      <Tab.Screen name="Perfil"        component={PantallaPerfil} />
      <Tab.Screen name="Mercado"       component={PantallaMercado} />
      <Tab.Screen name="Inicio"        component={PantallaInicio} />
      <Tab.Screen name="Vitales"       component={PantallaSignosVitales} />
      <Tab.Screen name="Estadísticas"  component={PantallaEstadisticas} />
    </Tab.Navigator>
  );
}

const estilosTab = StyleSheet.create({
  barra: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E8F0',
    height: Platform.OS === 'ios' ? 92 : 68,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    paddingTop: 12,
    elevation: 0,
    shadowOpacity: 0,
  },
});

// ── Navegador raíz ──────────────────────────────────────────────

export default function NavegadorApp() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="Registro"   component={PantallaRegistro} />
          <Stack.Screen name="Carga"      component={PantallaCarga} />
          <Stack.Screen name="Principal"  component={TabsPrincipales} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
