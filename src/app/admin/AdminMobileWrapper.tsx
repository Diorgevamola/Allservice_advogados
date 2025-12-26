'use client';

import { useState } from "react";
import { MobileHeader } from "@/components/layout/Sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

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
