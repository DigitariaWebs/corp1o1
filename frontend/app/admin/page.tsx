import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { MainNavigation } from "@/components/navigation/main-navigation"

export default function AdminPage() {
  const mockUser = {
    name: "Admin System",
    avatar: "/placeholder.svg?height=40&width=40",
    subscription: "enterprise" as const,
    notifications: 5,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <MainNavigation user={mockUser} />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <AdminDashboard />
        </div>
      </div>
    </div>
  )
}
