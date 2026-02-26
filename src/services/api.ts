import { createClient } from '@supabase/supabase-js';

// These would normally come from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const gameApi = {
    async fetchUserData(userId: string) {
        // Mock response for MVP
        console.log('Fetching user data for:', userId);
        return {
            id: userId,
            username: 'Маг-Ученик',
            level: 1,
            xp: 45,
            gold: 150,
            math_magic_level: 1,
            rus_magic_level: 1,
        };
    },

    async saveProgress(userId: string, updates: any) {
        console.log('Saving progress for:', userId, updates);
        // In real app: await supabase.from('profiles').update(updates).eq('id', userId);
        return { success: true };
    }
};
