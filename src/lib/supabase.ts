
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://bupbikzhhouzlwzpkwxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGJpa3poaG91emx3enBrd3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxOTIzNzMsImV4cCI6MjA1Mzc2ODM3M30.BtBddvYNvcG-rnsKg_LuTtWEfMHqc8wLO3QIE_EXU88";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
