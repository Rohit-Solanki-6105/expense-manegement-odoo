"use client"

import Link from "next/link";
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Expense Management
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Take control of your finances with our comprehensive expense tracking solution
        </p>

        {isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              Welcome back, {user?.name || user?.email}!
            </p>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/auth/signin">
                  Sign In
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/signup">
                  Create Account
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Start tracking your expenses today
            </p>
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Track Expenses
            </h3>
            <p className="text-gray-600">
              Easily record and categorize your daily expenses
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Analyze Spending
            </h3>
            <p className="text-gray-600">
              Get insights into your spending patterns and habits
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Set Budgets
            </h3>
            <p className="text-gray-600">
              Create budgets and stay on track with your financial goals
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
