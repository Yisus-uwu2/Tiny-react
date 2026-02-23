import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type DailyLogRow = any;
type DailyLogInsert = any;

export const dailyLogsService = {
    // Obtener bitácora de un bebé para un día específico
    async getLogsByDate(babyId: string, date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('daily_logs' as any)
            .select('*')
            .eq('baby_id', babyId)
            .gte('started_at', startOfDay.toISOString())
            .lte('started_at', endOfDay.toISOString())
            .order('started_at', { ascending: false });

        if (error) throw error;
        return data as DailyLogRow[];
    },

    // Registrar un nuevo evento en la bitácora
    async createLog(logData: DailyLogInsert) {
        const { data, error } = await supabase
            .from('daily_logs' as any)
            .insert(logData)
            .select()
            .single();

        if (error) throw error;
        return data as DailyLogRow;
    },

    // Eliminar un evento de la bitácora
    async deleteLog(id: string) {
        const { error } = await supabase
            .from('daily_logs' as any)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
