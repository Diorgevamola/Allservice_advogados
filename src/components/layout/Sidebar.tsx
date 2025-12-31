"use client";
import React, { useState, useEffect } from "react";
import { Sidebar as SidebarUI, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LayoutDashboard, User, Users, MessageSquare, Layout, Wifi, LogOut } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getUserProfile } from "@/app/(dashboard)/perfil/actions";
import { logoutAction } from "@/app/actions";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Kanban",
        href: "/kanban",
        icon: Layout,
    },
    {
        title: "Leads",
        href: "/leads",
        icon: Users,
    },
    {
        title: "Chats",
        href: "/chats",
        icon: MessageSquare,
    },
    {
        title: "Distribuição",
        href: "/distribuicao",
        icon: Users,
    },
    {
        title: "Perfil",
        href: "/perfil",
        icon: User,
    },
    {
        title: "Conexão",
        href: "/conexao",
        icon: Wifi,
    },
];

export function Sidebar() {
    const [open, setOpen] = useState(false);
    const [officeName, setOfficeName] = useState("AllService AI");

    useEffect(() => {
        async function loadProfile() {
            try {
                const profile = await getUserProfile();
                if (profile && profile["Escritório"]) {
                    setOfficeName(profile["Escritório"]);
                }
            } catch (error) {
                console.error("Erro ao carregar nome do escritório:", error);
            }
        }
        loadProfile();
    }, []);

    return (
        <SidebarUI open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                    {open ? <Logo officeName={officeName} /> : <LogoIcon />}
                    <div className="mt-8 flex flex-col gap-2">
                        {sidebarItems.map((item, idx) => (
                            <SidebarLink
                                key={idx}
                                link={{
                                    label: item.title,
                                    href: item.href,
                                    icon: <item.icon className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                                }}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <form action={logoutAction}>
                        <button
                            type="submit"
                            className={cn(
                                "flex items-center justify-start gap-2 group/sidebar py-2 w-full hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
                            )}
                        >
                            <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                            <motion.span
                                animate={{
                                    display: open ? "inline-block" : "none",
                                    opacity: open ? 1 : 0,
                                }}
                                className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
                            >
                                Sair
                            </motion.span>
                        </button>
                    </form>
                </div>
            </SidebarBody>
        </SidebarUI>
    );
}

export const Logo = ({ officeName }: { officeName: string }) => {
    return (
        <Link
            href="/"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium text-black dark:text-white whitespace-pre truncate"
            >
                {officeName}
            </motion.span>
        </Link>
    );
};

export const LogoIcon = () => {
    return (
        <Link
            href="/"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
        </Link>
    );
};

// Exporting specific components if they are needed elsewhere or to satisfy previous exports (MobileHeader is removed as it's handled internally)

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Kanban",
        href: "/kanban",
        icon: Layout,
    },
    {
        title: "Leads",
        href: "/leads",
        icon: Users,
    },
    {
        title: "Chats",
        href: "/chats",
        icon: MessageSquare,
    },
    {
        title: "Distribuição",
        href: "/distribuicao",
        icon: Users,
    },

    {
        title: "Perfil",
        href: "/perfil",
        icon: User,
    },
    {
        title: "Conexão",
        href: "/conexao",
        icon: Wifi,
    },
];

interface SidebarProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [officeName, setOfficeName] = useState<string>("AllService AI");
    const pathname = usePathname();

    // Reverted to simple sidebarItems usage
    const items = sidebarItems;

    useEffect(() => {
        async function loadProfile() {
            try {
                const profile = await getUserProfile();
                if (profile && profile["Escritório"]) {
                    setOfficeName(profile["Escritório"]);
                }
            } catch (error) {
                console.error("Erro ao carregar nome do escritório:", error);
            }
        }
        loadProfile();
    }, []);

    const toggleSidebar = () => setCollapsed(!collapsed);

    const handleNavClick = () => {
        // Close mobile sidebar on navigation
        if (onMobileClose) {
            onMobileClose();
        }
    };

    return (
        <motion.div
            initial={{ width: 240 }}
            animate={{ width: collapsed ? 100 : 280 }}
            className="relative flex h-screen flex-col border-r border-border bg-sidebar backdrop-blur-xl text-sidebar-foreground transition-all duration-300"
        >
            <div className="flex h-16 items-center justify-between px-4">
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-lg font-light truncate bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                    >
                        {officeName}
                    </motion.span>
                )}
                {collapsed && (
                    <div className="mx-auto h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary" />
                )}
                {/* Close button for mobile */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8 text-zinc-400"
                    onClick={onMobileClose}
                >
                    <X className="h-5 w-5" />
                </Button>
                {/* Collapse button for desktop */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex absolute -right-4 top-6 h-8 w-8 rounded-full border bg-background shadow-md"
                    onClick={toggleSidebar}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <nav className="flex-1 space-y-4 px-4 py-6">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavClick}
                            className={cn(
                                "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-light tracking-wide transition-all hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-accent text-accent-foreground shadow-sm border border-border" : "text-muted-foreground",
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

            <div className="p-4 border-t">
                <form action={logoutAction}>
                    <Button
                        variant="ghost"
                        className={cn("w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10", collapsed && "justify-center px-0")}
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

// Mobile Header Component
export function MobileHeader({ onMenuClick, officeName }: { onMenuClick: () => void; officeName: string }) {
    return (
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4">
            <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="text-zinc-400 hover:text-white"
            >
                <Menu className="h-6 w-6" />
            </Button>
            <span className="text-sm font-light bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {officeName}
            </span>
            <div className="w-10" /> {/* Spacer for centering */}
        </div>
    );
}
