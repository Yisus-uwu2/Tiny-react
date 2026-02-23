import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/auth';

const R = {
    bgTop: '#EDE9FE',
    bgBottom: '#FAFAFE',
    cardBg: 'rgba(255,255,255,0.85)',
    inputFill: '#F5F3FF',
    borderDefault: '#DDD6FE',
    borderFocus: '#A78BFA',
    labelColor: '#6D5EB0',
    titleColor: '#4C3D8F',
    headerTitle: '#2D2463',
    subtitle: '#9B8EC4',
    gradStart: '#C4B5FD',
    gradEnd: '#8B5CF6',
};

export default function PantallaLogin({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingresa tu correo y contraseña.');
            return;
        }

        try {
            setIsLoading(true);
            await authService.signIn({ email: email.trim(), password });
            setIsLoading(false);
            // Tras el login, la navegación general debería detectar la sesión y mandar a 'Principal'.
        } catch (error: any) {
            setIsLoading(false);
            Alert.alert('Error de Inicio de Sesión', error.message || 'Credenciales incorrectas.');
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <LinearGradient colors={[R.bgTop, R.bgBottom]} style={s.fondo}>
                <ScrollView contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">

                    <View style={s.encabezado}>
                        <Text style={s.tituloEncabezado}>Bienvenido a Tiny Care</Text>
                        <Text style={s.subtituloEncabezado}>Inicia sesión para monitorear a tu bebé</Text>
                    </View>

                    <View style={s.tarjeta}>
                        <Text style={s.etiqueta}>Correo Electrónico</Text>
                        <TextInput
                            style={s.input}
                            placeholder="correo@ejemplo.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={s.etiqueta}>Contraseña</Text>
                        <TextInput
                            style={s.input}
                            placeholder="Tu contraseña"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={{ marginTop: 24 }}>
                            <LinearGradient colors={[R.gradStart, R.gradEnd]} style={s.botonEntrar}>
                                {isLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={s.textoEntrar}>Iniciar Sesión</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={s.botonSecundario}>
                            <Text style={s.textoSecundario}>¿No tienes cuenta? Regístrate</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    fondo: { flex: 1 },
    contenido: { paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'center', flexGrow: 1 },
    encabezado: { alignItems: 'center', marginBottom: 40 },
    tituloEncabezado: { fontSize: 28, fontWeight: '800', color: R.headerTitle, textAlign: 'center' },
    subtituloEncabezado: { fontSize: 16, color: R.subtitle, marginTop: 8, textAlign: 'center' },
    tarjeta: {
        backgroundColor: R.cardBg, borderRadius: 24, padding: 24,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: R.gradStart, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 4,
    },
    etiqueta: { fontSize: 12, fontWeight: '700', color: R.labelColor, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
    input: {
        backgroundColor: R.inputFill,
        borderWidth: 1, borderColor: R.borderDefault, borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: R.headerTitle,
    },
    botonEntrar: {
        height: 54, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
        shadowColor: R.gradEnd, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
    },
    textoEntrar: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
    botonSecundario: { alignItems: 'center', marginTop: 16, paddingVertical: 10 },
    textoSecundario: { color: R.labelColor, fontSize: 14, fontWeight: '600' },
});
