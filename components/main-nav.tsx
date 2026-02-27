"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/hooks/use-language"
import { cn } from "@/lib/utils"
import { LanguageSelector } from "@/components/language-selector"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const { t } = useLanguage()
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: t("common.dashboard") },
    { href: "/properties", label: t("navigation.properties") },
    { href: "/tenants", label: t("navigation.tenants") },
    { href: "/contracts", label: t("navigation.contracts") },
    { href: "/invoices", label: t("navigation.invoices") },
    { href: "/maintenance", label: t("navigation.maintenance") },
    { href: "/reports", label: t("navigation.reports") },
  ]

  return (
    <div className="flex items-center">
      <nav className={cn("flex items-center space-x-4 lg:space-x-6 rtl:space-x-reverse", className)} {...props}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              pathname === item.href ? "text-primary" : "text-muted-foreground",
            )}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="ms-4">
        <LanguageSelector />
      </div>
    </div>
  )
}
