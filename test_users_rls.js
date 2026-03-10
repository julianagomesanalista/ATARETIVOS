require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); // Or query via raw postgres if we had connection string. We can just try to fetch all users using the test user's anon session.

async function checkUsersAsTestUser() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // login as the test user
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'juliana.gomes@ativos.com',
        password: 'password123' // Or we can just use jwt if they have google login... wait, let's just make an anonymous query first? 
    });
    
    // Actually, RLS might just require authenticated role, but wait... 
    // What if we just select * as anon?
    const { data, error } = await supabase.from('users').select('*');
    if (error) console.error("Anon select Error:", error);
    else console.log("Anon select:", data?.map(u => u.email));
}

checkUsersAsTestUser();
