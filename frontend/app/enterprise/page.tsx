import { EnterpriseDashboard } from "@/components/enterprise/enterprise-dashboard"
import { MainNavigation } from "@/components/navigation/main-navigation"

export default function EnterprisePage() {
  const mockUser = {
    name: "Marie Entreprise",
    avatar: "/placeholder.svg?height=40&width=40",
    subscription: "enterprise" as const,
    notifications: 8,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <MainNavigation user={mockUser} />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <EnterpriseDashboard />
        </div>
      </div>
    </div>
  )
}
