"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Cell, Label, Pie, PieChart, Sector, ResponsiveContainer, Legend, Tooltip } from "recharts"

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

interface LeadsPerOfficeChartProps {
    data: {
        office: string;
        leadCount: number;
    }[];
}

export function LeadsPerOfficeChart({ data }: LeadsPerOfficeChartProps) {
    // Use a set of predefined colors for the segments
    const COLORS = [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#96CEB4",
        "#FFEEAD"
    ];

    // Prepare data for Recharts, sorted by value and potentially grouped for "Others" if too many
    const chartData = React.useMemo(() => {
        const sortedData = [...data].sort((a, b) => b.leadCount - a.leadCount);

        // Only show top 9 and group the rest as "Outros" if there are many offices
        if (sortedData.length <= 10) {
            return sortedData.map((item, index) => ({
                name: item.office,
                value: item.leadCount,
                fill: COLORS[index % COLORS.length]
            }));
        }

        const top9 = sortedData.slice(0, 9);
        const others = sortedData.slice(9);
        const othersCount = others.reduce((acc, curr) => acc + curr.leadCount, 0);

        return [
            ...top9.map((item, index) => ({
                name: item.office,
                value: item.leadCount,
                fill: COLORS[index % COLORS.length]
            })),
            { name: "Outros", value: othersCount, fill: "hsl(var(--muted-foreground))" }
        ];

    }, [data]);

    const totalLeads = React.useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.leadCount, 0)
    }, [data])

    const chartConfig = {
        leads: {
            label: "Leads",
        },
        ...chartData.reduce((acc: any, item, index) => {
            acc[item.name] = {
                label: item.name,
                color: item.fill
            }
            return acc;
        }, {})
    } satisfies ChartConfig

    return (
        <Card className="flex flex-col bg-card/50 backdrop-blur-sm border-border h-full">
            <CardHeader className="items-center pb-0">
                <CardTitle>Distribuição de Leads</CardTitle>
                <CardDescription>Por Escritório</CardDescription>
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
                                                    {totalLeads.toLocaleString()}
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
                                    <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs text-muted-foreground max-h-[100px] overflow-y-auto custom-scrollbar">
                                        {payload.map((entry: any, index: number) => (
                                            <div key={`item-${index}`} className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                <span>{entry.value}</span>
                                            </div>
                                        ))}
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
