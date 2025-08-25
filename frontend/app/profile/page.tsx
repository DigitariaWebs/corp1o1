"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  User,
  Mail,
  Globe,
  Clock,
  Building,
  MapPin,
  Camera,
  Save,
  Shield,
  Bell,
  Brain,
  Zap,
  Settings,
  Award,
  Crown,
  Briefcase,
  Trash2,
  AlertTriangle,
} from "lucide-react"

interface ProfileSettings {
  profile: {
    firstName: string
    lastName: string
    email: string
    bio: string
    timezone: string
    preferredLanguage: string
    profileImage: string
  }
  learning: {
    learningStyle: string
    preferredPace: string
    optimalSessionDuration: number
    aiPersonality: string
    adaptiveMode: boolean
    voiceEnabled: boolean
  }
  notifications: {
    learningReminders: boolean
    achievementNotifications: boolean
    weeklyProgress: boolean
    aiInsights: boolean
  }
  account: {
    role: string
    subscription: {
      tier: string
      features: string[]
    }
    isEmailVerified: boolean
  }
  company?: {
    name: string
    industry: string
    size: string
    website: string
    department: string
    position: string
  }
}

export default function ProfilePage() {
  const { user, isLoading, getToken, refreshUserData } = useAuth()
  const { toast } = useToast()
  const [settings, setSettings] = useState<ProfileSettings | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      // Map user data to settings format
      setSettings({
        profile: {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          bio: user.bio || "",
          timezone: user.timezone || "UTC",
          preferredLanguage: user.preferredLanguage || "fr",
          profileImage: user.avatar || "",
        },
        learning: {
          learningStyle: user.learningProfile?.learningStyle || "balanced",
          preferredPace: user.learningProfile?.preferredPace || "medium",
          optimalSessionDuration: user.learningProfile?.optimalSessionDuration || 45,
          aiPersonality: user.learningProfile?.aiPersonality || "ARIA",
          adaptiveMode: user.learningProfile?.adaptiveMode ?? true,
          voiceEnabled: user.learningProfile?.voiceEnabled ?? false,
        },
        notifications: {
          learningReminders: user.learningProfile?.notificationSettings?.learningReminders ?? true,
          achievementNotifications: user.learningProfile?.notificationSettings?.achievementNotifications ?? true,
          weeklyProgress: user.learningProfile?.notificationSettings?.weeklyProgress ?? true,
          aiInsights: user.learningProfile?.notificationSettings?.aiInsights ?? true,
        },
        account: {
          role: user.role || "user",
          subscription: user.subscription || { tier: "basic", features: [] },
          isEmailVerified: user.isEmailVerified || false,
        },
        company: user.company || {
          name: "",
          industry: "",
          size: "",
          website: "",
          department: "",
          position: "",
        },
      })
    }
  }, [user])

  const handleUpdateSettings = async () => {
    if (!settings) return

    setIsUpdating(true)
    try {
      const token = await getToken()
      if (!token) throw new Error("No authentication token")

      // Check if backend is available first
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      
      const response = await fetch(`${apiUrl}/api/users/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          // If we can't parse the error response, use the status
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // Refresh user data in auth context
      await refreshUserData()
      
      toast({
        title: "Profil mis à jour",
        description: "Vos paramètres ont été sauvegardés avec succès.",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      
      let errorMessage = "Impossible de mettre à jour le profil."
      
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          errorMessage = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est démarré."
        } else if (error.message.includes("authentication")) {
          errorMessage = "Erreur d'authentification. Veuillez vous reconnecter."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "SUPPRIMER MON COMPTE") {
      toast({
        title: "Erreur de confirmation",
        description: "Veuillez taper exactement 'SUPPRIMER MON COMPTE' pour confirmer.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      const token = await getToken()
      if (!token) throw new Error("No authentication token")

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      
      const response = await fetch(`${apiUrl}/api/users/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          // If we can't parse the error response, use the status
        }
        throw new Error(errorMessage)
      }

      // Clear all local storage and redirect to home immediately
      localStorage.clear()
      sessionStorage.clear()
      
      // Add a flag to indicate deletion is in progress
      sessionStorage.setItem('account-deletion-in-progress', 'true')
      
      toast({
        title: "Compte supprimé",
        description: "Votre compte a été définitivement supprimé.",
      })

      // Redirect to home page immediately
      window.location.href = '/'

    } catch (error) {
      console.error("Error deleting account:", error)
      
      let errorMessage = "Impossible de supprimer le compte."
      
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          errorMessage = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est démarré."
        } else if (error.message.includes("authentication")) {
          errorMessage = "Erreur d'authentification. Veuillez vous reconnecter."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText("")
    }
  }

  const tabs = [
    { id: "profile", label: "Profil", icon: User },
    { id: "learning", label: "Apprentissage", icon: Brain },
    { id: "notifications", label: "Notifications", icon: Bell },
    ...(user?.role === "enterprise" ? [{ id: "company", label: "Entreprise", icon: Building }] : []),
    { id: "account", label: "Compte", icon: Settings },
  ]

  const subscriptionColors = {
    free: "from-gray-500 to-gray-600",
    basic: "from-slate-500 to-slate-600",
    premium: "from-cyan-500 to-blue-600", 
    enterprise: "from-amber-500 to-orange-600",
  }

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Paramètres du profil</h1>
          <p className="text-gray-300">Gérez vos informations personnelles et préférences d'apprentissage</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <p className="text-amber-300 text-sm">
                💡 <strong>Mode développement:</strong> Pour sauvegarder les modifications, assurez-vous que le backend soit démarré sur le port 5000.
              </p>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {settings.profile.profileImage ? (
                      <img
                        src={settings.profile.profileImage}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-revolutionary-cyan to-revolutionary-blue flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r ${
                        subscriptionColors[settings.account.subscription.tier as keyof typeof subscriptionColors]
                      } border-2 border-slate-800 flex items-center justify-center`}
                    >
                      {settings.account.subscription.tier === "enterprise" && <Crown className="h-2 w-2 text-white" />}
                      {settings.account.subscription.tier === "premium" && <Award className="h-2 w-2 text-white" />}
                      {settings.account.subscription.tier === "basic" && <Shield className="h-2 w-2 text-white" />}
                      {settings.account.subscription.tier === "free" && <User className="h-2 w-2 text-white" />}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{settings.profile.firstName} {settings.profile.lastName}</p>
                    <Badge className={`text-xs bg-gradient-to-r ${subscriptionColors[settings.account.subscription.tier as keyof typeof subscriptionColors]} text-white border-0`}>
                      {settings.account.subscription.tier}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-revolutionary-cyan/25 to-revolutionary-blue/25 text-white border border-revolutionary-cyan/40"
                        : "text-gray-300 hover:text-white hover:bg-slate-700"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">
                      {tabs.find(tab => tab.id === activeTab)?.label}
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      {activeTab === "profile" && "Informations personnelles et préférences de base"}
                      {activeTab === "learning" && "Paramètres d'apprentissage et IA"}
                      {activeTab === "notifications" && "Préférences de notification"}
                      {activeTab === "company" && "Informations de l'entreprise"}
                      {activeTab === "account" && "Paramètres du compte et sécurité"}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleUpdateSettings}
                    disabled={isUpdating}
                    className="bg-gradient-to-r from-revolutionary-cyan to-revolutionary-blue hover:from-revolutionary-cyan/90 hover:to-revolutionary-blue/90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isUpdating ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-white">Prénom</Label>
                        <Input
                          id="firstName"
                          value={settings.profile.firstName}
                          onChange={(e) => setSettings({
                            ...settings,
                            profile: { ...settings.profile, firstName: e.target.value }
                          })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-white">Nom</Label>
                        <Input
                          id="lastName"
                          value={settings.profile.lastName}
                          onChange={(e) => setSettings({
                            ...settings,
                            profile: { ...settings.profile, lastName: e.target.value }
                          })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="email"
                          value={settings.profile.email}
                          readOnly
                          className="bg-slate-700 border-slate-600 text-white opacity-50"
                        />
                        <Mail className="h-4 w-4 text-gray-400" />
                        {settings.account.isEmailVerified && (
                          <Badge className="bg-green-600">Vérifié</Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio" className="text-white">Bio</Label>
                      <Textarea
                        id="bio"
                        value={settings.profile.bio}
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, bio: e.target.value }
                        })}
                        placeholder="Parlez-nous de vous..."
                        className="bg-slate-700 border-slate-600 text-white"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="timezone" className="text-white">Fuseau horaire</Label>
                        <Select value={settings.profile.timezone} onValueChange={(value) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, timezone: value }
                        })}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="language" className="text-white">Langue préférée</Label>
                        <Select value={settings.profile.preferredLanguage} onValueChange={(value) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, preferredLanguage: value }
                        })}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Learning Tab */}
                {activeTab === "learning" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Style d'apprentissage</Label>
                        <Select value={settings.learning.learningStyle} onValueChange={(value) => setSettings({
                          ...settings,
                          learning: { ...settings.learning, learningStyle: value }
                        })}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="visual">Visuel</SelectItem>
                            <SelectItem value="auditory">Auditif</SelectItem>
                            <SelectItem value="kinesthetic">Kinesthésique</SelectItem>
                            <SelectItem value="reading">Lecture</SelectItem>
                            <SelectItem value="balanced">Équilibré</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white">Rythme préféré</Label>
                        <Select value={settings.learning.preferredPace} onValueChange={(value) => setSettings({
                          ...settings,
                          learning: { ...settings.learning, preferredPace: value }
                        })}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">Lent</SelectItem>
                            <SelectItem value="medium">Moyen</SelectItem>
                            <SelectItem value="fast">Rapide</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Personnalité IA</Label>
                      <Select value={settings.learning.aiPersonality} onValueChange={(value) => setSettings({
                        ...settings,
                        learning: { ...settings.learning, aiPersonality: value }
                      })}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ARIA">ARIA - Bienveillante et encourageante</SelectItem>
                          <SelectItem value="SAGE">SAGE - Sage et méthodique</SelectItem>
                          <SelectItem value="COACH">COACH - Motivante et exigeante</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="bg-slate-600" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Mode adaptatif</Label>
                          <p className="text-sm text-gray-400">L'IA adapte le contenu selon vos performances</p>
                        </div>
                        <Switch
                          checked={settings.learning.adaptiveMode}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            learning: { ...settings.learning, adaptiveMode: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Commandes vocales</Label>
                          <p className="text-sm text-gray-400">Utilisez votre voix pour naviguer</p>
                        </div>
                        <Switch
                          checked={settings.learning.voiceEnabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            learning: { ...settings.learning, voiceEnabled: checked }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">
                            {key === "learningReminders" && "Rappels d'apprentissage"}
                            {key === "achievementNotifications" && "Notifications de réussite"}
                            {key === "weeklyProgress" && "Rapport hebdomadaire"}
                            {key === "aiInsights" && "Insights IA"}
                          </Label>
                          <p className="text-sm text-gray-400">
                            {key === "learningReminders" && "Recevez des rappels pour vos sessions d'apprentissage"}
                            {key === "achievementNotifications" && "Soyez notifié de vos nouvelles réussites"}
                            {key === "weeklyProgress" && "Recevez un résumé de vos progrès chaque semaine"}
                            {key === "aiInsights" && "Recevez des recommandations personnalisées de l'IA"}
                          </p>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, [key]: checked }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Company Tab (Enterprise Only) */}
                {activeTab === "company" && user?.role === "enterprise" && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="companyName" className="text-white">Nom de l'entreprise</Label>
                      <Input
                        id="companyName"
                        value={settings.company?.name || ""}
                        onChange={(e) => setSettings({
                          ...settings,
                          company: { ...settings.company!, name: e.target.value }
                        })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="industry" className="text-white">Secteur d'activité</Label>
                        <Input
                          id="industry"
                          value={settings.company?.industry || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            company: { ...settings.company!, industry: e.target.value }
                          })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Taille de l'entreprise</Label>
                        <Select value={settings.company?.size || ""} onValueChange={(value) => setSettings({
                          ...settings,
                          company: { ...settings.company!, size: value }
                        })}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employés</SelectItem>
                            <SelectItem value="11-50">11-50 employés</SelectItem>
                            <SelectItem value="51-200">51-200 employés</SelectItem>
                            <SelectItem value="201-1000">201-1000 employés</SelectItem>
                            <SelectItem value="1000+">1000+ employés</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="department" className="text-white">Département</Label>
                        <Input
                          id="department"
                          value={settings.company?.department || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            company: { ...settings.company!, department: e.target.value }
                          })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="position" className="text-white">Poste</Label>
                        <Input
                          id="position"
                          value={settings.company?.position || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            company: { ...settings.company!, position: e.target.value }
                          })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website" className="text-white">Site web</Label>
                      <Input
                        id="website"
                        value={settings.company?.website || ""}
                        onChange={(e) => setSettings({
                          ...settings,
                          company: { ...settings.company!, website: e.target.value }
                        })}
                        placeholder="https://..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Account Tab */}
                {activeTab === "account" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${subscriptionColors[settings.account.subscription.tier as keyof typeof subscriptionColors]} flex items-center justify-center`}>
                          {settings.account.subscription.tier === "enterprise" && <Crown className="h-5 w-5 text-white" />}
                          {settings.account.subscription.tier === "premium" && <Award className="h-5 w-5 text-white" />}
                          {settings.account.subscription.tier === "basic" && <Shield className="h-5 w-5 text-white" />}
                          {settings.account.subscription.tier === "free" && <User className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold text-white capitalize">{settings.account.subscription.tier}</p>
                          <p className="text-sm text-gray-400">
                            {settings.account.subscription.tier === "free" && "Plan gratuit"}
                            {settings.account.subscription.tier === "basic" && "Fonctionnalités de base"}
                            {settings.account.subscription.tier === "premium" && "Accès complet + IA avancée"}
                            {settings.account.subscription.tier === "enterprise" && "Solution entreprise complète"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" className="border-revolutionary-cyan text-revolutionary-cyan hover:bg-revolutionary-cyan hover:text-white">
                        Gérer l'abonnement
                      </Button>
                    </div>

                    <Separator className="bg-slate-600" />

                    <div>
                      <Label className="text-white">Rôle</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className="bg-revolutionary-purple/20 text-revolutionary-purple border border-revolutionary-purple/30">
                          {settings.account.role === "user" && "Utilisateur"}
                          {settings.account.role === "enterprise" && "Entreprise"}
                          {settings.account.role === "admin" && "Administrateur"}
                        </Badge>
                        {settings.account.role === "enterprise" && <Briefcase className="h-4 w-4 text-revolutionary-purple" />}
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Vérification email</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={settings.account.isEmailVerified ? "bg-green-600" : "bg-orange-600"}>
                          {settings.account.isEmailVerified ? "Vérifié" : "Non vérifié"}
                        </Badge>
                        {!settings.account.isEmailVerified && (
                          <Button variant="outline" size="sm" className="text-orange-500 border-orange-500">
                            Vérifier maintenant
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-slate-600" />

                    {/* Danger Zone */}
                    <div className="border border-red-600/30 rounded-lg p-6 bg-red-900/10">
                      <div className="flex items-center space-x-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <h3 className="text-lg font-semibold text-red-400">Zone de danger</h3>
                      </div>
                      
                      <p className="text-gray-300 mb-4">
                        Une fois votre compte supprimé, il ne pourra pas être récupéré. Toutes vos données, 
                        certificats, et progrès seront définitivement perdus.
                      </p>

                      {!showDeleteConfirm ? (
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer mon compte
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-red-900/20 border border-red-600/50 rounded-lg">
                            <h4 className="text-red-400 font-semibold mb-2">Confirmer la suppression</h4>
                            <p className="text-gray-300 text-sm mb-3">
                              Pour confirmer, tapez <span className="font-mono font-bold text-red-400">SUPPRIMER MON COMPTE</span> dans le champ ci-dessous:
                            </p>
                            <Input
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              placeholder="SUPPRIMER MON COMPTE"
                              className="bg-slate-800 border-red-600/50 text-white font-mono"
                            />
                          </div>
                          
                          <div className="flex space-x-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowDeleteConfirm(false)
                                setDeleteConfirmText("")
                              }}
                              className="border-slate-600 text-gray-300 hover:bg-slate-700"
                            >
                              Annuler
                            </Button>
                            <Button
                              onClick={handleDeleteAccount}
                              disabled={isDeleting || deleteConfirmText !== "SUPPRIMER MON COMPTE"}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}