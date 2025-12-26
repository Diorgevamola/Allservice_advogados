const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
    console.log("Checking table: numero_dos_atendentes");
    const { data: users, error: err1 } = await supabase.from('numero_dos_atendentes').select('*').limit(1);
    if (users && users.length) console.log('numero_dos_atendentes keys:', Object.keys(users[0]));
    else console.log('numero_dos_atendentes Error or Empty:', err1);

    console.log("Checking table: Todos os clientes");
    const { data: leads, error: err2 } = await supabase.from('Todos os clientes').select('*').limit(1);
    if (leads && leads.length) console.log('Todos os clientes keys:', Object.keys(leads[0]));
    else console.log('Todos os clientes Error or Empty:', err2);
}
inspect();
