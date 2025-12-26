'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { useState } from "react";
import { MobileHeader } from "@/components/layout/Sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile Header */}
            <MobileHeader
                onMenuClick={() => setIsMobileMenuOpen(true)}
                officeName="Administração Global"
            />

            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
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
                        />
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-14 md:pt-0 bg-background/95">
                <div className="mx-auto max-w-6xl space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
