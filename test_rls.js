require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function updateTest() {
    const { data, error } = await supabase.from('users').update({ full_name: 'test_rls' }).eq('id', 'bfb72720-32ee-4fce-a587-9190ef571320');
    if (error) console.error("RLS Error:", error);
    else console.log("Update success:", data);
}

updateTest();
