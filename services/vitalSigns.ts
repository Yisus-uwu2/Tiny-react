import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type VitalSignRow = any;
type VitalSignInsert = any;

export const vitalSignsService = {
    // Obtener los últimos signos vitales de un bebé (tiempo real o más recientes)
    async getLatestVitalSigns(babyId: string, limit: number = 50) {
        const { data, error } = await supabase
            .from('vital_signs' as any)
            .select('*')
            .eq('baby_id', babyId)
            .order('recorded_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as VitalSignRow[];
    },

    // Registrar un nuevo signo vital (generalmente lo hará el hardware, pero útil para testing)
    async recordVitalSign(vitalData: VitalSignInsert) {
        const { data, error } = await supabase
            .from('vital_signs' as any)
            .insert(vitalData)
            .select()
            .single();

        if (error) throw error;
        return data as VitalSignRow;
    },

    // Suscribirse a nuevos signos vitales en tiempo real
    subscribeToVitalSigns(babyId: string, onInsert: (payload: any) => void) {
        return supabase
            .channel('vital_signs_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'vital_signs',
                    filter: `baby_id=eq.${babyId}`
                },
                (payload) => onInsert(payload.new)
            )
            .subscribe();
    }
};
