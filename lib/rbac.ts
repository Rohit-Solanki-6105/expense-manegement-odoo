// Role-based access control utilities

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'

export interface User {
  id: string
  role: UserRole
  canBeEmployee: boolean
}

// Role hierarchy: ADMIN > MANAGER > EMPLOYEE
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  return user?.role === role
}

/**
 * Check if user has a role at or above the specified level
 */
export function hasMinimumRole(user: User | null, minimumRole: UserRole): boolean {
  if (!user) return false
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minimumRole]
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, 'ADMIN')
}

/**
 * Check if user is a manager
 */
export function isManager(user: User | null): boolean {
  return hasRole(user, 'MANAGER')
}

/**
 * Check if user is an employee
 */
export function isEmployee(user: User | null): boolean {
  return hasRole(user, 'EMPLOYEE')
}

/**
 * Check if manager can act as employee
 * Managers can be employees if canBeEmployee is true
 */
export function canActAsEmployee(user: User | null): boolean {
  if (!user) return false
  return user.role === 'MANAGER' && user.canBeEmployee
}

/**
 * Check if user can access admin features
 */
export function canAccessAdmin(user: User | null): boolean {
  return isAdmin(user)
}

/**
 * Check if user can access manager features
 */
export function canAccessManager(user: User | null): boolean {
  return hasMinimumRole(user, 'MANAGER')
}

/**
 * Check if user can access employee features
 */
export function canAccessEmployee(user: User | null): boolean {
  if (!user) return false
  return user.role === 'EMPLOYEE' || canActAsEmployee(user)
}

/**
 * Get display name for role
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    ADMIN: 'Administrator',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
  }
  return roleNames[role]
}

/**
 * Get all roles that user can access
 */
export function getAccessibleRoles(user: User | null): UserRole[] {
  if (!user) return []
  
  const roles: UserRole[] = [user.role]
  
  // Managers who can be employees have access to employee features
  if (canActAsEmployee(user)) {
    roles.push('EMPLOYEE')
  }
  
  return roles
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(user: User | null): boolean {
  return hasMinimumRole(user, 'MANAGER')
}

/**
 * Check if user can view reports
 */
export function canViewReports(user: User | null): boolean {
  return hasMinimumRole(user, 'MANAGER')
}

/**
 * Check if user can approve expenses
 */
export function canApproveExpenses(user: User | null): boolean {
  return hasMinimumRole(user, 'MANAGER')
}