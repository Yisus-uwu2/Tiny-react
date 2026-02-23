import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type SaludRow = Database['public']['Tables']['Salud']['Row'];
type SaludInsert = Database['public']['Tables']['Salud']['Insert'];
type SaludUpdate = Database['public']['Tables']['Salud']['Update'];

type SaludDetallesRow = Database['public']['Tables']['SaludDetalles']['Row'];
type SaludDetallesInsert = Database['public']['Tables']['SaludDetalles']['Insert'];
type SaludDetallesUpdate = Database['public']['Tables']['SaludDetalles']['Update'];

export const healthService = {
    // Obtener detalles de Salud
    async getSalud() {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data, error } = await supabase
            .from('salud' as any)
            .select('*')
            .eq('id_Anexo', userData.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as SaludRow | null;
    },

    // Upsert Salud
    async upsertSalud(saludData: Omit<SaludInsert, 'id_Anexo'>) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        // Verify if it exists
        const { data: existing } = await supabase.from('salud' as any).select('id').eq('id_Anexo', userData.user.id).single();

        if (existing) {
            const { data, error } = await supabase.from('salud' as any).update(saludData).eq('id_Anexo', userData.user.id).select().single();
            if (error) throw error;
            return data as unknown as SaludRow;
        } else {
            const { data, error } = await supabase.from('salud' as any).insert({ ...saludData, id_Anexo: userData.user.id }).select().single();
            if (error) throw error;
            return data as unknown as SaludRow;
        }
    },

    // Obtener detalles de SaludDetalles
    async getSaludDetalles() {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data, error } = await supabase
            .from('saluddetalles' as any)
            .select('*')
            .eq('id_Anexo', userData.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as unknown as SaludDetallesRow | null;
    },

    // Upsert SaludDetalles
    async upsertSaludDetalles(detallesData: Omit<SaludDetallesInsert, 'id_Anexo'>) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        // Verify if it exists
        const { data: existing } = await supabase.from('saluddetalles' as any).select('id').eq('id_Anexo', userData.user.id).single();

        if (existing) {
            const { data, error } = await supabase.from('saluddetalles' as any).update(detallesData).eq('id_Anexo', userData.user.id).select().single();
            if (error) throw error;
            return data as unknown as SaludDetallesRow;
        } else {
            const { data, error } = await supabase.from('saluddetalles' as any).insert({ ...detallesData, id_Anexo: userData.user.id }).select().single();
            if (error) throw error;
            return data as unknown as SaludDetallesRow;
        }
    }
};
