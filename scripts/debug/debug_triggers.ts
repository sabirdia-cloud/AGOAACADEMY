import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ouskqpcmsldrzgjkksju.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91c2txcGNtc2xkcnpnamtrc2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MjQ3MzksImV4cCI6MjA4ODUwMDczOX0.lCn5Zo4ZfMoaM4-Fd_Z0l0vOFNwOgPG5_P7hhIUAugA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTriggers() {
    console.log("--- Listing Triggers on players table ---");
    const { data, error } = await supabase.rpc('get_triggers', { table_name: 'players' });
    if (error) {
        // If RPC doesn't exist, we try a raw query via a temporary function if possible, 
        // but let's just try to query information_schema if we had a proxy.
        // Since we don't have a direct SQL runner that returns data, let's try to 
        // guess the triggers or provide a "kill all" SQL.
        console.log("Could not list triggers directly via RPC. Error:", error.message);
    } else {
        console.log("Triggers:", data);
    }
}

async function checkPlayerTableSchemaDetailed() {
    console.log("--- Checking Players Table Schema Detailed ---");
    const { data, error } = await supabase.from('players').select('*').limit(0);
    if (error) {
        console.log("Error:", error.message);
    } else {
        // This won't give us triggers, but let's see if we missed any hidden columns
        console.log("Columns:", Object.keys(data));
    }
}

listTriggers();
checkPlayerTableSchemaDetailed();
