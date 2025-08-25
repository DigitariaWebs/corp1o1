"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Crown, Building, Check, X, Zap, Globe, Heart, TrendingUp, Download } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

interface SubscriptionTier {
  id: string
  name: string
  price: number
  currency: string
  period: string
  description: string
  features: string[]
  limitations: string[]
  popular?: boolean
  icon: React.ElementType
  color: string
  nftIncluded?: boolean
}

export function SubscriptionManagement() {
  const { t, tArray } = useTranslation() // ✅ Added tArray to destructuring
  const [currentPlan, setCurrentPlan] = useState("basic")
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  const subscriptionTiers: SubscriptionTier[] = [
    {
      id: "basic",
      name: t("subscription.tiers.basic.name"),
      price: billingPeriod === "monthly" ? 9.99 : 99.99,
      currency: "$",
      period: billingPeriod === "monthly" ? "/mois" : "/an",
      description: t("subscription.tiers.basic.description"),
      icon: CreditCard,
      color: "from-slate-500 to-slate-600",
      features: tArray("subscription.tiers.basic.features"), // ✅ Changed from t() to tArray()
      limitations: tArray("subscription.tiers.basic.limitations"), // ✅ Changed from t() to tArray()
    },
    {
      id: "premium",
      name: t("subscription.tiers.premium.name"),
      price: billingPeriod === "monthly" ? 29.99 : 299.99,
      currency: "$",
      period: billingPeriod === "monthly" ? "/mois" : "/an",
      description: t("subscription.tiers.premium.description"),
      icon: Crown,
      color: "from-cyan-500 to-blue-600",
      popular: true,
      nftIncluded: true,
      features: tArray("subscription.tiers.premium.features"), // ✅ Changed from t() to tArray()
      limitations: [],
    },
    {
      id: "enterprise",
      name: t("subscription.tiers.enterprise.name"),
      price: 499,
      currency: "$",
      period: "/mois",
      description: t("subscription.tiers.enterprise.description"),
      icon: Building,
      color: "from-amber-500 to-orange-600",
      features: tArray("subscription.tiers.enterprise.features"), // ✅ Changed from t() to tArray()
      limitations: [],
    },
  ]

  const currentTier = subscriptionTiers.find((tier) => tier.id === currentPlan)

  const youthImpactData = {
    personalContribution: 156.78,
    totalFund: 125000,
    youthHelped: 2500,
    targetAmount: 350000,
  }

  const billingHistory = [
    {
      date: "2024-01-01",
      amount: 29.99,
      plan: "Premium + NFT",
      status: "paid",
      invoice: "INV-2024-001",
    },
    {
      date: "2023-12-01",
      amount: 29.99,
      plan: "Premium + NFT",
      status: "paid",
      invoice: "INV-2023-012",
    },
    {
      date: "2023-11-01",
      amount: 29.99,
      plan: "Premium + NFT",
      status: "paid",
      invoice: "INV-2023-011",
    },
  ]

  const handleUpgrade = (tierId: string) => {
    setCurrentPlan(tierId)
    // Simulate upgrade process
    console.log(`Upgrading to ${tierId}`)
  }

  const progressPercentage = (youthImpactData.totalFund / youthImpactData.targetAmount) * 100

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-white mb-4">{t("subscription.title")}</h2>
        <p className="text-gray-300 text-lg">{t("subscription.subtitle")}</p>
      </motion.div>

      {/* Current Plan Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
          <CardHeader>
            <CardTitle className="text-white text-xl">{t("subscription.current_plan")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {currentTier && (
                  <>
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-r ${currentTier.color} flex items-center justify-center`}
                    >
                      <currentTier.icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{currentTier.name}</h3>
                      <p className="text-gray-300">{currentTier.description}</p>
                      <div className="flex items-center mt-2">
                        <span className="text-3xl font-bold text-white">
                          {currentTier.currency}
                          {currentTier.price}
                        </span>
                        <span className="text-gray-400 ml-1">{currentTier.period}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="text-right">
                <Badge className="bg-green-500/20 text-green-400 mb-2">{t("subscription.active")}</Badge>
                <p className="text-gray-400 text-sm">{t("subscription.renewal", { date: "01/02/2024" })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="plans" className="text-gray-300 data-[state=active]:text-white">
            {t("subscription.plans_pricing")}
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-gray-300 data-[state=active]:text-white">
            {t("subscription.billing")}
          </TabsTrigger>
          <TabsTrigger value="impact" className="text-gray-300 data-[state=active]:text-white">
            {t("subscription.social_impact")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-8">
          {/* Billing Period Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-slate-800/50 rounded-lg p-1 flex">
              <Button
                variant={billingPeriod === "monthly" ? "default" : "ghost"}
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 ${
                  billingPeriod === "monthly"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {t("subscription.monthly")}
              </Button>
              <Button
                variant={billingPeriod === "yearly" ? "default" : "ghost"}
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 ${
                  billingPeriod === "yearly"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {t("subscription.yearly")}
                <Badge className="ml-2 bg-green-500/20 text-green-400 text-xs">
                  {t("subscription.save_percent", { percent: "17" })}
                </Badge>
              </Button>
            </div>
          </motion.div>

          {/* Subscription Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptionTiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="relative"
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1">
                      {t("subscription.popular")}
                    </Badge>
                  </div>
                )}
                <Card
                  className={`h-full transition-all duration-300 hover:scale-105 ${
                    currentPlan === tier.id ? "ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20" : "hover:shadow-lg"
                  } ${
                    tier.popular
                      ? "bg-gradient-to-br from-slate-800/80 to-slate-700/60 border-2 border-amber-500/50"
                      : "bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/30"
                  }`}
                >
                  <CardHeader className="text-center pb-4">
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mx-auto mb-4`}
                    >
                      <tier.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-white text-2xl">{tier.name}</CardTitle>
                    <p className="text-gray-300 text-sm">{tier.description}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">
                        {tier.currency}
                        {tier.price}
                      </span>
                      <span className="text-gray-400">{tier.period}</span>
                    </div>
                    {tier.nftIncluded && (
                      <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                        <Zap className="h-3 w-3 mr-1" />
                        {t("subscription.nft_included")}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-semibold mb-3">Fonctionnalités incluses:</h4>
                        <ul className="space-y-2">
                          {tier.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center text-gray-300 text-sm">
                              <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {tier.limitations.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">Limitations:</h4>
                          <ul className="space-y-2">
                            {tier.limitations.map((limitation, limitationIndex) => (
                              <li key={limitationIndex} className="flex items-center text-gray-400 text-sm">
                                <X className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                                {limitation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Button
                        onClick={() => handleUpgrade(tier.id)}
                        disabled={currentPlan === tier.id}
                        className={`w-full mt-6 ${
                          currentPlan === tier.id
                            ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                            : `bg-gradient-to-r ${tier.color} hover:opacity-90 text-white`
                        }`}
                      >
                        {currentPlan === tier.id ? t("subscription.current") : t("subscription.upgrade_to", { plan: tier.name })}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Method */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{t("subscription.payment_method")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-600/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">•••• •••• •••• 4242</p>
                          <p className="text-gray-400 text-sm">Expire 12/26</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400">Principal</Badge>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-slate-600 text-white hover:bg-slate-800 bg-transparent"
                    >
                      {t("subscription.add_payment")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Billing History */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{t("subscription.billing_history")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {billingHistory.map((bill, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-600/30"
                      >
                        <div>
                          <p className="text-white font-medium">{bill.plan}</p>
                          <p className="text-gray-400 text-sm">{bill.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">${bill.amount}</p>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-green-500/20 text-green-400 text-xs">{t("subscription.paid")}</Badge>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="impact" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Impact */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center">
                    <Heart className="h-6 w-6 mr-3 text-pink-400" />
                    {t("subscription.personal_impact")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-pink-400 mb-2">${youthImpactData.personalContribution}</p>
                      <p className="text-gray-300">{t("subscription.total_contribution")}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-300">{t("subscription.youth_helped_indirectly")}</span>
                        <span className="text-white font-medium">
                          ~{Math.floor(youthImpactData.personalContribution / 50)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">{t("subscription.contribution_months")}</span>
                        <span className="text-white font-medium">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">{t("subscription.monthly_impact")}</span>
                        <span className="text-white font-medium">
                          ${(youthImpactData.personalContribution / 12).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-500/30">
                      <p className="text-pink-400 font-semibold mb-2">{t("subscription.thank_you_impact")}</p>
                      <p className="text-gray-300 text-sm">
                        {t("subscription.contribution_message")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Global Impact */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center">
                    <Globe className="h-6 w-6 mr-3 text-cyan-400" />
                    {t("subscription.global_impact")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-cyan-400 mb-2">
                        ${youthImpactData.totalFund.toLocaleString()}
                      </p>
                      <p className="text-gray-300">{t("subscription.total_fund")}</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Objectif 2024</span>
                        <span>${youthImpactData.targetAmount.toLocaleString()}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-3 mb-2" />
                      <p className="text-center text-gray-400 text-sm">
                        {progressPercentage.toFixed(1)}% de l'objectif atteint
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-slate-800/30">
                        <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{youthImpactData.youthHelped}</p>
                        <p className="text-gray-400 text-sm">Jeunes Aidés</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-slate-800/30">
                        <Globe className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">85</p>
                        <p className="text-gray-400 text-sm">Pays Touchés</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30">
                      <p className="text-cyan-400 font-semibold mb-2">{t("subscription.transparent_impact")}</p>
                      <p className="text-gray-300 text-sm">
                        {t("subscription.transparency_message")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
