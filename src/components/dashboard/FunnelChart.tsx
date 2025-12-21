
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface FunnelChartProps {
    data: {
        question: string;
        count: number;
        total: number;
        percentage: number;
    }[];
}

export function FunnelChart({ data }: FunnelChartProps) {
    return (
        <Card className="col-span-4 border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Funil de Conversão (Por Pergunta)
                </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(190, 100%, 50%)" stopOpacity={1} />
                                    <stop offset="100%" stopColor="hsl(270, 100%, 60%)" stopOpacity={1} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="question"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(0 0% 12%)' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(0 0% 4%)',
                                    borderRadius: '8px',
                                    border: '1px solid hsl(0 0% 12%)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                    color: 'hsl(210 40% 98%)'
                                }}
                            />
                            <Bar
                                dataKey="count"
                                fill="url(#barGradient)"
                                radius={[4, 4, 0, 0]}
                                name="Respostas"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
