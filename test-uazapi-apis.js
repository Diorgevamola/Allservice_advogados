// Script para testar APIs da Uazapi
require('dotenv').config({ path: '.env.local' });

const UAZAPI_URL = process.env.NEXT_PUBLIC_UAZAPI_URL || 'https://syxlabs.uazapi.com';
const ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN;

async function testInitInstance() {
    console.log('🔧 Testando criação de instância...\n');

    const instanceName = `teste_diorge_${Date.now()}`;
    console.log(`Nome da instância: ${instanceName}`);
    console.log(`URL: ${UAZAPI_URL}/instance/init`);
    console.log(`Admin Token: ${ADMIN_TOKEN?.substring(0, 10)}...`);
    console.log('');

    try {
        const response = await fetch(`${UAZAPI_URL}/instance/init`, {
            method: 'POST',
            headers: {
                'admintoken': ADMIN_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: instanceName
            })
        });

        const data = await response.json();

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log('\n📦 Resposta completa:');
        console.log(JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Instância criada com sucesso!');

            // Extrair token
            const token = data.token || data.instance?.token || data.apikey;
            if (token) {
                console.log(`\n🔑 Token gerado: ${token.substring(0, 20)}...`);
                return { success: true, token, instanceName, data };
            } else {
                console.log('\n⚠️ Token não encontrado na resposta');
                return { success: false, error: 'Token não retornado', data };
            }
        } else {
            console.log('\n❌ Erro ao criar instância');
            return { success: false, error: data.message || 'Erro desconhecido', data };
        }
    } catch (error) {
        console.error('\n❌ Exceção:', error.message);
        return { success: false, error: error.message };
    }
}

async function testConnectInstance(token) {
    console.log('\n\n🔌 Testando conexão da instância...\n');
    console.log(`URL: ${UAZAPI_URL}/instance/connect`);
    console.log(`Token: ${token?.substring(0, 20)}...`);
    console.log('');

    try {
        const response = await fetch(`${UAZAPI_URL}/instance/connect`, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        const data = await response.json();

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log('\n📦 Resposta completa:');
        console.log(JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Conexão iniciada com sucesso!');

            // Detectar formato do QR Code
            let qrBase64 = null;
            if (typeof data === 'string') {
                qrBase64 = data;
                console.log('\n📱 Formato: String direta');
            } else if (data.base64) {
                qrBase64 = data.base64;
                console.log('\n📱 Formato: { base64: "..." }');
            } else if (data.qrcode) {
                qrBase64 = typeof data.qrcode === 'string' ? data.qrcode : data.qrcode.base64;
                console.log('\n📱 Formato: { qrcode: ... }');
            }

            if (qrBase64) {
                console.log(`\n🎯 QR Code encontrado (${qrBase64.length} caracteres)`);
                console.log(`Primeiros 50 chars: ${qrBase64.substring(0, 50)}...`);
                return { success: true, qrBase64, data };
            } else {
                console.log('\n⚠️ QR Code não encontrado na resposta');
                return { success: false, error: 'QR Code não encontrado', data };
            }
        } else {
            console.log('\n❌ Erro ao conectar');
            return { success: false, error: data.message || 'Erro desconhecido', data };
        }
    } catch (error) {
        console.error('\n❌ Exceção:', error.message);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('═══════════════════════════════════════════');
    console.log('  TESTE DAS APIS UAZAPI');
    console.log('═══════════════════════════════════════════\n');

    // Teste 1: Criar instância
    const initResult = await testInitInstance();

    if (!initResult.success) {
        console.log('\n\n❌ Falha ao criar instância. Abortando testes.');
        return;
    }

    // Teste 2: Conectar instância
    const connectResult = await testConnectInstance(initResult.token);

    console.log('\n\n═══════════════════════════════════════════');
    console.log('  RESUMO DOS TESTES');
    console.log('═══════════════════════════════════════════');
    console.log(`Init: ${initResult.success ? '✅' : '❌'}`);
    console.log(`Connect: ${connectResult.success ? '✅' : '❌'}`);

    if (initResult.success && connectResult.success) {
        console.log('\n🎉 Todos os testes passaram!');
        console.log(`\nInstância: ${initResult.instanceName}`);
        console.log(`Token: ${initResult.token}`);
    }
}

runTests();
