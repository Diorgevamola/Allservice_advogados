
async function diagnosticMessages() {
    const token = '9d1e432a-6530-47ad-9cde-f15109051f68';
    const baseUrl = 'https://syxlabs.uazapi.com';

    console.log("--- Starting Uazapi Diagnostic ---");

    try {
        // 1. Get 10 Chats
        const chatRes = await fetch(`${baseUrl}/chat/find`, {
            method: 'POST',
            headers: { 'token': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit: 10, sort: "-wa_lastMsgTimestamp" })
        });

        const chatData = await chatRes.json();
        const chats = chatData.chats || chatData.response || [];

        console.log(`Found ${chats.length} chats.`);

        for (const chat of chats) {
            const chatId = chat.wa_chatid || chat.id;
            console.log(`\nChecking Chat: ${chat.wa_name || chat.name || chatId} (${chatId})`);

            // 2. Get Messages for each chat
            const msgRes = await fetch(`${baseUrl}/message/find`, {
                method: 'POST',
                headers: { 'token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatid: chatId, limit: 50, sort: "-messageTimestamp" })
            });

            const msgData = await msgRes.json();
            const messages = msgData.messages || msgData.response || [];

            console.log(`  Messages found: ${messages.length}`);

            if (messages.length > 0) {
                const sample = messages[0];
                console.log(`  - Raw Sample: fromMe=${typeof sample.fromMe}(${sample.fromMe}), timestamp=${typeof sample.messageTimestamp}(${sample.messageTimestamp}), text="${sample.text?.substring(0, 30)}..."`);

                const clientMsgs = messages.filter((m: any) => m.fromMe === false || m.fromMe === "false");
                const ourMsgs = messages.filter((m: any) => m.fromMe === true || m.fromMe === "true");

                console.log(`  - Combined Logic: Client=${clientMsgs.length}, Our=${ourMsgs.length}`);
            } else {
                console.log("  - Chat is empty.");
            }
        }

    } catch (e) {
        console.error("Diagnostic failed:", e);
    }
}

diagnosticMessages();
