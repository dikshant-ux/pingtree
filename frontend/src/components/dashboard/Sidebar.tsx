"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button" // Assuming Button is present, checked earlier.
// Actually checking imports:
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { LayoutDashboard, Users, BarChart3, PanelLeftClose, PanelLeftOpen, LogOut, User, Settings, List, Share2 } from 'lucide-react'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = React.useState(false)
    const [user, setUser] = React.useState<{ email: string; role: string } | null>(null)

    React.useEffect(() => {
        const fetchUser = async () => {
            try {
                // We use dynamic import for api to avoid circular deps if any, though likely safe.
                // Better to just import at top. I'll stick to top level import but since I can't edit top level easily with replace_file_content if I don't see it, I will assume imports are there or I added them. 
                // Wait, I can only replace contiguous blocks. I need to add imports too.
                // I will assume I need to do a larger replace or use multi_replace.
                // Let's use api from lib.
                const { default: api } = await import('@/lib/api');
                const res = await api.get('/users/me');
                setUser(res.data);
            } catch (err) {
                console.error("Failed to fetch user", err);
            }
        }
        fetchUser();
    }, []);

    const toggleCollapse = () => setCollapsed(!collapsed)

    const menuItems = [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Buyers', href: '/dashboard/buyers', icon: Users },
        { label: 'Leads', href: '/dashboard/leads', icon: List },
        { label: 'Ping Tree', href: '/dashboard/ping-tree', icon: Share2 },
        { label: 'Ingestion', href: '/dashboard/ingestion', icon: Share2 }, // Using Share2 as placeholder icon if Code/Terminal not ideal
        { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
        { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ]

    return (
        <div className={cn(
            "relative z-10 flex flex-col border-r bg-card transition-all duration-300 shadow-xl",
            collapsed ? "w-16" : "w-64",
            className
        )}>
            {/* Header / Logo */}
            <div className={cn("flex h-16 items-center border-b px-4", collapsed ? "justify-center" : "justify-between")}>
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <img src="/logo.svg" alt="PingTree Logo" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent truncate">
                            Ping Tree
                        </span>
                    </div>
                )}
                <Button variant="ghost" size="icon" className={cn("shrink-0", !collapsed && "ml-auto")} onClick={toggleCollapse}>
                    {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
            </div>

            {/* Nav */}
            <ScrollArea className="flex-1 py-4">
                <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <TooltipProvider key={item.href} disableHoverableContent>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                                                collapsed && "justify-center px-2"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {!collapsed && <span>{item.label}</span>}
                                        </Link>
                                    </TooltipTrigger>
                                    {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
                                </Tooltip>
                            </TooltipProvider>
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* Footer / Profile */}
            <div className="border-t p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={cn("w-full justify-start gap-2 px-2", collapsed && "justify-center px-0")}>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=random`} alt="@user" />
                                <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase() || 'CN'}</AvatarFallback>
                            </Avatar>
                            {!collapsed && (
                                <div className="flex flex-col items-start text-xs text-left overflow-hidden">
                                    <span className="font-medium truncate w-full">{user?.email?.split('@')[0] || 'Loading...'}</span>
                                    <span className="text-muted-foreground truncate w-full">{user?.email || '...'}</span>
                                </div>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.email?.split('@')[0] || 'User'}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user?.email || 'user@example.com'}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <Link href="/dashboard/profile">
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                            </Link>
                            <Link href="/dashboard/settings">
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                            </Link>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                            localStorage.removeItem('token')
                            if (typeof window !== 'undefined') window.location.href = '/login'
                        }}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
