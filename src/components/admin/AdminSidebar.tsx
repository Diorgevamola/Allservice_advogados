"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, MessageSquare, ChevronLeft, ChevronRight, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions";
import { motion } from "motion/react";

const adminItems = [
    {
        title: "Leads Globais",
        href: "/admin/leads",
        icon: Users,
    },
    {
        title: "Chats Globais",
        href: "/admin/chats",
        icon: MessageSquare,
    },
    {
        title: "Distribuição",
        href: "/admin/distribuicao",
        icon: Users,
    },
];

interface AdminSidebarProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function AdminSidebar({ isMobileOpen, onMobileClose }: AdminSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    const toggleSidebar = () => setCollapsed(!collapsed);

    const handleNavClick = () => {
        if (onMobileClose) {
            onMobileClose();
        }
    };

    return (
        <motion.div
            initial={{ width: 240 }}
            animate={{ width: collapsed ? 100 : 280 }}
            className="relative flex h-screen flex-col border-r border-red-900/20 bg-zinc-950 text-zinc-100 transition-all duration-300"
        >
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-lg font-light truncate text-white"
                    >
                        Administração
                    </motion.span>
                )}
                {collapsed && (
                    <div className="mx-auto h-8 w-8 rounded-full bg-red-600" />
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8 text-zinc-400"
                    onClick={onMobileClose}
                >
                    <X className="h-5 w-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex absolute -right-4 top-6 h-8 w-8 rounded-full border border-red-900/20 bg-zinc-900 shadow-md"
                    onClick={toggleSidebar}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <nav className="flex-1 space-y-4 px-4 py-6">
                {adminItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavClick}
                            className={cn(
                                "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-light tracking-wide transition-all hover:bg-white/5 hover:text-white",
                                isActive ? "bg-red-500/10 text-red-500 border border-red-500/20" : "text-zinc-400",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                >
                                    {item.title}
                                </motion.span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <form action={logoutAction}>
                    <Button
                        variant="ghost"
                        className={cn("w-full justify-start text-zinc-500 hover:text-white hover:bg-white/5", collapsed && "justify-center px-0")}
                        type="submit"
                    >
                        <LogOut className="h-5 w-5" />
                        {!collapsed && <span className="ml-2">Sair</span>}
                    </Button>
                </form>
            </div>
        </motion.div>
    );
}
