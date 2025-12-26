'use client';

import { useState } from "react";
import { Sidebar, MobileHeader } from "@/components/layout/Sidebar";

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
                <Sidebar isAdmin={true} />
            </div>

            {/* Mobile Sidebar */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-0 h-full w-[280px] animate-in slide-in-from-left duration-300">
                        <Sidebar
                            isMobileOpen={isMobileMenuOpen}
                            onMobileClose={() => setIsMobileMenuOpen(false)}
                            isAdmin={true}
                        />
                    </div>
                </div>
            )}

            {children}
        </div>
    );
}
