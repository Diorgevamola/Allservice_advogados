"use client"

import * as React from "react"
import { addDays, format, startOfMonth, endOfMonth, subDays, startOfWeek, endOfWeek, subWeeks, subMonths } from "date-fns"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { DateRange } from "react-day-picker"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({
    className,
    date,
    setDate
}: DatePickerWithRangeProps) {
    const [open, setOpen] = React.useState(false)

    // Presets configuration
    const presets = [
        {
            label: 'Hoje',
            getValue: () => ({ from: new Date(), to: new Date() })
        },
        {
            label: 'Ontem',
            getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) })
        },
        {
            label: 'Últimos 7 dias',
            getValue: () => ({ from: subDays(new Date(), 7), to: new Date() })
        },
        {
            label: 'Últimos 14 dias',
            getValue: () => ({ from: subDays(new Date(), 14), to: new Date() })
        },
        {
            label: 'Últimos 30 dias',
            getValue: () => ({ from: subDays(new Date(), 30), to: new Date() })
        },
        {
            label: 'Esta semana',
            getValue: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) })
        },
        {
            label: 'Semana passada',
            getValue: () => ({
                from: startOfWeek(subWeeks(new Date(), 1)),
                to: endOfWeek(subWeeks(new Date(), 1))
            })
        },
        {
            label: 'Este mês',
            getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
        },
        {
            label: 'Mês passado',
            getValue: () => ({
                from: startOfMonth(subMonths(new Date(), 1)),
                to: endOfMonth(subMonths(new Date(), 1))
            })
        },
    ];

    const handlePresetSelect = (preset: { getValue: () => DateRange }) => {
        const newRange = preset.getValue();
        setDate(newRange);
        // Do not close immediately to allow seeing selection on calendar if desired, 
        // or close it. User preference usually to see validation. 
        // Let's close it for snappier feel.
        // setOpen(false); 
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[280px] justify-start text-left font-normal bg-card/50 backdrop-blur-sm border-border hover:bg-accent/50",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                                    {format(date.to, "LLL dd, y", { locale: ptBR })}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y", { locale: ptBR })
                            )
                        ) : (
                            <span>Selecione uma data</span>
                        )}
                        <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex h-auto">
                        {/* Presets Sidebar */}
                        <div className="flex flex-col border-r border-border p-2 w-48 space-y-1 bg-muted/20">
                            <p className="text-[10px] font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">
                                Atalhos
                            </p>
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    className="w-full justify-start text-xs font-normal h-8 hover:bg-accent/50"
                                    onClick={() => handlePresetSelect(preset)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>

                        {/* Calendar */}
                        <div className="flex flex-col">
                            <div className="p-2">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                    locale={ptBR}
                                    className="rounded-md"
                                />
                            </div>
                            <div className="flex justify-end gap-2 p-4 pt-0 border-t border-border mt-auto h-14 items-center">
                                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button size="sm" onClick={() => setOpen(false)} className="px-6">Atualizar</Button>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
