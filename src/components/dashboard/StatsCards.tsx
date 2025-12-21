
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, XCircle } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface StatsCardsProps {
    stats: {
        qualified: number;
        total: number;
        disqualified: number;
    };
}

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="relative rounded-xl border border-border p-0.5">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                />
                <Card className="relative h-full bg-background shadow-none border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Leads Qualificados Enviados
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.qualified}</div>
                        <p className="text-xs text-muted-foreground">
                            Enviados para advogados
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
                <Card className="relative h-full bg-background shadow-none border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total de Leads Atendidos
                        </CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
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
                <Card className="relative h-full bg-background shadow-none border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Leads Desqualificados
                        </CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.disqualified}</div>
                        <p className="text-xs text-muted-foreground">
                            Não avançaram no funil
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
