'use client';

import { useEffect, useState } from "react";
import { fetchAdminStats, AdminStats } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await fetchAdminStats();
            setStats(data);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="p-8 text-center text-zinc-500 animate-pulse">
                Carregando estatísticas gerais...
            </div>
        );
    }

    const topCompanies = stats?.leadsByCompany.slice(0, 10) || [];
    const maxLeads = topCompanies.length > 0 ? topCompanies[0].leadCount : 1;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground">Painel Geral</h1>
                <p className="text-muted-foreground">Visão geral da plataforma AllService AI.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Escritórios</CardTitle>
                        <Building2 className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extralight">{stats?.totalCompanies ?? 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Empresas cadastradas</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-background border-emerald-500/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leads na Plataforma</CardTitle>
                        <Users className="h-5 w-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extralight">{stats?.totalLeads ?? 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total acumulado</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-background border-amber-500/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Média por Escritório</CardTitle>
                        <TrendingUp className="h-5 w-5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extralight">
                            {stats?.totalCompanies && stats.totalCompanies > 0
                                ? Math.round(stats.totalLeads / stats.totalCompanies)
                                : 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Leads por empresa</p>
                    </CardContent>
                </Card>
            </div>

            {/* Leads by Company Ranking */}
            <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Ranking de Escritórios</CardTitle>
                            <CardDescription>Top 10 por volume de leads</CardDescription>
                        </div>
                        <Link
                            href="/admin/leads"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            Ver todos os leads <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {topCompanies.map((company, index) => (
                            <div key={company.id} className="flex items-center gap-4">
                                <div className="w-8 text-center font-mono text-sm text-muted-foreground">
                                    {index + 1}º
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium truncate max-w-[200px]" title={company.office}>
                                            {company.office}
                                        </span>
                                        <span className="text-muted-foreground">{company.leadCount} leads</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                                            style={{ width: `${(company.leadCount / maxLeads) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {topCompanies.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">Nenhum dado disponível.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
