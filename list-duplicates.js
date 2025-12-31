require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    try {
        console.log("Checking for 554298673868 in table 'TeuCliente' with 'Telefone'...");
        const { data: testData, error: testError } = await supabase
            .from('TeuCliente')
            .select('*')
            .eq('Telefone', '554298673868');

        if (!testError) {
            console.log(`Found in table 'TeuCliente':`, testData.length, "records");
            if (testData.length > 0) console.log(JSON.stringify(testData, null, 2));
        } else {
            console.log(`Table 'TeuCliente' fetch error:`, testError.message);
        }

    } catch (err) {
        console.error("Crash:", err.message);
    }
}

check();
