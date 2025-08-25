import { ComprehensiveDashboard } from "@/components/dashboard/comprehensive-dashboard"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { OnboardingManager } from "@/components/onboarding/onboarding-manager"

export default function DashboardPage() {
  return (
    <OnboardingManager>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
        <MainNavigation />
        <ComprehensiveDashboard />
      </div>
    </OnboardingManager>
  )
}
