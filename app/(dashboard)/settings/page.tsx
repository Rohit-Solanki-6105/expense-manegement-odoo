"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Shield, MapPin, Calendar } from "lucide-react"
import { format } from "date-fns"

export default function SettingsPage() {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Please sign in to view settings.</p>
      </div>
    )
  }

  const user = session.user as any // Type assertion for extended user properties

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your basic account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="text-sm bg-muted p-2 rounded">
                {user.email}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <div className="text-sm bg-muted p-2 rounded">
                {user.name || "Not set"}
              </div>
            </div>

            {user.country && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Country
                </label>
                <div className="text-sm bg-muted p-2 rounded">
                  {user.country}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role & Permissions
            </CardTitle>
            <CardDescription>
              Your current role and access levels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Role</label>
              <div>
                <Badge variant="secondary" className="text-base">
                  {user.role}
                </Badge>
              </div>
            </div>

            {user.role === "MANAGER" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Permissions</label>
                <div>
                  {user.canBeEmployee ? (
                    <Badge variant="outline">Can act as Employee</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">No additional permissions</span>
                  )}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Access Permissions</label>
              <div className="space-y-1 text-sm">
                {user.role === "ADMIN" && (
                  <>
                    <div className="flex items-center gap-2">
                      ✅ <span>Manage categories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      ✅ <span>Manage users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      ✅ <span>View all reports</span>
                    </div>
                    <div className="flex items-center gap-2">
                      ✅ <span>Approve expenses</span>
                    </div>
                  </>
                )}
                
                {user.role === "MANAGER" && (
                  <>
                    <div className="flex items-center gap-2">
                      ✅ <span>Approve expenses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      ✅ <span>View team reports</span>
                    </div>
                    {user.canBeEmployee && (
                      <div className="flex items-center gap-2">
                        ✅ <span>Submit expenses</span>
                      </div>
                    )}
                  </>
                )}

                {(user.role === "EMPLOYEE" || (user.role === "MANAGER" && user.canBeEmployee)) && (
                  <div className="flex items-center gap-2">
                    ✅ <span>Submit expenses</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Account creation and activity details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Created</label>
                <div className="text-sm bg-muted p-2 rounded">
                  {user.createdAt ? format(new Date(user.createdAt), "PPP") : "Unknown"}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Updated</label>
                <div className="text-sm bg-muted p-2 rounded">
                  {user.updatedAt ? format(new Date(user.updatedAt), "PPP") : "Unknown"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>
              Application-wide preferences and configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">ExpenseFlow v1.0</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Professional expense management system with role-based access control, 
                  approval workflows, and comprehensive reporting.
                </p>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Features available:</strong> Expense submission, approval workflow, 
                  category management, reporting and analytics, user management, role-based permissions.
                </p>
                <p className="mt-2">
                  <strong>Upcoming features:</strong> Receipt OCR processing, advanced reporting, 
                  mobile application, integration with accounting systems.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}