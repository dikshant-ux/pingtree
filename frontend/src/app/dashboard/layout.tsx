'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

import { BreadcrumbProvider } from '@/context/BreadcrumbContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    if (!mounted) return null;

    return (
        <BreadcrumbProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar className="hidden md:flex" />

                <div className="flex flex-col flex-1 overflow-hidden relative">
                    <Header />

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto bg-slate-50/100 dark:bg-muted/20 p-8">
                        {children}
                    </main>
                </div>
            </div>
        </BreadcrumbProvider>
    );
}
