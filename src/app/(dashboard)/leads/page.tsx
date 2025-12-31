"use client";

import { useEffect, useState } from "react";
import { getLeads, exportLeadsToCsv } from "./actions";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getAvailableScripts } from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, endOfDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface Lead {
    id: number;
    nome: string;
    telefone: string;
    Status: string;
    created_at: string;
    status: string;
    area?: string;
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [scripts, setScripts] = useState<string[]>([]);
    const [selectedArea, setSelectedArea] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [totalLeads, setTotalLeads] = useState<number>(0);
    const [limit, setLimit] = useState<number>(100);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });

    useEffect(() => {
        async function fetchScripts() {
            try {
                const data = await getAvailableScripts();
                setScripts(data);
            } catch (error) {
                console.error("Erro ao carregar scripts:", error);
            }
        }
        fetchScripts();
    }, []);

    useEffect(() => {
        async function loadLeads() {
            setLoading(true);
            try {
                let startDate: string | undefined;
                let endDate: string | undefined;

                if (dateRange?.from) {
                    startDate = startOfDay(dateRange.from).toISOString();
                }
                if (dateRange?.to) {
                    endDate = endOfDay(dateRange.to).toISOString();
                }
                if (startDate && !endDate) {
                    endDate = endOfDay(dateRange!.from!).toISOString();
                }

                const result = await getLeads(startDate, endDate, selectedArea, limit, selectedStatus);
                setLeads(result.data || []);
                setTotalLeads(result.count);
            } catch (error) {
                toast.error("Erro ao carregar leads.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadLeads();
    }, [dateRange, selectedArea, limit, selectedStatus]);

    const handleExport = async () => {
        toast.promise(
            async () => {
                let startDate: string | undefined;
                let endDate: string | undefined;

                if (dateRange?.from) {
                    startDate = startOfDay(dateRange.from).toISOString();
                }
                if (dateRange?.to) {
                    endDate = endOfDay(dateRange.to).toISOString();
                }
                if (startDate && !endDate) {
                    endDate = endOfDay(dateRange!.from!).toISOString();
                }

                const csvData = await exportLeadsToCsv(startDate, endDate, selectedArea, 0, selectedStatus);

                if (!csvData) {
                    throw new Error("Nenhum dado para exportar.");
                }

                // Create blob and download
                const blob = new Blob(["\uFEFF" + csvData], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `leads_export_${format(new Date(), "dd-MM-yyyy_HH-mm")}.csv`);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
            },
            {
                loading: 'Gerando CSV...',
                success: 'Exportação concluída!',
                error: 'Erro ao exportar dados'
            }
        );
    };

    const getStatusBadge = (status: string) => {
        const s = status?.trim() || "Desconhecido";

        switch (s) {
            case "Concluído":
            case "Qualificado":
                return <Badge className="bg-green-500 hover:bg-green-600">{s}</Badge>;
            case "Em andamento":
                return <Badge className="bg-blue-500 hover:bg-blue-600">{s}</Badge>;
            case "Desqualificado":
                return <Badge variant="destructive">{s}</Badge>;
            default:
                return <Badge variant="secondary">{s}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-light tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Meus Leads
                    </h1>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Script:</span>
                        <Select value={selectedArea} onValueChange={setSelectedArea}>
                            <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-border">
                                <SelectValue placeholder="Todos os Scripts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Scripts</SelectItem>
                                {scripts.map((script) => (
                                    <SelectItem key={script} value={script}>
                                        {script.charAt(0).toUpperCase() + script.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Status:</span>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-border">
                                <SelectValue placeholder="Todos os Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="Concluído">Concluído</SelectItem>
                                <SelectItem value="Qualificado">Qualificado</SelectItem>
                                <SelectItem value="Em andamento">Em andamento</SelectItem>
                                <SelectItem value="Desqualificado">Desqualificado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />

                    <Button variant="outline" size="sm" onClick={handleExport} title="Exportar para CSV">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                    </Button>

                    <Badge variant="outline" className="text-base px-4 py-1 h-9 flex items-center">
                        Total: {totalLeads}
                    </Badge>
                </div>
            </div>

            <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle> Lista de Clientes</CardTitle>
                    <CardDescription>
                        Todos os leads atribuídos ao seu escritório.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data de Criação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            Nenhum lead encontrado no período selecionado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    leads.map((lead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell className="font-medium">{lead.nome || "Sem nome"}</TableCell>
                                            <TableCell>{lead.telefone}</TableCell>
                                            <TableCell>
                                                {getStatusBadge(lead.Status)}
                                            </TableCell>
                                            <TableCell>
                                                {lead.created_at
                                                    ? format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                                                    : "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                <div className="p-4 border-t border-border flex justify-end items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Linhas por página:</span>
                        <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                            <SelectTrigger className="w-[120px] h-8 bg-transparent border-border text-xs">
                                <SelectValue placeholder="Linhas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="100">100 linhas</SelectItem>
                                <SelectItem value="500">500 linhas</SelectItem>
                                <SelectItem value="1000">1000 linhas</SelectItem>
                                <SelectItem value="0">Todos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>
        </div>
    );
}
