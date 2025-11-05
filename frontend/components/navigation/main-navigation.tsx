"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Brain,
  User,
  Settings,
  CreditCard,
  HelpCircle,
  LogOut,
  Bell,
  Mic,
  Globe,
  Shield,
  BarChart3,
  Store,
  BookOpen,
  FileCheck,
  Award,
  Code,
  Target,
  Users,
  Building,
  ChevronDown,
  Layout,
  Plus,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  Edit,
  Zap,
  CheckCircle,
  Clock,
  TrendingUp,
  Video,
} from "lucide-react"
import Image from "next/image"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/contexts/auth-context"

export function MainNavigation() {
  const pathname = usePathname()
  const { t, locale, toggleLocale } = useTranslation()
  const { user, logout } = useAuth()
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isProfileHovered, setIsProfileHovered] = useState(false)

  if (!user) return null

  // Navigation items
  const mainNavigationItems = [
    {
      label: "AI Assistant",
      href: "/ai-assistant",
      icon: Brain,
      description: "AI Learning Assistant",
    },
    {
      label: t("navigation.dashboard"),
      href: "/dashboard",
      icon: Layout,
      description: t("navigation.dashboard"),
    },
    {
      label: t("navigation.learning"),
      href: "/learning",
      icon: BookOpen,
      description: "Parcours d'apprentissage",
    },
  ]

  // Secondary navigation in dropdown
  const secondaryNavigationItems = [
    {
      section: "Évaluation & Portfolio",
      items: [
        {
          label: t("navigation.portfolio"),
          href: "/portfolio",
          icon: Code,
          description: "GitHub, Behance, LinkedIn",
        },
        {
          label: t("navigation.assessments"),
          href: "/assessments",
          icon: FileCheck,
          description: t("assessments.title"),
        },
        {
          label: t("navigation.analytics"),
          href: "/analytics",
          icon: BarChart3,
          description: "Statistiques détaillées",
        },
      ],
    },
    {
      section: "Compétences & Certifications",
      items: [
        {
          label: t("navigation.skills"),
          href: "/skills",
          icon: Target,
          description: t("skills.title"),
        },
        {
          label: t("navigation.certificates"),
          href: "/certificates",
          icon: Award,
          description: t("certificates.title"),
        },
      ],
    },
    {
      section: "Découverte",
      items: [
        {
          label: t("navigation.marketplace"),
          href: "/marketplace",
          icon: Store,
          description: "Talents et opportunités",
        },
      ],
    },
  ]


  const subscriptionColors = {
    free: "from-gray-500 to-gray-600",
    basic: "from-slate-500 to-slate-600",
    premium: "from-cyan-500 to-blue-600",
    enterprise: "from-amber-500 to-orange-600",
  }

  const handleVoiceToggle = () => {
    setIsVoiceActive(!isVoiceActive)
    if (!isVoiceActive) {
      setTimeout(() => setIsVoiceActive(false), 5000)
    }
  }

  const isActiveRoute = (href: string) => {
    if (href === "/main" && pathname === "/") return false
    return pathname === href || pathname.startsWith(href + "/")
  }

  const isAnySecondaryActive = () => {
    return secondaryNavigationItems.some((section) => section.items.some((item) => isActiveRoute(item.href)))
  }

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-lg border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <a href="/main" className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Corp1o1" 
                width={120} 
                height={40} 
                className="h-8"
              />
            </a>
          </motion.div>
{/* User Profile with Hover Sidebar + Click Dropdown */}
<div className="relative">
  <div
    onMouseEnter={() => setIsProfileHovered(true)}
    onMouseLeave={() => setIsProfileHovered(false)}
    className="relative"
  >
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button id="user-menu" variant="ghost" className="relative h-9 w-9 rounded-full p-0">
          <div className="relative w-7 h-7 rounded-full overflow-hidden">
            {user.avatar ? (
              <Image src={user.avatar || "/placeholder.svg"} alt={user.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gradient-to-r ${
              subscriptionColors[user.subscription]
            } border border-slate-900 flex items-center justify-center`}
          >
            <Shield className="h-1.5 w-1.5 text-white" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700" align="end">
        {/* User Info Header */}
        <div className="p-3 border-b border-slate-700">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400 capitalize">
              {user.role}
            </p>
            <Badge
              className={`text-xs px-1.5 py-0.5 bg-gradient-to-r ${subscriptionColors[user.subscription]} text-white border-0`}
            >
              {user.subscription[0].toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Profile Menu Items */}
        <div>
          <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-1">
            Mon Compte
          </DropdownMenuLabel>
          <a href="/profile">
            <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-slate-700 px-3 py-2 cursor-pointer">
              <User className="mr-3 h-8 w-8" />
              <div>
                <p className="text-sm font-medium">{t("navigation.profile")}</p>
              </div>
            </DropdownMenuItem>
          </a>
          <a href="/settings">
            <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-slate-700 px-3 py-2 cursor-pointer">
              <Settings className="mr-3 h-4 w-4" />
              <div>
                <p className="text-sm font-medium">{t("navigation.settings")}</p>
              </div>
            </DropdownMenuItem>
          </a>
          <a href="/subscription">
            <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-slate-700 px-3 py-2 cursor-pointer">
              <CreditCard className="mr-3 h-4 w-4" />
              <div>
                <p className="text-sm font-medium">{t("navigation.subscription")}</p>
              </div>
            </DropdownMenuItem>
          </a>
        </div>

        <DropdownMenuSeparator className="bg-slate-700" />

        <div>
          <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-1">
            Aide & Sécurité
          </DropdownMenuLabel>
          <a href="/help">
            <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-slate-700 px-3 py-2 cursor-pointer">
              <HelpCircle className="mr-3 h-4 w-4" />
              <div>
                <p className="text-sm font-medium">{t("navigation.support")}</p>
              </div>
            </DropdownMenuItem>
          </a>
        </div>

        <DropdownMenuSeparator className="bg-slate-700" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={logout}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-2 cursor-pointer"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <p className="text-sm font-medium">{t("navigation.logout")}</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  {/* Profile Sidebar on Hover */}
  <AnimatePresence>
    {isProfileHovered && (
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute right-0 top-12 z-[100] w-80"
        onMouseEnter={() => setIsProfileHovered(true)}
        onMouseLeave={() => setIsProfileHovered(false)}
      >
        <Card className="bg-gradient-to-br from-slate-800/95 to-slate-700/95 backdrop-blur-lg border border-slate-600/50 shadow-2xl">
          <CardContent className="p-6">
            {/* Profile Header */}
            <div className="text-center mb-6">
              <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-cyan-500/20">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold text-white mb-1">{user.name}</h3>
              <p className="text-gray-400 text-sm mb-3 capitalize">
                {user.role}
              </p>
              <Badge className={`bg-gradient-to-r ${subscriptionColors[user.subscription]} text-white border-0`}>
                <Zap className="w-3 h-3 mr-1" />
                {user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)}
              </Badge>
            </div>

            {/* Profile Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-300 text-sm">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.company && (
                <div className="flex items-center text-gray-300 text-sm">
                  <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{user.company}</span>
                </div>
              )}
              <div className="flex items-center text-gray-300 text-sm">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <span>Joined {new Date((user as any).createdAt || '2024-01-01').toLocaleDateString()}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-cyan-400">12</div>
                <div className="text-xs text-gray-400">Skills</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-400">3</div>
                <div className="text-xs text-gray-400">Certificates</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-purple-400">2</div>
                <div className="text-xs text-gray-400">Active Paths</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-amber-400">85%</div>
                <div className="text-xs text-gray-400">Avg Score</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-cyan-400" />
                Recent Activity
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">JavaScript Assessment</p>
                    <p className="text-gray-400 text-xs">Completed • 85%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">React Learning Path</p>
                    <p className="text-gray-400 text-xs">In Progress • 60%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <a href="/profile">
                <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </a>
              <a href="/settings">
                <Button variant="outline" className="w-full border-slate-600 text-gray-300 hover:bg-slate-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )}
  </AnimatePresence>
</div>
          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Core Navigation Items */}
            {mainNavigationItems.map((item, index) => {
              const isActive = isActiveRoute(item.href)
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <a href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-revolutionary-cyan/25 to-revolutionary-blue/25 text-white border border-revolutionary-cyan/40 shadow-lg shadow-revolutionary-cyan/10"
                          : "text-gray-300 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </a>
                </motion.div>
              )
            })}
            {/* Conference Button */}
            <a href="/conference">
              <Button
                variant={isActiveRoute("/conference") ? "default" : "ghost"}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isActiveRoute("/conference")
                    ? "bg-gradient-to-r from-revolutionary-cyan/25 to-revolutionary-blue/25 text-white border border-revolutionary-cyan/40 shadow-lg shadow-revolutionary-cyan/10"
                    : "text-gray-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Video className="h-4 w-4 mr-2" />
                {t("navigation.conference")}
              </Button>
            </a>
            {/* "Plus" Dropdown for Secondary Items */}
            {secondaryNavigationItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isAnySecondaryActive() ? "default" : "ghost"}
                    className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      isAnySecondaryActive()
                        ? "bg-gradient-to-r from-revolutionary-cyan/25 to-revolutionary-blue/25 text-white border border-revolutionary-cyan/40 shadow-lg shadow-revolutionary-cyan/10"
                        : "text-gray-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("navigation.more")}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-slate-800 border-slate-700" align="start">
                  {secondaryNavigationItems.map((section, sectionIndex) => (
                    <div key={section.section}>
                      {sectionIndex > 0 && <DropdownMenuSeparator className="bg-slate-700" />}
                      <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
                        {section.section}
                      </DropdownMenuLabel>
                      {section.items.map((item) => (
                        <a key={item.href} href={item.href}>
                          <DropdownMenuItem
                            className={`text-gray-300 hover:text-white hover:bg-slate-700 px-3 py-2 cursor-pointer ${
                              isActiveRoute(item.href) ? "bg-gradient-to-r from-revolutionary-cyan/20 to-revolutionary-blue/20 text-revolutionary-cyan border-l-2 border-revolutionary-cyan" : ""
                            }`}
                          >
                            <item.icon className="mr-3 h-4 w-4" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-gray-500">{item.description}</p>
                            </div>
                          </DropdownMenuItem>
                        </a>
                      ))}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

 
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-slate-800/50 px-2"
              onClick={toggleLocale}
            >
              <Globe className="h-4 w-4 mr-1" />
              {locale.toUpperCase()}
            </Button>

            {/* Voice Control */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceToggle}
              className={`relative transition-all duration-300 px-2 ${
                isVoiceActive
                  ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30"
                  : "text-gray-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Mic className={`h-4 w-4 ${isVoiceActive ? "animate-pulse" : ""}`} />
              {isVoiceActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"
                />
              )}
            </Button>

            {/* Notifications */}
            <a href="/notifications">
              <Button
                variant="ghost"
                size="sm"
                className="relative text-gray-300 hover:text-white hover:bg-slate-800/50 px-2"
              >
                <Bell className="h-4 w-4" />
                {user.notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-gradient-to-r from-red-500 to-red-600 border-0 flex items-center justify-center">
                    {user.notifications > 9 ? "9+" : user.notifications}
                  </Badge>
                )}
              </Button>
            </a>

             
          </div>
        </div>
      </div>

      {/* Voice Command Overlay */}
      <AnimatePresence>
        {isVoiceActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur-lg border-b border-purple-500/30 p-3"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white font-medium text-sm">{t("navigation.voice_listening")}</span>
              </div>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 h-4 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full"
                    animate={{
                      height: [4, Math.random() * 16 + 8, 4],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
              <span className="text-gray-300 text-xs">{t("navigation.voice_commands")}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-slate-700 bg-slate-900/95">
        <div className="px-4 py-2">
          <div className="flex justify-between items-center">
            {mainNavigationItems.slice(0, 4).map((item) => {
              const isActive = isActiveRoute(item.href)
              return (
                <a key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 ${
                      isActive ? "bg-gradient-to-r from-revolutionary-cyan/25 to-revolutionary-blue/25 text-white border border-revolutionary-cyan/40" : "text-gray-300"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
