"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
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

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
            <Breadcrumb>
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
