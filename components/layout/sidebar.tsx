"use client"

import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboard, 
  Receipt, 
  Plus, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  Users, 
  Tags,
  LogOut,
  User,
  GitBranch
} from "lucide-react"
import { useState } from "react"

interface SidebarProps {
  children: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [ loading, isLoading] = useState<boolean>(true);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"]
    },
    {
      name: "My Expenses",
      href: "/expenses",
      icon: Receipt,
      roles: ["MANAGER", "EMPLOYEE", "ADMIN"]
    },
    {
      name: "Submit Expense",
      href: "/expenses/new",
      icon: Plus,
      roles: ["MANAGER", "EMPLOYEE"]
    },
    {
      name: "Approvals",
      href: "/approvals",
      icon: CheckSquare,
      roles: ["ADMIN", "MANAGER"]
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      roles: ["ADMIN", "MANAGER"]
    },
    {
      name: "Categories",
      href: "/categories",
      icon: Tags,
      roles: ["ADMIN"]
    },
    {
      name: "Approval Sequences",
      href: "/approval-sequences",
      icon: GitBranch,
      roles: ["ADMIN"]
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
      roles: ["ADMIN"]
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"]
    }
  ]

  const userRole = session?.user?.role as string
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole) || 
    (userRole === "MANAGER" && session?.user?.canBeEmployee && item.roles.includes("EMPLOYEE"))
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ExpenseFlow</span>
            </div>
          </div>
          
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => isLoading(true)}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 transition-colors ${
                        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User Profile Section */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                  <div className="flex items-center w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {session?.user?.name?.charAt(0)?.toUpperCase() || session?.user?.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3 text-left flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        {session?.user?.name || session?.user?.email}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {userRole}
                        </Badge>
                        {userRole === "MANAGER" && session?.user?.canBeEmployee && (
                          <Badge variant="outline" className="text-xs">
                            Employee
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}