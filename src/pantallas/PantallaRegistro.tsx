/**
 * PantallaRegistro — Formulario de registro del neonato.
 * Tarjetas glass, campos animados, validación y navegación a carga.
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Platform, Animated, Easing,
  KeyboardAvoidingView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

// Paleta específica de registro (lavanda pastel)
const R = {
  bgTop: '#EDE9FE',
  bgBottom: '#FAFAFE',
  cardBg: 'rgba(255,255,255,0.82)',
  inputFill: '#F5F3FF',
  borderDefault: '#DDD6FE',
  borderFocus: '#A78BFA',
  labelColor: '#6D5EB0',
  titleColor: '#4C3D8F',
  headerTitle: '#2D2463',
  subtitle: '#9B8EC4',
  gradStart: '#C4B5FD',
  gradEnd: '#8B5CF6',
  badgeColor: '#9B8EC4',
};

interface DatosFormulario {
  nombre: string;
  fechaNac: Date | null;
  horaNac: Date | null;
  sexo: string;
  peso: string;
  talla: string;
  historiaClinica: string;
  nombrePadres: string;
  contactoEmergencia: string;
  edadGestacional: string;
  apgar1: string;
  apgar5: string;
  grupoSanguineo: string;
  tipoParto: string;
  complicaciones: string;
  alergias: string;
  antecedentes: string;
}

const formularioInicial: DatosFormulario = {
  nombre: '', fechaNac: null, horaNac: null, sexo: '', peso: '', talla: '',
  historiaClinica: '', nombrePadres: '', contactoEmergencia: '',
  edadGestacional: '', apgar1: '', apgar5: '', grupoSanguineo: '',
  tipoParto: '', complicaciones: '', alergias: '', antecedentes: '',
};

export default function PantallaRegistro({ navigation }: any) {
  const [formulario, setFormulario] = useState<DatosFormulario>(formularioInicial);
  const [errores, setErrores]       = useState<Record<string, boolean>>({});
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [mostrarHora, setMostrarHora]   = useState(false);
  const [mostrarSexo, setMostrarSexo]   = useState(false);
  const [mostrarParto, setMostrarParto] = useState(false);

  // Animaciones de entrada
  const animEncabezado = useRef(new Animated.Value(0)).current;
  const animTarjeta1   = useRef(new Animated.Value(0)).current;
  const animTarjeta2   = useRef(new Animated.Value(0)).current;
  const animBoton      = useRef(new Animated.Value(0)).current;
  const animFlotante   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(160, [
      Animated.spring(animEncabezado, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }),
      Animated.spring(animTarjeta1,   { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }),
      Animated.spring(animTarjeta2,   { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }),
      Animated.spring(animBoton,      { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(animFlotante, { toValue: -8, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(animFlotante, { toValue: 0,  duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const entrada = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
  });

  const actualizar = (campo: keyof DatosFormulario) => (valor: string) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores(prev => ({ ...prev, [campo]: false }));
  };

  const validar = (): boolean => {
    const requeridos: (keyof DatosFormulario)[] = [
      'nombre', 'fechaNac', 'horaNac', 'peso', 'talla',
      'historiaClinica', 'nombrePadres', 'contactoEmergencia',
      'edadGestacional', 'apgar1', 'apgar5', 'grupoSanguineo',
      'complicaciones', 'alergias', 'antecedentes',
    ];
    const nuevosErrores: Record<string, boolean> = {};
    let valido = true;
    for (const campo of requeridos) {
      const val = formulario[campo];
      if (!val || (typeof val === 'string' && val.trim() === '')) {
        nuevosErrores[campo] = true;
        valido = false;
      }
    }
    setErrores(nuevosErrores);
    return valido;
  };

  const guardar = () => {
    if (validar()) {
      navigation.replace('Carga');
    } else {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos obligatorios.');
    }
  };

  const omitir = () => navigation.replace('Carga');

  const formatoFecha = (d: Date | null) =>
    d ? `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}` : '';

  const formatoHora = (d: Date | null) =>
    d ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` : '';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[R.bgTop, R.bgBottom]} style={s.fondo}>
        <ScrollView contentContainerStyle={s.contenido} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ENCABEZADO */}
          <Animated.View style={[s.envolturioEncabezado, entrada(animEncabezado)]}>
            <Animated.View style={[s.circuloIcono, { transform: [{ translateY: animFlotante }] }]}>
              <LinearGradient colors={[R.gradStart, R.gradEnd]} style={s.degradadoIcono}>
                <Text style={s.emojiIcono}>👶</Text>
              </LinearGradient>
            </Animated.View>
            <Text style={s.tituloEncabezado}>Registro del Neonato</Text>
            <Text style={s.subtituloEncabezado}>Completa la información de tu bebé</Text>
          </Animated.View>

          {/* TARJETA 1: Identificación */}
          <Animated.View style={[s.tarjetaGlass, entrada(animTarjeta1)]}>
            <View style={s.encabezadoTarjeta}>
              <View style={s.iconoTarjeta}><Text style={s.emojiTarjeta}>🍼</Text></View>
              <Text style={s.tituloTarjeta}>Identificación del neonato</Text>
            </View>

            <CampoFormulario etiqueta="Nombre completo" icono="👤" valor={formulario.nombre} alCambiar={actualizar('nombre')} error={errores.nombre} />

            <View style={s.fila}>
              <View style={s.mitad}>
                <TouchableOpacity onPress={() => setMostrarFecha(true)} activeOpacity={0.7}>
                  <CampoFormulario etiqueta="Fecha de nacimiento" icono="📅" valor={formatoFecha(formulario.fechaNac)} editable={false} error={errores.fechaNac} placeholder="DD/MM/AAAA" />
                </TouchableOpacity>
              </View>
              <View style={s.mitad}>
                <TouchableOpacity onPress={() => setMostrarHora(true)} activeOpacity={0.7}>
                  <CampoFormulario etiqueta="Hora de nacimiento" icono="🕐" valor={formatoHora(formulario.horaNac)} editable={false} error={errores.horaNac} placeholder="HH:MM" />
                </TouchableOpacity>
              </View>
            </View>

            {mostrarFecha && (
              <DateTimePicker
                value={formulario.fechaNac || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                minimumDate={new Date(2015, 0, 1)}
                onChange={(_, fecha) => {
                  setMostrarFecha(false);
                  if (fecha) {
                    setFormulario(prev => ({ ...prev, fechaNac: fecha }));
                    if (errores.fechaNac) setErrores(prev => ({ ...prev, fechaNac: false }));
                  }
                }}
              />
            )}
            {mostrarHora && (
              <DateTimePicker
                value={formulario.horaNac || new Date()}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, hora) => {
                  setMostrarHora(false);
                  if (hora) {
                    setFormulario(prev => ({ ...prev, horaNac: hora }));
                    if (errores.horaNac) setErrores(prev => ({ ...prev, horaNac: false }));
                  }
                }}
              />
            )}

            <CampoDesplegable
              etiqueta="Sexo" icono="⚤" valor={formulario.sexo}
              opciones={['Masculino', 'Femenino', 'Otro']}
              abierto={mostrarSexo} alAlternar={() => setMostrarSexo(!mostrarSexo)}
              alSeleccionar={(v) => { setFormulario(p => ({ ...p, sexo: v })); setMostrarSexo(false); }}
            />

            <View style={s.fila}>
              <View style={s.mitad}>
                <CampoFormulario etiqueta="Peso al nacer (kg)" icono="⚖️" valor={formulario.peso} alCambiar={actualizar('peso')} keyboardType="decimal-pad" error={errores.peso} />
              </View>
              <View style={s.mitad}>
                <CampoFormulario etiqueta="Talla al nacer (cm)" icono="📏" valor={formulario.talla} alCambiar={actualizar('talla')} keyboardType="decimal-pad" error={errores.talla} />
              </View>
            </View>

            <CampoFormulario etiqueta="Historia clínica / ID interno" icono="🏷️" valor={formulario.historiaClinica} alCambiar={actualizar('historiaClinica')} error={errores.historiaClinica} />
            <CampoFormulario etiqueta="Nombre de los padres o tutores" icono="👨‍👩‍👧" valor={formulario.nombrePadres} alCambiar={actualizar('nombrePadres')} error={errores.nombrePadres} />
            <CampoFormulario etiqueta="Contacto de emergencia" icono="📞" valor={formulario.contactoEmergencia} alCambiar={actualizar('contactoEmergencia')} keyboardType="phone-pad" error={errores.contactoEmergencia} />
          </Animated.View>

          {/* TARJETA 2: Información clínica */}
          <Animated.View style={[s.tarjetaGlass, entrada(animTarjeta2)]}>
            <View style={s.encabezadoTarjeta}>
              <View style={s.iconoTarjeta}><Text style={s.emojiTarjeta}>🏥</Text></View>
              <Text style={s.tituloTarjeta}>Información clínica base</Text>
            </View>

            <CampoFormulario etiqueta="Edad gestacional (semanas)" icono="📆" valor={formulario.edadGestacional} alCambiar={actualizar('edadGestacional')} keyboardType="number-pad" error={errores.edadGestacional} />

            <View style={s.fila}>
              <View style={s.mitad}>
                <CampoFormulario etiqueta="Apgar 1 min" icono="⏱️" valor={formulario.apgar1} alCambiar={actualizar('apgar1')} keyboardType="number-pad" error={errores.apgar1} />
              </View>
              <View style={s.mitad}>
                <CampoFormulario etiqueta="Apgar 5 min" icono="⏱️" valor={formulario.apgar5} alCambiar={actualizar('apgar5')} keyboardType="number-pad" error={errores.apgar5} />
              </View>
            </View>

            <CampoFormulario etiqueta="Grupo sanguíneo" icono="🩸" valor={formulario.grupoSanguineo} alCambiar={actualizar('grupoSanguineo')} error={errores.grupoSanguineo} />

            <CampoDesplegable
              etiqueta="Tipo de parto" icono="🏥" valor={formulario.tipoParto}
              opciones={['Natural', 'Cesárea', 'Instrumentado']}
              abierto={mostrarParto} alAlternar={() => setMostrarParto(!mostrarParto)}
              alSeleccionar={(v) => { setFormulario(p => ({ ...p, tipoParto: v })); setMostrarParto(false); }}
            />

            <CampoFormulario etiqueta="Complicaciones al nacer" icono="⚠️" valor={formulario.complicaciones} alCambiar={actualizar('complicaciones')} error={errores.complicaciones} />
            <CampoFormulario etiqueta="Alergias conocidas" icono="🚨" valor={formulario.alergias} alCambiar={actualizar('alergias')} error={errores.alergias} />
            <CampoFormulario etiqueta="Antecedentes médicos relevantes" icono="📋" valor={formulario.antecedentes} alCambiar={actualizar('antecedentes')} error={errores.antecedentes} multiline />
          </Animated.View>

          {/* BOTONES */}
          <Animated.View style={entrada(animBoton)}>
            <TouchableOpacity onPress={guardar} activeOpacity={0.85}>
              <LinearGradient colors={[R.gradStart, R.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.botonGuardar}>
                <Text style={s.iconoGuardar}>✓</Text>
                <Text style={s.textoGuardar}>Guardar registro</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={s.botonOmitir} onPress={omitir} activeOpacity={0.7}>
              <Text style={s.textoOmitir}>Continuar después</Text>
              <Text style={s.flechaOmitir}>→</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Insignias de confianza */}
          <Animated.View style={[s.filaConfianza, entrada(animBoton)]}>
            <View style={s.insigniaConfianza}>
              <Text style={s.iconoConfianza}>🛡️</Text>
              <Text style={s.textoConfianza}>Datos seguros</Text>
            </View>
            <View style={s.insigniaConfianza}>
              <Text style={s.iconoConfianza}>🔒</Text>
              <Text style={s.textoConfianza}>Privacidad garantizada</Text>
            </View>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────

