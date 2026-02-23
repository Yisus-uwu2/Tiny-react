/**
 * PantallaRegistro — Formulario multi-paso del neonato.
 * Progress stepper, chips seleccionables, campos limpios y animaciones spring.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Platform, Animated, Easing,
  KeyboardAvoidingView, Alert, Dimensions, LayoutAnimation, UIManager, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colores } from '../constantes/colores';
import { babyService } from '../../services/babies';
import { healthService } from '../../services/health';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: ANCHO } = Dimensions.get('window');

const PASOS = [
  { titulo: 'Datos del bebé', icono: '👶', desc: 'Información básica' },
  { titulo: 'Nacimiento', icono: '🏥', desc: 'Detalles del parto' },
  { titulo: 'Clínico', icono: '💊', desc: 'Historial médico' },
];

interface DatosForm {
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

const FORM_INIT: DatosForm = {
  nombre: '', fechaNac: null, horaNac: null, sexo: '', peso: '', talla: '',
  historiaClinica: '', nombrePadres: '', contactoEmergencia: '',
  edadGestacional: '', apgar1: '', apgar5: '', grupoSanguineo: '',
  tipoParto: '', complicaciones: '', alergias: '', antecedentes: '',
};

export default function PantallaRegistro({ navigation }: any) {
  const [form, setForm] = useState<DatosForm>(FORM_INIT);
  const [errores, setErrores] = useState<Record<string, boolean>>({});
  const [paso, setPaso] = useState(0);
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [mostrarHora, setMostrarHora] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const animEntrada = useRef(new Animated.Value(0)).current;
  const animContenido = useRef(new Animated.Value(0)).current;
  const animFlotante = useRef(new Animated.Value(0)).current;
  const animProgreso = useRef(new Animated.Value(0)).current;
  const escalaBtn = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(animEntrada, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }),
      Animated.spring(animContenido, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(animFlotante, { toValue: -6, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(animFlotante, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    Animated.spring(animProgreso, { toValue: (paso + 1) / PASOS.length, useNativeDriver: false, tension: 60, friction: 12 }).start();
  }, [paso]);

  const animarCambio = useCallback(() => {
    animContenido.setValue(0);
    Animated.spring(animContenido, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
  }, []);

  const set = (campo: keyof DatosForm) => (v: string) => {
    setForm(p => ({ ...p, [campo]: v }));
    if (errores[campo]) setErrores(p => ({ ...p, [campo]: false }));
  };

  const REQUERIDOS: (keyof DatosForm)[][] = [
    ['nombre', 'peso', 'talla', 'nombrePadres', 'contactoEmergencia'],
    ['edadGestacional', 'apgar1', 'apgar5', 'grupoSanguineo'],
    ['historiaClinica', 'complicaciones', 'alergias', 'antecedentes'],
  ];

  const validar = () => {
    const errs: Record<string, boolean> = {};
    let ok = true;
    for (const c of REQUERIDOS[paso]) {
      const v = form[c];
      if (!v || (typeof v === 'string' && !v.trim())) { errs[c] = true; ok = false; }
    }
    setErrores(errs);
    return ok;
  };

  const siguiente = async () => {
    if (!validar()) { Alert.alert('Campos obligatorios', 'Completa los campos marcados.'); return; }
    if (paso < PASOS.length - 1) {
      LayoutAnimation.configureNext(LayoutAnimation.create(250, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
      setPaso(p => p + 1);
      animarCambio();
    } else {
      setIsSaving(true);
      console.log('Iniciando guardado de datos del bebé...');
      try {
        const parts = form.nombre.trim().split(' ');
        const primer_Nombre = parts[0] || '';
        const apellido_Paterno = parts.length > 1 ? parts.slice(1).join(' ') : '';
        const sexo = form.sexo === 'Masculino' ? 'Masculino' : 'Femenino';

        console.log('Intentando invocar createBaby con:', { primer_Nombre, apellido_Paterno, sexo, fechaNac: form.fechaNac });
        const resBaby = await babyService.createBaby({
          primer_Nombre,
          apellido_Paterno,
          fecha_Nacimiento: form.fechaNac ? form.fechaNac.toISOString().split('T')[0] : undefined,
          sexo
        });
        console.log('createBaby exitoso:', resBaby);

        const gSang = form.grupoSanguineo?.toUpperCase();
        let grupoFormat: "A" | "B" | "AB" | "O" = "O";
        if (gSang?.includes('AB')) grupoFormat = 'AB';
        else if (gSang?.includes('A')) grupoFormat = 'A';
        else if (gSang?.includes('B')) grupoFormat = 'B';

        const rhFormat: "+" | "-" = gSang?.includes('-') ? '-' : '+';

        console.log('Intentando invocar upsertSalud con:', { grupoFormat, rhFormat });
        const resSalud = await healthService.upsertSalud({
          peso: parseFloat(form.peso) || null,
          talla: parseFloat(form.talla) || null,
          grupo_sanguineo: grupoFormat,
          tipo_RH: rhFormat
        });
        console.log('upsertSalud exitoso:', resSalud);

        const algBool = !!(form.alergias && form.alergias.trim().toLowerCase() !== 'ninguna' && form.alergias.trim().toLowerCase() !== 'sin alergias conocidas');
        const compBool = !!(form.complicaciones && form.complicaciones.trim().toLowerCase() !== 'ninguna');

        console.log('Intentando invocar upsertSaludDetalles...');
        const resSaludDetalles = await healthService.upsertSaludDetalles({
          Alergias: algBool,
          detalles_Ale: form.alergias,
          complicaciones: compBool,
          detalles_Com: form.complicaciones
        });
        console.log('upsertSaludDetalles exitoso:', resSaludDetalles);

        setIsSaving(false);
        console.log('Navegando a Carga...');
        navigation.replace('Carga');
      } catch (error: any) {
        setIsSaving(false);
        console.error('Error CATCH al registrar al bebé:', error);
        console.error('Detalles del error:', JSON.stringify(error, null, 2));
        Alert.alert('Error', error.message || 'No se pudo guardar la información del bebé.');
      }
    }
  };

  const anterior = () => {
    if (paso > 0) {
      LayoutAnimation.configureNext(LayoutAnimation.create(250, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
      setPaso(p => p - 1);
      setErrores({});
      animarCambio();
    }
  };

  const fmtFecha = (d: Date | null) => d ? `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}` : '';
  const fmtHora = (d: Date | null) => d ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` : '';

  const entAnim = {
    opacity: animContenido,
    transform: [{ translateY: animContenido.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };

  const renderPaso = () => {
    switch (paso) {
      case 0: return (
        <Animated.View style={entAnim}>
          <Campo label="Nombre completo del bebé" valor={form.nombre} onChange={set('nombre')} error={errores.nombre} placeholder="Ej: Emma Valentina" />
          <View style={s.fila}>
            <View style={s.mitad}>
              <TouchableOpacity onPress={() => setMostrarFecha(true)} activeOpacity={0.7}>
                <Campo label="Fecha de nacimiento" valor={fmtFecha(form.fechaNac)} editable={false} error={errores.fechaNac} placeholder="DD/MM/AAAA" />
              </TouchableOpacity>
            </View>
            <View style={s.mitad}>
              <TouchableOpacity onPress={() => setMostrarHora(true)} activeOpacity={0.7}>
                <Campo label="Hora de nacimiento" valor={fmtHora(form.horaNac)} editable={false} error={errores.horaNac} placeholder="HH:MM" />
              </TouchableOpacity>
            </View>
          </View>
          {mostrarFecha && <DateTimePicker value={form.fechaNac || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} maximumDate={new Date()} minimumDate={new Date(2015, 0, 1)} onChange={(_, d) => { setMostrarFecha(false); if (d) { setForm(p => ({ ...p, fechaNac: d })); if (errores.fechaNac) setErrores(p => ({ ...p, fechaNac: false })); } }} />}
          {mostrarHora && <DateTimePicker value={form.horaNac || new Date()} mode="time" is24Hour display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, h) => { setMostrarHora(false); if (h) { setForm(p => ({ ...p, horaNac: h })); if (errores.horaNac) setErrores(p => ({ ...p, horaNac: false })); } }} />}
          <Text style={s.labelGrupo}>Sexo</Text>
          <Chips opciones={['Masculino', 'Femenino', 'Otro']} valor={form.sexo} onSelect={v => setForm(p => ({ ...p, sexo: v }))} />
          <View style={s.fila}>
            <View style={s.mitad}><Campo label="Peso (kg)" valor={form.peso} onChange={set('peso')} keyboardType="decimal-pad" error={errores.peso} placeholder="3.2" /></View>
            <View style={s.mitad}><Campo label="Talla (cm)" valor={form.talla} onChange={set('talla')} keyboardType="decimal-pad" error={errores.talla} placeholder="49" /></View>
          </View>
          <Campo label="Nombre de padres o tutores" valor={form.nombrePadres} onChange={set('nombrePadres')} error={errores.nombrePadres} placeholder="María López, Carlos López" />
          <Campo label="Contacto de emergencia" valor={form.contactoEmergencia} onChange={set('contactoEmergencia')} keyboardType="phone-pad" error={errores.contactoEmergencia} placeholder="+52 55 1234 5678" />
        </Animated.View>
      );
      case 1: return (
        <Animated.View style={entAnim}>
          <Campo label="Edad gestacional (semanas)" valor={form.edadGestacional} onChange={set('edadGestacional')} keyboardType="number-pad" error={errores.edadGestacional} placeholder="38" />
          <View style={s.fila}>
            <View style={s.mitad}><Campo label="Apgar 1 min" valor={form.apgar1} onChange={set('apgar1')} keyboardType="number-pad" error={errores.apgar1} placeholder="8" /></View>
            <View style={s.mitad}><Campo label="Apgar 5 min" valor={form.apgar5} onChange={set('apgar5')} keyboardType="number-pad" error={errores.apgar5} placeholder="9" /></View>
          </View>
          <Campo label="Grupo sanguíneo" valor={form.grupoSanguineo} onChange={set('grupoSanguineo')} error={errores.grupoSanguineo} placeholder="O+" />
          <Text style={s.labelGrupo}>Tipo de parto</Text>
          <Chips opciones={['Natural', 'Cesárea', 'Instrumentado']} valor={form.tipoParto} onSelect={v => setForm(p => ({ ...p, tipoParto: v }))} />
        </Animated.View>
      );
      case 2: return (
        <Animated.View style={entAnim}>
          <Campo label="Historia clínica / ID" valor={form.historiaClinica} onChange={set('historiaClinica')} error={errores.historiaClinica} placeholder="HC-2026-001" />
          <Campo label="Complicaciones al nacer" valor={form.complicaciones} onChange={set('complicaciones')} error={errores.complicaciones} placeholder="Ninguna" />
          <Campo label="Alergias conocidas" valor={form.alergias} onChange={set('alergias')} error={errores.alergias} placeholder="Sin alergias conocidas" />
          <Campo label="Antecedentes médicos" valor={form.antecedentes} onChange={set('antecedentes')} error={errores.antecedentes} placeholder="Describir antecedentes..." multiline />
        </Animated.View>
      );
      default: return null;
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#F3EEFF', '#FAF8FF', Colores.fondo]} locations={[0, 0.35, 1]} style={s.bg}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Encabezado */}
          <Animated.View style={[s.header, { opacity: animEntrada, transform: [{ translateY: animEntrada.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Animated.View style={{ transform: [{ translateY: animFlotante }] }}>
              <LinearGradient colors={[Colores.primarioClaro, Colores.primario]} style={s.logoCircle}>
                <Text style={{ fontSize: 34 }}>👶</Text>
              </LinearGradient>
            </Animated.View>
            <Text style={s.headerTitle}>Registro del bebé</Text>
            <Text style={s.headerSub}>Configura el monitoreo de tu neonato</Text>
          </Animated.View>

          {/* Stepper */}
          <View style={s.stepper}>
            {PASOS.map((p, i) => {
              const activo = i === paso;
              const hecho = i < paso;
              return (
                <View key={i} style={s.stepDot}>
                  <View style={[s.stepCircle, activo && s.stepCircleActive, hecho && s.stepCircleDone]}>
                    {hecho ? <Text style={s.stepCheck}>✓</Text> : <Text style={[s.stepNum, activo && s.stepNumActive]}>{i + 1}</Text>}
                  </View>
                  <Text style={[s.stepLabel, activo && s.stepLabelActive]} numberOfLines={1}>{p.titulo}</Text>
                </View>
              );
            })}
            <View style={s.stepLine}>
              <Animated.View style={[s.stepLineFill, { width: animProgreso.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
            </View>
          </View>

          {/* Tarjeta */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={{ fontSize: 26 }}>{PASOS[paso].icono}</Text>
              <View>
                <Text style={s.cardTitle}>{PASOS[paso].titulo}</Text>
                <Text style={s.cardDesc}>{PASOS[paso].desc}</Text>
              </View>
            </View>
            <View style={s.divider} />
            {renderPaso()}
          </View>

          {/* Navegación */}
          <View style={s.navRow}>
            {paso > 0 && (
              <TouchableOpacity style={s.btnBack} onPress={anterior} activeOpacity={0.7}>
                <Text style={s.btnBackText}>← Anterior</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <TouchableOpacity activeOpacity={1}
                onPressIn={() => !isSaving && Animated.spring(escalaBtn, { toValue: 0.96, useNativeDriver: true, tension: 120, friction: 8 }).start()}
                onPressOut={() => { if (!isSaving) { Animated.spring(escalaBtn, { toValue: 1, useNativeDriver: true, tension: 40, friction: 6 }).start(); siguiente(); } }}>
                <Animated.View style={{ transform: [{ scale: escalaBtn }] }}>
                  <LinearGradient colors={[Colores.primarioClaro, Colores.primario]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnNext}>
                    {isSaving ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={s.btnNextText}>{paso === PASOS.length - 1 ? 'Completar registro' : 'Siguiente →'}</Text>
                    )}
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={s.skipBtn} onPress={() => navigation.replace('Carga')} activeOpacity={0.7}>
            <Text style={s.skipText}>Omitir por ahora</Text>
          </TouchableOpacity>
          <Text style={s.progressText}>Paso {paso + 1} de {PASOS.length}</Text>

          <View style={{ height: 32 }} />
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

// ── Sub-componentes ──

function Campo({ label, valor, onChange, keyboardType, error, editable = true, placeholder, multiline }: {
  label: string; valor?: string; onChange?: (t: string) => void; keyboardType?: any;
  error?: boolean; editable?: boolean; placeholder?: string; multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.fieldWrap}>
      <Text style={[s.fieldLabel, focused && { color: Colores.primario }, error && { color: '#F87171' }]}>{label}</Text>
      <View style={[s.fieldBox, focused && s.fieldFocused, error && s.fieldError]}>
        <TextInput
          style={[s.fieldInput, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
          value={valor} onChangeText={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          keyboardType={keyboardType} editable={editable}
          placeholder={placeholder} placeholderTextColor={Colores.textoSutil} multiline={multiline}
        />
      </View>
      {error && <Text style={s.fieldErr}>Este campo es obligatorio</Text>}
    </View>
  );
}

function Chips({ opciones, valor, onSelect }: { opciones: string[]; valor: string; onSelect: (v: string) => void }) {
  return (
    <View style={s.chipsRow}>
      {opciones.map(op => {
        const sel = valor === op;
        return (
          <TouchableOpacity key={op} activeOpacity={0.7} onPress={() => onSelect(op)}>
            <View style={[s.chip, sel && s.chipSel]}>
              <Text style={[s.chipText, sel && s.chipTextSel]}>{op}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Estilos ──

const s = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 54, paddingBottom: 20 },

  header: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: Colores.primario, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: Colores.textoOscuro, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: Colores.textoClaro, fontWeight: '500', marginTop: 4 },

  // Stepper
  stepper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, paddingHorizontal: 6, position: 'relative' },
  stepDot: { alignItems: 'center', width: (ANCHO - 56) / 3 },
  stepCircle: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EDE9FE', borderWidth: 2, borderColor: Colores.borde, zIndex: 2,
  },
  stepCircleActive: { backgroundColor: Colores.primario, borderColor: Colores.primario },
  stepCircleDone: { backgroundColor: Colores.seguro, borderColor: Colores.seguro },
  stepNum: { fontSize: 13, fontWeight: '800', color: Colores.textoClaro },
  stepNumActive: { color: '#FFF' },
  stepCheck: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  stepLabel: { fontSize: 10, fontWeight: '600', color: Colores.textoClaro, marginTop: 5, textAlign: 'center' },
  stepLabelActive: { color: Colores.primario, fontWeight: '700' },
  stepLine: {
    position: 'absolute', top: 16, left: (ANCHO - 56) / 6 + 6, right: (ANCHO - 56) / 6 + 6,
    height: 3, backgroundColor: Colores.borde, borderRadius: 1.5, zIndex: 1,
  },
  stepLineFill: { height: '100%', backgroundColor: Colores.seguro, borderRadius: 1.5 },

  // Card
  card: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 22, marginBottom: 18,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: Colores.textoOscuro },
  cardDesc: { fontSize: 12, color: Colores.textoClaro, fontWeight: '500', marginTop: 1 },
  divider: { height: 1, backgroundColor: Colores.divisor, marginBottom: 16 },

  // Fields
  fila: { flexDirection: 'row', gap: 12 },
  mitad: { flex: 1 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colores.textoMedio, marginBottom: 5, letterSpacing: 0.3 },
  fieldBox: {
    backgroundColor: '#F8F6FF', borderRadius: 14, borderWidth: 1.5, borderColor: Colores.borde,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10,
  },
  fieldFocused: { borderColor: Colores.primario, backgroundColor: '#FEFEFF' },
  fieldError: { borderColor: '#F87171', backgroundColor: '#FFF5F5' },
  fieldInput: { fontSize: 15, color: Colores.textoOscuro, fontWeight: '500', padding: 0 },
  fieldErr: { fontSize: 11, color: '#F87171', fontWeight: '600', marginTop: 3, marginLeft: 4 },

  // Chips
  labelGrupo: { fontSize: 12, fontWeight: '700', color: Colores.textoMedio, marginBottom: 8, letterSpacing: 0.3 },
  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F3EEFF', borderWidth: 1.5, borderColor: Colores.borde },
  chipSel: { backgroundColor: Colores.primario, borderColor: Colores.primario },
  chipText: { fontSize: 13, fontWeight: '600', color: Colores.textoMedio },
  chipTextSel: { color: '#FFF', fontWeight: '700' },

  // Nav
  navRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  btnBack: { paddingHorizontal: 18, paddingVertical: 15, borderRadius: 20, backgroundColor: '#F3EEFF', borderWidth: 1.5, borderColor: Colores.borde },
  btnBackText: { fontSize: 14, fontWeight: '700', color: Colores.primario },
  btnNext: {
    alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 22,
    shadowColor: Colores.primario, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  btnNextText: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipText: { fontSize: 14, color: Colores.textoClaro, fontWeight: '600' },
  progressText: { textAlign: 'center', fontSize: 12, color: Colores.textoSutil, fontWeight: '600', marginTop: 2 },
});
