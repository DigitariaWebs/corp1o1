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
  BookOpen,
  Brain,
  TrendingUp,
  Target,
  Activity,
  BarChart3,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

interface Employee {
  id: string
  name: string
  email: string
  department: string
  role: string
  avatar?: string
  joinDate: string
  lastActive: string
  skillsProgress: number
  completedAssessments: number
  certificates: number
  learningPaths: {
    active: number
    completed: number
  }
  status: "active" | "inactive" | "pending"
}

interface Department {
  id: string
  name: string
  employeeCount: number
  averageProgress: number
  topSkills: string[]
}

export function EnterpriseDashboard() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

  // Mock data
  const companyStats = {
    totalEmployees: 247,
    activeUsers: 189,
    completedAssessments: 1456,
    certificatesEarned: 342,
    averageSkillLevel: 73,
    learningHours: 2847,
    topPerformers: 23,
    departmentCount: 8,
  }

  const employees: Employee[] = [
    {
      id: "1",
      name: "Alexandre Dubois",
      email: "alexandre.dubois@company.com",
      department: "Développement",
      role: "Senior Developer",
      joinDate: "2023-01-15",
      lastActive: "2024-01-20",
      skillsProgress: 92,
      completedAssessments: 12,
      certificates: 5,
      learningPaths: { active: 2, completed: 8 },
      status: "active",
    },
    {
      id: "2",
      name: "Marie Laurent",
      email: "marie.laurent@company.com",
      department: "Marketing",
      role: "Marketing Manager",
      joinDate: "2023-03-20",
      lastActive: "2024-01-19",
      skillsProgress: 85,
      completedAssessments: 8,
      certificates: 3,
      learningPaths: { active: 1, completed: 5 },
      status: "active",
    },
    {
      id: "3",
      name: "Pierre Martin",
      email: "pierre.martin@company.com",
      department: "RH",
      role: "HR Specialist",
      joinDate: "2023-06-10",
      lastActive: "2024-01-18",
      skillsProgress: 78,
      completedAssessments: 6,
      certificates: 2,
      learningPaths: { active: 3, completed: 3 },
      status: "active",
    },
    {
      id: "4",
      name: "Sophie Durand",
      email: "sophie.durand@company.com",
      department: "Finance",
      role: "Financial Analyst",
      joinDate: "2023-09-05",
      lastActive: "2024-01-15",
      skillsProgress: 65,
      completedAssessments: 4,
      certificates: 1,
      learningPaths: { active: 2, completed: 2 },
      status: "pending",
    },
  ]

  const departments: Department[] = [
    {
      id: "dev",
      name: "Développement",
      employeeCount: 45,
      averageProgress: 87,
      topSkills: ["React", "Node.js", "Python"],
    },
    {
      id: "marketing",
      name: "Marketing",
      employeeCount: 32,
      averageProgress: 82,
      topSkills: ["Communication", "Analytics", "Design"],
    },
    {
      id: "hr",
      name: "Ressources Humaines",
      employeeCount: 18,
      averageProgress: 79,
      topSkills: ["Leadership", "Communication", "Gestion"],
    },
    {
      id: "finance",
      name: "Finance",
      employeeCount: 25,
      averageProgress: 75,
      topSkills: ["Analyse", "Excel", "Comptabilité"],
    },
  ]

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400"
      case "inactive":
        return "bg-red-500/20 text-red-400"
      case "pending":
        return "bg-amber-500/20 text-amber-400"
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
            <h2 className="text-3xl font-bold text-white mb-4">{t("enterprise.dashboard_title")}</h2>
            <p className="text-gray-300 text-lg">{t("enterprise.manage_team_skills")}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              {t("enterprise.add_employee")}
            </Button>
            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              {t("enterprise.export_report")}
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
            label: t("enterprise.metrics.total_employees"),
            value: companyStats.totalEmployees.toLocaleString(),
            change: "+12",
            icon: Users,
            color: "from-cyan-500 to-blue-600",
          },
          {
            label: t("enterprise.metrics.active_learners"),
            value: companyStats.activeUsers.toLocaleString(),
            change: "+23",
            icon: Activity,
            color: "from-green-500 to-teal-600",
          },
          {
            label: t("enterprise.metrics.certificates_earned"),
            value: companyStats.certificatesEarned.toLocaleString(),
            change: "+45",
            icon: Award,
            color: "from-amber-500 to-orange-600",
          },
          {
            label: t("enterprise.metrics.avg_skill_level"),
            value: `${companyStats.averageSkillLevel}%`,
            change: "+5%",
            icon: TrendingUp,
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

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
          <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white">
            {t("enterprise.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="employees" className="text-gray-300 data-[state=active]:text-white">
            {t("enterprise.tabs.employees")}
          </TabsTrigger>
          <TabsTrigger value="departments" className="text-gray-300 data-[state=active]:text-white">
            {t("enterprise.tabs.departments")}
          </TabsTrigger>
          <TabsTrigger value="learning" className="text-gray-300 data-[state=active]:text-white">
            {t("enterprise.tabs.learning_paths")}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-gray-300 data-[state=active]:text-white">
            {t("enterprise.tabs.analytics")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Department Performance */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{t("enterprise.department_performance")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departments.map((dept, index) => (
                      <div key={dept.id} className="p-4 rounded-lg bg-slate-800/30">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium">{dept.name}</h3>
                          <Badge className="bg-cyan-500/20 text-cyan-400">
                            {dept.employeeCount} {t("enterprise.employees")}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">{t("enterprise.average_progress")}</span>
                          <span className="text-white font-medium">{dept.averageProgress}%</span>
                        </div>
                        <Progress value={dept.averageProgress} className="h-2 mb-3" />
                        <div className="flex flex-wrap gap-1">
                          {dept.topSkills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="bg-slate-700 text-gray-300 text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{t("enterprise.recent_activity")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        type: "certificate",
                        message: t("enterprise.activity.certificate_earned", {
                          name: "Alexandre Dubois",
                          cert: "React Expert",
                        }),
                        timestamp: t("enterprise.activity.hours_ago", { hours: 2 }),
                        icon: Award,
                        color: "text-amber-400",
                      },
                      {
                        type: "assessment",
                        message: t("enterprise.activity.assessment_completed", {
                          name: "Marie Laurent",
                          assessment: "Communication",
                        }),
                        timestamp: t("enterprise.activity.hours_ago", { hours: 4 }),
                        icon: Brain,
                        color: "text-purple-400",
                      },
                      {
                        type: "learning",
                        message: t("enterprise.activity.learning_path_started", {
                          name: "Pierre Martin",
                          path: "Leadership",
                        }),
                        timestamp: t("enterprise.activity.hours_ago", { hours: 6 }),
                        icon: BookOpen,
                        color: "text-cyan-400",
                      },
                      {
                        type: "milestone",
                        message: t("enterprise.activity.milestone_reached", {
                          name: "Sophie Durand",
                          milestone: "50%",
                        }),
                        timestamp: t("enterprise.activity.hours_ago", { hours: 8 }),
                        icon: Target,
                        color: "text-green-400",
                      },
                    ].map((activity, index) => (
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
          </div>
        </TabsContent>

        <TabsContent value="employees" className="mt-8">
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("enterprise.search_employees")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white focus:border-cyan-500"
                />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">{t("enterprise.all_departments")}</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800 bg-transparent">
                <Filter className="h-4 w-4 mr-2" />
                {t("enterprise.filters")}
              </Button>
            </div>

            {/* Employee List */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-600">
                      <tr>
                        <th className="text-left p-4 text-gray-300 font-medium">{t("enterprise.employee")}</th>
                        <th className="text-left p-4 text-gray-300 font-medium">{t("enterprise.department")}</th>
                        <th className="text-left p-4 text-gray-300 font-medium">{t("enterprise.progress")}</th>
                        <th className="text-left p-4 text-gray-300 font-medium">{t("enterprise.certificates")}</th>
                        <th className="text-left p-4 text-gray-300 font-medium">{t("enterprise.status")}</th>
                        <th className="text-left p-4 text-gray-300 font-medium">{t("enterprise.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((employee) => (
                        <tr key={employee.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {employee.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{employee.name}</p>
                                <p className="text-gray-400 text-sm">{employee.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="text-white">{employee.department}</p>
                              <p className="text-gray-400 text-sm">{employee.role}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="w-24">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">{employee.skillsProgress}%</span>
                              </div>
                              <Progress value={employee.skillsProgress} className="h-2" />
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Award className="h-4 w-4 text-amber-400" />
                              <span className="text-white">{employee.certificates}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(employee.status)}>
                              {t(`enterprise.status.${employee.status}`)}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {departments.map((department) => (
              <motion.div
                key={department.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-xl">{department.name}</CardTitle>
                      <Badge className="bg-cyan-500/20 text-cyan-400">
                        {department.employeeCount} {t("enterprise.employees")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">{t("enterprise.average_progress")}</span>
                          <span className="text-white font-medium">{department.averageProgress}%</span>
                        </div>
                        <Progress value={department.averageProgress} className="h-3" />
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-2">{t("enterprise.top_skills")}</p>
                        <div className="flex flex-wrap gap-2">
                          {department.topSkills.map((skill) => (
                            <Badge
                              key={skill}
                              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t("enterprise.view_details")}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          {t("enterprise.analytics")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="learning" className="mt-8">
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">{t("enterprise.company_learning_paths")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Leadership Avancé",
                      description: "Développer les compétences de leadership",
                      enrolled: 45,
                      completed: 23,
                      duration: "8 semaines",
                      level: "Avancé",
                    },
                    {
                      title: "Communication Efficace",
                      description: "Maîtriser l'art de la communication",
                      enrolled: 67,
                      completed: 34,
                      duration: "6 semaines",
                      level: "Intermédiaire",
                    },
                    {
                      title: "Gestion de Projet",
                      description: "Méthodologies et outils de gestion",
                      enrolled: 32,
                      completed: 18,
                      duration: "10 semaines",
                      level: "Avancé",
                    },
                  ].map((path, index) => (
                    <div key={index} className="p-6 rounded-lg bg-slate-800/30 border border-slate-600/30">
                      <h3 className="text-white font-semibold text-lg mb-2">{path.title}</h3>
                      <p className="text-gray-300 text-sm mb-4">{path.description}</p>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{t("enterprise.enrolled")}</span>
                          <span className="text-white">{path.enrolled}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{t("enterprise.completed")}</span>
                          <span className="text-green-400">{path.completed}</span>
                        </div>
                        <Progress value={(path.completed / path.enrolled) * 100} className="h-2" />

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-slate-700 text-gray-300 text-xs">
                              {path.duration}
                            </Badge>
                            <Badge className="bg-purple-500/20 text-purple-400 text-xs">{path.level}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">{t("enterprise.skill_distribution")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">{t("enterprise.chart_placeholder")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">{t("enterprise.learning_trends")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">{t("enterprise.trend_chart_placeholder")}</p>
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
