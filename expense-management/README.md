# ExpenseFlow - Enterprise Expense Management System

A comprehensive expense management system built for MNCs with multi-level approval workflows, role-based access control, and receipt management.

## Features

### Core Features
- **Authentication & Company Management**: Auto-create company on admin signup with Supabase Auth
- **Role-Based Access Control**: Three distinct roles (Admin, Manager, Employee) with appropriate permissions
- **Expense Submission**: Employees can submit expenses with receipts, multiple currencies, and categories
- **Multi-Level Approval Workflows**: Configure flexible approval rules:
  - Percentage-based (e.g., expenses >$1000 need CFO approval)
  - Specific approver (e.g., all travel expenses need Travel Manager approval)
  - Hybrid (combine both conditions)
  - Sequential approvals (approvers must approve in order)
- **Receipt Management**: Upload and store receipts using Vercel Blob
- **Real-Time Status Tracking**: Track expense status through the approval pipeline

### User Roles

#### Admin
- Create and manage employees and managers
- Configure approval rules and workflows
- View all company expenses
- Full system access

#### Manager/Approver
- View pending approval requests assigned to them
- Approve or reject expenses with comments
- View approval history
- Sequential approval support

#### Employee
- Submit new expenses with receipts
- View personal expense history
- Track approval status
- Multi-currency support

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Vercel Blob
- **UI Components**: shadcn/ui with Tailwind CSS v4
- **TypeScript**: Full type safety

## Database Schema

### Tables
- `companies`: Company information
- `profiles`: User profiles with role and company association
- `expenses`: Expense records with status tracking
- `approval_rules`: Configurable approval workflow rules
- `approval_requests`: Individual approval requests for expenses

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access data from their company
- Role-based permissions enforced at database level

## Getting Started

### Prerequisites
1. Supabase project connected
2. Vercel Blob storage configured
3. Environment variables set (automatically configured via integrations)

### Setup Steps

1. **Run Database Scripts**
   - Execute `scripts/001_create_tables.sql` to create all tables
   - Execute `scripts/002_create_company_on_signup.sql` to set up the company creation trigger

2. **Create Admin Account**
   - Sign up at `/auth/sign-up`
   - This automatically creates a company and sets you as admin
   - Verify your email via Supabase

3. **Configure Your Company**
   - Add employees and managers via Admin Dashboard
   - Set up approval rules based on your workflow needs

4. **Start Using**
   - Employees can submit expenses
   - Managers receive approval requests
   - Track everything in real-time

## Application Routes

### Public Routes
- `/` - Landing page
- `/auth/login` - Sign in
- `/auth/sign-up` - Create admin account

### Protected Routes (require authentication)
- `/dashboard` - Main dashboard (redirects based on role)

#### Admin Routes
- `/dashboard/admin` - User management
- `/dashboard/admin/add-user` - Add employees/managers
- `/dashboard/admin/rules` - View approval rules
- `/dashboard/admin/rules/add` - Create approval rules
- `/dashboard/admin/expenses` - View all company expenses

#### Manager Routes
- `/dashboard/manager` - Approval queue

#### Employee Routes
- `/dashboard/employee` - Personal expenses
- `/dashboard/employee/submit` - Submit new expense

## Approval Workflow Logic

### Rule Types

1. **Percentage-Based**
   - Trigger: Expense amount ≥ (threshold_percentage × total budget)
   - Example: Expenses over 10% of budget need CFO approval

2. **Specific Approver**
   - Trigger: Expense amount ≥ threshold_amount
   - Example: All expenses over $1000 need Finance Manager approval

3. **Hybrid**
   - Trigger: Both conditions must be met
   - Example: Expenses over $5000 AND over 5% of budget need CEO approval

### Sequential Approvals
- Rules can have multiple approvers with sequence numbers
- Approvers must approve in order (sequence 1, then 2, then 3, etc.)
- Next approver only sees request after previous approver approves

### Status Flow
1. **Pending**: Expense submitted, awaiting approvals
2. **Approved**: All required approvals received
3. **Rejected**: Any approver rejected the expense

## Design System

### Colors
- Professional blue primary color for trust and reliability
- Neutral grays for backgrounds and borders
- Semantic colors for status indicators (green for approved, red for rejected, yellow for pending)

### Typography
- Clean, readable fonts optimized for data-heavy interfaces
- Proper hierarchy for scanning large tables and forms

### Layout
- Responsive design with mobile-first approach
- Consistent spacing using Tailwind's spacing scale
- Card-based layouts for clear content separation

## Security Features

- Row Level Security (RLS) on all database tables
- Company-based data isolation
- Role-based access control
- Secure file uploads with validation
- Protected API routes with authentication checks

## Future Enhancements

- OCR receipt scanning (requires fal.ai integration)
- Export to CSV/PDF
- Advanced analytics and reporting
- Budget tracking and alerts
- Mobile app
- Slack/Teams notifications

## Support

For issues or questions, refer to the Vercel documentation or open a support ticket at vercel.com/help.
