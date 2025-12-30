
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, XCircle, Clock, Percent } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface StatsCardsProps {
    stats: {
        qualified: number;
        total: number;
        disqualified: number;
        inProgress: number;
    };
}

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative rounded-xl border border-border p-0.5">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                />
                <Card className="relative h-full bg-card backdrop-blur-md shadow-none border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-light text-muted-foreground">
                            Total de Leads
                        </CardTitle>
                        <Users className="h-4 w-4 text-blue-400/80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extralight tracking-tight text-card-foreground">{stats.total}</div>
                        <p className="text-xs text-muted-foreground font-light mt-1">
                            Todas as conversas iniciadas
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="relative rounded-xl border border-border p-0.5">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                />
                <Card className="relative h-full bg-card backdrop-blur-md shadow-none border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-light text-muted-foreground">
                            Leads Qualificados
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-400/80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extralight tracking-tight text-card-foreground">{stats.qualified}</div>
                        <p className="text-xs text-muted-foreground font-light mt-1">
                            Status "Concluído"
                        </p>
                    </CardContent>
                </Card>
            </div>


            <div className="relative rounded-xl border border-border p-0.5">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                />
                <Card className="relative h-full bg-card backdrop-blur-md shadow-none border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-light text-muted-foreground">
                            Em Andamento
                        </CardTitle>
                        <Clock className="h-4 w-4 text-yellow-400/80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extralight tracking-tight text-card-foreground">{stats.inProgress}</div>
                        <p className="text-xs text-muted-foreground font-light mt-1">
                            Processo ativo
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="relative rounded-xl border border-border p-0.5">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                />
                <Card className="relative h-full bg-card backdrop-blur-md shadow-none border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-light text-muted-foreground">
                            Leads Desqualificados
                        </CardTitle>
                        <XCircle className="h-4 w-4 text-destructive/80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extralight tracking-tight text-card-foreground">{stats.disqualified}</div>
                        <p className="text-xs text-muted-foreground font-light mt-1">
                            Não avançaram
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="relative rounded-xl border border-border p-0.5">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                />
                <Card className="relative h-full bg-card backdrop-blur-md shadow-none border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-light text-muted-foreground">
                            Taxa de Conversão
                        </CardTitle>
                        <Percent className="h-4 w-4 text-primary/80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extralight tracking-tight text-card-foreground">
                            {stats.total > 0 ? ((stats.qualified / stats.total) * 100).toFixed(1) : "0.0"}%
                        </div>
                        <p className="text-xs text-muted-foreground font-light mt-1">
                            Qualificados / Total
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
