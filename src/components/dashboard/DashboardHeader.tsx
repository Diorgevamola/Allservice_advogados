
'use client';

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeRange } from "@/lib/api";
import Image from 'next/image';

interface DashboardHeaderProps {
    children?: React.ReactNode;
}

export function DashboardHeader({ children }: DashboardHeaderProps) {
    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-primary">
                    <img
                        src="/logo.png"
                        alt="AllService AI"
                        className="h-full w-full object-cover"
                    />
                </div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    AllService AI
                </h2>
            </div>
            <div className="flex items-center gap-4">
                {children}
            </div>
        </div>
    );
}
