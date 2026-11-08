import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ouskqpcmsldrzgjkksju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91c2txcGNtc2xkcnpnamtrc2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MjQ3MzksImV4cCI6MjA4ODUwMDczOX0.lCn5Zo4ZfMoaM4-Fd_Z0l0vOFNwOgPG5_P7hhIUAugA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const basicPayload = {
    player_id: 36, // Using valid player from previous test
    coach_id: null,
    date: new Date().toISOString().split('T')[0],
    technical: 5.5,
    tactical: 5.5,
    physical: 5.5,
    mental: 5.5,
    notes: 'Test note float'
  };

  const { data, error } = await supabase.from('evaluations').insert([basicPayload]).select();
  console.log('Result with floats:', { data, error });
}

run();
