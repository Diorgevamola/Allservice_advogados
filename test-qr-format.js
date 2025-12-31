// Teste simples para verificar formato do QR Code
require('dotenv').config({ path: '.env.local' });

const UAZAPI_URL = process.env.NEXT_PUBLIC_UAZAPI_URL;
const ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN;

async function test() {
    // 1. Init
    console.log('1️⃣ Criando instância...');
    const initRes = await fetch(`${UAZAPI_URL}/instance/init`, {
        method: 'POST',
        headers: { 'admintoken': ADMIN_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `teste_${Date.now()}` })
    });
    const initData = await response.json();
    const token = initData.token;
    console.log(`✅ Token: ${token}\n`);

    // 2. Connect
    console.log('2️⃣ Conectando...');
    const connectRes = await fetch(`${UAZAPI_URL}/instance/connect`, {
        method: 'POST',
        headers: { 'token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
    const connectData = await connectRes.json();

    console.log('\n📦 Estrutura da resposta:');
    console.log(`- typeof data: ${typeof connectData}`);
    console.log(`- data.base64: ${connectData.base64 ? 'EXISTS' : 'null'}`);
    console.log(`- data.qrcode: ${connectData.qrcode ? 'EXISTS' : 'null'}`);
    console.log(`- data.instance: ${connectData.instance ? 'EXISTS' : 'null'}`);
    console.log(`- data.instance.qrcode: ${connectData.instance?.qrcode ? 'EXISTS ✅' : 'null'}`);

    if (connectData.instance?.qrcode) {
        const qr = connectData.instance.qrcode;
        console.log(`\n🎯 QR Code encontrado!`);
        console.log(`Tamanho: ${qr.length} caracteres`);
        console.log(`Primeiros 50: ${qr.substring(0, 50)}...`);
    }
}

test().catch(console.error);
