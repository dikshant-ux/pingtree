"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { useBreadcrumbs } from "@/context/BreadcrumbContext"

export function Header() {
    const pathname = usePathname()
    const { customLabels } = useBreadcrumbs()
    const paths = pathname.split('/').filter(Boolean)
    const [isOpen, setIsOpen] = useState(false)

    // Close the mobile sidebar when the route changes
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 flex flex-col border-r-0">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <Sidebar className="w-full flex-1 border-r-0 shadow-none border-t-0" isMobile />
                </SheetContent>
            </Sheet>

            <Breadcrumb className="hidden sm:flex">
                <BreadcrumbList>
                    {paths.map((path, index) => {
                        const href = `/${paths.slice(0, index + 1).join('/')}`
                        const isLast = index === paths.length - 1
                        const label = customLabels[href] || path.charAt(0).toUpperCase() + path.slice(1)

                        return (
                            <div key={path} className="flex items-center">
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage>{label}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link href={href}>{label}</Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {!isLast && <BreadcrumbSeparator />}
                            </div>
                        )
                    })}
                </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-2">
                <ModeToggle />
            </div>
        </header>
    )
}
