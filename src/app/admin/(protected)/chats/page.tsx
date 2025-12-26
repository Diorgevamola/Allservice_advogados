'use client';

import { useEffect, useState, useCallback } from "react";
import { fetchAllOffices } from "@/lib/api";
import { fetchChatsForOffice } from "@/app/(dashboard)/chats/actions";
import { UazapiChat } from "@/lib/uazapi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MessageSquare, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminChatsPage() {
    const [offices, setOffices] = useState<any[]>([]);
    const [selectedOffice, setSelectedOffice] = useState<string>("");
    const [chats, setChats] = useState<UazapiChat[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            const data = await fetchAllOffices();
            setOffices(data);
        }
        load();
    }, []);

    const loadChats = useCallback(async (officeId: string) => {
        if (!officeId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await fetchChatsForOffice(officeId);
            const chatList = result.chats || result.response || [];
            setChats(chatList);
        } catch (err: any) {
            setError(err.message || "Erro ao carregar chats");
            setChats([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedOffice) {
            loadChats(selectedOffice);
        }
    }, [selectedOffice, loadChats]);

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

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between">
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

            <div className="flex-1 rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden">
                {!selectedOffice ? (
                    <div className="h-full flex items-center justify-center text-zinc-500 font-light">
                        <div className="text-center">
                            <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                            Selecione um escritório acima para ver as conversas.
                        </div>
                    </div>
                ) : loading ? (
                    <div className="h-full flex items-center justify-center text-zinc-500">
                        <div className="animate-pulse">Carregando conversas...</div>
                    </div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center text-red-500">
                        <div className="text-center">
                            <p className="font-medium">Erro ao carregar</p>
                            <p className="text-sm text-zinc-500 mt-1">{error}</p>
                        </div>
                    </div>
                ) : chats.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-500">
                        Nenhuma conversa encontrada para este escritório.
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto">
                        {chats.map((chat) => (
                            <div
                                key={chat.wa_chatid}
                                className="flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                            >
                                {/* Avatar with Status Ring */}
                                <div className={cn("relative h-12 w-12 rounded-full border-2 flex items-center justify-center bg-zinc-800", getStatusColor(chat.status))}>
                                    {chat.photoUrl ? (
                                        <img src={chat.photoUrl} alt={chat.name} className="h-full w-full rounded-full object-cover" />
                                    ) : (
                                        <User className="h-6 w-6 text-zinc-500" />
                                    )}
                                    {chat.isAIEnabled && (
                                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-zinc-900">
                                            <Bot className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Chat Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium truncate">{chat.name || chat.pushName || chat.phone || "Desconhecido"}</span>
                                        <span className="text-xs text-zinc-500">{formatTimestamp(chat.wa_lastMsgTimestamp)}</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 truncate mt-0.5">
                                        {chat.wa_lastMessageBody || "Sem mensagens recentes"}
                                    </p>
                                </div>

                                {/* Unread Count */}
                                {chat.wa_unreadCount > 0 && (
                                    <div className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                        {chat.wa_unreadCount}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
