'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import { fetchGlobalLeads } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 20;

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadingTriggerRef = useRef<HTMLDivElement>(null);

    const loadLeads = useCallback(async (offset: number, isInitial: boolean = false) => {
        if (isInitial) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const result = await fetchGlobalLeads(offset, PAGE_SIZE);

            if (isInitial) {
                setLeads(result.leads);
            } else {
                setLeads(prev => [...prev, ...result.leads]);
            }
            setTotalCount(result.count);
            setHasMore(result.hasMore);
        } catch (error) {
            console.error("Error loading leads:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadLeads(0, true);
    }, [loadLeads]);

    // Infinite scroll observer
    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                loadLeads(leads.length, false);
            }
        }, { threshold: 0.1 });

        if (loadingTriggerRef.current) {
            observerRef.current.observe(loadingTriggerRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, loadingMore, loading, leads.length, loadLeads]);

    if (loading) {
        return (
            <div className="p-8 text-center text-zinc-500 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando leads globais...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground">Leads Globais</h1>
                <p className="text-muted-foreground">Visualizando todos os leads da plataforma.</p>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                    <CardTitle>Todos os Leads ({totalCount})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-white/5 max-h-[600px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card z-10">
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Escritório</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead, index) => (
                                    <TableRow key={`${lead.id}-${index}`}>
                                        <TableCell className="font-medium">{lead.nome || 'N/A'}</TableCell>
                                        <TableCell className="text-muted-foreground">{lead.companyName}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${lead.Status === 'Concluído' ? 'bg-emerald-500/20 text-emerald-400' :
                                                lead.Status === 'Desqualificado' ? 'bg-red-500/20 text-red-400' :
                                                    lead.Status === 'Em andamento' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-zinc-700/50 text-zinc-400'
                                                }`}>
                                                {lead.Status || 'Novo'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {lead.created_at ? format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Infinite scroll trigger */}
                        <div ref={loadingTriggerRef} className="h-10 flex items-center justify-center">
                            {loadingMore && (
                                <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Carregando mais...
                                </div>
                            )}
                            {!hasMore && leads.length > 0 && (
                                <div className="text-zinc-600 text-sm py-4">
                                    Todos os {totalCount} leads carregados.
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
