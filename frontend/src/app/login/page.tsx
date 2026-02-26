'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTwoFactor, setShowTwoFactor] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            if (showTwoFactor) {
                formData.append('otp_code', otpCode);
            }

            const res = await api.post('/auth/login/access-token', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const { access_token } = res.data;
            localStorage.setItem('token', access_token);
            router.push('/dashboard');
        } catch (err: any) {
            if (err.response?.status === 403 && err.response?.data?.detail === "2FA_REQUIRED") {
                setShowTwoFactor(true);
                setError('');
            } else if (showTwoFactor && err.response?.status === 401) {
                setError('Invalid 2FA code');
            } else {
                setError('Invalid email or password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            mode="login"
            title={showTwoFactor ? "Two-Factor Authentication" : "Welcome Back"}
            subtitle={showTwoFactor ? "Enter the 6-digit code from your authenticator app" : "Enter your credentials to access your dashboard"}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center justify-center animate-in fade-in slide-in-from-top-2">
                        <span className="mr-2">⚠️</span>
                        {error}
                    </div>
                )}

                {showTwoFactor ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground ml-1 mb-1.5 block">
                                Authentication Code
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-indigo-400 transition-colors">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    maxLength={6}
                                    className="w-full pl-10 pr-4 py-3 bg-secondary/50 dark:bg-gray-900/50 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 text-foreground placeholder-muted-foreground transition-all outline-none font-mono tracking-widest text-center text-lg"
                                    placeholder="000000"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => { setShowTwoFactor(false); setOtpCode(''); }}
                                className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
                            >
                                Back to login
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground ml-1 mb-1.5 block">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-indigo-400 transition-colors">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-secondary/50 dark:bg-gray-900/50 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 text-foreground placeholder-muted-foreground transition-all outline-none"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground ml-1 mb-1.5 block">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-indigo-400 transition-colors">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 bg-secondary/50 dark:bg-gray-900/50 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 text-foreground placeholder-muted-foreground transition-all outline-none"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-indigo-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <div className="text-right mt-1">
                                <Link href="#" className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {showTwoFactor ? "Verifying..." : "Signing in..."}
                        </>
                    ) : (
                        <>
                            {showTwoFactor ? "Verify Code" : "Sign In"}
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <div className="text-center text-xs text-gray-500 mt-4">
                    Protected by enterprise-grade security
                </div>
            </form >
        </AuthLayout >
    );
}

