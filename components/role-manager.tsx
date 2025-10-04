"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface User {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  canBeEmployee: boolean
}

interface RoleManagerProps {
  users: User[]
  onUpdateRole: (userId: string, role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE', canBeEmployee: boolean) => void
}

export function RoleManager({ users, onUpdateRole }: RoleManagerProps) {
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MANAGER' | 'EMPLOYEE'>('EMPLOYEE')
  const [canBeEmployee, setCanBeEmployee] = useState(false)

  const handleSaveRole = (userId: string) => {
    onUpdateRole(userId, selectedRole, canBeEmployee)
    setEditingUser(null)
  }

  const startEditing = (user: User) => {
    setEditingUser(user.id)
    setSelectedRole(user.role)
    setCanBeEmployee(user.canBeEmployee)
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Role Management</h3>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {user.name || 'Unnamed User'}
                </div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              
              {editingUser === user.id ? (
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'ADMIN' | 'MANAGER' | 'EMPLOYEE')}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="ADMIN">Administrator</option>
                    <option value="MANAGER">Manager</option>
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                  
                  {selectedRole === 'MANAGER' && (
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={canBeEmployee}
                        onChange={(e) => setCanBeEmployee(e.target.checked)}
                        className="mr-1"
                      />
                      Can be Employee
                    </label>
                  )}
                  
                  <Button
                    size="sm"
                    onClick={() => handleSaveRole(user.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'ADMIN' ? 'Administrator' : 
                     user.role === 'MANAGER' ? 'Manager' : 'Employee'}
                  </span>
                  
                  {user.role === 'MANAGER' && user.canBeEmployee && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Can be Employee
                    </span>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditing(user)}
                  >
                    Edit Role
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}