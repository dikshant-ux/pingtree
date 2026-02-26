'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ModeToggle } from '@/components/mode-toggle';


interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    mode: 'login' | 'register';
}

export default function AuthLayout({ children, title, subtitle, mode }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
            {/* Left Side - Branding & Visuals */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden items-center justify-center p-12">
                {/* Dynamic Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900 to-black z-0" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-20 z-0" />

                {/* Animated Orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] mix-blend-screen"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] mix-blend-screen"
                />

                <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 max-w-lg text-center"
                >
                    <div className="mb-8 flex justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                            <span className="text-4xl text-white">
                                {mode === 'login' ? '⚡' : '🚀'}
                            </span>
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {mode === 'login' ? 'Ping Tree Distribution' : 'Join the Network'}
                    </h2>
                    <p className="text-xl text-gray-400 font-light leading-relaxed">
                        {mode === 'login'
                            ? "The most advanced lead distribution platform. Route, filter, and monetize your traffic with real-time analytics and precision control."
                            : "Start monetizing your traffic today. Connect with top-tier buyers and optimize your revenue streams with our intelligent routing engine."
                        }
                    </p>

                    {/* Stats or Trust Indicators */}
                    <div className="mt-12 grid grid-cols-3 gap-8 border-t border-white/10 pt-8">
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {mode === 'login' ? '99.9%' : '500+'}
                            </div>
                            <div className="text-sm text-gray-500">
                                {mode === 'login' ? 'Uptime' : 'Buyers'}
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {mode === 'login' ? '50ms' : '$2M+'}
                            </div>
                            <div className="text-sm text-gray-500">
                                {mode === 'login' ? 'Latency' : 'Daily Vol'}
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">100+</div>
                            <div className="text-sm text-gray-500">Integrations</div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Form Container */}
            <div className="w-full lg:w-1/2 flex flex-col relative z-10 bg-background">
                {/* Top Toggle - Centered */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">

                    <div className="bg-background/80 dark:bg-gray-900/50 backdrop-blur-md p-1 rounded-xl border border-border flex items-center shadow-sm">
                        <Link
                            href="/login"
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${mode === 'login'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${mode === 'register'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>

                {/* Theme Toggle - Top Right */}
                <div className="absolute top-6 right-6 z-20">
                    <ModeToggle />
                </div>

                {/* Mobile Header (visible only on small screens) */}
                <div className="lg:hidden p-6 pb-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <span className="text-xl text-white">⚡</span>
                        </div>
                        <span className="font-bold text-xl text-foreground">Ping Tree</span>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24 overflow-y-auto">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-full max-w-md space-y-8"
                    >
                        <div className="text-center lg:text-left">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                                {title}
                            </h1>
                            <p className="text-muted-foreground">
                                {subtitle}
                            </p>
                        </div>

                        {children}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
