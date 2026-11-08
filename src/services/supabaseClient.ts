import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ouskqpcmsldrzgjkksju.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91c2txcGNtc2xkcnpnamtrc2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MjQ3MzksImV4cCI6MjA4ODUwMDczOX0.lCn5Zo4ZfMoaM4-Fd_Z0l0vOFNwOgPG5_P7hhIUAugA';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY) {
  console.warn("Using default Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY in your environment variables for custom database access.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
