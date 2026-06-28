import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://jtkeyfcgjscyvtuomlnv.supabase.co';
const supabaseAnonKey = 'sb_publishable_oq5CD_Dove5B2FOboTRRng_KHX6wqqT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit',
  },
});
