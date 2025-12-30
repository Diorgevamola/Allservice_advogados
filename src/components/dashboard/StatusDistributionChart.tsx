"use client"

import * as React from "react"
import { Label, Pie, PieChart, Legend } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export interface StatusDistributionProps {
    data: {
        qualified: number;
        inProgress: number;
        disqualified: number;
        total: number;
    };
}

export function StatusDistributionChart({ data }: StatusDistributionProps) {

    const chartData = React.useMemo(() => [
        { name: "qualified", value: data.qualified, fill: "#22c55e", label: "Concluído" }, // Green
        { name: "inProgress", value: data.inProgress, fill: "#eab308", label: "Em Andamento" }, // Yellow
        { name: "disqualified", value: data.disqualified, fill: "#ef4444", label: "Desqualificado" }, // Red
    ], [data]);

    const chartConfig = {
        qualified: {
            label: "Concluído",
            color: "#22c55e",
        },
        inProgress: {
            label: "Em Andamento",
            color: "#eab308",
        },
        disqualified: {
            label: "Desqualificado",
            color: "#ef4444",
        }
    } satisfies ChartConfig

    return (
        <Card className="flex flex-col bg-card/50 backdrop-blur-sm border-border h-full">
            <CardHeader className="items-center pb-0">
                <CardTitle>Status dos Leads</CardTitle>
                <CardDescription>Distribuição Total</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[300px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={100}
                            strokeWidth={2}
                            stroke="hsl(var(--background))"
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {data.total.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground"
                                                >
                                                    Leads
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                        <Legend
                            content={({ payload }) => {
                                if (!payload) return null;
                                return (
                                    <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-muted-foreground">
                                        {payload.map((entry: any, index: number) => {
                                            const item = chartData.find(d => d.fill === entry.color);
                                            return (
                                                <div key={`item-${index}`} className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                    <span>{item?.label || entry.value}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            }}
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
