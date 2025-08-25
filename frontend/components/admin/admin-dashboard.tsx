"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Users,
  Award,
  Building,
  Brain,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  UserCheck,
  Activity,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  BarChart3,
  Download,
  RefreshCw,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/hooks/use-translation"

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  assessmentsToday: number
  certificatesIssued: number
  revenue: number
  aiAccuracy: number
  systemUptime: number
  supportTickets: number
}

interface UserData {
  id: string
  name: string
  email: string
  role: "user" | "enterprise" | "admin"
  subscription: "basic" | "premium" | "enterprise"
  joinDate: string
  lastActive: string
  status: "active" | "inactive" | "suspended"
  assessments: number
  certificates: number
  company?: string
}

export function AdminDashboard() {
  const { t } = useTranslation()
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "90d">("7d")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 125847,
    activeUsers: 23456,
    assessmentsToday: 1247,
    certificatesIssued: 8934,
    revenue: 234567,
    aiAccuracy: 97.3,
    systemUptime: 99.9,
    supportTickets: 23,
  })

  const [users, setUsers] = useState<UserData[]>([
    {
      id: "1",
      name: "Alexandre Dubois",
      email: "alexandre.dubois@example.com",
      role: "user",
      subscription: "premium",
      joinDate: "2023-01-15",
      lastActive: "2024-01-20",
      status: "active",
      assessments: 12,
      certificates: 5,
    },
    {
      id: "2",
      name: "Marie Laurent",
      email: "marie@techcorp.com",
      role: "enterprise",
      subscription: "enterprise",
      joinDate: "2023-03-20",
      lastActive: "2024-01-19",
      status: "active",
      assessments: 45,
      certificates: 15,
      company: "TechCorp Solutions",
    },
    {
      id: "3",
      name: "Pierre Martin",
      email: "pierre.martin@startup.com",
      role: "user",
      subscription: "basic",
      joinDate: "2023-06-10",
      lastActive: "2024-01-18",
      status: "active",
      assessments: 3,
      certificates: 1,
    },
    {
      id: "4",
      name: "Sophie Durand",
      email: "sophie@innovation.fr",
      role: "enterprise",
      subscription: "enterprise",
      joinDate: "2023-09-05",
      lastActive: "2024-01-15",
      status: "inactive",
      assessments: 28,
      certificates: 8,
      company: "Innovation Labs",
    },
    {
      id: "5",
      name: "Admin Test",
      email: "admin@corp1o1.com",
      role: "admin",
      subscription: "enterprise",
      joinDate: "2023-01-01",
      lastActive: "2024-01-20",
      status: "active",
      assessments: 0,
      certificates: 0,
    },
  ])

  const recentActivities = [
    {
      type: "user_registration",
      message: t("admin.activities.new_premium_user", { name: "Marie Dubois" }),
      timestamp: t("admin.time.minutes_ago", { count: 2 }),
      icon: UserCheck,
      color: "text-green-400",
    },
    {
      type: "certificate_issued",
      message: t("admin.activities.certificate_issued", { type: "Expert React", name: "Jean Martin" }),
      timestamp: t("admin.time.minutes_ago", { count: 5 }),
      icon: Award,
      color: "text-cyan-400",
    },
    {
      type: "system_alert",
      message: t("admin.activities.usage_spike"),
      timestamp: t("admin.time.minutes_ago", { count: 12 }),
      icon: AlertTriangle,
      color: "text-amber-400",
    },
    {
      type: "ai_update",
      message: t("admin.activities.ai_model_updated"),
      timestamp: t("admin.time.hours_ago", { count: 1 }),
      icon: Brain,
      color: "text-purple-400",
    },
  ]

  const enterpriseClients = [
    {
      name: "TechCorp Solutions",
      users: 1250,
      plan: "Enterprise",
      status: "active",
      lastActivity: t("admin.time.hours_ago", { count: 2 }),
      revenue: 15000,
    },
    {
      name: "Innovation Labs",
      users: 850,
      plan: "Enterprise",
      status: "active",
      lastActivity: t("admin.time.minutes_ago", { count: 30 }),
      revenue: 12000,
    },
    {
      name: "Digital Dynamics",
      users: 650,
      plan: "Team",
      status: "trial",
      lastActivity: t("admin.time.hours_ago", { count: 1 }),
      revenue: 8500,
    },
  ]

  const systemAlerts = [
    {
      level: "warning",
      message: t("admin.alerts.high_cpu_usage"),
      timestamp: t("admin.time.minutes_ago", { count: 15 }),
      resolved: false,
    },
    {
      level: "info",
      message: t("admin.alerts.scheduled_maintenance"),
      timestamp: t("admin.time.hours_ago", { count: 2 }),
      resolved: false,
    },
    {
      level: "success",
      message: t("admin.alerts.backup_completed"),
      timestamp: t("admin.time.hours_ago", { count: 6 }),
      resolved: true,
    },
  ]

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.company && user.company.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesRole = selectedRole === "all" || user.role === selectedRole
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus

    return matchesSearch && matchesRole && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400"
      case "inactive":
        return "bg-gray-500/20 text-gray-400"
      case "suspended":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/20 text-purple-400"
      case "enterprise":
        return "bg-amber-500/20 text-amber-400"
      case "user":
        return "bg-cyan-500/20 text-cyan-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case "enterprise":
        return "bg-amber-500/20 text-amber-400"
      case "premium":
        return "bg-cyan-500/20 text-cyan-400"
      case "basic":
        return "bg-gray-500/20 text-gray-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">{t("admin.dashboard_title")}</h2>
            <p className="text-gray-300 text-lg">{t("admin.platform_overview")}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex bg-slate-800/50 rounded-lg p-1">
              {["24h", "7d", "30d", "90d"].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-4 py-2 text-sm ${
                    timeRange === range
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {range}
                </Button>
              ))}
            </div>
            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          {
            label: t("admin.metrics.total_users"),
            value: metrics.totalUsers.toLocaleString(),
            change: "+12.5%",
            icon: Users,
            color: "from-cyan-500 to-blue-600",
          },
          {
            label: t("admin.metrics.active_users"),
            value: metrics.activeUsers.toLocaleString(),
            change: "+8.2%",
            icon: Activity,
            color: "from-green-500 to-teal-600",
          },
          {
            label: t("admin.metrics.revenue"),
            value: `${(metrics.revenue / 1000).toFixed(0)}K€`,
            change: "+23.1%",
            icon: DollarSign,
            color: "from-amber-500 to-orange-600",
          },
          {
            label: t("admin.metrics.ai_accuracy"),
            value: `${metrics.aiAccuracy}%`,
            change: "+0.3%",
            icon: Brain,
            color: "from-purple-500 to-pink-600",
          },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{metric.label}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                    <p className="text-green-400 text-sm font-medium">{metric.change}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${metric.color} flex items-center justify-center`}
                  >
                    <metric.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
          <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white">
            {t("admin.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="users" className="text-gray-300 data-[state=active]:text-white">
            {t("admin.tabs.users")}
          </TabsTrigger>
          <TabsTrigger value="enterprise" className="text-gray-300 data-[state=active]:text-white">
            {t("admin.tabs.enterprises")}
          </TabsTrigger>
          <TabsTrigger value="system" className="text-gray-300 data-[state=active]:text-white">
            {t("admin.tabs.system")}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-gray-300 data-[state=active]:text-white">
            {t("admin.tabs.analytics")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{t("admin.recent_activity")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-800/30">
                        <activity.icon className={`h-5 w-5 ${activity.color} mt-0.5`} />
                        <div className="flex-1">
                          <p className="text-white text-sm">{activity.message}</p>
                          <p className="text-gray-400 text-xs">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* System Status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{t("admin.system_status")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">{t("admin.system.uptime")}</span>
                        <span className="text-green-400 font-medium">{metrics.systemUptime}%</span>
                      </div>
                      <Progress value={metrics.systemUptime} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">{t("admin.system.ai_accuracy")}</span>
                        <span className="text-purple-400 font-medium">{metrics.aiAccuracy}%</span>
                      </div>
                      <Progress value={metrics.aiAccuracy} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-slate-800/30">
                        <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{metrics.assessmentsToday}</p>
                        <p className="text-gray-400 text-sm">{t("admin.system.assessments_today")}</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-slate-800/30">
                        <Award className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{metrics.certificatesIssued}</p>
                        <p className="text-gray-400 text-sm">{t("admin.system.certificates_issued")}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-8">
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher des utilisateurs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">Tous les rôles</option>
                <option value="user">Utilisateur</option>
                <option value="enterprise">Entreprise</option>
                <option value="admin">Administrateur</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
              </select>
              <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800 bg-transparent">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
              <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800 bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>

            {/* Users Table */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-600">
                      <tr>
                        <th className="text-left p-4 text-gray-300 font-medium">Utilisateur</th>
                        <th className="text-left p-4 text-gray-300 font-medium">Rôle</th>
                        <th className="text-left p-4 text-gray-300 font-medium">Abonnement</th>
                        <th className="text-left p-4 text-gray-300 font-medium">Statut</th>
                        <th className="text-left p-4 text-gray-300 font-medium">Activité</th>
                        <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{user.name}</p>
                                <p className="text-gray-400 text-sm">{user.email}</p>
                                {user.company && <p className="text-gray-500 text-xs">{user.company}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={getSubscriptionColor(user.subscription)}>{user.subscription}</Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <p className="text-white">{user.assessments} évaluations</p>
                              <p className="text-gray-400">{user.certificates} certificats</p>
                              <p className="text-gray-500 text-xs">Actif: {user.lastActive}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
                                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir le profil
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Suspendre
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Aucun utilisateur trouvé</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enterprise" className="mt-8">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{t("admin.enterprise_clients")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {enterpriseClients.map((client, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-600/30"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <Building className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{client.name}</h3>
                            <p className="text-gray-400 text-sm">
                              {t("admin.enterprise.users_count", { count: client.users })} • {client.lastActivity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              client.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }
                          >
                            {client.status === "active" ? t("admin.enterprise.active") : t("admin.enterprise.trial")}
                          </Badge>
                          <p className="text-white font-medium mt-1">
                            {t("admin.enterprise.monthly_revenue", { amount: client.revenue })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Alerts */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{t("admin.system_alerts")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemAlerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          alert.level === "warning"
                            ? "bg-amber-900/20 border-amber-500/30"
                            : alert.level === "info"
                              ? "bg-blue-900/20 border-blue-500/30"
                              : "bg-green-900/20 border-green-500/30"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {alert.level === "warning" ? (
                              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
                            ) : alert.level === "info" ? (
                              <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                            )}
                            <div>
                              <p className="text-white text-sm">{alert.message}</p>
                              <p className="text-gray-400 text-xs">{alert.timestamp}</p>
                            </div>
                          </div>
                          {!alert.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
                            >
                              {t("admin.resolve")}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance Metrics */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{t("admin.performance_metrics")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      { label: t("admin.performance.api_response"), value: "125ms", target: "< 200ms", status: "good" },
                      { label: t("admin.performance.cpu_usage"), value: "68%", target: "< 80%", status: "good" },
                      { label: t("admin.performance.memory_usage"), value: "82%", target: "< 85%", status: "warning" },
                      {
                        label: t("admin.performance.storage_available"),
                        value: "2.3TB",
                        target: "> 1TB",
                        status: "good",
                      },
                    ].map((metric, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{metric.label}</p>
                          <p className="text-gray-400 text-sm">
                            {t("admin.performance.target")}: {metric.target}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${metric.status === "good" ? "text-green-400" : "text-amber-400"}`}>
                            {metric.value}
                          </p>
                          <div
                            className={`w-3 h-3 rounded-full ${metric.status === "good" ? "bg-green-400" : "bg-amber-400"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">Croissance des utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
                    <p className="text-gray-400">Graphique de croissance des utilisateurs</p>
                    <p className="text-gray-500 text-sm mt-2">+23% ce mois-ci</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">Revenus par abonnement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                    <p className="text-gray-400">Répartition des revenus</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Enterprise:</span>
                        <span className="text-amber-400">65%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Premium:</span>
                        <span className="text-cyan-400">30%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Basic:</span>
                        <span className="text-gray-400">5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">Évaluations par domaine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { domain: "Communication", count: 3456, percentage: 35 },
                    { domain: "Technique", count: 2890, percentage: 29 },
                    { domain: "Leadership", count: 1834, percentage: 18 },
                    { domain: "Créativité", count: 1120, percentage: 11 },
                    { domain: "Autres", count: 700, percentage: 7 },
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.domain}</span>
                        <span className="text-white">{item.count}</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">Activité géographique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold">🌍</span>
                    </div>
                    <p className="text-gray-400">Carte mondiale des utilisateurs</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">France:</span>
                        <span className="text-green-400">45%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Europe:</span>
                        <span className="text-blue-400">30%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Amérique du Nord:</span>
                        <span className="text-purple-400">15%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Autres:</span>
                        <span className="text-gray-400">10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
