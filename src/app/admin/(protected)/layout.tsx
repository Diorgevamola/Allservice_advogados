import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminMobileWrapper } from "../AdminMobileWrapper";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session || !session.startsWith('admin:')) {
        redirect('/login');
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile Header & Sidebar logic wrapped in a client component */}
            <AdminMobileWrapper>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-14 md:pt-0 bg-background/95 w-full">
                    <div className="mx-auto max-w-6xl space-y-8">
                        {children}
                    </div>
                </main>
            </AdminMobileWrapper>
        </div>
    );
}
