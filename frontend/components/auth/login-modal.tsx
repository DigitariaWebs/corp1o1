"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Mail, Shield, Eye, EyeOff, Building, User, Crown } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/contexts/auth-context"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [loginMethod, setLoginMethod] = useState<"banking" | "email">("banking")
  const [userType, setUserType] = useState<"user" | "enterprise" | "admin">("user")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    bankId: "",
    bankPassword: "",
    selectedBank: "",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate authentication
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock user data based on type
    const mockUsers = {
      user: {
        id: "user-1",
        name: "Alexandre Dubois",
        email: "alexandre.dubois@example.com",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "user" as const,
        subscription: "premium" as const,
        notifications: 3,
      },
      enterprise: {
        id: "enterprise-1",
        name: "Marie Entreprise",
        email: "marie@techcorp.com",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "enterprise" as const,
        subscription: "enterprise" as const,
        notifications: 8,
        company: "TechCorp Solutions",
      },
      admin: {
        id: "admin-1",
        name: "Admin System",
        email: "admin@corp1o1.com",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "admin" as const,
        subscription: "enterprise" as const,
        notifications: 15,
      },
    }

    login(mockUsers[userType])
    setIsLoading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-600">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white text-center">{t("login.welcome_back")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              className={`cursor-pointer transition-all duration-300 ${
                userType === "user"
                  ? "bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500/50"
                  : "bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600 hover:border-slate-500"
              }`}
              onClick={() => setUserType("user")}
            >
              <CardHeader className="text-center pb-2">
                <div
                  className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                    userType === "user"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600"
                      : "bg-gradient-to-r from-slate-600 to-slate-700"
                  }`}
                >
                  <User className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-lg">{t("login.user_type.individual")}</CardTitle>
              </CardHeader>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-300 ${
                userType === "enterprise"
                  ? "bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-2 border-amber-500/50"
                  : "bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600 hover:border-slate-500"
              }`}
              onClick={() => setUserType("enterprise")}
            >
              <CardHeader className="text-center pb-2">
                <div
                  className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                    userType === "enterprise"
                      ? "bg-gradient-to-r from-amber-500 to-orange-600"
                      : "bg-gradient-to-r from-slate-600 to-slate-700"
                  }`}
                >
                  <Building className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-lg">{t("login.user_type.enterprise")}</CardTitle>
              </CardHeader>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-300 ${
                userType === "admin"
                  ? "bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50"
                  : "bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600 hover:border-slate-500"
              }`}
              onClick={() => setUserType("admin")}
            >
              <CardHeader className="text-center pb-2">
                <div
                  className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                    userType === "admin"
                      ? "bg-gradient-to-r from-purple-500 to-pink-600"
                      : "bg-gradient-to-r from-slate-600 to-slate-700"
                  }`}
                >
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-lg">{t("login.user_type.admin")}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Login Methods */}
          <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as "banking" | "email")}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
              <TabsTrigger value="banking" className="text-gray-300 data-[state=active]:text-white">
                <CreditCard className="h-4 w-4 mr-2" />
                {t("login.banking_login")}
              </TabsTrigger>
              <TabsTrigger value="email" className="text-gray-300 data-[state=active]:text-white">
                <Mail className="h-4 w-4 mr-2" />
                {t("login.email_login")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="banking" className="mt-6">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white">{t("login.banking.secure_login")}</CardTitle>
                  <CardDescription className="text-gray-300">{t("login.banking.connect_bank_account")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="bank-select" className="text-white">
                        {t("login.banking.select_bank")}
                      </Label>
                      <select
                        id="bank-select"
                        value={formData.selectedBank}
                        onChange={(e) => setFormData({ ...formData, selectedBank: e.target.value })}
                        className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                        required
                      >
                        <option value="">{t("login.banking.choose_bank")}</option>
                        <option value="rbc">RBC Royal Bank</option>
                        <option value="td">TD Canada Trust</option>
                        <option value="scotiabank">Scotiabank</option>
                        <option value="bmo">BMO Bank of Montreal</option>
                        <option value="cibc">CIBC</option>
                        <option value="other">{t("login.banking.other_bank")}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bank-id" className="text-white">
                          {t("login.banking.bank_id")}
                        </Label>
                        <Input
                          id="bank-id"
                          type="text"
                          value={formData.bankId}
                          onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                          placeholder={t("login.banking.your_id")}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank-password" className="text-white">
                          {t("login.banking.password")}
                        </Label>
                        <div className="relative">
                          <Input
                            id="bank-password"
                            type={showPassword ? "text" : "password"}
                            value={formData.bankPassword}
                            onChange={(e) => setFormData({ ...formData, bankPassword: e.target.value })}
                            className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500 pr-10"
                            placeholder={t("login.banking.your_password")}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Shield className="h-5 w-5 text-cyan-400 mr-2" />
                        <span className="text-cyan-400 font-semibold">{t("login.banking.security_guaranteed")}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{t("login.banking.security_details")}</p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3"
                    >
                      {isLoading ? t("login.logging_in") : t("login.banking.secure_login_button")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="mt-6">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white">{t("login.email.login_with_email")}</CardTitle>
                  <CardDescription className="text-gray-300">{t("login.email.enter_credentials")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-white">
                        {t("login.email.email_address")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                        placeholder={t("login.email.email_placeholder")}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="password" className="text-white">
                        {t("login.email.password")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500 pr-10"
                          placeholder={t("login.email.password_placeholder")}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 text-sm text-gray-300">
                        <input type="checkbox" className="rounded border-slate-600 bg-slate-700" />
                        <span>{t("login.remember_me")}</span>
                      </label>
                      <Button variant="link" className="text-cyan-400 hover:text-cyan-300 p-0">
                        {t("login.forgot_password")}
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold py-3"
                    >
                      {isLoading ? t("login.logging_in") : t("login.email.login_button")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-center">
            <p className="text-gray-400 text-sm">
              {t("login.no_account")}
              <Button variant="link" className="text-cyan-400 hover:text-cyan-300 p-0 ml-1">
                {t("login.sign_up")}
              </Button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
