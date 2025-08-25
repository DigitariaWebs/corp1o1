"use client"

import { CertificateManagement } from "@/components/certificates/certificate-management"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { useAuth } from "@/contexts/auth-context"

export default function CertificatesPage() {
  const { user } = useAuth()

  const mockUser = {
    name: user?.name || "Student",
    avatar: user?.avatar || "/placeholder.svg?height=40&width=40",
    subscription: "premium" as const,
    notifications: 3,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <MainNavigation user={mockUser} />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <CertificateManagement />
        </div>
      </div>
    </div>
  )
}
