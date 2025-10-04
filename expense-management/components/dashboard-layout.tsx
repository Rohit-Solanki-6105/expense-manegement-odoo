"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { ReceiptIcon, UsersIcon, CheckCircleIcon, FileTextIcon, LogOutIcon, SettingsIcon } from "@/components/icons"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { Profile } from "@/lib/types"

interface DashboardLayoutProps {
  children: React.ReactNode
  profile: Profile
}

export function DashboardLayout({ children, profile }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const navigation = [
    ...(profile.role === "admin"
      ? [
          { name: "Team", href: "/dashboard/admin", icon: UsersIcon },
          { name: "Approval Rules", href: "/dashboard/admin/rules", icon: SettingsIcon },
          { name: "All Expenses", href: "/dashboard/admin/expenses", icon: FileTextIcon },
        ]
      : []),
    ...(profile.role === "manager"
      ? [
          { name: "Pending Approvals", href: "/dashboard/manager", icon: CheckCircleIcon },
          { name: "My Expenses", href: "/dashboard/employee", icon: ReceiptIcon },
        ]
      : []),
    ...(profile.role === "employee" ? [{ name: "My Expenses", href: "/dashboard/employee", icon: ReceiptIcon }] : []),
  ]

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptIcon className="h-6 w-6" />
            <span className="text-lg font-semibold">ExpenseFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOutIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-border bg-muted/30 md:block">
          <nav className="space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link key={item.name} href={item.href}>
                  <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start gap-2" size="sm">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
