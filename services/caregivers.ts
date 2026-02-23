import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type CaregiverRow = Database['public']['Tables']['Cuidadores']['Row'];
type CaregiverInsert = Database['public']['Tables']['Cuidadores']['Insert'];
type CaregiverUpdate = Database['public']['Tables']['Cuidadores']['Update'];

export const caregiverService = {
    // Obtener todos los cuidadores
    async getCaregivers() {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data, error } = await supabase
            .from('Cuidadores')
            .select('*')
            .eq('id_Anexo', userData.user.id);

        if (error) throw error;
        return data as CaregiverRow[];
    },

    // Obtener un cuidador por su ID
    async getCaregiverById(id: number) {
        const { data, error } = await supabase
            .from('Cuidadores')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as CaregiverRow;
    },

    // Registrar un nuevo cuidador
    async createCaregiver(caregiverData: Omit<CaregiverInsert, 'id_Anexo'>) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data, error } = await supabase
            .from('Cuidadores')
            .insert({ ...caregiverData, id_Anexo: userData.user.id })
            .select()
            .single();

        if (error) throw error;
        return data as CaregiverRow;
    },

    // Actualizar datos de un cuidador
    async updateCaregiver(id: number, updates: CaregiverUpdate) {
        const { data, error } = await supabase
            .from('Cuidadores')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as CaregiverRow;
    },

    // Eliminar un cuidador
    async deleteCaregiver(id: number) {
        const { error } = await supabase
            .from('Cuidadores')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
