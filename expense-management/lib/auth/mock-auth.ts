// Mock authentication for v0 preview
// In production, this will be replaced with real Supabase auth

export interface User {
  id: string
  email: string
  role: "admin" | "manager" | "employee"
  company_id: string
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("mock_user")
  if (!userStr) return null

  return JSON.parse(userStr)
}

export function setCurrentUser(user: User | null) {
  if (typeof window === "undefined") return

  if (user) {
    localStorage.setItem("mock_user", JSON.stringify(user))
  } else {
    localStorage.removeItem("mock_user")
  }
}

export function signIn(email: string, password: string): User {
  // Mock sign in - determine role based on email
  const role = email.includes("admin") ? "admin" : email.includes("manager") ? "manager" : "employee"

  const user: User = {
    id: Math.random().toString(36).substring(7),
    email,
    role,
    company_id: "mock-company-id",
  }

  setCurrentUser(user)
  return user
}

export function signUp(email: string, password: string, companyName: string): User {
  const user: User = {
    id: Math.random().toString(36).substring(7),
    email,
    role: "admin",
    company_id: Math.random().toString(36).substring(7),
  }

  setCurrentUser(user)
  return user
}

export function signOut() {
  setCurrentUser(null)
}
