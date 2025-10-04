export type UserRole = "admin" | "manager" | "employee"

export type ExpenseStatus = "pending" | "approved" | "rejected"

export type ApprovalRuleType = "percentage" | "specific_approver" | "hybrid"

export interface Company {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  company_id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Currency {
  code: string
  name: string
  symbol: string
}

export interface Expense {
  id: string
  company_id: string
  employee_id: string
  title: string
  description?: string
  amount: number
  currency_code: string
  category: string
  receipt_url?: string
  status: ExpenseStatus
  submitted_at: string
  created_at: string
  updated_at: string
}

export interface ApprovalRule {
  id: string
  company_id: string
  name: string
  rule_type: ApprovalRuleType
  threshold_amount?: number
  threshold_percentage?: number
  approver_id?: string
  sequence_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ApprovalRequest {
  id: string
  expense_id: string
  approver_id: string
  sequence_order: number
  status: ExpenseStatus
  comments?: string
  responded_at?: string
  created_at: string
}
