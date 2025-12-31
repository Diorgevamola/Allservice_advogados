'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isChatsPage = pathname === '/chats';
    const isKanbanPage = pathname === '/kanban';
    // Chats and Kanban need full width/height without default padding
    const isNoPadding = isChatsPage || isKanbanPage;

    return (
        <div className={cn(
            "flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 border-neutral-200 dark:border-neutral-700 overflow-hidden",
            "h-screen"
        )}>
            <Sidebar />
            <main className={cn(
                "flex-1 overflow-y-auto bg-white dark:bg-neutral-900",
                isNoPadding ? "p-0" : "p-4 md:p-8"
            )}>
                {children}
            </main>
        </div>
    );
}
