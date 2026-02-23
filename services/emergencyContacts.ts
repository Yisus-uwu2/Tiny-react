import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type EmergencyContactRow = Database['public']['Tables']['Emergencias']['Row'];
type EmergencyContactInsert = Database['public']['Tables']['Emergencias']['Insert'];
type EmergencyContactUpdate = Database['public']['Tables']['Emergencias']['Update'];

export const emergencyContactService = {
    // Obtener todos los contactos de emergencia
    async getEmergencyContacts() {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data, error } = await supabase
            .from('Emergencias')
            .select('*')
            .eq('id_Anexo', userData.user.id);

        if (error) throw error;
        return data as EmergencyContactRow[];
    },

    // Obtener un contacto por su ID
    async getEmergencyContactById(id: number) {
        const { data, error } = await supabase
            .from('Emergencias')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as EmergencyContactRow;
    },

    // Registrar un nuevo contacto de emergencia
    async createEmergencyContact(contactData: Omit<EmergencyContactInsert, 'id_Anexo'>) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data, error } = await supabase
            .from('Emergencias')
            .insert({ ...contactData, id_Anexo: userData.user.id })
            .select()
            .single();

        if (error) throw error;
        return data as EmergencyContactRow;
    },

    // Actualizar datos de un contacto
    async updateEmergencyContact(id: number, updates: EmergencyContactUpdate) {
        const { data, error } = await supabase
            .from('Emergencias')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as EmergencyContactRow;
    },

    // Eliminar un contacto de emergencia
    async deleteEmergencyContact(id: number) {
        const { error } = await supabase
            .from('Emergencias')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
