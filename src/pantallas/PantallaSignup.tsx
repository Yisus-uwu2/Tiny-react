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

export default function PantallaSignup({ navigation }: any) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async () => {
        if (!fullName || !email || !password || !phone) {
            Alert.alert('Error', 'Por favor llena todos los campos.');
            return;
        }

        try {
            setIsLoading(true);
            await authService.signUp({
                email: email.trim(),
                password,
                phone_number: phone.trim(),
                full_name: fullName.trim(),
            });
            setIsLoading(false);
            Alert.alert('Éxito', 'Cuenta creada correctamente.', [{ text: 'Continuar', onPress: () => navigation.replace('Registro') }]);
        } catch (error: any) {
            setIsLoading(false);
            Alert.alert('Error de Registro', error.message || 'Error al crear la cuenta.');
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <LinearGradient colors={[R.bgTop, R.bgBottom]} style={s.fondo}>
                <ScrollView contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">

                    <View style={s.encabezado}>
                        <Text style={s.tituloEncabezado}>Crea tu Cuenta</Text>
                        <Text style={s.subtituloEncabezado}>Únete a Tiny Care para proteger a tu bebé</Text>
                    </View>

                    <View style={s.tarjeta}>
                        <Text style={s.etiqueta}>Nombre Completo</Text>
                        <TextInput
                            style={s.input}
                            placeholder="Juan Pérez"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />

                        <Text style={s.etiqueta}>Correo Electrónico</Text>
                        <TextInput
                            style={s.input}
                            placeholder="correo@ejemplo.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={s.etiqueta}>Número de Teléfono</Text>
                        <TextInput
                            style={s.input}
                            placeholder="+52 55 1234 5678"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />

                        <Text style={s.etiqueta}>Contraseña</Text>
                        <TextInput
                            style={s.input}
                            placeholder="Crea una contraseña segura"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity onPress={handleSignUp} disabled={isLoading} style={{ marginTop: 24 }}>
                            <LinearGradient colors={[R.gradStart, R.gradEnd]} style={s.botonGuardar}>
                                {isLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={s.textoGuardar}>Registrarse</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.botonSecundario}>
                            <Text style={s.textoSecundario}>¿Ya tienes cuenta? Inicia sesión</Text>
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
    encabezado: { alignItems: 'center', marginBottom: 30 },
    tituloEncabezado: { fontSize: 28, fontWeight: '800', color: R.headerTitle },
    subtituloEncabezado: { fontSize: 15, color: R.subtitle, marginTop: 8 },
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
    botonGuardar: {
        height: 54, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
        shadowColor: R.gradEnd, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
    },
    textoGuardar: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
    botonSecundario: { alignItems: 'center', marginTop: 16, paddingVertical: 10 },
    textoSecundario: { color: R.labelColor, fontSize: 14, fontWeight: '600' },
});
