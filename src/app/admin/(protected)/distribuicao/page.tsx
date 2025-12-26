'use client';

import { useEffect, useState } from "react";
import { fetchGlobalDistribuicao } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminDistribuicaoPage() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await fetchGlobalDistribuicao();
            setRows(data);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div className="p-8 text-center text-zinc-500">Carregando distribuição global...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground">Distribuição Global (TeuCliente)</h1>
                <p className="text-muted-foreground">Registro completo de distribuição.</p>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                    <CardTitle>Registros ({rows.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-white/5">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium">{row.Nome || row.nome || 'N/A'}</TableCell>
                                        <TableCell>{row.Telefone || row.telefone || 'N/A'}</TableCell>
                                        <TableCell>
                                            {row.created_at ? format(new Date(row.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
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
