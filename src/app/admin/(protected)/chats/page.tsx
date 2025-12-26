'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchAllOffices } from "@/lib/api";
import { fetchChatsForOffice, fetchMessagesForOffice } from "@/app/(dashboard)/chats/actions";
import { UazapiChat, UazapiMessage } from "@/lib/uazapi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MessageSquare, Bot, User, Search, SlidersHorizontal, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

export default function AdminChatsPage() {
    const [offices, setOffices] = useState<any[]>([]);
    const [selectedOffice, setSelectedOffice] = useState<string>("");

    // Chat List State
    const [chats, setChats] = useState<UazapiChat[]>([]);
    const [loadingChats, setLoadingChats] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Selected Chat State
    const [selectedChat, setSelectedChat] = useState<UazapiChat | null>(null);
    const [messages, setMessages] = useState<UazapiMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [aiFilter, setAiFilter] = useState<'all' | 'ai' | 'human'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Em andamento' | 'Concluído' | 'Desqualificado'>('all');

    useEffect(() => {
        async function load() {
            const data = await fetchAllOffices();
            setOffices(data);
        }
        load();
    }, []);

    const loadChats = useCallback(async (officeId: string) => {
        if (!officeId) return;
        setLoadingChats(true);
        setError(null);
        try {
            const result = await fetchChatsForOffice(officeId);
            const chatList = result.chats || result.response || [];
            setChats(chatList);
            setSelectedChat(null); // Reset selection on office change
        } catch (err: any) {
            setError(err.message || "Erro ao carregar chats");
            setChats([]);
        } finally {
            setLoadingChats(false);
        }
    }, []);

    const loadMessages = useCallback(async (chatId: string, officeId: string) => {
        if (!chatId || !officeId) return;
        setLoadingMessages(true);
        try {
            const res = await fetchMessagesForOffice(officeId, chatId);
            const msgs = (res.messages || res.response || []).reverse();
            setMessages(msgs);

            // Scroll to bottom
            setTimeout(() => {
                const scrollArea = document.getElementById('admin-message-scroll');
                if (scrollArea) {
                    const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
                    if (scrollContainer) {
                        scrollContainer.scrollTop = scrollContainer.scrollHeight;
                    }
                }
            }, 100);
        } catch (error) {
            console.error("Error loading messages:", error);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        if (selectedOffice) {
            loadChats(selectedOffice);
        }
    }, [selectedOffice, loadChats]);

    const handleChatSelect = (chat: UazapiChat) => {
        setSelectedChat(chat);
        loadMessages(chat.wa_chatid, selectedOffice);
    };

    const formatTimestamp = (timestamp?: number) => {
        if (!timestamp) return "";
        try {
            return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true, locale: ptBR });
        } catch {
            return "";
        }
    };

    const getStatusColor = (status?: string) => {
        if (!status) return "border-transparent";
        const s = status.toLowerCase();
        if (s === 'concluído' || s === 'concluido') return "border-emerald-500";
        if (s === 'em andamento') return "border-amber-500";
        if (s === 'desqualificado') return "border-red-500";
        return "border-zinc-700";
    };

    const filteredChats = chats.filter(chat => {
        const name = (chat.wa_name || chat.wa_contactName || chat.name || chat.wa_chatid || '').toLowerCase();
        const matchesSearch = name.includes(searchQuery.toLowerCase());

        let matchesAI = true;
        if (aiFilter === 'ai') matchesAI = chat.isAIEnabled === true;
        else if (aiFilter === 'human') matchesAI = chat.isAIEnabled !== true;

        let matchesStatus = true;
        if (statusFilter !== 'all') {
            matchesStatus = chat.status === statusFilter;
        }

        return matchesSearch && matchesAI && matchesStatus;
    });

    return (
        <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-foreground">Chats Globais</h1>
                    <p className="text-muted-foreground">Monitore as conversas dos escritórios.</p>
                </div>
                <div className="w-[300px]">
                    <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um Escritório" />
                        </SelectTrigger>
                        <SelectContent>
                            {offices.map((office) => (
                                <SelectItem key={office.id} value={String(office.id)}>
                                    {office['Escritório'] || office.nome || 'Sem Nome'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex-1 border border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden flex rounded-xl">
                {!selectedOffice ? (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-light">
                        <div className="text-center">
                            <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                            Selecione um escritório acima para ver as conversas.
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat List Sidebar */}
                        <div className={cn(
                            "w-full md:w-[350px] border-r border-white/10 flex flex-col transition-all",
                            selectedChat ? "hidden md:flex" : "flex"
                        )}>
                            <div className="p-3 border-b border-white/10 space-y-3">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar conversa..."
                                            className="pl-8 bg-black/20 border-white/10 h-9"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={cn(
                                            "p-2 rounded-md border transition-all h-9 w-9 flex items-center justify-center",
                                            showFilters || aiFilter !== 'all' || statusFilter !== 'all'
                                                ? "bg-primary/20 border-primary/30 text-primary"
                                                : "bg-transparent border-white/10 text-muted-foreground hover:bg-white/5"
                                        )}
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                    </button>
                                </div>

                                {showFilters && (
                                    <div className="space-y-2 pt-1 animate-in slide-in-from-top-2">
                                        <div className="flex gap-1 bg-black/20 p-1 rounded-md">
                                            {(['all', 'ai', 'human'] as const).map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setAiFilter(t)}
                                                    className={cn(
                                                        "flex-1 py-1 text-[10px] uppercase font-medium rounded transition-all",
                                                        aiFilter === t ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                                                    )}
                                                >
                                                    {t === 'all' ? 'Todos' : t === 'ai' ? 'IA' : 'Humano'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {loadingChats ? (
                                    <div className="p-8 text-center text-muted-foreground flex justify-center">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    </div>
                                ) : filteredChats.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        Nenhuma conversa encontrada.
                                    </div>
                                ) : (
                                    filteredChats.map((chat) => (
                                        <div
                                            key={chat.wa_chatid}
                                            onClick={() => handleChatSelect(chat)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5",
                                                selectedChat?.wa_chatid === chat.wa_chatid ? "bg-white/10" : ""
                                            )}
                                        >
                                            <div className={cn("relative h-10 w-10 rounded-full border-2 flex items-center justify-center bg-zinc-800 shrink-0", getStatusColor(chat.status))}>
                                                {chat.photoUrl ? (
                                                    <img src={chat.photoUrl} alt={chat.name} className="h-full w-full rounded-full object-cover" />
                                                ) : (
                                                    <User className="h-5 w-5 text-zinc-500" />
                                                )}
                                                {chat.isAIEnabled && (
                                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-zinc-900">
                                                        <Bot className="h-2.5 w-2.5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="font-medium text-sm truncate text-zinc-200">
                                                        {chat.name || chat.pushName || chat.phone || "Desconhecido"}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500 ml-2">
                                                        {chat.wa_lastMsgTimestamp ? format(new Date(chat.wa_lastMsgTimestamp * 1000), 'HH:mm') : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-500 truncate mt-0.5">
                                                    {chat.wa_lastMessageBody || "Sem mensagens recentes"}
                                                </p>
                                            </div>
                                            {chat.wa_unreadCount > 0 && (
                                                <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary text-[10px] flex items-center justify-center text-black font-bold">
                                                    {chat.wa_unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Message View Area */}
                        <div className={cn(
                            "flex-1 flex flex-col bg-card/10",
                            selectedChat ? "flex" : "hidden md:flex"
                        )}>
                            {!selectedChat ? (
                                <div className="flex-1 flex items-center justify-center text-zinc-600 flex-col gap-2">
                                    <MessageSquare className="h-10 w-10 opacity-20" />
                                    <p>Selecione uma conversa para visualizar</p>
                                </div>
                            ) : (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-black/20">
                                        <button
                                            className="md:hidden p-1 -ml-1 text-zinc-400"
                                            onClick={() => setSelectedChat(null)}
                                        >
                                            <ArrowLeft className="h-5 w-5" />
                                        </button>
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={selectedChat.image || selectedChat.profileParams?.imgUrl} />
                                            <AvatarFallback className="text-xs">{(selectedChat.wa_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-medium text-sm text-zinc-200">{selectedChat.wa_name || selectedChat.wa_contactName || selectedChat.name}</h3>
                                            <p className="text-xs text-zinc-500">{selectedChat.phone || selectedChat.wa_chatid.split('@')[0]}</p>
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <ScrollArea id="admin-message-scroll" className="flex-1 p-4">
                                        {loadingMessages ? (
                                            <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Carregando histórico...
                                            </div>
                                        ) : (
                                            <div className="space-y-3 flex flex-col pb-4">
                                                {messages.map((msg) => (
                                                    <div
                                                        key={msg.id}
                                                        className={cn(
                                                            "max-w-[75%] p-3 rounded-2xl text-sm relative group",
                                                            msg.fromMe
                                                                ? "bg-primary/20 text-zinc-100 self-end rounded-br-none"
                                                                : "bg-white/10 text-zinc-200 self-start rounded-bl-none",
                                                            msg.status === 'Deleted' ? "opacity-50 italic" : ""
                                                        )}
                                                    >
                                                        <div className="flex flex-col gap-1">
                                                            {/* Simple media handling logic */}
                                                            {['audio', 'ptt', 'voice'].includes(msg.messageType) ? (
                                                                <span className="italic opacity-70 flex items-center gap-1">🎙️ Áudio</span>
                                                            ) : msg.messageType === 'image' ? (
                                                                msg.fileURL ? (
                                                                    <img src={msg.fileURL} alt="Imagem" className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-90" onClick={() => window.open(msg.fileURL, '_blank')} />
                                                                ) : <span className="italic opacity-70">📷 Foto</span>
                                                            ) : msg.status === 'Deleted' ? (
                                                                <span className="flex items-center gap-1"><Trash2 className="h-3 w-3" /> Apagada</span>
                                                            ) : (
                                                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] opacity-50 block text-right mt-1">
                                                            {format(new Date(msg.messageTimestamp), 'HH:mm')}
                                                        </span>
                                                    </div>
                                                ))}
                                                {messages.length === 0 && (
                                                    <div className="text-center text-zinc-600 text-xs py-10">
                                                        Nenhuma mensagem encontrada.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