function CampoFormulario({
  etiqueta, icono, valor, alCambiar, keyboardType, error,
  editable = true, placeholder, multiline,
}: {
  etiqueta: string; icono: string; valor?: string; alCambiar?: (t: string) => void;
  keyboardType?: any; error?: boolean; editable?: boolean; placeholder?: string; multiline?: boolean;
}) {
  const [enfocado, setEnfocado] = useState(false);
  const animBorde = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animBorde, { toValue: enfocado ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [enfocado]);

  const colorBorde = error
    ? '#F87171'
    : animBorde.interpolate({ inputRange: [0, 1], outputRange: [R.borderDefault, R.borderFocus] });

  return (
    <View style={s.envoltorioCampo}>
      <Animated.View style={[s.contenedorCampo, { borderColor: colorBorde }, enfocado && s.campoEnfocado, error && s.campoError]}>
        <Text style={s.iconoCampo}>{icono}</Text>
        <View style={s.interiorCampo}>
          <Text style={[s.etiquetaCampo, enfocado && { color: R.borderFocus }]}>{etiqueta}</Text>
          <TextInput
            style={[s.campo, multiline && { minHeight: 60, textAlignVertical: 'top' }]}
            value={valor} onChangeText={alCambiar}
            onFocus={() => setEnfocado(true)} onBlur={() => setEnfocado(false)}
            keyboardType={keyboardType} editable={editable}
            placeholder={placeholder} placeholderTextColor={R.subtitle} multiline={multiline}
          />
        </View>
      </Animated.View>
      {error && <Text style={s.textoError}>Campo requerido</Text>}
    </View>
  );
}

