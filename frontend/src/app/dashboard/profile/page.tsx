'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function ProfilePage() {
    const [user, setUser] = useState<{ email: string; role: string; is_active: boolean; is_2fa_enabled: boolean } | null>(null);
    const [loading, setLoading] = useState(true);
    const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
    const [showDisableDialog, setShowDisableDialog] = useState(false);
    const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Change Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);


    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (err) {
            console.error("Failed to fetch user", err);
        } finally {
            setLoading(false);
        }
    };

    const startTwoFactorSetup = async () => {
        try {
            // Reset state
            setQrCodeUrl('');
            setOtpCode('');

            const res = await api.post('/auth/2fa/setup');
            setQrCodeUrl(res.data.otpauth_url);
        } catch (err) {
            toast.error("Failed to start 2FA setup.");
        }
    };

    const verifyAndEnableTwoFactor = async () => {
        try {
            await api.post('/auth/2fa/enable', { token: otpCode });
            toast.success("Two-factor authentication enabled.");
            setShowTwoFactorSetup(false);
            fetchUser(); // Refresh user state
        } catch (err) {
            toast.error("Invalid code. Please try again.");
        }
    };

    const disableTwoFactor = async () => {
        try {
            await api.post('/auth/2fa/disable', { password });
            toast.success("Two-factor authentication disabled.");
            setShowDisableDialog(false);
            setPassword('');
            fetchUser();
        } catch (err) {
            toast.error("Failed to disable 2FA. Incorrect password.");
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        try {
            await api.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            toast.success("Password updated successfully.");
            setShowChangePasswordDialog(false);
            // Reset fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            const msg = err.response?.data?.detail || "Failed to update password.";
            toast.error(msg);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return <div className="text-destructive">Failed to load profile.</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Profile</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Your basic account details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20 border-2 border-border">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${user.email}&background=random&size=128`} alt="@user" />
                                <AvatarFallback className="text-2xl">{user.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <h3 className="text-xl font-semibold">{user.email.split('@')[0]}</h3>
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    <Badge variant={user.is_active ? "default" : "destructive"} className="text-xs">
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                                    <p className="text-sm font-medium capitalize">{user.role}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">User ID</p>
                                    <p className="text-sm font-mono text-muted-foreground truncate" title="ID hidden for security">********</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Manage your password and security settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/40">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">Password</p>
                                <p className="text-xs text-muted-foreground">Last changed: Never</p>
                            </div>

                            <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">Change Password</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Change Password</DialogTitle>
                                        <DialogDescription>
                                            Enter your current password and a new strong password.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="current-password">Current Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="current-password"
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="new-password">New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="new-password"
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                                            <Input
                                                id="confirm-password"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowChangePasswordDialog(false)}>Cancel</Button>
                                        <Button
                                            onClick={handleChangePassword}
                                            disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                                        >
                                            Update Password
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/40">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">Two-Factor Authentication</p>
                                <p className="text-xs text-muted-foreground">
                                    {user.is_2fa_enabled
                                        ? "Your account is secured with 2FA."
                                        : "Add an extra layer of security."}
                                </p>
                            </div>

                            {user.is_2fa_enabled ? (
                                <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">Disable</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                                            <DialogDescription>
                                                Please enter your password to confirm. This will lower your account security.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="password">Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>Cancel</Button>
                                            <Button variant="destructive" onClick={disableTwoFactor} disabled={!password}>Disable 2FA</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            ) : (
                                <Dialog open={showTwoFactorSetup} onOpenChange={setShowTwoFactorSetup}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" onClick={startTwoFactorSetup}>Enable 2FA</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
                                            <DialogDescription>
                                                Scan the QR code with your authenticator app (like Google Authenticator).
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex flex-col items-center justify-center space-y-4 py-4">
                                            {qrCodeUrl ? (
                                                <div className="p-4 bg-white rounded-lg border">
                                                    <QRCodeSVG value={qrCodeUrl} size={150} />
                                                </div>
                                            ) : (
                                                <div className="h-[150px] w-[150px] flex items-center justify-center">
                                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                                </div>
                                            )}

                                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                                <Label htmlFor="otp">Verification Code</Label>
                                                <Input
                                                    type="text"
                                                    id="otp"
                                                    placeholder="Enter 6-digit code"
                                                    value={otpCode}
                                                    onChange={(e) => setOtpCode(e.target.value)}
                                                    maxLength={6}
                                                    className="text-center text-lg tracking-widest font-mono"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" onClick={verifyAndEnableTwoFactor} disabled={otpCode.length !== 6}>Verify & Enable</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
