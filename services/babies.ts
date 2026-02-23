import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type DatosRow = Database['public']['Tables']['Datos']['Row'];
type DatosInsert = Database['public']['Tables']['Datos']['Insert'];
type DatosUpdate = Database['public']['Tables']['Datos']['Update'];

export interface CreateDatosInput {
    primer_Nombre?: string;
    segundo_Nombre?: string;
    apellido_Paterno?: string;
    apellido_Materno?: string;
    fecha_Nacimiento?: string;
    sexo?: 'Femenino' | 'Masculino';
}

export interface UpdateDatosInput extends Partial<CreateDatosInput> { }

export const babyService = {
    async getBabies() {
        // Recuperamos los registros de Datos donde id_Anexo sea el usuario actual
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data, error } = await supabase
            .from('datos' as any)
            .select('*')
            .eq('id_Anexo', userData.user.id);

        if (error) throw error;
        return data as unknown as DatosRow[];
    },

    // Obtener un registro por su ID
    async getBabyById(id: number) {
        const { data, error } = await supabase
            .from('datos' as any)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as unknown as DatosRow;
    },

    // Registrar un nuevo registro
    async createBaby(babyData: CreateDatosInput) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const payload: DatosInsert = {
            id_Anexo: userData.user.id,
            primer_Nombre: babyData.primer_Nombre,
            segundo_Nombre: babyData.segundo_Nombre,
            apellido_Paterno: babyData.apellido_Paterno,
            apellido_Materno: babyData.apellido_Materno,
            fecha_Nacimiento: babyData.fecha_Nacimiento,
            sexo: babyData.sexo,
        };

        const { data, error } = await supabase
            .from('datos' as any)
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as DatosRow;
    },

    // Actualizar datos
    async updateBaby(id: number, updates: DatosUpdate) {
        const { data, error } = await supabase
            .from('datos' as any)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as DatosRow;
    },

    // Eliminar un registro
    async deleteBaby(id: number) {
        const { error } = await supabase
            .from('datos' as any)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
