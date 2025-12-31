import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

async function debugStatus() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase env vars:", { url: !!supabaseUrl, key: !!supabaseKey });
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('numero_dos_atendentes')
        .select('url_uazapi, token_uazapi, Escritório')
        .eq('telefone', '554298673868')
        .single();

    if (error) {
        console.error("Supabase Error:", error);
        return;
    }

    console.log("Client Found:", data.Escritório);
    console.log("URL:", data.url_uazapi);

    if (!data.url_uazapi || !data.token_uazapi) {
        console.log("Status: CONFIG_MISSING");
        return;
    }

    try {
        const endpoint = `${data.url_uazapi}/instance/status`;
        console.log("Testing endpoint:", endpoint);

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'token': data.token_uazapi,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log("Response OK:", response.ok);
        console.log("Status Code:", response.status);

        const result = await response.json();
        console.log("UAZAPI DATA:", JSON.stringify(result, null, 2));

    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

debugStatus();
