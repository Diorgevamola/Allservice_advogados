
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length === 2) {
                    process.env[parts[0].trim()] = parts[1].trim();
                }
            });
        }
    } catch (e) {
        console.error("Error loading env:", e);
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Testing numero_dos_atendentes access...");

    // 1. Try to fetch any row to check general access
    const { data: list, error: listError } = await supabase
        .from('numero_dos_atendentes')
        .select('*')
        .limit(1);

    if (listError) {
        console.error("List Error:", listError);
    } else {
        console.log("List Success. Count:", list.length);
        if (list.length > 0) {
            console.log("First item sample:", list[0]);
            console.log("ID Type:", typeof list[0].id);
        }
    }

    // 2. Try to verify specific error scenarios if we had an ID
    // We don't have a specific ID, but we can verify if selecting * works.
}

run();
