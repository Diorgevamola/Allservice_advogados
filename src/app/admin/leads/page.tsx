'use client';

import { useEffect, useState } from "react";
import { fetchGlobalLeads } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await fetchGlobalLeads();
            setLeads(data);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div className="p-8 text-center text-zinc-500">Carregando leads globais...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground">Leads Globais</h1>
                <p className="text-muted-foreground">Visualizando todos os leads da plataforma.</p>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                    <CardTitle>Todos os Leads ({leads.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-white/5">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data</TableHead>
                                    {/* Add Office ID/Name if available in leads table, but schema check didn't confirm it clearly besides ID_empresa */}
                                    <TableHead className="text-right">Empresa ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell className="font-medium">{lead.Nome || 'N/A'}</TableCell>
                                        <TableCell>{lead.Status || 'Novo'}</TableCell>
                                        <TableCell>
                                            {lead.created_at ? format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {lead.ID_empresa?.slice(0, 8)}...
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
