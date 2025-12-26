'use client';

import { useEffect, useState } from "react";
import { fetchAdminStats, AdminStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Users, TrendingUp } from "lucide-react";

export default function AdminPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await fetchAdminStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load admin stats", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-[50vh] text-muted-foreground">Carregando dados globais...</div>;
    }

    if (!stats) {
        return <div className="text-red-500">Erro ao carregar painel administrativo.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground">Visão Geral Administrativa</h1>
                <p className="text-muted-foreground">Gerenciamento global de escritórios e leads.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Escritórios</CardTitle>
                        <Building2 className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                        <p className="text-xs text-muted-foreground">Ativos na plataforma</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Leads</CardTitle>
                        <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalLeads}</div>
                        <p className="text-xs text-muted-foreground">Processados globalmente</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Média de Leads</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalCompanies > 0 ? Math.round(stats.totalLeads / stats.totalCompanies) : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Por escritório</p>
                    </CardContent>
                </Card>
            </div>

            {/* Companies Table */}
            <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                    <CardTitle>Escritórios Cadastrados</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome da Empresa</TableHead>
                                <TableHead>Responsável</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead className="text-right">Total Leads</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.leadsByCompany.map((company) => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-medium">{company.office}</TableCell>
                                    <TableCell>{company.name}</TableCell>
                                    <TableCell>{company.phone}</TableCell>
                                    <TableCell className="text-right">{company.leadCount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