function CampoDesplegable({
  etiqueta, icono, valor, opciones, abierto, alAlternar, alSeleccionar,
}: {
  etiqueta: string; icono: string; valor: string; opciones: string[];
  abierto: boolean; alAlternar: () => void; alSeleccionar: (v: string) => void;
}) {
  return (
    <View style={s.envoltorioCampo}>
      <TouchableOpacity onPress={alAlternar} activeOpacity={0.7}>
        <View style={[s.contenedorCampo, s.contenedorDesplegable]}>
          <Text style={s.iconoCampo}>{icono}</Text>
          <View style={s.interiorCampo}>
            <Text style={s.etiquetaCampo}>{etiqueta}</Text>
            <Text style={[s.campo, !valor && { color: R.subtitle }]}>{valor || 'Seleccionar...'}</Text>
          </View>
          <Text style={s.flechaDesplegable}>{abierto ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>
      {abierto && (
        <View style={s.listaDesplegable}>
          {opciones.map(op => (
            <TouchableOpacity
              key={op}
              style={[s.itemDesplegable, valor === op && s.itemSeleccionado]}
              onPress={() => alSeleccionar(op)}
            >
              <Text style={[s.textoItem, valor === op && s.textoItemSeleccionado]}>{op}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────────

const s = StyleSheet.create({
  fondo: { flex: 1 },
  contenido: { paddingHorizontal: 22, paddingVertical: 24 },

  envolturioEncabezado: { alignItems: 'center', marginBottom: 28 },
  circuloIcono: { marginBottom: 16 },
  degradadoIcono: {
    width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
    shadowColor: R.gradEnd, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  emojiIcono: { fontSize: 40 },
  tituloEncabezado: { fontSize: 26, fontWeight: '800', color: R.headerTitle, letterSpacing: 0.5 },
  subtituloEncabezado: { fontSize: 14, color: R.subtitle, fontWeight: '500', marginTop: 6 },

  tarjetaGlass: {
    backgroundColor: R.cardBg, borderRadius: 24, padding: 20, marginBottom: 20,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: R.gradStart, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4,
  },
  encabezadoTarjeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  iconoTarjeta: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  emojiTarjeta: { fontSize: 18 },
  tituloTarjeta: { fontSize: 17, fontWeight: '700', color: R.titleColor, letterSpacing: 0.2 },

  fila: { flexDirection: 'row', gap: 12 },
  mitad: { flex: 1 },

  envoltorioCampo: { marginBottom: 14 },
  contenedorCampo: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: R.inputFill, borderRadius: 16,
    borderWidth: 1, borderColor: R.borderDefault, paddingHorizontal: 14, paddingVertical: 10,
  },
  campoEnfocado: { borderColor: R.borderFocus, borderWidth: 1.5, backgroundColor: '#FAFAFE' },
  campoError: { borderColor: '#F87171', borderWidth: 1.5 },
  iconoCampo: { fontSize: 18, marginRight: 10, width: 24, textAlign: 'center' },
  interiorCampo: { flex: 1 },
  etiquetaCampo: { fontSize: 11, fontWeight: '600', color: R.labelColor, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  campo: { fontSize: 15, color: R.headerTitle, fontWeight: '500', padding: 0, margin: 0 },
  textoError: { fontSize: 11, color: '#F87171', fontWeight: '600', marginTop: 4, marginLeft: 14 },

  contenedorDesplegable: {},
  flechaDesplegable: { fontSize: 10, color: R.borderFocus, marginLeft: 8 },
  listaDesplegable: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 6,
    borderWidth: 1, borderColor: R.borderDefault, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  itemDesplegable: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F0FA' },
  itemSeleccionado: { backgroundColor: '#F5F3FF' },
  textoItem: { fontSize: 15, color: R.headerTitle, fontWeight: '500' },
  textoItemSeleccionado: { color: R.gradEnd, fontWeight: '700' },

  botonGuardar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 24,
    shadowColor: R.gradEnd, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  iconoGuardar: { fontSize: 20, color: '#FFFFFF', marginRight: 10, fontWeight: '800' },
  textoGuardar: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },

  botonOmitir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 12 },
  textoOmitir: { fontSize: 15, color: R.labelColor, fontWeight: '600', letterSpacing: 0.3 },
  flechaOmitir: { fontSize: 18, color: R.labelColor, marginLeft: 6 },

  filaConfianza: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 20 },
  insigniaConfianza: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  iconoConfianza: { fontSize: 14 },
  textoConfianza: { fontSize: 12, color: R.badgeColor, fontWeight: '500' },
});
