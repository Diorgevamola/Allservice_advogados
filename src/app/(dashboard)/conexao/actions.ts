'use server';

import { getUserProfile } from "@/app/(dashboard)/perfil/actions";

export async function getWhatsAppStatus() {
    try {
        const profile = await getUserProfile();

        if (!profile.token_uazapi || !profile.url_uazapi) {
            return { state: 'disconnected', error: "Configurações do WhatsApp ausentes no perfil." };
        }

        const endpoint = `${profile.url_uazapi}/instance/status`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'token': profile.token_uazapi,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            next: { revalidate: 0 }
        });

        if (!response.ok) {
            if (response.status === 404 || response.status === 401) {
                return { state: 'not_initialized', error: "Instância não inicializada ou token inválido." };
            }
            return { state: 'error', error: `Erro na API: ${response.status}` };
        }

        const data = await response.json();

        // Handle Uazapi response format (matching perfil/actions.ts)
        let state = 'unknown';
        if (data?.instance?.state) {
            state = data.instance.state; // "open" | "connecting" | "close"
        } else if (data?.status?.connected === true) {
            state = 'open';
        } else if (data?.status?.connected === false) {
            state = 'close';
        } else if (data?.state) {
            state = data.state;
        }

        // Standardize "connected" to "open" for frontend consistency if needed
        if (state.toLowerCase() === 'connected') state = 'open';

        return {
            state,
            raw: data,
            config: {
                url: profile.url_uazapi,
                token: profile.token_uazapi
            }
        };

    } catch (error: any) {
        console.error("getWhatsAppStatus exception:", error);
        return { state: 'error', error: error.message };
    }
}

export async function initWhatsAppInstance() {
    try {
        const profile = await getUserProfile();

        if (!profile.token_uazapi || !profile.url_uazapi) {
            return { error: "Configure sua URL e Token no Perfil primeiro." };
        }

        // According to docs, init might need an admintoken
        // However, the user said "use o token da uazapi que está na coluna token_uazapi"
        // Let's use the token provided in the header as 'admintoken' for init as per generic Uazapi/Evolution docs if needed
        // But the user's specific request says "use o token... que está no banco de dados"

        const endpoint = `${profile.url_uazapi}/instance/init`;

        // Normally instance name is required. Since we don't have a specific column for it, 
        // we'll use a sanitized version of the office name or the token itself as a fallback identifier.
        const instanceName = profile["Escritório"]?.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || "instancia_advogado";

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'admintoken': process.env.UAZAPI_ADMIN_TOKEN || profile.token_uazapi, // Switch to admintoken header
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: instanceName
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: data.message || `Erro ao inicializar: ${response.status}` };
        }

        return { success: true, data };

    } catch (error: any) {
        console.error("initWhatsAppInstance exception:", error);
        return { error: error.message };
    }
}

export async function connectWhatsAppInstance() {
    try {
        const profile = await getUserProfile();

        if (!profile.token_uazapi || !profile.url_uazapi) {
            return { error: "URL e Token da Uazapi ausentes. Complete seu Perfil primeiro." };
        }

        const endpoint = `${profile.url_uazapi}/instance/connect`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'token': profile.token_uazapi,
                'Content-Type': 'application/json'
            },
            // Optional: specify phone if needed for pairing code, 
            // but usually we want QR code first for a fresh connect.
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: data.message || `Erro ao conectar: ${response.status}` };
        }

        // data often contains { base64: "...", qrcode: "..." }
        return { success: true, data };

    } catch (error: any) {
        console.error("connectWhatsAppInstance exception:", error);
        return { error: error.message };
    }
}
