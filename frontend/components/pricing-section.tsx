"use client"

import { Corp1o1Pricing } from "@/components/ui/corp1o1-pricing"
import { Shield, Crown, Building } from "lucide-react"

interface PricingSectionProps {
  onSelectPlan?: (planId: string) => void
}

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
  
  const corp1o1Plans = [
    {
      name: "STARTER",
      price: "29",
      yearlyPrice: "23",
      period: "month",
      features: [
        "5 AI assessments per month",
        "Basic portfolio analysis",
        "Standard certificates",
        "Mobile & desktop access",
        "Email support",
        "Personal dashboard",
        "GitHub/Behance integration"
      ],
      description: "Perfect for discovering AI skills assessment",
      buttonText: "Start Free Trial",
      href: "/signup?plan=starter",
      isPopular: false,
      icon: Shield,
      gradient: "from-slate-500 to-slate-600",
    },
    {
      name: "PROFESSIONAL",
      price: "79",
      yearlyPrice: "63",
      period: "month",
      features: [
        "Unlimited AI assessments",
        "NFT blockchain certificates",
        "Advanced AI analysis 99.7%",
        "Voice & written evaluations",
        "Priority support 24/7",
        "Complete API access",
        "Scalable certificates",
        "Blockchain verification",
        "Smart portfolio",
        "Career recommendations"
      ],
      description: "Complete solution for ambitious professionals",
      buttonText: "Unlock My Potential",
      href: "/signup?plan=professional",
      isPopular: true,
      icon: Crown,
      gradient: "from-cyan-500 to-blue-600",
    },
    {
      name: "ENTERPRISE",
      price: "299",
      yearlyPrice: "239",
      period: "month",
      features: [
        "Everything in Professional",
        "Unlimited team management",
        "Advanced admin dashboard",
        "Custom integrations",
        "Dedicated support & training",
        "Analytics reports",
        "Complete white-labeling",
        "99.9% SLA guarantee",
        "GDPR/SOC2 compliance",
        "Personalized onboarding"
      ],
      description: "For organizations revolutionizing recruitment",
      buttonText: "Transform HR",
      href: "/contact?plan=enterprise",
      isPopular: false,
      icon: Building,
      gradient: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <Corp1o1Pricing 
      plans={corp1o1Plans}
      title="The Skills Revolution"
      description="Transform your career with our AI assessment solutions\nAll plans include platform access, AI analysis, and dedicated support."
    />
  );
}