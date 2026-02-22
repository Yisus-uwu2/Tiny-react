/**
 * PantallaMercado — Marketplace estilo Amazon.
 * Carrusel de destacados, carrito funcional, modal de detalle,
 * selector de cantidad, resumen de compra.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
  Animated, Easing, Modal, Pressable, Dimensions, Platform, Vibration, TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colores } from '../constantes/colores';

const { width: ANCHO } = Dimensions.get('window');

// ── Datos ────────────────────────────────────────────────────────

interface Opinion {
  usuario: string;
  fecha: string;
  calificacion: number;
  texto: string;
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  calificacion: number;
  resenas: number;
  categoria: 'Sensores' | 'Prendas' | 'Accesorios';
  emoji: string;
  descripcion: string;
  caracteristicas: string[];
  colorAccent: string;
  envioGratis?: boolean;
  especificaciones?: { clave: string; valor: string }[];
  opiniones?: Opinion[];
  imagenes?: string[]; // emojis como "fotos"
}

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

const productos: Producto[] = [
  {
    id: 1, nombre: 'Mameluco inteligente con sensor', precio: 1499, calificacion: 4.5, resenas: 112,
    categoria: 'Prendas', emoji: '👕', colorAccent: '#8B5CF6', envioGratis: true,
    descripcion: 'Mameluco premium con bolsillo integrado para sensores vitales. Tela hipoalergénica y transpirable.',
    caracteristicas: ['Tela 100% algodón orgánico', 'Bolsillo para sensor', 'Lavable a máquina', 'Tallas: 0-12 meses'],
    imagenes: ['👕', '👶', '🧵', '📏'],
    especificaciones: [{ clave: 'Material', valor: '100% algodón orgánico' }, { clave: 'Tallas', valor: '0-12 meses' }, { clave: 'Peso', valor: '120g' }, { clave: 'Colores', valor: 'Blanco, Beige, Rosa' }],
    opiniones: [
      { usuario: 'María G.', fecha: '15 Feb 2026', calificacion: 5, texto: 'Excelente calidad, mi bebé duerme muy cómodo con él.' },
      { usuario: 'Carlos R.', fecha: '10 Feb 2026', calificacion: 4, texto: 'Buen material, el sensor cabe perfecto en el bolsillo.' },
      { usuario: 'Ana L.', fecha: '3 Feb 2026', calificacion: 5, texto: 'Lo mejor que he comprado para monitorear a mi bebé.' },
    ],
  },
  {
    id: 2, nombre: 'Sensor MAX30102 (ritmo/oxigenación)', precio: 799, calificacion: 4.7, resenas: 85,
    categoria: 'Sensores', emoji: '❤️', colorAccent: '#FF6B8A', envioGratis: true,
    descripcion: 'Sensor de alta precisión para medir frecuencia cardíaca y saturación de oxígeno.',
    caracteristicas: ['Precisión ±2%', 'Bluetooth 5.0', 'Batería 48h', 'Certificado médico'],
    imagenes: ['❤️', '📡', '🔋', '📊'],
    especificaciones: [{ clave: 'Precisión', valor: '±2% SpO2' }, { clave: 'Conectividad', valor: 'Bluetooth 5.0' }, { clave: 'Batería', valor: '48 horas' }, { clave: 'Peso', valor: '8g' }],
    opiniones: [
      { usuario: 'Laura M.', fecha: '18 Feb 2026', calificacion: 5, texto: 'Muy preciso, los datos coinciden con el oxímetro del pediatra.' },
      { usuario: 'Pedro S.', fecha: '12 Feb 2026', calificacion: 5, texto: 'La batería dura muchísimo, lo recomiendo.' },
      { usuario: 'Sofía T.', fecha: '5 Feb 2026', calificacion: 4, texto: 'Excelente sensor, fácil de conectar con la app.' },
    ],
  },
  {
    id: 3, nombre: 'Sensor MLX90614 (temperatura)', precio: 649, calificacion: 4.6, resenas: 67,
    categoria: 'Sensores', emoji: '🌡️', colorAccent: '#FB923C', envioGratis: true,
    descripcion: 'Sensor infrarrojo sin contacto para monitoreo continuo de temperatura corporal.',
    caracteristicas: ['Precisión ±0.2°C', 'Sin contacto directo', 'Respuesta instantánea', 'Ultra bajo consumo'],
    imagenes: ['🌡️', '📡', '👶', '🔬'],
    especificaciones: [{ clave: 'Precisión', valor: '±0.2°C' }, { clave: 'Tipo', valor: 'Infrarrojo' }, { clave: 'Consumo', valor: 'Ultra bajo' }, { clave: 'Peso', valor: '5g' }],
    opiniones: [
      { usuario: 'Roberto H.', fecha: '14 Feb 2026', calificacion: 5, texto: 'Medición instantánea sin molestar al bebé dormido.' },
      { usuario: 'Diana P.', fecha: '8 Feb 2026', calificacion: 4, texto: 'Muy útil para monitoreo continuo durante la noche.' },
    ],
  },
  {
    id: 4, nombre: 'Body con bolsillo para sensor', precio: 499, calificacion: 4.3, resenas: 34,
    categoria: 'Prendas', emoji: '🧷', colorAccent: '#38BDF8',
    descripcion: 'Body de algodón suave con bolsillo discreto para colocar sensores cómodamente.',
    caracteristicas: ['Algodón premium', 'Costuras planas', 'Cierre magnético', 'Pack de 3 unidades'],
    imagenes: ['🧷', '👕', '👶', '🧵'],
    especificaciones: [{ clave: 'Material', valor: 'Algodón premium' }, { clave: 'Cierre', valor: 'Magnético' }, { clave: 'Pack', valor: '3 unidades' }, { clave: 'Tallas', valor: '0-12 meses' }],
    opiniones: [
      { usuario: 'Elena V.', fecha: '16 Feb 2026', calificacion: 4, texto: 'Muy buena calidad, el cierre magnético es súper práctico.' },
      { usuario: 'Jorge M.', fecha: '9 Feb 2026', calificacion: 5, texto: 'El pack de 3 es ideal para tener siempre uno limpio.' },
    ],
  },
  {
    id: 5, nombre: 'Cargador USB para sensores', precio: 199, calificacion: 4.8, resenas: 54,
    categoria: 'Accesorios', emoji: '🔌', colorAccent: '#22C55E',
    descripcion: 'Cargador USB-C de carga rápida compatible con todos los sensores TinyCare.',
    caracteristicas: ['Carga rápida 25W', 'Cable de 1.5m incluido', 'LED indicador', 'Protección contra sobrecarga'],
    imagenes: ['🔌', '⚡', '🔋', '💡'],
    especificaciones: [{ clave: 'Potencia', valor: '25W' }, { clave: 'Cable', valor: '1.5m USB-C' }, { clave: 'Indicador', valor: 'LED RGB' }, { clave: 'Protección', valor: 'Sobrecarga' }],
    opiniones: [
      { usuario: 'Miguel F.', fecha: '17 Feb 2026', calificacion: 5, texto: 'Carga súper rápido, el LED indicador es muy útil.' },
      { usuario: 'Valeria C.', fecha: '11 Feb 2026', calificacion: 5, texto: 'Compatible con todos mis sensores, excelente compra.' },
    ],
  },
  {
    id: 6, nombre: 'Funda lavable para sensor', precio: 149, calificacion: 4.2, resenas: 21,
    categoria: 'Accesorios', emoji: '🧴', colorAccent: '#F59E0B',
    descripcion: 'Funda protectora lavable para sensores. Mantiene el sensor limpio y seguro.',
    caracteristicas: ['Material antibacterial', 'Lavable a máquina', 'Pack de 5', 'Compatible con MAX30102'],
    imagenes: ['🧴', '🧼', '✨', '🛡️'],
    especificaciones: [{ clave: 'Material', valor: 'Silicona antibacterial' }, { clave: 'Lavado', valor: 'Máquina / Mano' }, { clave: 'Pack', valor: '5 fundas' }, { clave: 'Compatibilidad', valor: 'MAX30102' }],
    opiniones: [
      { usuario: 'Patricia N.', fecha: '13 Feb 2026', calificacion: 4, texto: 'Buena relación calidad-precio, protegen bien el sensor.' },
      { usuario: 'Andrés K.', fecha: '6 Feb 2026', calificacion: 4, texto: 'El pack de 5 dura bastante, fáciles de lavar.' },
    ],
  },
];

const DESTACADOS = [productos[1], productos[0], productos[2]]; // 3 productos para el carrusel
const ANCHO_CAROUSEL = ANCHO - 40;

type Categoria = 'Todos' | 'Sensores' | 'Prendas' | 'Accesorios';
const CATEGORIAS: { clave: Categoria; icono: string }[] = [
  { clave: 'Todos', icono: '✦' },
  { clave: 'Sensores', icono: '◉' },
  { clave: 'Prendas', icono: '◈' },
  { clave: 'Accesorios', icono: '◆' },
];

const GRADIENTES_DESTACADOS: [string, string][] = [
  ['#FF6B8A', '#FF4775'],
  ['#A78BFA', '#7C3AED'],
  ['#FB923C', '#EA580C'],
];

const ETIQUETAS_DESTACADOS = ['Más vendido', 'Popular', 'Nuevo'];

// ── Pantalla principal ──────────────────────────────────────────

export default function PantallaMercado() {
  const [filtro, setFiltro] = useState<Categoria>('Todos');
  const [productoSel, setProductoSel] = useState<Producto | null>(null);
  const [modalProducto, setModalProducto] = useState(false);
  const [modalCarrito, setModalCarrito] = useState(false);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [cantidadSel, setCantidadSel] = useState(1);
  const [toastTexto, setToastTexto] = useState<string | null>(null);
  const [paginaCarrusel, setPaginaCarrusel] = useState(0);
  const [paginaSlide, setPaginaSlide] = useState(0);
  const [busqueda, setBusqueda] = useState('');

  // Animaciones
  const animEntrada = useRef(new Animated.Value(0)).current;
  const animFiltros = useRef(new Animated.Value(0)).current;
  const animGrilla = useRef(new Animated.Value(0)).current;
  const animModalProd = useRef(new Animated.Value(0)).current;
  const animModalCart = useRef(new Animated.Value(0)).current;
  const animToast = useRef(new Animated.Value(0)).current;
  const animBadge = useRef(new Animated.Value(1)).current;
  const animDots = useRef(DESTACADOS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const animSlideDots = useRef([0, 1, 2, 3].map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const scrollCarrusel = useRef<FlatList>(null);

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(animEntrada, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }),
      Animated.spring(animFiltros, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }),
      Animated.spring(animGrilla, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }),
    ]).start();
  }, []);

  // Animar dots del slide de producto
  useEffect(() => {
    animSlideDots.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i === paginaSlide ? 1 : 0,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }).start();
    });
  }, [paginaSlide]);

  // Animar dots cuando cambia la página
  useEffect(() => {
    animDots.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i === paginaCarrusel ? 1 : 0,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }).start();
    });
  }, [paginaCarrusel]);

  // Auto-scroll carrusel
  useEffect(() => {
    const intervalo = setInterval(() => {
      setPaginaCarrusel(prev => {
        const next = (prev + 1) % DESTACADOS.length;
        scrollCarrusel.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(intervalo);
  }, []);

  const entrada = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  });

  const filtradosCat = filtro === 'Todos' ? productos : productos.filter(p => p.categoria === filtro);
  const filtrados = busqueda.trim()
    ? filtradosCat.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : filtradosCat;
  const totalCarrito = carrito.reduce((s, i) => s + i.cantidad, 0);
  const subtotalCarrito = carrito.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);

  // ── Acciones del carrito ──

  const agregarAlCarrito = useCallback((producto: Producto, cantidad: number = 1) => {
    setCarrito(prev => {
      const existente = prev.find(i => i.producto.id === producto.id);
      if (existente) {
        return prev.map(i => i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i);
      }
      return [...prev, { producto, cantidad }];
    });
    Vibration.vibrate(30);
    // Animar badge
    Animated.sequence([
      Animated.timing(animBadge, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.spring(animBadge, { toValue: 1, useNativeDriver: true, tension: 100, friction: 6 }),
    ]).start();
    // Toast
    mostrarToast(`${producto.nombre.substring(0, 25)}… agregado`);
  }, [animBadge]);

  const cambiarCantidad = useCallback((productoId: number, delta: number) => {
    setCarrito(prev => prev.map(i => {
      if (i.producto.id !== productoId) return i;
      const nueva = i.cantidad + delta;
      return nueva > 0 ? { ...i, cantidad: nueva } : i;
    }).filter(i => i.cantidad > 0));
  }, []);

  const eliminarDelCarrito = useCallback((productoId: number) => {
    setCarrito(prev => prev.filter(i => i.producto.id !== productoId));
    Vibration.vibrate(20);
  }, []);

  const vaciarCarrito = useCallback(() => {
    setCarrito([]);
    Vibration.vibrate(20);
  }, []);

  // ── Modales ──

  const abrirProducto = useCallback((p: Producto) => {
    setProductoSel(p);
    setCantidadSel(1);
    setPaginaSlide(0);
    // Reset slide dots
    animSlideDots.forEach((anim, i) => anim.setValue(i === 0 ? 1 : 0));
    setModalProducto(true);
    animModalProd.setValue(0);
    Animated.spring(animModalProd, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }, [animModalProd]);

  const cerrarProducto = useCallback(() => {
    Animated.timing(animModalProd, { toValue: 0, duration: 200, useNativeDriver: true, easing: Easing.in(Easing.ease) }).start(() => {
      setModalProducto(false);
      setProductoSel(null);
    });
  }, [animModalProd]);

  const abrirCarrito = useCallback(() => {
    setModalCarrito(true);
    animModalCart.setValue(0);
    Animated.spring(animModalCart, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }, [animModalCart]);

  const cerrarCarrito = useCallback(() => {
    Animated.timing(animModalCart, { toValue: 0, duration: 200, useNativeDriver: true, easing: Easing.in(Easing.ease) }).start(() => {
      setModalCarrito(false);
    });
  }, [animModalCart]);

  // ── Toast ──

  const mostrarToast = useCallback((texto: string) => {
    setToastTexto(texto);
    animToast.setValue(0);
    Animated.sequence([
      Animated.spring(animToast, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.delay(1600),
      Animated.timing(animToast, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastTexto(null));
  }, [animToast]);

  // ── Checkout ──

  const realizarCompra = useCallback(() => {
    cerrarCarrito();
    setTimeout(() => {
      mostrarToast('Compra realizada con éxito');
      setCarrito([]);
    }, 400);
  }, [cerrarCarrito, mostrarToast]);

  // ── enCarrito helper ──
  const enCarrito = (id: number) => carrito.find(i => i.producto.id === id);

  return (
    <View style={s.contenedor}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>

        {/* ── HEADER ── */}
        <Animated.View style={[s.zonaEncabezado, entrada(animEntrada)]}>
          <View style={s.espacioSuperior} />
          <View style={s.filaEncabezado}>
            <View>
              <Text style={s.tituloEncabezado}>Tienda</Text>
              <Text style={s.subtituloEncabezado}>Productos para tu bebé</Text>
            </View>
            <TouchableOpacity onPress={abrirCarrito} activeOpacity={0.7}>
              <View style={s.iconoCarrito}>
                <Text style={s.textoCarritoIcono}>🛒</Text>
                {totalCarrito > 0 && (
                  <Animated.View style={[s.badgeCarrito, { transform: [{ scale: animBadge }] }]}>
                    <Text style={s.textoBadgeCarrito}>{totalCarrito > 99 ? '99+' : totalCarrito}</Text>
                  </Animated.View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── BUSCADOR ── */}
        <Animated.View style={[s.contenedorBuscador, entrada(animEntrada)]}>
          <View style={s.campoBuscador}>
            <Text style={s.iconoBuscar}>🔍</Text>
            <TextInput
              style={s.inputBuscar}
              placeholder="Buscar productos..."
              placeholderTextColor="#B0ACC0"
              value={busqueda}
              onChangeText={setBusqueda}
              returnKeyType="search"
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')} activeOpacity={0.6}>
                <Text style={s.botonLimpiar}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── FILTROS ── */}
        <Animated.View style={entrada(animFiltros)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.contenedorFiltros}>
            {CATEGORIAS.map((cat) => {
              const activo = filtro === cat.clave;
              return (
                <TouchableOpacity
                  key={cat.clave}
                  style={[s.chipFiltro, activo && s.chipFiltroActivo]}
                  onPress={() => setFiltro(cat.clave)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.textoFiltroIcono, activo && s.textoFiltroIconoActivo]}>{cat.icono}</Text>
                  <Text style={[s.textoFiltro, activo && s.textoFiltroActivo]}>{cat.clave}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── CARRUSEL DESTACADOS ── */}
        <Animated.View style={[s.contenedorCarrusel, entrada(animGrilla)]}>
          <FlatList
            ref={scrollCarrusel}
            data={DESTACADOS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => `dest-${item.id}`}
            snapToInterval={ANCHO_CAROUSEL}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 0 }}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / ANCHO_CAROUSEL);
              setPaginaCarrusel(idx);
            }}
            getItemLayout={(_, index) => ({ length: ANCHO_CAROUSEL, offset: ANCHO_CAROUSEL * index, index })}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => abrirProducto(item)}
                style={{ width: ANCHO_CAROUSEL }}
              >
                <LinearGradient
                  colors={GRADIENTES_DESTACADOS[index]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.tarjetaDestacada}
                >
                  <View style={s.filaDestacada}>
                    <View style={{ flex: 1 }}>
                      <View style={s.badgeDestacado}>
                        <Text style={s.textoBadgeDestacado}>{ETIQUETAS_DESTACADOS[index]}</Text>
                      </View>
                      <Text style={s.tituloDestacado} numberOfLines={2}>{item.nombre}</Text>
                      <Text style={s.precioDestacado}>${item.precio.toLocaleString()} MXN</Text>
                      <View style={s.estrellasFila}>
                        <Text style={s.estrellasBlancas}>{'★'.repeat(Math.floor(item.calificacion))}</Text>
                        <Text style={s.resenasBlancas}>({item.resenas})</Text>
                      </View>
                    </View>
                    <View style={s.emojiDestacado}>
                      <Text style={s.emojiDestacadoTexto}>{item.emoji}</Text>
                    </View>
                  </View>
                  {/* Botón rápido */}
                  <TouchableOpacity
                    style={s.botonRapidoDestacado}
                    onPress={() => agregarAlCarrito(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.textoBotonRapido}>Agregar al carrito</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
          {/* Indicadores */}
          <View style={s.indicadores}>
            {DESTACADOS.map((_, i) => (
              <Animated.View key={i} style={[s.punto, {
                width: animDots[i].interpolate({ inputRange: [0, 1], outputRange: [8, 24] }),
                backgroundColor: animDots[i].interpolate({ inputRange: [0, 1], outputRange: ['#E5E4EE', Colores.primario] }),
              }]} />
            ))}
          </View>
        </Animated.View>

        {/* ── PRODUCTOS ── */}
        <Animated.View style={[s.seccionTitulo, entrada(animGrilla)]}>
          <Text style={s.tituloSeccion}>
            {filtro === 'Todos' ? 'Todos los productos' : filtro}
          </Text>
          <Text style={s.conteoSeccion}>{filtrados.length} productos</Text>
        </Animated.View>

        <Animated.View style={[s.grilla, entrada(animGrilla)]}>
          {filtrados.map((producto) => {
            const itemEnCarrito = enCarrito(producto.id);
            return (
              <TarjetaProducto
                key={producto.id}
                producto={producto}
                cantidadEnCarrito={itemEnCarrito?.cantidad ?? 0}
                alPresionar={() => abrirProducto(producto)}
                alAgregar={() => agregarAlCarrito(producto)}
                alCambiarCantidad={(d) => cambiarCantidad(producto.id, d)}
              />
            );
          })}
        </Animated.View>

        <View style={s.pieConfianza}>
          <View style={s.badgeConfianza}>
            <Text style={s.iconoConfianza}>✓</Text>
          </View>
          <Text style={s.textoConfianza}>Producto seguro para recién nacidos · Compra protegida</Text>
        </View>
      </ScrollView>

      {/* ── MODAL DETALLE PRODUCTO (estilo Amazon) ── */}
      <Modal visible={modalProducto} transparent animationType="none" statusBarTranslucent onRequestClose={cerrarProducto}>
        <View style={s.overlayModal}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={StyleSheet.absoluteFill} onPress={cerrarProducto} />
          <Animated.View style={[s.panelModal, { maxHeight: '94%' }, {
            transform: [{ translateY: animModalProd.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
            opacity: animModalProd,
          }]}>
            {productoSel && (
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={s.asaModal} />

                {/* Carrusel de imágenes */}
                <ScrollView
                  horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                  style={s.carruselImagenes}
                  onMomentumScrollEnd={(e) => {
                    const ancho = ANCHO - 48;
                    const idx = Math.round(e.nativeEvent.contentOffset.x / ancho);
                    setPaginaSlide(idx);
                  }}
                >
                  {(productoSel.imagenes ?? [productoSel.emoji]).map((img, i) => (
                    <View key={i} style={[s.slideImagen, { backgroundColor: productoSel.colorAccent + '08' }]}>
                      <Text style={s.emojiSlide}>{img}</Text>
                    </View>
                  ))}
                </ScrollView>
                <View style={s.indicadoresSlide}>
                  {(productoSel.imagenes ?? [productoSel.emoji]).map((_, i) => (
                    <Animated.View key={i} style={[s.puntoSlide, {
                      width: animSlideDots[i]?.interpolate({ inputRange: [0, 1], outputRange: [7, 20] }) ?? 7,
                      backgroundColor: animSlideDots[i]?.interpolate({ inputRange: [0, 1], outputRange: ['#E5E4EE', productoSel.colorAccent] }) ?? '#E5E4EE',
                    }]} />
                  ))}
                </View>

                {/* Título + Estrellas */}
                <View style={s.headerProductoModal}>
                  <Text style={s.nombreModal}>{productoSel.nombre}</Text>
                  <View style={s.filaEstrellasModalRow}>
                    <Text style={s.estrellasModal}>{'★'.repeat(Math.floor(productoSel.calificacion))}{'☆'.repeat(5 - Math.floor(productoSel.calificacion))}</Text>
                    <Text style={s.resenasModal}>{productoSel.calificacion}</Text>
                    <Text style={s.linkResenas}>({productoSel.resenas} reseñas)</Text>
                  </View>
                </View>

                {/* Precio + Envío */}
                <View style={s.bloquePrecio}>
                  <Text style={[s.precioModal, { color: productoSel.colorAccent }]}>
                    ${productoSel.precio.toLocaleString()} MXN
                  </Text>
                  {productoSel.envioGratis && (
                    <View style={s.badgeEnvio}>
                      <Text style={s.textoEnvio}>Envío gratis</Text>
                    </View>
                  )}
                </View>

                {/* Categoría */}
                <View style={s.chipCategoriaModal}>
                  <Text style={[s.textoChipCat, { color: productoSel.colorAccent }]}>{productoSel.categoria}</Text>
                </View>

                {/* Descripción */}
                <View style={s.seccionModal}>
                  <Text style={s.tituloSeccionModal}>Descripción del producto</Text>
                  <Text style={s.descModal}>{productoSel.descripcion}</Text>
                </View>

                {/* Especificaciones técnicas */}
                {productoSel.especificaciones && (
                  <View style={s.seccionEspecificaciones}>
                    <Text style={s.tituloSeccionModal}>Especificaciones técnicas</Text>
                    {productoSel.especificaciones.map((esp, i) => (
                      <View key={i} style={[s.filaEspecificacion, i % 2 === 0 && s.filaEspecificacionAlt]}>
                        <Text style={s.claveEspec}>{esp.clave}</Text>
                        <Text style={s.valorEspec}>{esp.valor}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Opiniones */}
                {productoSel.opiniones && productoSel.opiniones.length > 0 && (
                  <View style={s.seccionOpiniones}>
                    <View style={s.headerOpiniones}>
                      <Text style={s.tituloSeccionModal}>Opiniones de clientes</Text>
                      <View style={s.resumenCal}>
                        <Text style={s.calResumen}>{productoSel.calificacion}</Text>
                        <Text style={s.de5}>/5</Text>
                      </View>
                    </View>
                    {productoSel.opiniones.map((op, i) => (
                      <View key={i} style={s.tarjetaOpinion}>
                        <View style={s.headerOpinion}>
                          <View style={s.avatarOpinion}>
                            <Text style={s.textoAvatarOp}>{op.usuario.charAt(0)}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.nombreOpinion}>{op.usuario}</Text>
                            <Text style={s.fechaOpinion}>{op.fecha}</Text>
                          </View>
                          <Text style={s.estrellasOpinion}>{'★'.repeat(op.calificacion)}</Text>
                        </View>
                        <Text style={s.textoOpinion}>{op.texto}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Separador */}
                <View style={s.divisorProducto} />

                {/* Selector de cantidad */}
                <View style={s.filaSelectCantidad}>
                  <Text style={s.etiquetaCantidad}>Cantidad:</Text>
                  <View style={s.selectorCantidad}>
                    <TouchableOpacity style={s.botonCantidad} onPress={() => setCantidadSel(Math.max(1, cantidadSel - 1))}>
                      <Text style={s.textoCantBtn}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.valorCantidad}>{cantidadSel}</Text>
                    <TouchableOpacity style={s.botonCantidad} onPress={() => setCantidadSel(cantidadSel + 1)}>
                      <Text style={s.textoCantBtn}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Subtotal */}
                <View style={s.filaSubtotalModal}>
                  <Text style={s.etiquetaSubtotal}>Subtotal</Text>
                  <Text style={[s.valorSubtotal, { color: productoSel.colorAccent }]}>
                    ${(productoSel.precio * cantidadSel).toLocaleString()} MXN
                  </Text>
                </View>

                {/* Botón agregar */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => { agregarAlCarrito(productoSel, cantidadSel); cerrarProducto(); }}
                  style={s.botonAgregarModal}
                >
                  <LinearGradient
                    colors={[productoSel.colorAccent, productoSel.colorAccent + 'CC']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.degradadoAgregar}
                  >
                    <Text style={s.textoAgregar}>Agregar al carrito</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Comprar ahora */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    agregarAlCarrito(productoSel, cantidadSel);
                    cerrarProducto();
                    setTimeout(abrirCarrito, 400);
                  }}
                  style={s.botonComprarAhora}
                >
                  <Text style={[s.textoComprarAhora, { color: productoSel.colorAccent }]}>Comprar ahora</Text>
                </TouchableOpacity>

                {/* Garantía */}
                <View style={s.garantiaModal}>
                  <Text style={s.textoGarantia}>✓ Garantía de 1 año · Devolución gratis 30 días</Text>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* ── MODAL CARRITO ── */}
      <Modal visible={modalCarrito} transparent animationType="none" statusBarTranslucent onRequestClose={cerrarCarrito}>
        <View style={s.overlayModal}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={StyleSheet.absoluteFill} onPress={cerrarCarrito} />
          <Animated.View style={[s.panelModal, { maxHeight: '92%' }, {
            transform: [{ translateY: animModalCart.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
            opacity: animModalCart,
          }]}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={s.asaModal} />

              {/* Header carrito */}
              <View style={s.headerCarrito}>
                <View>
                  <Text style={s.tituloCarrito}>Tu carrito</Text>
                  <Text style={s.subtituloCarrito}>
                    {totalCarrito} {totalCarrito === 1 ? 'producto' : 'productos'}
                  </Text>
                </View>
                {carrito.length > 0 && (
                  <TouchableOpacity onPress={vaciarCarrito} activeOpacity={0.7}>
                    <Text style={s.textoVaciar}>Vaciar</Text>
                  </TouchableOpacity>
                )}
              </View>

              {carrito.length === 0 ? (
                <View style={s.carritoVacio}>
                  <Text style={s.emojiVacio}>🛒</Text>
                  <Text style={s.tituloVacio}>Tu carrito está vacío</Text>
                  <Text style={s.descVacio}>Agrega productos para comenzar</Text>
                  <TouchableOpacity style={s.botonExplorar} onPress={cerrarCarrito} activeOpacity={0.7}>
                    <Text style={s.textoExplorar}>Explorar productos</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Items del carrito */}
                  {carrito.map(item => (
                    <View key={item.producto.id} style={s.itemCarrito}>
                      <View style={[s.emojiItem, { backgroundColor: item.producto.colorAccent + '12' }]}>
                        <Text style={s.textoEmojiItem}>{item.producto.emoji}</Text>
                      </View>
                      <View style={s.infoItem}>
                        <Text style={s.nombreItem} numberOfLines={2}>{item.producto.nombre}</Text>
                        <Text style={[s.precioItem, { color: item.producto.colorAccent }]}>
                          ${item.producto.precio.toLocaleString()} MXN
                        </Text>
                        {item.producto.envioGratis && (
                          <Text style={s.envioItem}>Envío gratis</Text>
                        )}
                        <View style={s.controlItem}>
                          <View style={s.selectorCantidadPeq}>
                            <TouchableOpacity
                              style={s.botonCantPeq}
                              onPress={() => cambiarCantidad(item.producto.id, -1)}
                            >
                              <Text style={s.textoCantPeq}>−</Text>
                            </TouchableOpacity>
                            <Text style={s.valorCantPeq}>{item.cantidad}</Text>
                            <TouchableOpacity
                              style={s.botonCantPeq}
                              onPress={() => cambiarCantidad(item.producto.id, 1)}
                            >
                              <Text style={s.textoCantPeq}>+</Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity onPress={() => eliminarDelCarrito(item.producto.id)}>
                            <Text style={s.textoEliminar}>Eliminar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={s.subtotalItem}>
                        ${(item.producto.precio * item.cantidad).toLocaleString()}
                      </Text>
                    </View>
                  ))}

                  {/* Resumen */}
                  <View style={s.resumenCarrito}>
                    <View style={s.filaResumen}>
                      <Text style={s.etiquetaResumen}>Subtotal</Text>
                      <Text style={s.valorResumen}>${subtotalCarrito.toLocaleString()} MXN</Text>
                    </View>
                    <View style={s.filaResumen}>
                      <Text style={s.etiquetaResumen}>Envío</Text>
                      <Text style={[s.valorResumen, { color: Colores.seguro }]}>Gratis</Text>
                    </View>
                    <View style={s.divisorResumen} />
                    <View style={s.filaResumen}>
                      <Text style={s.etiquetaTotal}>Total</Text>
                      <Text style={s.valorTotal}>${subtotalCarrito.toLocaleString()} MXN</Text>
                    </View>
                  </View>

                  {/* Botón de compra */}
                  <TouchableOpacity activeOpacity={0.85} onPress={realizarCompra} style={s.botonComprar}>
                    <LinearGradient
                      colors={[Colores.primario, Colores.primarioOscuro]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.degradadoComprar}
                    >
                      <Text style={s.textoComprar}>Realizar compra</Text>
                      <Text style={s.totalComprar}>${subtotalCarrito.toLocaleString()}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Seguridad */}
                  <View style={s.seguridadCarrito}>
                    <Text style={s.textoSeguridad}>✓ Compra 100% segura · Datos encriptados</Text>
                  </View>
                </>
              )}

              <TouchableOpacity style={s.botonCerrarModal} onPress={cerrarCarrito}>
                <Text style={s.textoCerrarModal}>Cerrar</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* ── TOAST (no bloquea touch) ── */}
      {toastTexto !== null && (
        <View style={s.toastOverlay} pointerEvents="box-none">
          <Animated.View style={[s.toastCard, {
            opacity: animToast,
            transform: [
              { translateY: animToast.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
            ],
          }]} pointerEvents="none">
            <View style={s.toastCheck}>
              <Text style={s.toastCheckTexto}>✓</Text>
            </View>
            <Text style={s.toastTexto} numberOfLines={1}>{toastTexto}</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// ── TarjetaProducto ─────────────────────────────────────────────

function TarjetaProducto({
  producto,
  cantidadEnCarrito,
  alPresionar,
  alAgregar,
  alCambiarCantidad,
}: {
  producto: Producto;
  cantidadEnCarrito: number;
  alPresionar: () => void;
  alAgregar: () => void;
  alCambiarCantidad: (delta: number) => void;
}) {
  return (
    <TouchableOpacity style={s.tarjetaProducto} onPress={alPresionar} activeOpacity={0.85}>
      <View style={[s.emojiProductoContainer, { backgroundColor: producto.colorAccent + '10' }]}>
        <Text style={s.emojiProductoTexto}>{producto.emoji}</Text>
        {producto.envioGratis && (
          <View style={s.chipEnvioProd}>
            <Text style={s.textoChipEnvio}>Envío gratis</Text>
          </View>
        )}
      </View>
      <Text style={s.nombreProducto} numberOfLines={2}>{producto.nombre}</Text>
      <View style={s.filaPrecioProducto}>
        <Text style={[s.precioProducto, { color: producto.colorAccent }]}>
          ${producto.precio.toLocaleString()}
        </Text>
        <Text style={s.monedaProducto}>MXN</Text>
      </View>
      <View style={s.filaEstrellas}>
        <Text style={s.estrellas}>{'★'.repeat(Math.floor(producto.calificacion))}</Text>
        <Text style={s.conteoResenas}>({producto.resenas})</Text>
      </View>

      {cantidadEnCarrito > 0 ? (
        <View style={s.controlEnTarjeta}>
          <TouchableOpacity style={[s.botonCtrlTarjeta, { backgroundColor: producto.colorAccent + '15' }]} onPress={() => alCambiarCantidad(-1)}>
            <Text style={[s.textoCtrlTarjeta, { color: producto.colorAccent }]}>−</Text>
          </TouchableOpacity>
          <Text style={[s.cantidadCtrlTarjeta, { color: producto.colorAccent }]}>{cantidadEnCarrito}</Text>
          <TouchableOpacity style={[s.botonCtrlTarjeta, { backgroundColor: producto.colorAccent }]} onPress={() => alCambiarCantidad(1)}>
            <Text style={[s.textoCtrlTarjeta, { color: '#FFF' }]}>+</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[s.botonAgregarTarjeta, { backgroundColor: producto.colorAccent }]} onPress={alAgregar} activeOpacity={0.7}>
          <Text style={s.textoBotonTarjeta}>Agregar</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ── Estilos ──────────────────────────────────────────────────────

const ANCHO_CARTA = (ANCHO - 48 - 14) / 2;

const s = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondo },

  // Header
  zonaEncabezado: { backgroundColor: Colores.fondo, paddingHorizontal: 20 },
  espacioSuperior: { height: Platform.OS === 'ios' ? 60 : 46 },
  filaEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tituloEncabezado: { fontSize: 26, fontWeight: '900', color: '#1A1A2E', letterSpacing: -0.5 },
  subtituloEncabezado: { fontSize: 13, color: '#9B95B0', fontWeight: '500', marginTop: 2 },
  iconoCarrito: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  textoCarritoIcono: { fontSize: 24 },
  badgeCarrito: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  textoBadgeCarrito: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  // Buscador
  contenedorBuscador: { paddingHorizontal: 20, marginTop: 14 },
  campoBuscador: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, paddingHorizontal: 16, height: 48,
    borderWidth: 1.5, borderColor: '#F1F0F8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  iconoBuscar: { fontSize: 16, marginRight: 10 },
  inputBuscar: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1A2E', padding: 0 },
  botonLimpiar: { fontSize: 14, color: '#9B95B0', fontWeight: '700', paddingLeft: 10 },

  // Filtros
  contenedorFiltros: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  chipFiltro: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F1F0F8',
  },
  chipFiltroActivo: { backgroundColor: Colores.primario + '12', borderColor: Colores.primario + '50' },
  textoFiltroIcono: { fontSize: 12, color: '#9B95B0', fontWeight: '700' },
  textoFiltroIconoActivo: { color: Colores.primario },
  textoFiltro: { fontSize: 13, fontWeight: '600', color: '#6B6B8A' },
  textoFiltroActivo: { color: Colores.primario, fontWeight: '700' },

  // Carrusel
  contenedorCarrusel: { marginBottom: 20, paddingHorizontal: 20 },
  tarjetaDestacada: { borderRadius: 24, padding: 22, overflow: 'hidden' },
  filaDestacada: { flexDirection: 'row', alignItems: 'center' },
  badgeDestacado: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10,
  },
  textoBadgeDestacado: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  tituloDestacado: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', lineHeight: 22, marginBottom: 8 },
  precioDestacado: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginBottom: 6 },
  estrellasFila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  estrellasBlancas: { fontSize: 13, color: '#FFFFFF' },
  resenasBlancas: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  emojiDestacado: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginLeft: 14,
  },
  emojiDestacadoTexto: { fontSize: 42 },
  botonRapidoDestacado: {
    marginTop: 14, backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 10, borderRadius: 14, alignItems: 'center',
  },
  textoBotonRapido: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  indicadores: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  punto: { height: 8, borderRadius: 4 },

  // Sección título
  seccionTitulo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: 20, marginBottom: 14,
  },
  tituloSeccion: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  conteoSeccion: { fontSize: 12, color: '#9B95B0', fontWeight: '500' },

  // Grilla
  grilla: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 14 },

  // Tarjeta producto
  tarjetaProducto: {
    width: ANCHO_CARTA, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 2,
  },
  emojiProductoContainer: {
    width: '100%' as any, height: 80, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative',
  },
  emojiProductoTexto: { fontSize: 38 },
  chipEnvioProd: {
    position: 'absolute', top: 6, right: 6, backgroundColor: '#22C55E',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  textoChipEnvio: { color: '#FFF', fontSize: 8, fontWeight: '700' },
  nombreProducto: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 8, lineHeight: 18 },
  filaPrecioProducto: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginBottom: 6 },
  precioProducto: { fontSize: 18, fontWeight: '900' },
  monedaProducto: { fontSize: 11, fontWeight: '500', color: '#9B95B0' },
  filaEstrellas: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  estrellas: { fontSize: 12, color: '#F59E0B' },
  conteoResenas: { fontSize: 11, color: '#9B95B0' },
  botonAgregarTarjeta: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 14,
  },
  textoBotonTarjeta: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  controlEnTarjeta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, overflow: 'hidden',
  },
  botonCtrlTarjeta: {
    width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  textoCtrlTarjeta: { fontSize: 18, fontWeight: '800' },
  cantidadCtrlTarjeta: { fontSize: 16, fontWeight: '800' },

  // Pie
  pieConfianza: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 10, paddingHorizontal: 20, marginBottom: 60 },
  badgeConfianza: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colores.seguro + '20', alignItems: 'center', justifyContent: 'center' },
  iconoConfianza: { fontSize: 13, fontWeight: '800', color: Colores.seguro },
  textoConfianza: { fontSize: 12, color: '#9B95B0', fontWeight: '500', flex: 1 },

  // Modal compartido
  overlayModal: { flex: 1, justifyContent: 'flex-end' } as any,
  panelModal: {
    maxHeight: '88%', backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
  },
  asaModal: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E4EE', alignSelf: 'center', marginBottom: 20 },

  // Modal producto — estilo Amazon
  carruselImagenes: { marginHorizontal: -24, marginBottom: 6 },
  slideImagen: {
    width: ANCHO - 48, height: 200, borderRadius: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiSlide: { fontSize: 72 },
  indicadoresSlide: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 16 },
  puntoSlide: { height: 7, borderRadius: 4 },
  headerProductoModal: { marginBottom: 12 },
  nombreModal: { fontSize: 19, fontWeight: '800', color: '#1A1A2E', marginBottom: 6, lineHeight: 24 },
  filaEstrellasModalRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  estrellasModal: { fontSize: 14, color: '#F59E0B' },
  resenasModal: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  linkResenas: { fontSize: 13, color: Colores.primario, fontWeight: '500' },
  bloquePrecio: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  precioModal: { fontSize: 26, fontWeight: '900' },
  badgeEnvio: {
    backgroundColor: '#22C55E15', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  textoEnvio: { color: '#22C55E', fontSize: 11, fontWeight: '700' },
  chipCategoriaModal: {
    alignSelf: 'flex-start', backgroundColor: '#F1F0F8', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 10, marginBottom: 16,
  },
  textoChipCat: { fontSize: 12, fontWeight: '700' },
  seccionModal: { marginBottom: 16 },
  tituloSeccionModal: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 8 },
  descModal: { fontSize: 14, color: '#6B6B8A', lineHeight: 21 },
  seccionCaracteristicas: {
    backgroundColor: '#F9F8FC', borderRadius: 16, padding: 16, borderLeftWidth: 4, marginBottom: 16,
  },
  tituloCaracteristicas: { fontSize: 14, fontWeight: '800', color: '#1A1A2E', marginBottom: 10 },
  filaCaracteristica: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  puntoCaracteristica: { width: 6, height: 6, borderRadius: 3 },
  textoCaracteristica: { flex: 1, fontSize: 13, color: '#6B6B8A', lineHeight: 18 },
  seccionEspecificaciones: { marginBottom: 16 },
  filaEspecificacion: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10,
  },
  filaEspecificacionAlt: { backgroundColor: '#F9F8FC' },
  claveEspec: { fontSize: 13, fontWeight: '600', color: '#9B95B0' },
  valorEspec: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  seccionOpiniones: { marginBottom: 18 },
  headerOpiniones: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resumenCal: { flexDirection: 'row', alignItems: 'baseline' },
  calResumen: { fontSize: 22, fontWeight: '900', color: '#1A1A2E' },
  de5: { fontSize: 14, fontWeight: '500', color: '#9B95B0' },
  tarjetaOpinion: {
    backgroundColor: '#F9F8FC', borderRadius: 14, padding: 14, marginBottom: 10,
  },
  headerOpinion: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatarOpinion: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colores.primario + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  textoAvatarOp: { fontSize: 14, fontWeight: '800', color: Colores.primario },
  nombreOpinion: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  fechaOpinion: { fontSize: 11, color: '#9B95B0' },
  estrellasOpinion: { fontSize: 12, color: '#F59E0B' },
  textoOpinion: { fontSize: 13, color: '#6B6B8A', lineHeight: 19 },
  divisorProducto: { height: 1, backgroundColor: '#F1F0F8', marginVertical: 14 },
  garantiaModal: { alignItems: 'center', marginBottom: 4, marginTop: 4 },
  textoGarantia: { fontSize: 12, color: '#9B95B0', fontWeight: '500' },

  filaSelectCantidad: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F9F8FC', borderRadius: 16, padding: 16, marginBottom: 12,
  },
  etiquetaCantidad: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  selectorCantidad: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  botonCantidad: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E5E4EE',
  },
  textoCantBtn: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  valorCantidad: { fontSize: 18, fontWeight: '900', color: '#1A1A2E', minWidth: 24, textAlign: 'center' },

  filaSubtotalModal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, marginBottom: 8,
  },
  etiquetaSubtotal: { fontSize: 15, fontWeight: '600', color: '#9B95B0' },
  valorSubtotal: { fontSize: 20, fontWeight: '900' },

  botonAgregarModal: { marginBottom: 8 },
  degradadoAgregar: { alignItems: 'center', justifyContent: 'center', borderRadius: 20, paddingVertical: 16 },
  textoAgregar: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  botonComprarAhora: {
    alignItems: 'center', paddingVertical: 14, borderRadius: 20,
    borderWidth: 2, borderColor: '#E5E4EE', marginBottom: 6,
  },
  textoComprarAhora: { fontSize: 16, fontWeight: '700' },

  botonCerrarModal: { alignItems: 'center', paddingVertical: 10 },
  textoCerrarModal: { fontSize: 14, fontWeight: '600', color: '#9B95B0' },
  emojiModalContainer: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  emojiModalTexto: { fontSize: 48 },

  // Modal carrito
  headerCarrito: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20,
  },
  tituloCarrito: { fontSize: 22, fontWeight: '900', color: '#1A1A2E' },
  subtituloCarrito: { fontSize: 13, color: '#9B95B0', fontWeight: '500', marginTop: 2 },
  textoVaciar: { fontSize: 14, fontWeight: '600', color: '#EF4444' },

  carritoVacio: { alignItems: 'center', paddingVertical: 40 },
  emojiVacio: { fontSize: 56, marginBottom: 16, opacity: 0.4 },
  tituloVacio: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  descVacio: { fontSize: 14, color: '#9B95B0', marginBottom: 20 },
  botonExplorar: {
    backgroundColor: Colores.primario + '15', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16,
  },
  textoExplorar: { color: Colores.primario, fontSize: 14, fontWeight: '700' },

  itemCarrito: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F0F8',
  },
  emojiItem: {
    width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  textoEmojiItem: { fontSize: 28 },
  infoItem: { flex: 1 },
  nombreItem: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', lineHeight: 18, marginBottom: 4 },
  precioItem: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  envioItem: { fontSize: 11, color: '#22C55E', fontWeight: '600', marginBottom: 6 },
  controlItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  selectorCantidadPeq: { flexDirection: 'row', alignItems: 'center', gap: 0, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E4EE', overflow: 'hidden' },
  botonCantPeq: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F8FC' },
  textoCantPeq: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  valorCantPeq: { width: 32, textAlign: 'center', fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
  textoEliminar: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  subtotalItem: { fontSize: 14, fontWeight: '800', color: '#1A1A2E', marginLeft: 8 },

  resumenCarrito: {
    backgroundColor: '#F9F8FC', borderRadius: 18, padding: 18, marginTop: 16, marginBottom: 16,
  },
  filaResumen: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  etiquetaResumen: { fontSize: 14, color: '#9B95B0', fontWeight: '500' },
  valorResumen: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  divisorResumen: { height: 1, backgroundColor: '#E5E4EE', marginVertical: 8 },
  etiquetaTotal: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  valorTotal: { fontSize: 18, fontWeight: '900', color: '#1A1A2E' },

  botonComprar: { marginBottom: 8 },
  degradadoComprar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 20, paddingVertical: 16, paddingHorizontal: 24,
  },
  textoComprar: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  totalComprar: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700' },

  seguridadCarrito: { alignItems: 'center', marginBottom: 6 },
  textoSeguridad: { fontSize: 12, color: '#9B95B0', fontWeight: '500' },

  // Toast
  toastOverlay: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 120 : 100, left: 0, right: 0,
    alignItems: 'center', zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1A1A2E', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  toastCheck: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center',
  },
  toastCheckTexto: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  toastTexto: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', maxWidth: ANCHO - 120 },
});
