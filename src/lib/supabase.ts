import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://arfmaikmiraqykgvzskt.supabase.co';
const supabaseKey = 'sb_publishable_KFeKqAPQl0DhGz1tvKh4UQ_to4AXtBp';

export const supabase = createClient(supabaseUrl, supabaseKey);
