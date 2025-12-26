const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env.local
const envPath = path.resolve(__dirname, '.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

const envVars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (key && !key.startsWith('#')) {
            envVars[key] = val.replace(/^["']|["']$/g, ''); // User simple quote stripping
        }
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing keys in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Checking table: numero_dos_atendentes");
    const { data: users, error: err1 } = await supabase.from('numero_dos_atendentes').select('*').limit(1);
    if (users && users.length) console.log('numero_dos_atendentes keys:', Object.keys(users[0]));
    else {
        if (err1) console.log('numero_dos_atendentes Error:', err1);
        else console.log('numero_dos_atendentes is empty');
    }

    // Checking if there is a 'users' table or similar?
    const { data: usersTable, error: errUser } = await supabase.from('users').select('*').limit(1);
    if (!errUser) console.log("'users' table exists!");
}
inspect();
