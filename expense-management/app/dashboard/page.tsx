"use client"

import { getCurrentUser } from "@/lib/auth/mock-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    // Redirect based on role
    if (user.role === "admin") {
      router.push("/dashboard/admin")
    } else if (user.role === "manager") {
      router.push("/dashboard/manager")
    } else {
      router.push("/dashboard/employee")
    }
  }, [router])

  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  )
}
