import  Corp1o1UserPortfolio  from "@/components/portfolio/portfolio-integration-hub"
import { MainNavigation } from "@/components/navigation/main-navigation"

export default function PortfolioPage() {
  const mockUser = {
    name: "Alexandre Dubois",
    avatar: "/placeholder.svg?height=40&width=40",
    subscription: "premium" as const,
    notifications: 3,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <MainNavigation user={mockUser} />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Corp1o1UserPortfolio />
        </div>
      </div>
    </div>
  )
}
