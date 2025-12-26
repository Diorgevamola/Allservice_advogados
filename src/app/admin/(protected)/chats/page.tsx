'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchAllOffices } from "@/lib/api";
import {
    fetchChatsForOffice,
    fetchMessagesForOffice,
    getLeadDetailsForOffice,
    sendMessageForOffice,
    deleteMessageForOffice,
    toggleLeadAIForOffice,
    updateLeadStatusForOffice
} from '@/app/(dashboard)/chats/actions';
import { UazapiChat, UazapiMessage } from '@/lib/uazapi';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import {
    Search,
    MessageSquare,
    MoreVertical,
    Phone,
    Trash2,
    Plus,
    Bot,
    User,
    SlidersHorizontal,
    Loader2,
    SendHorizonal,
    ArrowLeft,
    Users
} from 'lucide-react';
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AdminChatsPage() {
    const [offices, setOffices] = useState<any[]>([]);
    const [selectedOffice, setSelectedOffice] = useState<string>("");

    // --- State from User Chat Page ---
    const searchParams = useSearchParams();
    const phoneParam = searchParams.get('phone');

    const [chats, setChats] = useState<UazapiChat[]>([]);
    // const [chats] handled by loadChats

    const [selectedChat, setSelectedChat] = useState<UazapiChat | null>(null);
    const [messages, setMessages] = useState<UazapiMessage[]>([]);
    const [loadingChats, setLoadingChats] = useState(false); // Changed default to false until office selected
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [inputText, setInputText] = useState('');

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observer = useRef<IntersectionObserver | null>(null);

    // Lead Profile State
    const [leadDetails, setLeadDetails] = useState<any>(null);
    const [showProfile, setShowProfile] = useState(false);

    // AI FAB State
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [isAIEnabled, setIsAIEnabled] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [aiFilter, setAiFilter] = useState<'all' | 'ai' | 'human'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Em andamento' | 'Concluído' | 'Desqualificado'>('all');
    const [questionFilter, setQuestionFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Load Offices
    useEffect(() => {
        async function load() {
            const data = await fetchAllOffices();
            setOffices(data);
        }
        load();
    }, []);

    // Load Chats when Office Selected
    useEffect(() => {
        if (selectedOffice) {
            setChats([]);
            setPage(1);
            setHasMore(true);
            setSelectedChat(null);
            loadChats(1, true);
        } else {
            setChats([]);
        }
    }, [selectedOffice]);

    // Polling for NEW chats (only first page)
    useEffect(() => {
        if (!selectedOffice) return;
        const interval = setInterval(() => {
            refreshFirstPage();
        }, 10000);
        return () => clearInterval(interval);
    }, [selectedOffice]);

    // Polling for messages when chat selected
    useEffect(() => {
        if (!selectedOffice) return;
        let interval: NodeJS.Timeout;
        if (selectedChat) {
            loadMessages(selectedChat.wa_chatid); // Initial load when clicked
            interval = setInterval(() => {
                loadMessages(selectedChat.wa_chatid, false);
            }, 5000); // 5s polling
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [selectedChat, selectedOffice]);

    // Sync AI state when details load
    useEffect(() => {
        if (leadDetails) {
            const aiStatus = leadDetails.IA_responde === true || leadDetails.IA_responde === 'true';
            setIsAIEnabled(aiStatus);
        } else {
            setIsAIEnabled(false);
        }
    }, [leadDetails]);


    async function loadChats(pageNum: number, isInitial = false) {
        if (!selectedOffice) return;
        if (isInitial) setLoadingChats(true);
        else setLoadingMore(true);

        try {
            const res = await fetchChatsForOffice(selectedOffice, pageNum, 20); // Using Office Action
            const newChats = res.chats || res.response || [];

            if (pageNum === 1) {
                setChats(newChats);
            } else {
                setChats(prev => {
                    const existingIds = new Set(prev.map(c => c.wa_chatid));
                    const filtered = newChats.filter(c => !existingIds.has(c.wa_chatid));
                    return [...prev, ...filtered];
                });
            }

            setHasMore(newChats.length === 20);
            setPage(pageNum);
        } catch (error) {
            console.error("Error loading chats:", error);
        } finally {
            if (isInitial) setLoadingChats(false);
            setLoadingMore(false);
        }
    }

    async function refreshFirstPage() {
        if (!selectedOffice) return;
        try {
            const res = await fetchChatsForOffice(selectedOffice, 1, 20);
            const firstPageChats = res.chats || res.response || [];

            setChats(prev => {
                const combined = [...firstPageChats];
                const firstPageIds = new Set(firstPageChats.map(c => c.wa_chatid));
                const otherChats = prev.filter(c => !firstPageIds.has(c.wa_chatid));
                return [...combined, ...otherChats].sort((a, b) => (b.wa_lastMsgTimestamp || 0) - (a.wa_lastMsgTimestamp || 0));
            });
        } catch (e) {
            console.error("Refresh error:", e);
        }
    }

    const lastChatElementRef = useCallback((node: HTMLDivElement) => {
        if (loadingChats || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadChats(page + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, [loadingChats, loadingMore, hasMore, page, selectedOffice]);

    async function loadMessages(chatId: string, forceScroll = false) {
        if (!chatId || !selectedOffice) return;
        if (forceScroll) setLoadingMessages(true);

        const res = await fetchMessagesForOffice(selectedOffice, chatId); // Using Office Action
        if (res.messages || res.response) {
            const msgs = (res.messages || res.response || []).reverse();
            setMessages(msgs);

            if (forceScroll) {
                setTimeout(() => {
                    const scrollArea = document.getElementById('message-area-scroll-admin');
                    if (scrollArea) {
                        const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
                        if (scrollContainer) {
                            scrollContainer.scrollTop = scrollContainer.scrollHeight;
                        }
                    }
                }, 100);
            }
        }
        if (forceScroll) setLoadingMessages(false);
    }

    async function handleChatSelect(chat: UazapiChat) {
        setSelectedChat(chat);
        setLoadingMessages(true);
        setMessages([]);
        setShowProfile(false);
        setLeadDetails(null);
        setIsFabOpen(false);
        setIsAIEnabled(false);

        if (chat.phone || chat.wa_chatid) {
            const phone = chat.phone || chat.wa_chatid.split('@')[0];
            const details = await getLeadDetailsForOffice(selectedOffice, phone); // Using Office Action
            setLeadDetails(details);

            if (details) {
                const completed = details.Status === 'Concluído';
                setChats(prev => prev.map(c =>
                    c.wa_chatid === chat.wa_chatid ? { ...c, isCompleted: completed } : c
                ));
            }
        }

        await loadMessages(chat.wa_chatid, true);
    }

    async function handleSendMessage() {
        if (!selectedChat || !inputText.trim() || !selectedOffice) return;
        const text = inputText;
        setInputText('');

        try {
            const tempId = Date.now().toString();
            const tempMsg: UazapiMessage = {
                id: tempId,
                messageid: tempId,
                chatid: selectedChat.wa_chatid,
                text: text,
                messageType: 'text',
                messageTimestamp: Date.now(),
                fromMe: true
            };
            setMessages(prev => [...prev, tempMsg]);

            const res = await sendMessageForOffice(selectedOffice, selectedChat.wa_chatid, text);
            if (res.success) {
                loadMessages(selectedChat.wa_chatid, true);
            } else {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                toast.error("Erro ao enviar mensagem como Admin");
            }
        } catch (e) {
            console.error("Handler error:", e);
        }
    }

    async function handleDeleteMessage(messageId: string) {
        if (!selectedChat || !selectedOffice) return;
        const originalMessages = [...messages];

        setMessages(prev => prev.map(m =>
            (m.id === messageId || m.messageid === messageId)
                ? { ...m, status: 'Deleted', text: 'Esta mensagem foi apagada' }
                : m
        ));

        const res = await deleteMessageForOffice(selectedOffice, selectedChat.wa_chatid, messageId);
        if (!res.success) {
            toast.error("Erro ao apagar mensagem");
            setMessages(originalMessages);
        } else {
            toast.success("Mensagem apagada para todos");
        }
    }

    async function handleToggleAI(enabled: boolean) {
        if (!selectedChat || !selectedOffice) return;
        const prev = isAIEnabled;
        setIsAIEnabled(enabled);

        const phone = selectedChat.phone || selectedChat.wa_chatid.split('@')[0];
        const res = await toggleLeadAIForOffice(selectedOffice, phone, enabled);

        if (res.success) {
            toast.success(enabled ? "IA Ativada" : "IA Desativada");
            if (leadDetails) {
                setLeadDetails({ ...leadDetails, IA_responde: enabled });
            }
            setChats(prev => prev.map(c => {
                const currentPhone = (c.phone || c.wa_chatid.split('@')[0]).replace(/\D/g, '');
                if (currentPhone === phone) {
                    return { ...c, isAIEnabled: enabled };
                }
                return c;
            }));
        } else {
            setIsAIEnabled(prev);
            toast.error("Erro ao alterar status da IA");
        }
    }

    async function handleStatusChange(newStatus: string) {
        if (!selectedChat || !selectedOffice) return;
        const phone = selectedChat.phone || selectedChat.wa_chatid.split('@')[0];

        if (leadDetails) {
            setLeadDetails({ ...leadDetails, Status: newStatus });
        }

        const res = await updateLeadStatusForOffice(selectedOffice, phone, newStatus);

        if (res.success) {
            toast.success(`Status atualizado para: ${newStatus}`);
            setChats(prev => prev.map(c =>
                c.wa_chatid === selectedChat.wa_chatid ? { ...c, status: newStatus, isCompleted: newStatus === 'Concluído' } : c
            ));
        } else {
            toast.error("Erro ao atualizar status");
        }
    }

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

        let matchesQuestion = true;
        if (questionFilter !== 'all') {
            const key = questionFilter.toLowerCase() as keyof UazapiChat;
            const val = chat[key];
            matchesQuestion = val !== null && val !== undefined && val !== '';
        }

        return matchesSearch && matchesAI && matchesStatus && matchesQuestion;
    });

    const getLastMessageDisplay = (chat: UazapiChat) => {
        if (chat.wa_lastMessageTextVote) return chat.wa_lastMessageTextVote;
        if (chat.wa_lastMessageText) return chat.wa_lastMessageText;
        if (chat.last_message?.message) return chat.last_message.message;
        if (chat.wa_lastMessageType && chat.wa_lastMessageType !== 'text') return `[${chat.wa_lastMessageType}]`;
        return '';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Concluído':
                return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'Desqualificado':
                return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'Em andamento':
                return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default:
                return 'text-muted-foreground bg-muted/50 border-border';
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
            {/* Header with Office Selector */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-foreground">Chats Globais</h1>
                    <p className="text-muted-foreground">Monitore as conversas dos escritórios.</p>
                </div>
                <div className="w-[300px]">
                    <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                        <SelectTrigger className="border-primary/50 bg-primary/10 ring-2 ring-primary/20 text-primary-foreground font-medium h-10">
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

            {!selectedOffice ? (
                <div className="flex-1 border border-white/10 bg-black/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-zinc-500 font-light">
                    <div className="text-center">
                        <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                        Selecione um escritório acima para ver as conversas.
                    </div>
                </div>
            ) : (
                <div className="flex-1 border border-white/10 bg-card rounded-xl overflow-hidden flex shadow-2xl">
                    {/* Chat List Sider */}
                    <div className={`w-full md:w-[350px] border-r border-border bg-card flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-border space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar conversa..."
                                        className="pl-8 bg-background"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-2 rounded-md transition-all border ${showFilters || aiFilter !== 'all' || statusFilter !== 'all' || questionFilter !== 'all' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-background hover:bg-muted border-transparent text-muted-foreground'}`}
                                    title="Filtros"
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                </button>
                            </div>

                            {showFilters && (
                                <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Tipo</span>
                                        <div className="flex gap-1 bg-muted/50 p-1 rounded-md">
                                            <button
                                                onClick={() => setAiFilter('all')}
                                                className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${aiFilter === 'all' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Todos
                                            </button>
                                            <button
                                                onClick={() => setAiFilter('ai')}
                                                className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium rounded transition-all ${aiFilter === 'ai' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                <Bot className="h-3 w-3" />
                                                IA
                                            </button>
                                            <button
                                                onClick={() => setAiFilter('human')}
                                                className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium rounded transition-all ${aiFilter === 'human' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                <User className="h-3 w-3" />
                                                Humano
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Status</span>
                                        <div className="grid grid-cols-2 gap-1 bg-muted/50 p-1 rounded-md">
                                            {(['all', 'Em andamento', 'Concluído', 'Desqualificado'] as const).map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => setStatusFilter(s)}
                                                    className={`py-1 text-[10px] font-medium rounded transition-all ${statusFilter === s ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    {s === 'all' ? 'Todos' : s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Etapa Alcançada</span>
                                        <div className="grid grid-cols-4 gap-1 bg-muted/50 p-1 rounded-md max-h-[120px] overflow-y-auto custom-scrollbar">
                                            <button
                                                onClick={() => setQuestionFilter('all')}
                                                className={`py-1 text-[10px] font-medium rounded transition-all ${questionFilter === 'all' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Todas
                                            </button>
                                            {(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'] as const).map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setQuestionFilter(t)}
                                                    className={`py-1 text-[10px] font-medium rounded transition-all ${questionFilter === t ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <ScrollArea className="flex-1 min-h-0">
                            <div className="flex flex-col">
                                {loadingChats ? (
                                    <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                                ) : (
                                    <>
                                        {filteredChats.map((chat) => (
                                            <div
                                                key={chat.id || chat.wa_chatid}
                                                className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors flex gap-3 relative ${selectedChat?.wa_chatid === chat.wa_chatid ? 'bg-muted' : ''}`}
                                                onClick={() => handleChatSelect(chat)}
                                            >
                                                <Avatar className={`border-2 border-background ${chat.status?.toLowerCase() === 'concluído' || chat.status?.toLowerCase() === 'concluido' ? 'ring-2 ring-green-500 ring-offset-1' :
                                                    chat.status?.toLowerCase() === 'desqualificado' ? 'ring-2 ring-red-500 ring-offset-1' :
                                                        chat.status?.toLowerCase() === 'em andamento' ? 'ring-2 ring-yellow-500 ring-offset-1' :
                                                            ''
                                                    }`}>
                                                    <AvatarImage src={chat.image || chat.profileParams?.imgUrl} />
                                                    <AvatarFallback>{(chat.wa_name || chat.wa_contactName || chat.name || "U")?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            {chat.isAIEnabled ? (
                                                                <div title="Atendimento por IA">
                                                                    <Bot className="h-3.5 w-3.5 text-primary shrink-0" />
                                                                </div>
                                                            ) : (
                                                                <div title="Atendimento Humano">
                                                                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                </div>
                                                            )}
                                                            <h3 className="font-semibold truncate text-sm">{chat.wa_name || chat.wa_contactName || chat.name || chat.wa_chatid}</h3>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap mr-2">
                                                            {chat.wa_lastMsgTimestamp ? format(new Date(chat.wa_lastMsgTimestamp * 1000), 'dd/MM HH:mm') : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate pr-4">
                                                        {getLastMessageDisplay(chat)}
                                                    </p>
                                                </div>

                                                {chat.wa_unreadCount > 0 && (
                                                    <div className="flex flex-col justify-center">
                                                        <span className="h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-medium">
                                                            {chat.wa_unreadCount}
                                                        </span>
                                                    </div>
                                                )
                                                }
                                            </div>
                                        ))}

                                        {filteredChats.length === 0 && !loadingMore && !loadingChats && (
                                            <div className="p-8 text-center text-muted-foreground text-sm">
                                                Nenhuma conversa encontrada.
                                            </div>
                                        )}

                                        {hasMore && (
                                            <div ref={lastChatElementRef} className="p-4 flex justify-center items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                {loadingMore && <span className="text-xs text-muted-foreground">Carregando mais...</span>}
                                            </div>
                                        )}

                                        {!hasMore && filteredChats.length > 0 && (
                                            <div className="p-4 text-center text-[10px] text-muted-foreground opacity-50 uppercase tracking-wider">
                                                Fim das conversas
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Message Area */}
                    <Card className={`flex-1 flex flex-row bg-card/50 backdrop-blur-sm border-none rounded-none overflow-hidden relative ${selectedChat ? 'flex' : 'hidden md:flex'}`
                    }>
                        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative ${showProfile ? 'mr-[0px]' : ''}`}>
                            {selectedChat ? (
                                <>
                                    {/* Header */}
                                    <div className="p-4 border-b border-border flex justify-between items-center bg-card/80">
                                        <div className="flex items-center gap-3">
                                            <button
                                                className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                                                onClick={() => setSelectedChat(null)}
                                            >
                                                <ArrowLeft className="h-5 w-5" />
                                            </button>
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
                                        </div>
                                        <div className="flex gap-2 items-center text-muted-foreground bg-card">
                                            {leadDetails && (
                                                <div className="mr-2">
                                                    <Select
                                                        value={leadDetails.Status || leadDetails.status || "Em andamento"}
                                                        onValueChange={handleStatusChange}
                                                    >
                                                        <SelectTrigger className={`w-[140px] h-8 text-xs font-medium border ${getStatusColor(leadDetails.Status || leadDetails.status || "Em andamento")}`}>
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Em andamento" className="text-yellow-500">Em andamento</SelectItem>
                                                            <SelectItem value="Concluído" className="text-green-500">Concluído</SelectItem>
                                                            <SelectItem value="Desqualificado" className="text-red-500">Desqualificado</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                            <Phone className="h-5 w-5 cursor-pointer hover:text-foreground" />
                                            <MoreVertical className="h-5 w-5 cursor-pointer hover:text-foreground" onClick={() => setShowProfile(!showProfile)} />
                                        </div>
                                    </div>

                                    <ScrollArea id="message-area-scroll-admin" className="flex-1 min-h-0 p-4">
                                        <div className="space-y-4 flex flex-col pb-16">
                                            {loadingMessages ? (
                                                <div className="text-center text-muted-foreground mt-10">Carregando mensagens...</div>
                                            ) : (
                                                messages.map(msg => (
                                                    <div
                                                        key={msg.id}
                                                        className={`max-w-[70%] p-3 rounded-2xl text-sm relative group ${msg.fromMe
                                                            ? 'bg-primary/20 text-foreground self-end rounded-br-none'
                                                            : 'bg-muted text-foreground self-start rounded-bl-none'
                                                            } ${msg.status === 'Deleted' ? 'opacity-60 italic' : ''}`}
                                                    >
                                                        {msg.fromMe && msg.status !== 'Deleted' && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <button
                                                                        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-destructive hover:bg-destructive/10 rounded-full transition-all"
                                                                        title="Apagar para todos"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Apagar mensagem?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Esta ação apagará a mensagem para todos os participantes da conversa.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDeleteMessage(msg.id || msg.messageid)}
                                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                        >
                                                                            Apagar para todos
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                        <div className="flex flex-col gap-1">
                                                            {['audio', 'ptt', 'voice'].includes(msg.messageType) ? (
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
                                                            ) : msg.status === 'Deleted' ? (
                                                                <p className="flex items-center gap-1.5 opacity-70">
                                                                    <Trash2 className="h-3 w-3" />
                                                                    Mensagem apagada
                                                                </p>
                                                            ) : (
                                                                <p>{msg.text}</p>
                                                            )}

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

                                    {/* FAB Area */}
                                    <div className="absolute bottom-20 left-4 z-20 flex flex-col gap-2">
                                        <div className={`flex items-center gap-2 bg-card border border-border p-2 rounded-lg shadow-lg transition-all duration-300 origin-bottom-left ${isFabOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                                            <Switch
                                                id="ai-mode-admin"
                                                checked={isAIEnabled}
                                                onCheckedChange={handleToggleAI}
                                            />
                                            <Label htmlFor="ai-mode-admin" className="text-sm cursor-pointer flex items-center gap-1">
                                                <Bot className="h-4 w-4" />
                                                IA {isAIEnabled ? 'On' : 'Off'}
                                            </Label>
                                        </div>

                                        <button
                                            className={`h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform duration-300 ${isFabOpen ? 'rotate-45' : 'rotate-0'}`}
                                            onClick={() => setIsFabOpen(!isFabOpen)}
                                        >
                                            <Plus className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="p-4 border-t border-border bg-card/80">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Digite uma mensagem..."
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            />
                                            <button
                                                className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                                onClick={handleSendMessage}
                                            >
                                                <SendHorizonal className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-zinc-600 flex-col gap-2">
                                    <MessageSquare className="h-10 w-10 opacity-20" />
                                    <p>Selecione uma conversa para visualizar</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
