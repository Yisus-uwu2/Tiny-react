/**
 * PantallaPerfil — Perfil del bebé con secciones editables.
 * Modales tipo bottom-sheet con animaciones, Ionicons, teclado inteligente,
 * y selector de fecha nativo para campos de fecha.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Animated, Platform, Switch, Alert,
  Keyboard, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colores } from '../constantes/colores';
import { useDatosSensor } from '../hooks/useDatosSensor';

const { width: ANCHO } = Dimensions.get('window');

// ── Tipos ───────────────────────────────────────────────────────

interface DatosBebe {
  nombre: string;
  fechaNacimiento: string;
  peso: string;
  talla: string;
  sexo: string;
  tipoSangre: string;
}

interface Contacto {
  id: string;
  nombre: string;
  telefono: string;
  rol: string;
}

interface DatosPediatra {
  nombre: string;
  telefono: string;
  clinica: string;
  proximaCita: string;
  ultimaRevision: string;
}

interface Umbrales {
  rcMin: string; rcMax: string;
  o2Min: string; o2Max: string;
  tempMin: string; tempMax: string;
}

// ── Constantes ──────────────────────────────────────────────────

const COLORES_ROL: Record<string, string> = {
  Mamá: '#EC4899', Papá: '#3B82F6', Abuela: '#A855F7', Abuelo: '#6366F1',
  Tía: '#F59E0B', Tío: '#14B8A6', Cuidador: '#8B5CF6', Otro: '#6B7280',
};
const ICONOS_ROL: Record<string, keyof typeof Ionicons.glyphMap> = {
  Mamá: 'heart', Papá: 'shield-checkmark', Abuela: 'flower', Abuelo: 'glasses',
  Tía: 'star', Tío: 'rocket', Cuidador: 'people', Otro: 'person',
};
const ROLES = ['Mamá', 'Papá', 'Abuela', 'Abuelo', 'Tía', 'Tío', 'Cuidador', 'Otro'];
const SEXOS = ['Femenino', 'Masculino'];
const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ── Helpers ─────────────────────────────────────────────────────

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatearFecha(date: Date): string {
  return `${date.getDate()} ${MESES[date.getMonth()]} ${date.getFullYear()}`;
}

function parsearFecha(str: string): Date {
  // Intenta parsear "15 Mar 2026"
  const partes = str.trim().split(' ');
  if (partes.length === 3) {
    const dia = parseInt(partes[0], 10);
    const mesIdx = MESES.findIndex(m => m.toLowerCase() === partes[1].toLowerCase());
    const anio = parseInt(partes[2], 10);
    if (!isNaN(dia) && mesIdx >= 0 && !isNaN(anio)) {
      return new Date(anio, mesIdx, dia);
    }
  }
  return new Date();
}

// ═════════════════════════════════════════════════════════════════
// ModalSheet — Bottom sheet animado reutilizable
// ═════════════════════════════════════════════════════════════════

interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  titulo: string;
  subtitulo?: string;
  icono: keyof typeof Ionicons.glyphMap;
  colorIcono?: string;
  children: React.ReactNode;
}

function ModalSheet({ visible, onClose, titulo, subtitulo, icono, colorIcono = Colores.primario, children }: ModalSheetProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(300)).current;
  // Animated.Value para el espaciado del teclado — NO causa re-renders de React
  // (evita ciclos de foco y contenido que desaparece)
  const tecladoPadding = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const evShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const evHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subShow = Keyboard.addListener(evShow, (e) => {
      tecladoPadding.setValue(e.endCoordinates.height);
    });
    const subHide = Keyboard.addListener(evHide, () => {
      tecladoPadding.setValue(0);
    });

    return () => { subShow.remove(); subHide.remove(); };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      fade.setValue(0);
      slide.setValue(300);
      tecladoPadding.setValue(0);
    }
  }, [visible]);

  const cerrar = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 300, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={cerrar}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15,10,30,0.55)' }, { opacity: fade }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={cerrar} />
      </Animated.View>

      <Animated.View style={[estilos.hoja, { transform: [{ translateY: slide }] }]}>
        {/* Asa */}
        <View style={estilos.asaContenedor}>
          <View style={estilos.asa} />
        </View>

        {/* Cabecera */}
        <View style={estilos.cabecera}>
          <View style={[estilos.iconoCabecera, { backgroundColor: colorIcono + '18' }]}>
            <Ionicons name={icono} size={22} color={colorIcono} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.tituloCabecera}>{titulo}</Text>
            {subtitulo && <Text style={estilos.subtituloCabecera}>{subtitulo}</Text>}
          </View>
          <TouchableOpacity onPress={cerrar} style={estilos.btnCerrar}>
            <Ionicons name="close" size={20} color={Colores.textoMedio} />
          </TouchableOpacity>
        </View>

        {/* Contenido scrolleable */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          {children}
          {/* Espaciador animado — crece con el teclado sin re-render de React */}
          <Animated.View style={{ height: tecladoPadding }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════
// Componentes de formulario
// ═════════════════════════════════════════════════════════════════

interface CampoInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  icono?: keyof typeof Ionicons.glyphMap;
  placeholder?: string;
  keyboardType?: TextInput['props']['keyboardType'];
  multiline?: boolean;
}

function CampoInput({ label, value, onChangeText, icono, placeholder, keyboardType, multiline }: CampoInputProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={estilos.etiquetaCampo}>{label}</Text>
      <View style={estilos.contenedorInput}>
        {icono && (
          <View style={estilos.iconoInput}>
            <Ionicons name={icono} size={18} color={Colores.primario} />
          </View>
        )}
        <TextInput
          style={[estilos.input, multiline && { height: 80, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colores.textoClaro}
          keyboardType={keyboardType}
          multiline={multiline}
          blurOnSubmit={false}
        />
      </View>
    </View>
  );
}

// ── Campo de fecha con DateTimePicker nativo ─────────────────

interface CampoFechaProps {
  label: string;
  value: string;
  onChange: (fecha: string) => void;
  icono?: keyof typeof Ionicons.glyphMap;
}

function CampoFecha({ label, value, onChange, icono }: CampoFechaProps) {
  const [mostrar, setMostrar] = useState(false);
  const fechaActual = value ? parsearFecha(value) : new Date();

  const manejarCambio = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setMostrar(false);
    if (selectedDate) onChange(formatearFecha(selectedDate));
  };

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={estilos.etiquetaCampo}>{label}</Text>
      <TouchableOpacity
        style={estilos.contenedorInput}
        onPress={() => setMostrar(true)}
        activeOpacity={0.7}
      >
        {icono && (
          <View style={estilos.iconoInput}>
            <Ionicons name={icono} size={18} color={Colores.primario} />
          </View>
        )}
        <Text style={[estilos.input, { paddingTop: 13, color: value ? Colores.textoOscuro : Colores.textoClaro }]}>
          {value || 'Seleccionar fecha'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={Colores.primario} style={{ marginRight: 12 }} />
      </TouchableOpacity>

      {mostrar && (
        <DateTimePicker
          value={fechaActual}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={manejarCambio}
          locale="es"
        />
      )}
    </View>
  );
}

// ── Selector de chips ────────────────────────────────────────

interface SelectorChipsProps {
  label: string;
  opciones: string[];
  valor: string;
  onChange: (v: string) => void;
  colores?: Record<string, string>;
  iconos?: Record<string, keyof typeof Ionicons.glyphMap>;
}

function SelectorChips({ label, opciones, valor, onChange, colores, iconos }: SelectorChipsProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={estilos.etiquetaCampo}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {opciones.map(op => {
          const activo = op === valor;
          const color = colores?.[op] || Colores.primario;
          return (
            <TouchableOpacity
              key={op}
              onPress={() => onChange(op)}
              style={[estilos.chip, activo && { backgroundColor: color + '18', borderColor: color }]}
            >
              {iconos?.[op] && <Ionicons name={iconos[op]} size={14} color={activo ? color : Colores.textoClaro} style={{ marginRight: 4 }} />}
              <Text style={[estilos.chipTexto, activo && { color, fontWeight: '700' }]}>{op}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Botones de modal ────────────────────────────────────────

function BotonesModal({ onCancelar, onGuardar }: { onCancelar: () => void; onGuardar: () => void }) {
  return (
    <View style={estilos.botonesModal}>
      <TouchableOpacity style={estilos.btnCancelar} onPress={onCancelar}>
        <Ionicons name="close-circle-outline" size={18} color={Colores.textoMedio} />
        <Text style={estilos.btnCancelarTexto}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={estilos.btnGuardar} onPress={onGuardar}>
        <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
        <Text style={estilos.btnGuardarTexto}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Campo de umbral ─────────────────────────────────────────

function CampoUmbral({ label, value, onChange, color }: { label: string; value: string; onChange: (t: string) => void; color: string }) {
  return (
    <View style={estilos.campoUmbral}>
      <View style={[estilos.indicadorUmbral, { backgroundColor: color }]} />
      <Text style={estilos.etiquetaUmbral}>{label}</Text>
      <TextInput
        style={estilos.inputUmbral}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholderTextColor={Colores.textoClaro}
        blurOnSubmit={false}
      />
    </View>
  );
}

function GrupoUmbral({ titulo, icono, color, unidad, children }: { titulo: string; icono: keyof typeof Ionicons.glyphMap; color: string; unidad: string; children: React.ReactNode }) {
  return (
    <View style={[estilos.grupoUmbral, { borderLeftColor: color }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name={icono} size={18} color={color} style={{ marginRight: 6 }} />
          <Text style={[estilos.tituloGrupo, { color }]}>{titulo}</Text>
        </View>
        <View style={[estilos.badgeUnidad, { backgroundColor: color + '15' }]}>
          <Text style={[estilos.badgeUnidadTexto, { color }]}>{unidad}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

// ── Barra de rango visual ───────────────────────────────────

function BarraRango({ min, max, color }: { min: number; max: number; color: string }) {
  const rango = max - min;
  return (
    <View style={estilos.barraRango}>
      <View style={[estilos.barraSegmento, { flex: 1, backgroundColor: '#FEE2E2', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
      <View style={[estilos.barraSegmento, { flex: 2, backgroundColor: color + '30' }]} />
      <View style={[estilos.barraSegmento, { flex: 1, backgroundColor: '#FEE2E2', borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
      <Text style={[estilos.barraTexto, { left: '10%' }]}>{min}</Text>
      <Text style={[estilos.barraTexto, { right: '10%' }]}>{max}</Text>
    </View>
  );
}

// ── Tarjeta de contacto editable ────────────────────────────

function TarjetaPadreEditable({ contacto, onEditar, onEliminar }: { contacto: Contacto; onEditar: () => void; onEliminar: () => void }) {
  const color = COLORES_ROL[contacto.rol] || '#6B7280';
  const iconoRol = ICONOS_ROL[contacto.rol] || 'person';
  return (
    <View style={[estilos.tarjetaContacto, { borderLeftColor: color }]}>
      <View style={[estilos.avatarContacto, { backgroundColor: color + '18' }]}>
        <Ionicons name={iconoRol} size={20} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={estilos.nombreContacto}>{contacto.nombre}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <View style={[estilos.badgeRol, { backgroundColor: color + '15' }]}>
            <Text style={[estilos.badgeRolTexto, { color }]}>{contacto.rol}</Text>
          </View>
          <Text style={estilos.telContacto}>{contacto.telefono}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onEditar} style={estilos.btnAccionContacto}>
        <Ionicons name="create-outline" size={17} color={Colores.primario} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onEliminar} style={[estilos.btnAccionContacto, { backgroundColor: '#FEE2E2' }]}>
        <Ionicons name="trash-outline" size={17} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════
// Pantalla principal
// ═════════════════════════════════════════════════════════════════

export default function PantallaPerfil() {
  const { datos } = useDatosSensor();

  // ── Estado del bebé
  const [bebe, setBebe] = useState<DatosBebe>({
    nombre: 'Emma Valentina', fechaNacimiento: '15 Mar 2026', peso: '3.2',
    talla: '49', sexo: 'Femenino', tipoSangre: 'O+',
  });
  const [formBebe, setFormBebe] = useState<DatosBebe>({ ...bebe });
  const [modalBebe, setModalBebe] = useState(false);

  // ── Contactos
  const [contactos, setContactos] = useState<Contacto[]>([
    { id: '1', nombre: 'María López', telefono: '+52 55 1234 5678', rol: 'Mamá' },
    { id: '2', nombre: 'Carlos López', telefono: '+52 55 8765 4321', rol: 'Papá' },
  ]);
  const [formContacto, setFormContacto] = useState<Contacto>({ id: '', nombre: '', telefono: '', rol: 'Mamá' });
  const [modalContacto, setModalContacto] = useState(false);
  const [editandoContacto, setEditandoContacto] = useState<string | null>(null);

  // ── Pediatra
  const [pediatra, setPediatra] = useState<DatosPediatra>({
    nombre: 'Dra. Ana García', telefono: '+52 55 9876 5432',
    clinica: 'Hospital Infantil', proximaCita: '20 Mar 2026', ultimaRevision: '15 Feb 2026',
  });
  const [formPediatra, setFormPediatra] = useState<DatosPediatra>({ ...pediatra });
  const [modalPediatra, setModalPediatra] = useState(false);

  // ── Umbrales
  const [umbrales, setUmbrales] = useState<Umbrales>({
    rcMin: '100', rcMax: '160', o2Min: '92', o2Max: '100', tempMin: '36.0', tempMax: '37.5',
  });
  const [formUmbrales, setFormUmbrales] = useState<Umbrales>({ ...umbrales });
  const [modalUmbrales, setModalUmbrales] = useState(false);

  // ── Notificaciones
  const [notifVitales, setNotifVitales] = useState(true);
  const [notifCitas, setNotifCitas] = useState(true);
  const [notifConsejos, setNotifConsejos] = useState(false);

  // ── Secciones colapsables
  const [seccionAbierta, setSeccionAbierta] = useState<string | null>('dispositivo');

  const toggleSeccion = (id: string) => setSeccionAbierta(prev => (prev === id ? null : id));

  // ── Handlers Bebé
  const abrirEditarBebe = () => { setFormBebe({ ...bebe }); setModalBebe(true); };
  const guardarBebe = () => { setBebe({ ...formBebe }); setModalBebe(false); };

  // ── Handlers Contactos
  const abrirNuevoContacto = () => {
    setFormContacto({ id: Date.now().toString(), nombre: '', telefono: '', rol: 'Mamá' });
    setEditandoContacto(null);
    setModalContacto(true);
  };
  const abrirEditarContacto = (c: Contacto) => {
    setFormContacto({ ...c });
    setEditandoContacto(c.id);
    setModalContacto(true);
  };
  const guardarContacto = () => {
    if (editandoContacto) {
      setContactos(prev => prev.map(c => (c.id === editandoContacto ? { ...formContacto } : c)));
    } else {
      setContactos(prev => [...prev, { ...formContacto }]);
    }
    setModalContacto(false);
  };
  const eliminarContacto = (id: string) => {
    Alert.alert('Eliminar contacto', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setContactos(prev => prev.filter(c => c.id !== id)) },
    ]);
  };

  // ── Handlers Pediatra
  const abrirEditarPediatra = () => { setFormPediatra({ ...pediatra }); setModalPediatra(true); };
  const guardarPediatra = () => { setPediatra({ ...formPediatra }); setModalPediatra(false); };

  // ── Handlers Umbrales
  const abrirEditarUmbrales = () => { setFormUmbrales({ ...umbrales }); setModalUmbrales(true); };
  const guardarUmbrales = () => { setUmbrales({ ...formUmbrales }); setModalUmbrales(false); };

  // ── Edad del bebé
  const calcularEdad = () => {
    const nacimiento = parsearFecha(bebe.fechaNacimiento);
    const hoy = new Date();
    const diffMs = hoy.getTime() - nacimiento.getTime();
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (dias < 0) return 'Por nacer';
    if (dias < 30) return `${dias} días`;
    const meses = Math.floor(dias / 30);
    return meses === 1 ? '1 mes' : `${meses} meses`;
  };

  // ── Render sección colapsable
  const renderSeccion = (id: string, titulo: string, icono: keyof typeof Ionicons.glyphMap, color: string, contenido: React.ReactNode) => {
    const abierta = seccionAbierta === id;
    return (
      <View style={estilos.seccion} key={id}>
        <TouchableOpacity style={estilos.seccionHeader} onPress={() => toggleSeccion(id)} activeOpacity={0.7}>
          <View style={[estilos.iconoSeccion, { backgroundColor: color + '15' }]}>
            <Ionicons name={icono} size={18} color={color} />
          </View>
          <Text style={estilos.seccionTitulo}>{titulo}</Text>
          <Ionicons name={abierta ? 'chevron-up' : 'chevron-down'} size={18} color={Colores.textoClaro} />
        </TouchableOpacity>
        {abierta && <View style={estilos.seccionContenido}>{contenido}</View>}
      </View>
    );
  };

  // ── Render principal ──────────────────────────────────────────

  return (
    <View style={estilos.contenedor}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={estilos.header}>
          <Text style={estilos.headerTitulo}>Perfil</Text>
          <TouchableOpacity style={estilos.btnConfig}>
            <Ionicons name="settings-outline" size={22} color={Colores.textoMedio} />
          </TouchableOpacity>
        </View>

        {/* ── Tarjeta del bebé ── */}
        <View style={estilos.tarjetaBebe}>
          <View style={estilos.avatarBebe}>
            <Text style={{ fontSize: 36 }}>{bebe.sexo === 'Femenino' ? '👧' : '👦'}</Text>
          </View>
          <Text style={estilos.nombreBebe}>{bebe.nombre}</Text>
          <Text style={estilos.edadBebe}>{calcularEdad()} • {bebe.sexo}</Text>

          <View style={estilos.statsRow}>
            <View style={estilos.statItem}>
              <Ionicons name="scale-outline" size={16} color={Colores.primario} />
              <Text style={estilos.statValor}>{bebe.peso} kg</Text>
              <Text style={estilos.statLabel}>Peso</Text>
            </View>
            <View style={[estilos.statDivisor]} />
            <View style={estilos.statItem}>
              <Ionicons name="resize-outline" size={16} color={Colores.secundario} />
              <Text style={estilos.statValor}>{bebe.talla} cm</Text>
              <Text style={estilos.statLabel}>Talla</Text>
            </View>
            <View style={[estilos.statDivisor]} />
            <View style={estilos.statItem}>
              <Ionicons name="water-outline" size={16} color="#EF4444" />
              <Text style={estilos.statValor}>{bebe.tipoSangre}</Text>
              <Text style={estilos.statLabel}>Sangre</Text>
            </View>
          </View>

          <TouchableOpacity style={estilos.btnEditarBebe} onPress={abrirEditarBebe}>
            <Ionicons name="create-outline" size={16} color={Colores.primario} />
            <Text style={estilos.btnEditarBebeTexto}>Editar datos</Text>
          </TouchableOpacity>
        </View>

        {/* ── Dispositivo ── */}
        {renderSeccion('dispositivo', 'Dispositivo TinyCare', 'hardware-chip-outline', '#8B5CF6', (
          <View>
            <View style={estilos.filaInfo}>
              <Ionicons name="battery-full" size={16} color="#22C55E" />
              <Text style={estilos.filaInfoLabel}>Batería</Text>
              <Text style={estilos.filaInfoValor}>87%</Text>
            </View>
            <View style={estilos.filaInfo}>
              <Ionicons name="bluetooth" size={16} color="#3B82F6" />
              <Text style={estilos.filaInfoLabel}>Conexión</Text>
              <Text style={[estilos.filaInfoValor, { color: datos.conectado ? '#22C55E' : '#EF4444' }]}>
                {datos.conectado ? 'Conectado' : 'Desconectado'}
              </Text>
            </View>
            <View style={estilos.filaInfo}>
              <Ionicons name="sync" size={16} color={Colores.primario} />
              <Text style={estilos.filaInfoLabel}>Última sync</Text>
              <Text style={estilos.filaInfoValor}>Hace 2 min</Text>
            </View>
            <View style={estilos.filaInfo}>
              <Ionicons name="information-circle-outline" size={16} color={Colores.textoMedio} />
              <Text style={estilos.filaInfoLabel}>Firmware</Text>
              <Text style={estilos.filaInfoValor}>v2.1.4</Text>
            </View>
          </View>
        ))}

        {/* ── Contactos familiares ── */}
        {renderSeccion('contactos', 'Contactos familiares', 'people-outline', '#EC4899', (
          <View>
            {contactos.map(c => (
              <TarjetaPadreEditable
                key={c.id}
                contacto={c}
                onEditar={() => abrirEditarContacto(c)}
                onEliminar={() => eliminarContacto(c.id)}
              />
            ))}
            <TouchableOpacity style={estilos.btnAgregar} onPress={abrirNuevoContacto}>
              <Ionicons name="add-circle-outline" size={18} color={Colores.primario} />
              <Text style={estilos.btnAgregarTexto}>Agregar contacto</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* ── Pediatra ── */}
        {renderSeccion('pediatra', 'Pediatra', 'medkit-outline', '#14B8A6', (
          <View>
            <View style={estilos.filaInfo}>
              <Ionicons name="person" size={16} color="#14B8A6" />
              <Text style={estilos.filaInfoLabel}>Nombre</Text>
              <Text style={estilos.filaInfoValor}>{pediatra.nombre}</Text>
            </View>
            <View style={estilos.filaInfo}>
              <Ionicons name="call" size={16} color="#14B8A6" />
              <Text style={estilos.filaInfoLabel}>Teléfono</Text>
              <Text style={estilos.filaInfoValor}>{pediatra.telefono}</Text>
            </View>
            <View style={estilos.filaInfo}>
              <Ionicons name="business" size={16} color="#14B8A6" />
              <Text style={estilos.filaInfoLabel}>Clínica</Text>
              <Text style={estilos.filaInfoValor}>{pediatra.clinica}</Text>
            </View>
            <View style={estilos.filaInfo}>
              <Ionicons name="calendar" size={16} color={Colores.primario} />
              <Text style={estilos.filaInfoLabel}>Próxima cita</Text>
              <Text style={estilos.filaInfoValor}>{pediatra.proximaCita}</Text>
            </View>
            <View style={estilos.filaInfo}>
              <Ionicons name="time" size={16} color="#F59E0B" />
              <Text style={estilos.filaInfoLabel}>Última revisión</Text>
              <Text style={estilos.filaInfoValor}>{pediatra.ultimaRevision}</Text>
            </View>
            <TouchableOpacity style={estilos.btnAgregar} onPress={abrirEditarPediatra}>
              <Ionicons name="create-outline" size={18} color={Colores.primario} />
              <Text style={estilos.btnAgregarTexto}>Editar pediatra</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* ── Notificaciones ── */}
        {renderSeccion('notificaciones', 'Notificaciones', 'notifications-outline', '#F59E0B', (
          <View>
            <View style={estilos.filaSwitch}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="heart" size={16} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={estilos.switchLabel}>Alertas de vitales</Text>
              </View>
              <Switch value={notifVitales} onValueChange={setNotifVitales} trackColor={{ false: '#E5E7EB', true: Colores.primarioClaro }} thumbColor={notifVitales ? Colores.primario : '#CCC'} />
            </View>
            <View style={estilos.filaSwitch}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="calendar" size={16} color={Colores.primario} style={{ marginRight: 8 }} />
                <Text style={estilos.switchLabel}>Recordatorio de citas</Text>
              </View>
              <Switch value={notifCitas} onValueChange={setNotifCitas} trackColor={{ false: '#E5E7EB', true: Colores.primarioClaro }} thumbColor={notifCitas ? Colores.primario : '#CCC'} />
            </View>
            <View style={estilos.filaSwitch}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="bulb" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
                <Text style={estilos.switchLabel}>Consejos diarios</Text>
              </View>
              <Switch value={notifConsejos} onValueChange={setNotifConsejos} trackColor={{ false: '#E5E7EB', true: Colores.primarioClaro }} thumbColor={notifConsejos ? Colores.primario : '#CCC'} />
            </View>
          </View>
        ))}

        {/* ── Umbrales ── */}
        {renderSeccion('umbrales', 'Umbrales de alerta', 'options-outline', '#EF4444', (
          <View>
            <View style={estilos.filaInfo}>
              <Ionicons name="heart" size={16} color={Colores.corazon} />
              <Text style={estilos.filaInfoLabel}>Ritmo cardíaco</Text>
              <Text style={estilos.filaInfoValor}>{umbrales.rcMin} – {umbrales.rcMax} bpm</Text>
            </View>
            <BarraRango min={parseInt(umbrales.rcMin)} max={parseInt(umbrales.rcMax)} color={Colores.corazon} />
            <View style={estilos.filaInfo}>
              <Ionicons name="water" size={16} color={Colores.oxigeno} />
              <Text style={estilos.filaInfoLabel}>Oxígeno</Text>
              <Text style={estilos.filaInfoValor}>{umbrales.o2Min} – {umbrales.o2Max} %</Text>
            </View>
            <BarraRango min={parseInt(umbrales.o2Min)} max={parseInt(umbrales.o2Max)} color={Colores.oxigeno} />
            <View style={estilos.filaInfo}>
              <Ionicons name="thermometer" size={16} color={Colores.temperatura} />
              <Text style={estilos.filaInfoLabel}>Temperatura</Text>
              <Text style={estilos.filaInfoValor}>{umbrales.tempMin} – {umbrales.tempMax} °C</Text>
            </View>
            <BarraRango min={parseFloat(umbrales.tempMin)} max={parseFloat(umbrales.tempMax)} color={Colores.temperatura} />

            <TouchableOpacity style={estilos.btnPersonalizar} onPress={abrirEditarUmbrales}>
              <LinearGradient colors={[Colores.primario, Colores.primarioOscuro]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={estilos.btnPersonalizarGrad}>
                <Ionicons name="options-outline" size={16} color="#FFF" />
                <Text style={estilos.btnPersonalizarTexto}>Personalizar umbrales</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}

        {/* ── Acerca de ── */}
        {renderSeccion('acerca', 'Acerca de TinyCare', 'information-circle-outline', '#6366F1', (
          <View>
            <View style={estilos.filaInfo}>
              <Ionicons name="code-slash" size={16} color="#6366F1" />
              <Text style={estilos.filaInfoLabel}>Versión</Text>
              <Text style={estilos.filaInfoValor}>1.0.0</Text>
            </View>
            <View style={estilos.filaInfo}>
              <Ionicons name="build" size={16} color="#6366F1" />
              <Text style={estilos.filaInfoLabel}>Build</Text>
              <Text style={estilos.filaInfoValor}>2026.02.22</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ═══ MODALES ═════════════════════════════════════════════ */}

      {/* Modal Bebé */}
      <ModalSheet visible={modalBebe} onClose={() => setModalBebe(false)} titulo="Datos del bebé" subtitulo="Información básica" icono="person-circle-outline" colorIcono={Colores.primario}>
        <CampoInput label="Nombre completo" value={formBebe.nombre} onChangeText={t => setFormBebe(p => ({ ...p, nombre: t }))} icono="person-outline" placeholder="Nombre del bebé" />
        <CampoFecha label="Fecha de nacimiento" value={formBebe.fechaNacimiento} onChange={v => setFormBebe(p => ({ ...p, fechaNacimiento: v }))} icono="calendar-outline" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <CampoInput label="Peso (kg)" value={formBebe.peso} onChangeText={t => setFormBebe(p => ({ ...p, peso: t }))} icono="scale-outline" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <CampoInput label="Talla (cm)" value={formBebe.talla} onChangeText={t => setFormBebe(p => ({ ...p, talla: t }))} icono="resize-outline" keyboardType="numeric" />
          </View>
        </View>
        <SelectorChips label="Sexo" opciones={SEXOS} valor={formBebe.sexo} onChange={v => setFormBebe(p => ({ ...p, sexo: v }))} />
        <SelectorChips label="Tipo de sangre" opciones={TIPOS_SANGRE} valor={formBebe.tipoSangre} onChange={v => setFormBebe(p => ({ ...p, tipoSangre: v }))} />
        <BotonesModal onCancelar={() => setModalBebe(false)} onGuardar={guardarBebe} />
      </ModalSheet>

      {/* Modal Contacto */}
      <ModalSheet
        visible={modalContacto}
        onClose={() => setModalContacto(false)}
        titulo={editandoContacto ? 'Editar contacto' : 'Nuevo contacto'}
        subtitulo="Información familiar"
        icono="people-outline"
        colorIcono="#EC4899"
      >
        <CampoInput label="Nombre" value={formContacto.nombre} onChangeText={t => setFormContacto(p => ({ ...p, nombre: t }))} icono="person-outline" placeholder="Nombre completo" />
        <CampoInput label="Teléfono" value={formContacto.telefono} onChangeText={t => setFormContacto(p => ({ ...p, telefono: t }))} icono="call-outline" placeholder="+52 55 1234 5678" keyboardType="phone-pad" />
        <SelectorChips label="Rol familiar" opciones={ROLES} valor={formContacto.rol} onChange={v => setFormContacto(p => ({ ...p, rol: v }))} colores={COLORES_ROL} iconos={ICONOS_ROL} />

        {/* Vista previa */}
        {formContacto.nombre ? (
          <View style={{ marginBottom: 14 }}>
            <Text style={estilos.etiquetaCampo}>Vista previa</Text>
            <TarjetaPadreEditable contacto={formContacto} onEditar={() => {}} onEliminar={() => {}} />
          </View>
        ) : null}

        <BotonesModal onCancelar={() => setModalContacto(false)} onGuardar={guardarContacto} />
      </ModalSheet>

      {/* Modal Pediatra */}
      <ModalSheet visible={modalPediatra} onClose={() => setModalPediatra(false)} titulo="Datos del pediatra" subtitulo="Médico de cabecera" icono="medkit-outline" colorIcono="#14B8A6">
        <CampoInput label="Nombre" value={formPediatra.nombre} onChangeText={t => setFormPediatra(p => ({ ...p, nombre: t }))} icono="person-outline" placeholder="Nombre del pediatra" />
        <CampoInput label="Teléfono" value={formPediatra.telefono} onChangeText={t => setFormPediatra(p => ({ ...p, telefono: t }))} icono="call-outline" placeholder="+52 55 1234 5678" keyboardType="phone-pad" />
        <CampoInput label="Clínica / Hospital" value={formPediatra.clinica} onChangeText={t => setFormPediatra(p => ({ ...p, clinica: t }))} icono="business-outline" placeholder="Nombre del hospital" />
        <CampoFecha label="Próxima cita" value={formPediatra.proximaCita} onChange={v => setFormPediatra(p => ({ ...p, proximaCita: v }))} icono="calendar-outline" />
        <CampoFecha label="Última revisión" value={formPediatra.ultimaRevision} onChange={v => setFormPediatra(p => ({ ...p, ultimaRevision: v }))} icono="time-outline" />
        <BotonesModal onCancelar={() => setModalPediatra(false)} onGuardar={guardarPediatra} />
      </ModalSheet>

      {/* Modal Umbrales */}
      <ModalSheet visible={modalUmbrales} onClose={() => setModalUmbrales(false)} titulo="Umbrales de alerta" subtitulo="Rangos normales personalizados" icono="options-outline" colorIcono="#EF4444">
        <GrupoUmbral titulo="Ritmo cardíaco" icono="heart" color={Colores.corazon} unidad="bpm">
          <CampoUmbral label="Mínimo" value={formUmbrales.rcMin} onChange={t => setFormUmbrales(p => ({ ...p, rcMin: t }))} color={Colores.corazon} />
          <CampoUmbral label="Máximo" value={formUmbrales.rcMax} onChange={t => setFormUmbrales(p => ({ ...p, rcMax: t }))} color={Colores.corazon} />
        </GrupoUmbral>

        <GrupoUmbral titulo="Saturación O₂" icono="water" color={Colores.oxigeno} unidad="%">
          <CampoUmbral label="Mínimo" value={formUmbrales.o2Min} onChange={t => setFormUmbrales(p => ({ ...p, o2Min: t }))} color={Colores.oxigeno} />
          <CampoUmbral label="Máximo" value={formUmbrales.o2Max} onChange={t => setFormUmbrales(p => ({ ...p, o2Max: t }))} color={Colores.oxigeno} />
        </GrupoUmbral>

        <GrupoUmbral titulo="Temperatura" icono="thermometer" color={Colores.temperatura} unidad="°C">
          <CampoUmbral label="Mínimo" value={formUmbrales.tempMin} onChange={t => setFormUmbrales(p => ({ ...p, tempMin: t }))} color={Colores.temperatura} />
          <CampoUmbral label="Máximo" value={formUmbrales.tempMax} onChange={t => setFormUmbrales(p => ({ ...p, tempMax: t }))} color={Colores.temperatura} />
        </GrupoUmbral>

        <BotonesModal onCancelar={() => setModalUmbrales(false)} onGuardar={guardarUmbrales} />
      </ModalSheet>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════
// Estilos
// ═════════════════════════════════════════════════════════════════

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 10,
  },
  headerTitulo: {
    fontSize: 28,
    fontWeight: '800',
    color: Colores.textoOscuro,
  },
  btnConfig: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F0FA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Tarjeta bebé ──
  tarjetaBebe: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarBebe: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F0FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  nombreBebe: {
    fontSize: 22,
    fontWeight: '800',
    color: Colores.textoOscuro,
  },
  edadBebe: {
    fontSize: 14,
    color: Colores.textoMedio,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colores.divisor,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValor: {
    fontSize: 16,
    fontWeight: '700',
    color: Colores.textoOscuro,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colores.textoClaro,
    marginTop: 2,
  },
  statDivisor: {
    width: 1,
    height: 32,
    backgroundColor: Colores.divisor,
  },
  btnEditarBebe: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colores.primario + '10',
  },
  btnEditarBebeTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: Colores.primario,
    marginLeft: 6,
  },

  // ── Secciones ──
  seccion: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconoSeccion: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  seccionTitulo: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colores.textoOscuro,
  },
  seccionContenido: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // ── Filas de info ──
  filaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colores.divisor,
  },
  filaInfoLabel: {
    flex: 1,
    fontSize: 13,
    color: Colores.textoMedio,
    marginLeft: 10,
  },
  filaInfoValor: {
    fontSize: 13,
    fontWeight: '600',
    color: Colores.textoOscuro,
  },

  // ── Switch ──
  filaSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colores.divisor,
  },
  switchLabel: {
    fontSize: 14,
    color: Colores.textoOscuro,
  },

  // ── Contactos ──
  tarjetaContacto: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  avatarContacto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nombreContacto: {
    fontSize: 14,
    fontWeight: '700',
    color: Colores.textoOscuro,
  },
  telContacto: {
    fontSize: 12,
    color: Colores.textoMedio,
  },
  badgeRol: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeRolTexto: {
    fontSize: 11,
    fontWeight: '600',
  },
  btnAccionContacto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colores.primario + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  btnAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colores.primarioClaro,
  },
  btnAgregarTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: Colores.primario,
    marginLeft: 6,
  },

  // ── Umbrales ──
  btnPersonalizar: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnPersonalizarGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  btnPersonalizarTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  barraRango: {
    height: 8,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
    marginTop: 4,
    position: 'relative',
  },
  barraSegmento: {
    height: '100%',
  },
  barraTexto: {
    position: 'absolute',
    top: 10,
    fontSize: 10,
    color: Colores.textoClaro,
  },

  // ── Modal / ModalSheet ──
  hoja: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '85%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  asaContenedor: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  asa: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colores.divisor,
  },
  iconoCabecera: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tituloCabecera: {
    fontSize: 17,
    fontWeight: '800',
    color: Colores.textoOscuro,
  },
  subtituloCabecera: {
    fontSize: 12,
    color: Colores.textoMedio,
    marginTop: 1,
  },
  btnCerrar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F0FA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Campos del formulario ──
  etiquetaCampo: {
    fontSize: 12,
    fontWeight: '600',
    color: Colores.textoMedio,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contenedorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colores.borde,
  },
  iconoInput: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colores.textoOscuro,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colores.borde,
    backgroundColor: '#FAFAFA',
  },
  chipTexto: {
    fontSize: 13,
    color: Colores.textoMedio,
  },

  // ── Botones modal ──
  botonesModal: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btnCancelar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F0FA',
    gap: 6,
  },
  btnCancelarTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: Colores.textoMedio,
  },
  btnGuardar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colores.primario,
    gap: 6,
  },
  btnGuardarTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },

  // ── Umbrales en modal ──
  grupoUmbral: {
    borderLeftWidth: 3,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    padding: 14,
    marginBottom: 14,
  },
  tituloGrupo: {
    fontSize: 14,
    fontWeight: '700',
  },
  badgeUnidad: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeUnidadTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  campoUmbral: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicadorUmbral: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 10,
  },
  etiquetaUmbral: {
    flex: 1,
    fontSize: 13,
    color: Colores.textoMedio,
  },
  inputUmbral: {
    width: 70,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: Colores.textoOscuro,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colores.borde,
    paddingVertical: 8,
  },
});
