'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';

import AuthLayout from '@/components/auth/AuthLayout';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Password Validation Logic
    const validations = {
        length: password.length >= 8,
        number: /\d/.test(password),
        special: /[!@#$%^&*]/.test(password),
        case: /[a-z]/.test(password) && /[A-Z]/.test(password),
    };

    const isPasswordValid = Object.values(validations).every(Boolean);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPasswordValid) {
            setError('Please meet all password requirements');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/register', {
                email,
                password,
                role: 'admin' // Defaulting to admin for now as per requirements
            });

            // Redirect to login after successful registration
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            mode="register"
            title="Create Account"
            subtitle="Join Ping Tree to manage your lead distribution"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center justify-center animate-in fade-in slide-in-from-top-2">
                        <span className="mr-2">⚠️</span>
                        {error}
                    </div>
                )}

                <div className="space-y-4">
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
                                className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 dark:bg-gray-900/50 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 text-foreground placeholder-muted-foreground transition-all outline-none"
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
                                className="w-full pl-10 pr-10 py-2.5 bg-secondary/50 dark:bg-gray-900/50 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 text-foreground placeholder-muted-foreground transition-all outline-none"
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

                        {/* Password Strength Indicators */}
                        {password && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <div className={`text-[10px] flex items-center ${validations.length ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${validations.length ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    8+ characters
                                </div>
                                <div className={`text-[10px] flex items-center ${validations.case ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${validations.case ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    Upper & lowercase
                                </div>
                                <div className={`text-[10px] flex items-center ${validations.number ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${validations.number ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    Number
                                </div>
                                <div className={`text-[10px] flex items-center ${validations.special ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${validations.special ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    Special char (!@#$%)
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-medium text-muted-foreground ml-1 mb-1.5 block">
                            Confirm Password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-indigo-400 transition-colors">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 bg-secondary/50 dark:bg-gray-900/50 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 text-foreground placeholder-muted-foreground transition-all outline-none"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-indigo-400 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group transform hover:-translate-y-0.5"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                        </>
                    ) : (
                        <>
                            Sign Up
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <div className="text-center text-xs text-gray-500 mt-4">
                    Protected by enterprise-grade security
                </div>
            </form>
        </AuthLayout>
    );
}

