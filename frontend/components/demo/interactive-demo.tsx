"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  Play,
  RotateCcw,
  CheckCircle,
  Star,
  Award,
  Target,
  TrendingUp,
  Users,
  Zap,
  BookOpen,
  MessageSquare,
  Palette,
  Heart,
  ArrowRight,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

export function InteractiveDemo() {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasSound, setHasSound] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState("communication")
  const [assessmentProgress, setAssessmentProgress] = useState(0)
  const [showResults, setShowResults] = useState(false)

  const demoSteps = [
    {
      id: "welcome",
      title: t("demo.steps.welcome.title"),
      description: t("demo.steps.welcome.description"),
      component: "welcome",
    },
    {
      id: "skill-selection",
      title: t("demo.steps.skill_selection.title"),
      description: t("demo.steps.skill_selection.description"),
      component: "skill-selection",
    },
    {
      id: "assessment",
      title: t("demo.steps.assessment.title"),
      description: t("demo.steps.assessment.description"),
      component: "assessment",
    },
    {
      id: "ai-analysis",
      title: t("demo.steps.ai_analysis.title"),
      description: t("demo.steps.ai_analysis.description"),
      component: "ai-analysis",
    },
    {
      id: "results",
      title: t("demo.steps.results.title"),
      description: t("demo.steps.results.description"),
      component: "results",
    },
  ]

  const skills = [
    {
      id: "communication",
      name: t("demo.skills.communication"),
      icon: MessageSquare,
      color: "from-blue-500 to-cyan-600",
      level: 85,
    },
    {
      id: "creativity",
      name: t("demo.skills.creativity"),
      icon: Palette,
      color: "from-purple-500 to-pink-600",
      level: 78,
    },
    {
      id: "leadership",
      name: t("demo.skills.leadership"),
      icon: Users,
      color: "from-amber-500 to-orange-600",
      level: 72,
    },
    {
      id: "emotional-intelligence",
      name: t("demo.skills.emotional_intelligence"),
      icon: Heart,
      color: "from-green-500 to-teal-600",
      level: 90,
    },
  ]

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleReset = () => {
    setCurrentStep(0)
    setAssessmentProgress(0)
    setShowResults(false)
    setIsPlaying(false)
  }

  const startAssessment = () => {
    setIsPlaying(true)
    const interval = setInterval(() => {
      setAssessmentProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsPlaying(false)
          setShowResults(true)
          setTimeout(() => handleNext(), 1000)
          return 100
        }
        return prev + 2
      })
    }, 100)
  }

  const renderStepContent = () => {
    const step = demoSteps[currentStep]

    switch (step.component) {
      case "welcome":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <Brain className="h-12 w-12 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">{t("demo.welcome.title")}</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">{t("demo.welcome.description")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  icon: Brain,
                  title: t("demo.features.ai_assessment"),
                  description: t("demo.features.ai_assessment_desc"),
                },
                {
                  icon: TrendingUp,
                  title: t("demo.features.real_time_analysis"),
                  description: t("demo.features.real_time_analysis_desc"),
                },
                {
                  icon: Award,
                  title: t("demo.features.instant_certification"),
                  description: t("demo.features.instant_certification_desc"),
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="p-6 rounded-lg bg-slate-800/30 border border-slate-600/30"
                >
                  <feature.icon className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )

      case "skill-selection":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">{t("demo.skill_selection.title")}</h2>
              <p className="text-gray-300">{t("demo.skill_selection.description")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {skills.map((skill) => (
                <motion.div
                  key={skill.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSkill(skill.id)}
                  className={`p-6 rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedSkill === skill.id
                      ? "bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500/50"
                      : "bg-slate-800/30 border border-slate-600/30 hover:border-slate-500/50"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${skill.color} flex items-center justify-center`}
                    >
                      <skill.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{skill.name}</h3>
                      <div className="flex items-center space-x-2 mt-2">
                        <Progress value={skill.level} className="flex-1 h-2" />
                        <span className="text-gray-400 text-sm">{skill.level}%</span>
                      </div>
                    </div>
                    {selectedSkill === skill.id && <CheckCircle className="h-6 w-6 text-cyan-400" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )

      case "assessment":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">{t("demo.assessment.title")}</h2>
              <p className="text-gray-300">{t("demo.assessment.description")}</p>
            </div>

            <Card className="max-w-2xl mx-auto bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  {t("demo.assessment.ai_evaluation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                    <div className="text-4xl font-bold text-white">{Math.round(assessmentProgress)}%</div>
                  </div>
                  <Progress value={assessmentProgress} className="h-3 mb-4" />
                  <p className="text-gray-300">
                    {assessmentProgress < 100 ? t("demo.assessment.analyzing") : t("demo.assessment.complete")}
                  </p>
                </div>

                {!isPlaying && assessmentProgress === 0 && (
                  <Button
                    onClick={startAssessment}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t("demo.assessment.start")}
                  </Button>
                )}

                {isPlaying && (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 text-cyan-400">
                      <Zap className="h-5 w-5 animate-pulse" />
                      <span>{t("demo.assessment.processing")}</span>
                    </div>
                  </div>
                )}

                {showResults && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-4 rounded-lg bg-green-900/20 border border-green-500/30"
                  >
                    <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 font-semibold">{t("demo.assessment.analysis_complete")}</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )

      case "ai-analysis":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">{t("demo.ai_analysis.title")}</h2>
              <p className="text-gray-300">{t("demo.ai_analysis.description")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
              <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    {t("demo.ai_analysis.insights")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        type: "strength",
                        text: t("demo.ai_analysis.strength_1"),
                        icon: Star,
                        color: "text-green-400",
                      },
                      {
                        type: "strength",
                        text: t("demo.ai_analysis.strength_2"),
                        icon: Star,
                        color: "text-green-400",
                      },
                      {
                        type: "improvement",
                        text: t("demo.ai_analysis.improvement_1"),
                        icon: Target,
                        color: "text-amber-400",
                      },
                    ].map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-slate-800/30"
                      >
                        <insight.icon className={`h-5 w-5 ${insight.color} mt-0.5`} />
                        <p className="text-gray-300 text-sm">{insight.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    {t("demo.ai_analysis.recommendations")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        title: t("demo.ai_analysis.rec_1_title"),
                        description: t("demo.ai_analysis.rec_1_desc"),
                        priority: "high",
                      },
                      {
                        title: t("demo.ai_analysis.rec_2_title"),
                        description: t("demo.ai_analysis.rec_2_desc"),
                        priority: "medium",
                      },
                      {
                        title: t("demo.ai_analysis.rec_3_title"),
                        description: t("demo.ai_analysis.rec_3_desc"),
                        priority: "low",
                      },
                    ].map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="p-3 rounded-lg bg-slate-800/30 border border-slate-600/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium text-sm">{rec.title}</h4>
                          <Badge
                            className={
                              rec.priority === "high"
                                ? "bg-red-500/20 text-red-400"
                                : rec.priority === "medium"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-gray-500/20 text-gray-400"
                            }
                          >
                            {t(`demo.priority.${rec.priority}`)}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-xs">{rec.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )

      case "results":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">{t("demo.results.title")}</h2>
              <p className="text-gray-300">{t("demo.results.description")}</p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white text-center text-2xl">
                    {t("demo.results.skill_assessment_complete")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-white">85%</span>
                      </div>
                      <h3 className="text-white font-semibold mb-2">{t("demo.results.skill_level")}</h3>
                      <p className="text-gray-300 text-sm">{t("demo.results.above_average")}</p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                        <Award className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">{t("demo.results.certificate_earned")}</h3>
                      <p className="text-gray-300 text-sm">{t("demo.results.blockchain_verified")}</p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center mb-4">
                        <TrendingUp className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">{t("demo.results.growth_potential")}</h3>
                      <p className="text-gray-300 text-sm">{t("demo.results.personalized_path")}</p>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <Button
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-3"
                      onClick={() => window.location.href = "/dashboard"}
                    >
                      {t("demo.results.start_your_journey")}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4"
          >
            {t("demo.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg"
          >
            {t("demo.subtitle")}
          </motion.p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            {demoSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                      : "bg-slate-700 text-gray-400"
                  }`}
                >
                  {index + 1}
                </div>
                {index < demoSteps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${index < currentStep ? "bg-cyan-500" : "bg-slate-700"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">{demoSteps[currentStep].title}</h2>
            <p className="text-gray-400">{demoSteps[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setHasSound(!hasSound)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
            >
              {hasSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("demo.controls.reset")}
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800 bg-transparent disabled:opacity-50"
            >
              {t("demo.controls.previous")}
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === demoSteps.length - 1}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              {currentStep === demoSteps.length - 1 ? t("demo.controls.finish") : t("demo.controls.next")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
