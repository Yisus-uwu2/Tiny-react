import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type UserAdministradorInsert = Database['public']['Tables']['UserAdministrador']['Insert'];

export const authService = {
    // Registrarse con email, contraseña y teléfono
    async signUp({ email, password, phone_number, full_name }: { email: string; password: string; phone_number: string; full_name: string }) {
        // 1. Crear el usuario en auth.users
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            phone: phone_number,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Error al crear el usuario en Supabase.');

        // 2. Crear el registro vinculante en la tabla 'UserAdministrador' usando el ID generado
        const parentData: UserAdministradorInsert = {
            id_Principal: authData.user.id,
            correo: authData.user.email,
            usuario: full_name,
            password: password, // As per user schema, storing plain password or hashed (ideally we wouldn't, but following schema)
        };

        const { error: dbError } = await supabase
            .from('UserAdministrador')
            .insert(parentData);

        if (dbError) {
            // Si falla la inserción, opcionalmente deberíamos borrar o notificar error crítico
            console.error('Error inserting UserAdministrador', dbError);
            throw dbError;
        }

        return authData.user;
    },

    // Iniciar sesión
    async signIn({ email, password }: { email: string; password: string }) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data.user;
    },

    // Cerrar sesión
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // Obtener la sesión actual
    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    }
};
