'use server';

import { getUserProfile } from "@/app/(dashboard)/perfil/actions";

export async function getWhatsAppStatus() {
    try {
        const profile = await getUserProfile();

        if (!profile.token_uazapi) {
            return { state: 'not_initialized', error: "Token ausente. Clique em conectar para criar uma nova instância." };
        }

        const apiUrl = process.env.NEXT_PUBLIC_UAZAPI_URL || profile.url_uazapi;

        if (!apiUrl) {
            return { state: 'disconnected', error: "URL da API não configurada." };
        }

        const endpoint = `${apiUrl}/instance/status`;

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

        console.log("🔍 [DEBUG] RAW Uazapi Status Response:", JSON.stringify(data, null, 2));

        // Handle Uazapi response format (matching perfil/actions.ts)
        let state = 'unknown';

        // Priority 1: Check detailed instance status
        if (data?.instance?.status) {
            state = data.instance.status; // "disconnected" | "open" | "connecting"
        }
        // Priority 2: Check legacy state field
        else if (data?.instance?.state) {
            state = data.instance.state; // "open" | "connecting" | "close"
        }
        // Priority 3: Fallback to boolean connected status
        else if (data?.status?.connected === true) {
            state = 'open';
        } else if (data?.status?.connected === false) {
            // Only set close if we don't have a more specific status
            if (state === 'unknown') state = 'close';
        } else if (data?.state) {
            state = data.state;
        }

        // Normalize states for frontend
        const lowerState = state.toLowerCase();
        if (lowerState === 'connected') state = 'open';
        if (lowerState === 'disconnected') state = 'close'; // "close" in frontend means disconnected/show QR button

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

        const apiUrl = process.env.NEXT_PUBLIC_UAZAPI_URL || profile.url_uazapi;

        if (!apiUrl) {
            return { error: "URL da API não configurada no sistema." };
        }

        const endpoint = `${apiUrl}/instance/init`;

        // Generate instance name from office name or phone
        const instanceName = profile["Escritório"]?.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
            || `instance_${profile.telefone}`
            || `instance_${Date.now()}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'admintoken': process.env.UAZAPI_ADMIN_TOKEN || '',
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

        // Extract token from response - adjust based on actual Uazapi response format
        const instanceToken = data.token || data.instance?.token || data.apikey;

        if (!instanceToken) {
            console.error('Init response:', data);
            return { error: 'Token não retornado pela API após inicialização.' };
        }

        return { success: true, data, token: instanceToken };

    } catch (error: any) {
        console.error("initWhatsAppInstance exception:", error);
        return { error: error.message };
    }
}

export async function connectWhatsAppInstance(tokenOverride?: string) {
    try {
        const profile = await getUserProfile();
        const token = tokenOverride || profile.token_uazapi;

        if (!token) {
            return { error: "Token da Uazapi ausente. Complete seu Perfil primeiro." };
        }

        const apiUrl = process.env.NEXT_PUBLIC_UAZAPI_URL || profile.url_uazapi;

        if (!apiUrl) {
            return { error: "URL da API não configurada." };
        }

        const endpoint = `${apiUrl}/instance/connect`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: data.message || `Erro ao conectar: ${response.status}` };
        }

        // Handle different response formats from Uazapi
        let qrBase64 = null;

        if (typeof data === 'string') {
            qrBase64 = data;
        } else if (data.instance?.qrcode) {
            // Uazapi format: { instance: { qrcode: "data:image/png;base64,..." } }
            qrBase64 = data.instance.qrcode;
        } else if (data.base64) {
            qrBase64 = data.base64;
        } else if (data.qrcode) {
            qrBase64 = typeof data.qrcode === 'string' ? data.qrcode : data.qrcode.base64;
        }

        if (!qrBase64) {
            console.error('Unexpected API response:', data);
            return { error: 'Formato de resposta inesperado. Verifique os logs.' };
        }

        return { success: true, data: { base64: qrBase64 } };

    } catch (error: any) {
        console.error("connectWhatsAppInstance exception:", error);
        return { error: error.message };
    }
}
