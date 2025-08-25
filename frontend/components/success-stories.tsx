"use client"

import React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Shield, Palette, Lightbulb } from "lucide-react"
import Image from "next/image"
import { useTranslation } from "@/hooks/use-translation"

export default function SuccessStories() {
  const { t } = useTranslation()
  const [currentStory, setCurrentStory] = useState(0)

  const stories = [
    {
      name: "Amira",
      title: t("stories.amira_title"),
      icon: Shield,
      color: "from-cyan-500 to-blue-600",
      image: "/placeholder.svg?height=300&width=300",
      story: t("stories.amira_story"),
      skills: [
        t("stories.amira_skills").split(",")[0] || "Sécurité Éthique",
        t("stories.amira_skills").split(",")[1] || "Protection Réseau", 
        t("stories.amira_skills").split(",")[2] || "Tests de Pénétration"
      ],
      achievement: t("stories.amira_achievement"),
      beforeAfter: {
        before: t("stories.amira_before"),
        after: t("stories.amira_after"),
      },
    },
    {
      name: "Lucas",
      title: t("stories.lucas_title"),
      icon: Lightbulb,
      color: "from-amber-500 to-orange-600",
      image: "/placeholder.svg?height=300&width=300",
      story: t("stories.lucas_story"),
      skills: [
        "Innovation", 
        "Résolution de Problèmes", 
        "Design Mécanique"
      ],
      achievement: t("stories.lucas_achievement"),
      beforeAfter: {
        before: t("stories.lucas_before"),
        after: t("stories.lucas_after"),
      },
    },
    {
      name: "Fatou",
      title: t("stories.fatou_title"),
      icon: Palette,
      color: "from-purple-500 to-pink-600",
      image: "/placeholder.svg?height=300&width=300",
      story: t("stories.fatou_story"),
      skills: [
        "Design 3D", 
        "UX/UI", 
        "Réalité Virtuelle"
      ],
      achievement: t("stories.fatou_achievement"),
      beforeAfter: {
        before: t("stories.fatou_before"),
        after: t("stories.fatou_after"),
      },
    },
  ]

  const nextStory = () => {
    setCurrentStory((prev) => (prev + 1) % stories.length)
  }

  const prevStory = () => {
    setCurrentStory((prev) => (prev - 1 + stories.length) % stories.length)
  }

  return (
    <section className="py-20 px-4 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t("stories.title")}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t("stories.subtitle")}
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Image Section */}
                    <div className="relative h-64 lg:h-auto">
                      <Image
                        src={stories[currentStory].image || "/placeholder.svg"}
                        alt={stories[currentStory].name}
                        fill
                        className="object-cover"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${stories[currentStory].color} opacity-20`} />
                      <div className="absolute top-4 left-4">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${stories[currentStory].color} flex items-center justify-center`}
                        >
                          {stories[currentStory].icon &&
                            React.createElement(stories[currentStory].icon, {
                              className: "h-6 w-6 text-white",
                            })}
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 lg:p-12">
                      <h3 className="text-3xl font-bold text-white mb-2">{stories[currentStory].name}</h3>
                      <p
                        className={`text-lg font-semibold bg-gradient-to-br ${stories[currentStory].color} bg-clip-text text-transparent mb-6`}
                      >
                        {stories[currentStory].title}
                      </p>

                      <p className="text-gray-300 mb-6 leading-relaxed">{stories[currentStory].story}</p>

                      <div className="mb-6">
                        <h4 className="text-white font-semibold mb-3">Compétences Reconnues:</h4>
                        <div className="flex flex-wrap gap-2">
                          {stories[currentStory].skills.map((skill, index) => (
                            <span
                              key={index}
                              className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-br ${stories[currentStory].color} text-white`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <div
                          className={`p-4 rounded-lg bg-gradient-to-r ${stories[currentStory].color} bg-opacity-10 border border-opacity-20`}
                        >
                          <p className="text-white font-semibold">🏆 {stories[currentStory].achievement}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-red-400 font-semibold mb-1">{t("stories.before")}</p>
                          <p className="text-gray-300 text-sm">{stories[currentStory].beforeAfter.before}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                          <p className="text-green-400 font-semibold mb-1">{t("stories.after")}</p>
                          <p className="text-gray-300 text-sm">{stories[currentStory].beforeAfter.after}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-center items-center mt-8 gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevStory}
              className="rounded-full border-slate-600 hover:border-slate-500 text-white hover:bg-slate-800 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2">
              {stories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStory(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentStory
                      ? `bg-gradient-to-r ${stories[currentStory].color}`
                      : "bg-slate-600 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextStory}
              className="rounded-full border-slate-600 hover:border-slate-500 text-white hover:bg-slate-800 bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
