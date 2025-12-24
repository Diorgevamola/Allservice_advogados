
'use client';

import { useState, useEffect } from 'react';
import { fetchChats, fetchMessages, getLeadDetails } from './actions';
import { UazapiChat, UazapiMessage } from '@/lib/uazapi';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, Phone, MoreVertical, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ChatsPage() {
    const [chats, setChats] = useState<UazapiChat[]>([]);
    const [selectedChat, setSelectedChat] = useState<UazapiChat | null>(null);
    const [messages, setMessages] = useState<UazapiMessage[]>([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Profile state
    const [leadDetails, setLeadDetails] = useState<any>(null);
    const [showProfile, setShowProfile] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [limit, setLimit] = useState<number>(100);

    // Initial load + polling for chats list (every 10 seconds)
    useEffect(() => {
        loadChats(); // Initial load
        const interval = setInterval(() => {
            loadChats(true); // silent update
        }, 10000);
        return () => clearInterval(interval);
    }, [limit]);

    // Polling for messages (every 3 seconds) if chat is selected
    useEffect(() => {
        if (!selectedChat) return;

        const interval = setInterval(() => {
            loadMessages(selectedChat.wa_chatid, true); // silent update
        }, 3000);

        return () => clearInterval(interval);
    }, [selectedChat]);

    useEffect(() => {
        if (selectedChat) {
            loadMessages(selectedChat.wa_chatid);
            // Fetch lead details
            const phone = selectedChat.phone || (selectedChat.wa_chatid.includes('@') ? selectedChat.wa_chatid.split('@')[0] : selectedChat.wa_chatid);
            getLeadDetails(phone).then(data => {
                setLeadDetails(data);
            });
        } else {
            setLeadDetails(null);
            setShowProfile(false);
        }
    }, [selectedChat]);

    // Scroll to bottom when messages update
    // Scroll to bottom when messages update
    useEffect(() => {
        // Target the viewport inside the message area specifically
        const messageArea = document.getElementById('message-area-scroll');
        const viewport = messageArea?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }, [messages]);

    async function loadChats(silent = false) {
        if (!silent) setLoadingChats(true);
        setError(null);
        try {
            const res = await fetchChats(1, limit);

            if (res.error) {
                console.error("Chats error from server:", res.error);
                if (!silent) setError(res.error);
            } else if (res.chats || res.response) {
                const data = res.chats || res.response || [];
                setChats(data);
            }
        } catch (err) {
            console.error("Unexpected error in loadChats:", err);
            if (!silent) setError("Erro inesperado ao carregar chats.");
        }
        if (!silent) setLoadingChats(false);
    }

    async function loadMessages(chatId: string, silent = false) {
        if (!silent) {
            setLoadingMessages(true);
            setMessages([]); // Clear previous messages immediately to avoid confusion
        }

        try {
            const res = await fetchMessages(chatId);

            // Race condition check: ensure we are still looking at the same chat
            if (chatId !== selectedChat?.wa_chatid && !silent) return;
            // For silent updates, we also check, but we rely on the effect cleanup mostly. 
            // However, inside the async function, selectedChat might have changed.
            // Since we can't easily access the *current* selectedChat ref here without a ref, 
            // we rely on the fact that if the user switched, the component re-rendered and this 
            // closure is stale or the effect was cleaned up. 
            // BUT, strictly speaking, async continuations can run. 
            // A simple check against the state available in closure is tricky if it's stale. 
            // For now, clearing messages on start of non-silent load helps UI responsiveness.

            const data = res.messages || res.response;
            if (data) {
                // Reverse so oldest is at top for standard chat view
                // If silent, we might want to check if data changed, but replacing is strictly easier for now.
                setMessages(data.reverse());
            }
        } catch (error) {
            console.error("Error loading messages:", error);
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    }

    const filteredChats = chats.filter(chat => {
        const name = (chat.wa_name || chat.wa_contactName || chat.name || chat.wa_chatid || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    const getLastMessageDisplay = (chat: UazapiChat) => {
        if (chat.wa_lastMessageType === 'image') return '📷 Foto';
        if (chat.wa_lastMessageType === 'video') return '🎥 Vídeo';
        if (chat.wa_lastMessageType === 'audio') return '🎙️ Áudio';
        if (chat.wa_lastMessageType === 'document') return '📄 Documento';
        if (chat.wa_lastMessageType === 'sticker') return '✨ Figurinha';

        return chat.wa_lastMessageTextVote || chat.wa_lastMessageText || chat.last_message?.message || "Sem mensagens";
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* Chat List */}
            <Card className="w-[350px] flex flex-col bg-card/50 backdrop-blur-sm border-r border-y-0 border-l-0 rounded-none overflow-hidden">
                <div className="p-4 border-b border-border space-y-4">
                    <h2 className="text-xl font-semibold text-foreground">Conversas</h2>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar conversas..."
                            className="pl-8 bg-background/50 border-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                {error && (
                    <div className="p-4 m-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                        {error}
                    </div>
                )}
                <ScrollArea className="flex-1 min-h-0">
                    {loadingChats ? (
                        <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                    ) : (
                        <div className="flex flex-col gap-1 p-2">
                            {filteredChats.map(chat => (
                                <button
                                    key={chat.wa_chatid || chat.id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${selectedChat?.wa_chatid === chat.wa_chatid
                                        ? 'bg-primary/20 hover:bg-primary/30'
                                        : 'hover:bg-muted/50'
                                        }`}
                                >
                                    <Avatar>
                                        <AvatarImage src={chat.image || chat.profileParams?.imgUrl} />
                                        <AvatarFallback>{(chat.wa_name || chat.wa_contactName || chat.name || "U")?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-medium truncate text-sm text-foreground">
                                                {chat.wa_name || chat.wa_contactName || chat.name || chat.wa_chatid.split('@')[0]}
                                            </span>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                {chat.wa_lastMsgTimestamp ? format(new Date(chat.wa_lastMsgTimestamp), 'HH:mm', { locale: ptBR }) : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {getLastMessageDisplay(chat)}
                                        </p>
                                    </div>
                                    {chat.wa_unreadCount > 0 && (
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                            {chat.wa_unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t border-border flex justify-end items-center gap-2">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">Mostrar:</span>
                    <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                        <SelectTrigger className="w-[100px] h-7 bg-transparent border-border text-[10px]">
                            <SelectValue placeholder="Linhas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="100">100 chats</SelectItem>
                            <SelectItem value="500">500 chats</SelectItem>
                            <SelectItem value="1000">1000 chats</SelectItem>
                            <SelectItem value="0">Todos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Message Area */}
            <Card className="flex-1 flex flex-row bg-card/50 backdrop-blur-sm border-none rounded-none overflow-hidden relative">
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${showProfile ? 'mr-[0px]' : ''}`}>
                    {selectedChat ? (
                        <>
                            <div className="p-4 border-b border-border flex justify-between items-center bg-card/80">
                                <div
                                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setShowProfile(!showProfile)}
                                >
                                    <Avatar>
                                        <AvatarImage src={selectedChat.image || selectedChat.profileParams?.imgUrl} />
                                        <AvatarFallback>{(selectedChat.wa_name || selectedChat.wa_contactName || selectedChat.name || "U")?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-foreground">{selectedChat.wa_name || selectedChat.wa_contactName || selectedChat.name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedChat.phone || `+${selectedChat.wa_chatid.split('@')[0]}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 text-muted-foreground">
                                    <Phone className="h-5 w-5 cursor-pointer hover:text-foreground" />
                                    <MoreVertical className="h-5 w-5 cursor-pointer hover:text-foreground" onClick={() => setShowProfile(!showProfile)} />
                                </div>
                            </div>

                            <ScrollArea id="message-area-scroll" className="flex-1 min-h-0 p-4">
                                <div className="space-y-4 flex flex-col">
                                    {loadingMessages ? (
                                        <div className="text-center text-muted-foreground mt-10">Carregando mensagens...</div>
                                    ) : (
                                        messages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.fromMe
                                                    ? 'bg-primary/20 text-foreground self-end rounded-br-none'
                                                    : 'bg-muted text-foreground self-start rounded-bl-none'
                                                    }`}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    {msg.messageType === 'audio' || msg.messageType === 'ptt' || msg.messageType === 'voice' ? (
                                                        msg.fileURL ? (
                                                            <audio controls src={msg.fileURL} className="max-w-[240px]" />
                                                        ) : (
                                                            <span className="italic opacity-70">🎙️ Áudio indisponível</span>
                                                        )
                                                    ) : msg.messageType === 'image' ? (
                                                        msg.fileURL ? (
                                                            <img src={msg.fileURL} alt="Imagem" className="max-w-[240px] rounded-lg cursor-pointer hover:opacity-90" onClick={() => window.open(msg.fileURL, '_blank')} />
                                                        ) : (
                                                            <span className="italic opacity-70">📷 Foto indisponível</span>
                                                        )
                                                    ) : msg.messageType === 'video' ? (
                                                        msg.fileURL ? (
                                                            <video controls src={msg.fileURL} className="max-w-[240px] rounded-lg" />
                                                        ) : (
                                                            <span className="italic opacity-70">🎥 Vídeo indisponível</span>
                                                        )
                                                    ) : msg.messageType === 'document' ? (
                                                        msg.fileURL ? (
                                                            <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline">
                                                                📄 Documento
                                                            </a>
                                                        ) : (
                                                            <span className="italic opacity-70">📄 Documento indisponível</span>
                                                        )
                                                    ) : (
                                                        <p>{msg.text}</p>
                                                    )}

                                                    {/* Caption for media if text exists and is not just the type/url */}
                                                    {(msg.messageType === 'image' || msg.messageType === 'video') && msg.text && msg.text !== 'image' && msg.text !== 'video' && (
                                                        <p className="mt-1">{msg.text}</p>
                                                    )}
                                                </div>
                                                <span className="text-[10px] opacity-70 block text-right mt-1">
                                                    {format(new Date(msg.messageTimestamp), 'HH:mm')}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t border-border bg-card/80">
                                <div className="flex gap-2">
                                    <Input placeholder="Digite uma mensagem..." className="flex-1 bg-background" />
                                    <button className="p-2 bg-primary rounded-md text-primary-foreground hover:bg-primary/90">
                                        <MessageSquare className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                            <p>Selecione uma conversa para visualizar</p>
                        </div>
                    )}
                </div>

                {/* Profile Panel */}
                {selectedChat && showProfile && (
                    <div className="w-[300px] border-l border-border bg-card overflow-y-auto p-4 animate-in slide-in-from-right duration-300 absolute inset-y-0 right-0 shadow-lg z-10">
                        <div className="flex flex-col items-center mb-6">
                            <Avatar className="h-20 w-20 mb-3">
                                <AvatarImage src={selectedChat.image || selectedChat.profileParams?.imgUrl} />
                                <AvatarFallback>{(selectedChat.wa_name || selectedChat.wa_contactName || selectedChat.name || "U")?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <h2 className="text-lg font-bold text-center">{selectedChat.wa_name || selectedChat.wa_contactName}</h2>
                            <p className="text-sm text-muted-foreground">{selectedChat.phone || `+${selectedChat.wa_chatid.split('@')[0]}`}</p>
                        </div>

                        {leadDetails ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Informações do Lead</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Status:</span>
                                            <span className="font-medium text-foreground">{leadDetails.Status || leadDetails.status || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Criado em:</span>
                                            <span className="font-medium text-foreground">
                                                {leadDetails.created_at ? format(new Date(leadDetails.created_at), 'dd/MM/yyyy') : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Follow-up 1:</span>
                                            <span className={`font-medium ${leadDetails.follow_up_1_enviado ? 'text-green-500' : 'text-foreground'}`}>
                                                {leadDetails.follow_up_1_enviado ? 'Enviado' : 'Pendente'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Follow-up 2:</span>
                                            <span className={`font-medium ${leadDetails.follow_up_2_enviado ? 'text-green-500' : 'text-foreground'}`}>
                                                {leadDetails.follow_up_2_enviado ? 'Enviado' : 'Pendente'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {leadDetails['resumo da conversa'] && (
                                    <div>
                                        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Resumo</h3>
                                        <p className="text-sm bg-muted/30 p-2 rounded-md border border-border">
                                            {leadDetails['resumo da conversa']}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Perguntas Respondidas</h3>
                                    <div className="space-y-1 text-sm">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => {
                                            const val = leadDetails[`t${i}`];
                                            if (val === true || val === 'true' || val === 'TRUE') {
                                                return (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <span className="h-4 w-4 bg-green-500/20 text-green-500 rounded flex items-center justify-center text-[10px] font-bold">✓</span>
                                                        <span>Pergunta T{i}</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                        {![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].some(i => leadDetails[`t${i}`] === true) && (
                                            <span className="text-muted-foreground italic text-xs">Nenhuma resposta registrada.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 text-center border border-dashed border-border rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    Lead não encontrado na base de dados para este telefone.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}
