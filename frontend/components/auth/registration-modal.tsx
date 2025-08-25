"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Mail, Shield, Eye, EyeOff, Building, User, Crown, ArrowLeft, CheckCircle } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/contexts/auth-context"

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [currentStep, setCurrentStep] = useState<"method" | "form" | "success">("method")
  const [registrationMethod, setRegistrationMethod] = useState<"banking" | "email">("banking")
  const [userType, setUserType] = useState<"user" | "enterprise" | "admin">("user")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    bankId: "",
    bankPassword: "",
    selectedBank: "",
    company: "",
  })

  const handleBack = () => {
    if (currentStep === "form") {
      setCurrentStep("method")
    } else if (currentStep === "success") {
      setCurrentStep("form")
    }
  }

  const handleMethodSelect = (method: "banking" | "email") => {
    setRegistrationMethod(method)
    setCurrentStep("form")
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate registration process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setCurrentStep("success")
    setIsLoading(false)

    // Auto-login after successful registration
    setTimeout(() => {
      const newUser = {
        id: `${userType}-${Date.now()}`,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        avatar: "/placeholder.svg?height=40&width=40",
        role: userType as "user" | "enterprise" | "admin",
        subscription: userType === "enterprise" ? ("enterprise" as const) : ("premium" as const),
        notifications: 0,
        company: userType === "enterprise" ? formData.company : undefined,
      }

      login(newUser)
      onClose()
    }, 2000)
  }

  const isUnder18 = () => {
    if (!formData.birthDate) return false
    const birthDate = new Date(formData.birthDate)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 < 18
    }
    return age < 18
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-600">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            {currentStep !== "method" && (
              <Button
                onClick={handleBack}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-slate-800/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-2xl font-bold text-white">
              {currentStep === "method" && t("registration.join_revolution")}
              {currentStep === "form" && `Inscription ${registrationMethod === "banking" ? "bancaire" : "par email"}`}
              {currentStep === "success" && "Inscription réussie !"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {currentStep === "method" && (
          <div className="space-y-6">
            <p className="text-gray-300 text-center">{t("registration.choose_method")}</p>

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
                  <CardTitle className="text-white text-lg">{t("registration.user_type.individual")}</CardTitle>
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
                  <CardTitle className="text-white text-lg">{t("registration.user_type.enterprise")}</CardTitle>
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
                  <CardTitle className="text-white text-lg">{t("registration.user_type.admin")}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Registration Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                onClick={() => handleMethodSelect("banking")}
                className="cursor-pointer bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600 hover:border-cyan-500/50 transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      {t("registration.banking.title")}
                    </CardTitle>
                    <Badge className="bg-cyan-500/20 text-cyan-400">{t("registration.recommended")}</Badge>
                  </div>
                  <CardDescription className="text-gray-300">{t("registration.banking.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      t("registration.banking.features.instant_verification"),
                      t("registration.banking.features.bank_security"),
                      t("registration.banking.features.immediate_access"),
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card
                onClick={() => handleMethodSelect("email")}
                className="cursor-pointer bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600 hover:border-slate-500/50 transition-all duration-300"
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    {t("registration.email.title")}
                  </CardTitle>
                  <CardDescription className="text-gray-300">{t("registration.email.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      t("registration.email.features.manual_verification"),
                      t("registration.email.features.activation_delay"),
                      t("registration.email.features.accessible_all"),
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-sm">{t("registration.security_notice")}</p>
            </div>
          </div>
        )}

        {currentStep === "form" && (
          <div className="space-y-6">
            {registrationMethod === "banking" ? (
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white">{t("registration.banking.secure_connection")}</CardTitle>
                  <CardDescription className="text-gray-300">{t("registration.banking.connect_bank")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegistration} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-white">
                          {t("registration.email.first_name")}
                        </Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                          placeholder={t("registration.email.your_first_name")}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-white">
                          {t("registration.email.last_name")}
                        </Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                          placeholder={t("registration.email.your_last_name")}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-white">
                        {t("registration.email.email_address")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                        placeholder={t("registration.email.email_placeholder")}
                        required
                      />
                    </div>

                    {userType === "enterprise" && (
                      <div>
                        <Label htmlFor="company" className="text-white">
                          Nom de l'entreprise
                        </Label>
                        <Input
                          id="company"
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                          placeholder="Votre entreprise"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="bank-select" className="text-white">
                        {t("registration.banking.select_bank")}
                      </Label>
                      <select
                        id="bank-select"
                        value={formData.selectedBank}
                        onChange={(e) => setFormData({ ...formData, selectedBank: e.target.value })}
                        className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                        required
                      >
                        <option value="">{t("registration.banking.choose_bank")}</option>
                        <option value="bnp">BNP Paribas</option>
                        <option value="credit-agricole">Crédit Agricole</option>
                        <option value="societe-generale">Société Générale</option>
                        <option value="lcl">LCL</option>
                        <option value="other">{t("registration.banking.other_bank")}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bank-id" className="text-white">
                          {t("registration.banking.bank_id")}
                        </Label>
                        <Input
                          id="bank-id"
                          type="text"
                          value={formData.bankId}
                          onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                          placeholder={t("registration.banking.your_id")}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank-password" className="text-white">
                          {t("registration.banking.password")}
                        </Label>
                        <div className="relative">
                          <Input
                            id="bank-password"
                            type={showPassword ? "text" : "password"}
                            value={formData.bankPassword}
                            onChange={(e) => setFormData({ ...formData, bankPassword: e.target.value })}
                            className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500 pr-10"
                            placeholder={t("registration.banking.your_password")}
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

                    <div>
                      <Label htmlFor="birthDate" className="text-white">
                        {t("registration.email.birth_date")}
                      </Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                        required
                      />
                    </div>

                    {isUnder18() && (
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                          <span className="text-green-400 font-semibold">
                            {t("registration.youth.benefits_activated")}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{t("registration.youth.free_access")}</p>
                      </div>
                    )}

                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Shield className="h-5 w-5 text-cyan-400 mr-2" />
                        <span className="text-cyan-400 font-semibold">
                          {t("registration.banking.security_guaranteed")}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{t("registration.banking.security_details")}</p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3"
                    >
                      {isLoading ? "Création du compte..." : t("registration.banking.verify_identity")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white">{t("registration.email.create_account")}</CardTitle>
                  <CardDescription className="text-gray-300">{t("registration.email.create_account")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegistration} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-white">
                          {t("registration.email.first_name")}
                        </Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                          placeholder={t("registration.email.your_first_name")}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-white">
                          {t("registration.email.last_name")}
                        </Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                          placeholder={t("registration.email.your_last_name")}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-white">
                        {t("registration.email.email_address")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                        placeholder={t("registration.email.email_placeholder")}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-white">
                        {t("registration.email.phone")}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                        placeholder={t("registration.email.phone_placeholder")}
                        required
                      />
                    </div>

                    {userType === "enterprise" && (
                      <div>
                        <Label htmlFor="company" className="text-white">
                          Nom de l'entreprise
                        </Label>
                        <Input
                          id="company"
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                          placeholder="Votre entreprise"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="birthDate" className="text-white">
                        {t("registration.email.birth_date")}
                      </Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password" className="text-white">
                          {t("registration.email.password")}
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500 pr-10"
                            placeholder={t("registration.email.password_placeholder")}
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
                      <div>
                        <Label htmlFor="confirmPassword" className="text-white">
                          {t("registration.email.confirm_password")}
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                          placeholder={t("registration.email.confirm_password_placeholder")}
                          required
                        />
                      </div>
                    </div>

                    {isUnder18() && (
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                          <span className="text-green-400 font-semibold">
                            {t("registration.youth.benefits_activated")}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{t("registration.youth.free_access")}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="terms" className="rounded border-slate-600 bg-slate-700" required />
                      <label htmlFor="terms" className="text-sm text-gray-300">
                        {t("registration.accept_terms")}
                      </label>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold py-3"
                    >
                      {isLoading ? "Création du compte..." : t("registration.email.create_account")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentStep === "success" && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Bienvenue dans l'aventure !</h3>
              <p className="text-gray-300">
                Votre compte a été créé avec succès. Vous allez être redirigé vers votre tableau de bord.
              </p>
            </div>
            <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-cyan-400 font-semibold mb-2">Prochaines étapes :</p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Complétez votre profil</li>
                <li>• Commencez votre première évaluation</li>
                <li>• Explorez vos domaines de compétences</li>
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
