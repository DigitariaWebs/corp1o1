"use client"

import React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  Brain,
  Award,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

interface Notification {
  id: string
  type: "assessment" | "certificate" | "system" | "social" | "achievement"
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: "low" | "medium" | "high"
  actionUrl?: string
}

export function NotificationCenter() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "assessment",
      title: t("notifications.types.assessment_available"),
      message: "Évaluation Communication Avancée - Durée estimée: 45 minutes",
      timestamp: "Il y a 2 minutes",
      read: false,
      priority: "high",
      actionUrl: "/assessments",
    },
    {
      id: "2",
      type: "certificate",
      title: t("notifications.types.certificate_issued", { title: "Expert Communication", user: "vous" }),
      message: "Votre certificat Expert en Communication Interpersonnelle est prêt à télécharger",
      timestamp: "Il y a 1 heure",
      read: false,
      priority: "medium",
      actionUrl: "/certificates",
    },
    {
      id: "3",
      type: "achievement",
      title: t("notifications.types.achievement_unlocked"),
      message: "Félicitations! Vous avez atteint le niveau Expert en Intelligence Émotionnelle",
      timestamp: "Il y a 3 heures",
      read: true,
      priority: "medium",
    },
    {
      id: "4",
      type: "social",
      title: t("notifications.types.follower_new", { name: "Marie Dubois" }),
      message: "Marie Dubois suit maintenant votre progression",
      timestamp: "Il y a 1 jour",
      read: true,
      priority: "low",
    },
    {
      id: "5",
      type: "system",
      title: t("notifications.types.maintenance"),
      message: "Maintenance système prévue demain de 02:00 à 04:00 UTC",
      timestamp: "Il y a 2 jours",
      read: false,
      priority: "medium",
    },
  ])

  const [soundEnabled, setSoundEnabled] = useState(true)
  const [selectedTab, setSelectedTab] = useState("all")

  const notificationIcons = {
    assessment: Brain,
    certificate: Award,
    achievement: CheckCircle,
    social: Users,
    system: AlertTriangle,
  }

  const priorityColors = {
    high: "border-red-500/50 bg-red-900/20",
    medium: "border-yellow-500/50 bg-yellow-900/20",
    low: "border-gray-500/50 bg-gray-900/20",
  }

  const filteredNotifications =
    selectedTab === "all"
      ? notifications
      : selectedTab === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n.type === selectedTab)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-cyan-400" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 text-xs bg-red-500 text-white border-0">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{t("notifications.title")}</h2>
            <p className="text-gray-400">
              {unreadCount > 0
                ? t("notifications.unread_count", { count: unreadCount })
                : t("notifications.all_read")}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-800 bg-transparent">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          variant="outline"
          size="sm"
          className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {t("notifications.mark_all_read")}
        </Button>
        <Button
          onClick={clearAll}
          disabled={notifications.length === 0}
          variant="outline"
          size="sm"
          className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t("notifications.clear_all")}
        </Button>
      </div>

      {/* Notification Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800/50">
          <TabsTrigger value="all" className="text-gray-300 data-[state=active]:text-white">
            {t("notifications.tabs.all")}
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-gray-300 data-[state=active]:text-white">
            {t("notifications.tabs.unread", { count: unreadCount })}
          </TabsTrigger>
          <TabsTrigger value="assessment" className="text-gray-300 data-[state=active]:text-white">
            {t("notifications.tabs.assessments")}
          </TabsTrigger>
          <TabsTrigger value="certificate" className="text-gray-300 data-[state=active]:text-white">
            {t("notifications.tabs.certificates")}
          </TabsTrigger>
          <TabsTrigger value="achievement" className="text-gray-300 data-[state=active]:text-white">
            {t("notifications.tabs.achievements")}
          </TabsTrigger>
          <TabsTrigger value="system" className="text-gray-300 data-[state=active]:text-white">
            Système
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <div className="space-y-4">
            <AnimatePresence>
              {filteredNotifications.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white font-semibold text-lg mb-2">{t("notifications.no_notifications")}</h3>
                  <p className="text-gray-400">{t("notifications.up_to_date")}</p>
                </motion.div>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={`bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border transition-all duration-300 hover:border-slate-500/50 ${
                        !notification.read ? "border-cyan-500/30 shadow-lg shadow-cyan-500/10" : "border-slate-600/30"
                      } ${priorityColors[notification.priority]}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div
                              className={`w-10 h-10 rounded-lg bg-gradient-to-r ${
                                notification.type === "assessment"
                                  ? "from-purple-500 to-pink-600"
                                  : notification.type === "certificate"
                                    ? "from-amber-500 to-orange-600"
                                    : notification.type === "achievement"
                                      ? "from-green-500 to-teal-600"
                                      : notification.type === "social"
                                        ? "from-blue-500 to-cyan-600"
                                        : "from-red-500 to-red-600"
                              } flex items-center justify-center`}
                            >
                              {React.createElement(notificationIcons[notification.type], {
                                className: "h-5 w-5 text-white",
                              })}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-white font-semibold">{notification.title}</h3>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                                )}
                                <Badge
                                  className={`text-xs ${
                                    notification.priority === "high"
                                      ? "bg-red-500/20 text-red-400"
                                      : notification.priority === "medium"
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-gray-500/20 text-gray-400"
                                  }`}
                                >
                                  {notification.priority}
                                </Badge>
                              </div>
                              <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-400">
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {notification.timestamp}
                                </div>
                                <Badge variant="secondary" className="bg-slate-700 text-gray-300 text-xs">
                                  {notification.type}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {notification.actionUrl && (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                              >
                                {t("notifications.actions.view")}
                              </Button>
                            )}
                            {!notification.read && (
                              <Button
                                onClick={() => markAsRead(notification.id)}
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteNotification(notification.id)}
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-red-400 hover:bg-red-900/20 bg-transparent"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
