// Mock database for v0 preview
// In production, this will use real Supabase queries

export interface Expense {
  id: string
  title: string
  amount: number
  currency: string
  category: string
  description: string
  receipt_url: string | null
  status: "pending" | "approved" | "rejected"
  employee_id: string
  employee_email: string
  created_at: string
}

export interface ApprovalRequest {
  id: string
  expense_id: string
  approver_id: string
  status: "pending" | "approved" | "rejected"
  order: number
  comments: string | null
  expense: Expense
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: "admin" | "manager" | "employee"
  company_id: string
}

export interface ApprovalRule {
  id: string
  name: string
  rule_type: "percentage" | "specific_approver" | "hybrid"
  threshold_amount: number | null
  threshold_percentage: number | null
  approvers: string[]
  company_id: string
}

// Mock data
const mockExpenses: Expense[] = [
  {
    id: "1",
    title: "Office Supplies",
    amount: 150.0,
    currency: "USD",
    category: "Office Supplies",
    description: "Pens, papers, and folders",
    receipt_url: null,
    status: "pending",
    employee_id: "emp1",
    employee_email: "employee@company.com",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Client Dinner",
    amount: 450.0,
    currency: "USD",
    category: "Meals & Entertainment",
    description: "Dinner with potential client",
    receipt_url: null,
    status: "approved",
    employee_id: "emp1",
    employee_email: "employee@company.com",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

const mockProfiles: Profile[] = [
  {
    id: "admin1",
    email: "admin@company.com",
    full_name: "Admin User",
    role: "admin",
    company_id: "company1",
  },
  {
    id: "manager1",
    email: "manager@company.com",
    full_name: "Manager User",
    role: "manager",
    company_id: "company1",
  },
  {
    id: "emp1",
    email: "employee@company.com",
    full_name: "Employee User",
    role: "employee",
    company_id: "company1",
  },
]

const mockApprovalRules: ApprovalRule[] = [
  {
    id: "rule1",
    name: "Small Expenses",
    rule_type: "specific_approver",
    threshold_amount: 500,
    threshold_percentage: null,
    approvers: ["manager1"],
    company_id: "company1",
  },
]

export const mockDb = {
  expenses: {
    getAll: () => Promise.resolve(mockExpenses),
    getByUser: (userId: string) => Promise.resolve(mockExpenses.filter((e) => e.employee_id === userId)),
    create: (expense: Omit<Expense, "id" | "created_at">) =>
      Promise.resolve({
        ...expense,
        id: Math.random().toString(36).substring(7),
        created_at: new Date().toISOString(),
      }),
  },
  profiles: {
    getAll: () => Promise.resolve(mockProfiles),
    getByEmail: (email: string) => Promise.resolve(mockProfiles.find((p) => p.email === email) || null),
    create: (profile: Omit<Profile, "id">) =>
      Promise.resolve({
        ...profile,
        id: Math.random().toString(36).substring(7),
      }),
  },
  approvalRules: {
    getAll: () => Promise.resolve(mockApprovalRules),
    create: (rule: Omit<ApprovalRule, "id">) =>
      Promise.resolve({
        ...rule,
        id: Math.random().toString(36).substring(7),
      }),
  },
  approvalRequests: {
    getByApprover: (approverId: string) =>
      Promise.resolve([
        {
          id: "req1",
          expense_id: "1",
          approver_id: approverId,
          status: "pending" as const,
          order: 1,
          comments: null,
          expense: mockExpenses[0],
        },
      ]),
  },
}
