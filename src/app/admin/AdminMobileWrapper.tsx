'use client';

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

// Simple internal MobileHeader since the main one was removed/refactored
function MobileHeader({ onMenuClick, officeName }: { onMenuClick: () => void; officeName: string }) {
    return (
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4">
            <button
                onClick={onMenuClick}
                className="text-zinc-400 hover:text-white p-2"
            >
                <Menu className="h-6 w-6" />
            </button>
            <span className="text-sm font-light bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {officeName}
            </span>
            <div className="w-10" /> {/* Spacer for centering */}
        </div>
    );
}

export function AdminMobileWrapper({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden w-full">
            {/* Mobile Header */}
            <MobileHeader
                onMenuClick={() => setIsMobileMenuOpen(true)}
                officeName="Administração Global"
            />

            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <AdminSidebar />
            </div>

            {/* Mobile Sidebar */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-0 h-full w-[280px] animate-in slide-in-from-left duration-300">
                        <AdminSidebar
                            isMobileOpen={isMobileMenuOpen}
                            onMobileClose={() => setIsMobileMenuOpen(false)}
                        />
                    </div>
                </div>
            )}

            {children}
        </div>
    );
}
