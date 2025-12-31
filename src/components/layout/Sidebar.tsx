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
