"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Zap,
  Clock,
  Target,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Brain,
  Star,
  Trophy,
  Timer,
  Play,
  Pause,
  RotateCcw,
  HelpCircle,
  Lightbulb,
  TrendingUp,
  Award,
  FileCheck,
  Settings,
  Sparkles,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  PieChart,
  Activity,
  Flame,
  Rocket,
  Crown,
  Shield,
  Globe,
  Code,
  Briefcase,
  GraduationCap,
  Laptop,
  Smartphone,
  Database,
  Cloud,
  Cpu,
  Wrench,
  Palette,
  Music,
  Camera,
  Gamepad2,
  Heart,
  Coffee,
  Sun,
  Moon,
  Wind,
  Droplets,
  Mountain,
  TreePine,
  Waves,
  Compass,
  MapPin,
  Navigation,
  Plane,
  Car,
  Train,
  Ship,
  Bike,
  Footprints,
  Eye,
  Ear,
  Nose,
  Hand,
  Fingerprint,
  User,
  Users2,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MessageSquare,
  Video,
  Mic,
  Volume2,
  VolumeX,
  Stop,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Download,
  Upload,
  Share,
  Copy,
  Cut,
  Scissors,
  Clipboard,
  ClipboardCheck,
  ClipboardCopy,
  ClipboardList,
  ClipboardPaste,
  ClipboardX,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileJson,
  FilePdf,
  FileWord,
  FileExcel,
  FilePowerpoint,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderX,
  Archive,
  ArchiveRestore,
  Trash2,
  Trash,
  Delete,
  Edit,
  Edit2,
  Edit3,
  Pencil,
  Pencil1,
  Pencil2,
  Pen,
  PenTool,
  Highlighter,
  Eraser,
  Paintbrush,
  PaintBucket,
  Palette as PaletteIcon,
  Brush,
  Pen as PenIcon,
  Marker,
  Crayon,
  Pencil as PencilIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code2,
  Terminal,
  Command,
  Keyboard,
  Mouse,
  Monitor,
  Laptop2,
  Smartphone2,
  Tablet,
  Watch,
  Headphones,
  Speaker,
  Radio,
  Tv,
  Projector,
  Camera2,
  Video2,
  Film,
  Image,
  ImageIcon,
  Picture,
  Photo,
  Gallery,
  Album,
  Library,
  Book,
  BookOpen2,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  BookmarkMinus,
  BookmarkX,
  Tag,
  Tags,
  Hash,
  AtSign,
  Percent,
  DollarSign,
  Euro,
  Pound,
  Yen,
  Rupee,
  Bitcoin,
  CreditCard,
  Wallet,
  Banknote,
  Coins,
  PiggyBank,
  TrendingUp as TrendingUpIcon,
  TrendingDown,
  BarChart,
  BarChart2,
  BarChart3 as BarChart3Icon,
  LineChart,
  PieChart as PieChartIcon,
  DonutChart,
  AreaChart,
  Scatter,
  Radar,
  Gauge,
  Speedometer,
  Thermometer,
  Gauge as GaugeIcon,
  Activity as ActivityIcon,
  Pulse,
  Heart as HeartIcon,
  HeartHandshake,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  Surprised,
  Confused,
  Worried,
  Sleepy,
  Dizzy,
  Kiss,
  Wink,
  Tongue,
  ThumbsUp,
  ThumbsDown,
  Clap,
  Wave,
  Peace,
  Victory,
  Ok,
  Point,
  Stop as StopIcon,
  Go,
  FastForward,
  Rewind,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  Repeat as RepeatIcon,
  Shuffle as ShuffleIcon,
  Loop,
  RotateCcw as RotateCcwIcon,
  RotateCw,
  Refresh,
  RefreshCw,
  RefreshCcw,
  Sync,
  SyncOff,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  SignalZero,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryHigh,
  BatteryFull,
  BatteryCharging,
  Plug,
  PlugZap,
  Power,
  PowerOff,
  PowerOn,
  ToggleLeft,
  ToggleRight,
  Switch,
  Toggle,
  Lock,
  Unlock,
  Key,
  KeyRound,
  Shield as ShieldIcon,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldOff,
  Security,
  Fingerprint as FingerprintIcon,
  Eye as EyeIcon,
  EyeOff,
  Search,
  SearchX,
  Filter,
  FilterX,
  Sort,
  SortAsc,
  SortDesc,
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  ArrowUpDown,
  ArrowLeftRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftCircle,
  ArrowRightCircle,
  ArrowUpSquare,
  ArrowDownSquare,
  ArrowLeftSquare,
  ArrowRightSquare,
  ArrowUpTriangle,
  ArrowDownTriangle,
  ArrowLeftTriangle,
  ArrowRightTriangle,
  ArrowUpWide,
  ArrowDownWide,
  ArrowLeftWide,
  ArrowRightWide,
  ArrowUpNarrow,
  ArrowDownNarrow,
  ArrowLeftNarrow,
  ArrowRightNarrow,
  ArrowUpShort,
  ArrowDownShort,
  ArrowLeftShort,
  ArrowRightShort,
  ArrowUpLong,
  ArrowDownLong,
  ArrowLeftLong,
  ArrowRightLong,
  ArrowUpThick,
  ArrowDownThick,
  ArrowLeftThick,
  ArrowRightThick,
  ArrowUpThin,
  ArrowDownThin,
  ArrowLeftThin,
  ArrowRightThin,
  ArrowUpBold,
  ArrowDownBold,
  ArrowLeftBold,
  ArrowRightBold,
  ArrowUpLight,
  ArrowDownLight,
  ArrowLeftLight,
  ArrowRightLight,
  ArrowUpHeavy,
  ArrowDownHeavy,
  ArrowLeftHeavy,
  ArrowRightHeavy,
  ArrowUpExtra,
  ArrowDownExtra,
  ArrowLeftExtra,
  ArrowRightExtra,
  ArrowUpSuper,
  ArrowDownSuper,
  ArrowLeftSuper,
  ArrowRightSuper,
  ArrowUpUltra,
  ArrowDownUltra,
  ArrowLeftUltra,
  ArrowRightUltra,
  ArrowUpMega,
  ArrowDownMega,
  ArrowLeftMega,
  ArrowRightMega,
  ArrowUpGiga,
  ArrowDownGiga,
  ArrowLeftGiga,
  ArrowRightGiga,
  ArrowUpTera,
  ArrowDownTera,
  ArrowLeftTera,
  ArrowRightTera,
  ArrowUpPeta,
  ArrowDownPeta,
  ArrowLeftPeta,
  ArrowRightPeta,
  ArrowUpExa,
  ArrowDownExa,
  ArrowLeftExa,
  ArrowRightExa,
  ArrowUpZetta,
  ArrowDownZetta,
  ArrowLeftZetta,
  ArrowRightZetta,
  ArrowUpYotta,
  ArrowDownYotta,
  ArrowLeftYotta,
  ArrowRightYotta
} from "lucide-react"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  category: string
}

interface QuickAssessment {
  id: string
  title: string
  description: string
  duration: number
  questions: Question[]
  category: string
  difficulty: string
}

const QUICK_ASSESSMENTS: QuickAssessment[] = [
  {
    id: 'js-fundamentals',
    title: 'JavaScript Fundamentals',
    description: 'Test your basic JavaScript knowledge',
    duration: 5,
    category: 'Technical Skills',
    difficulty: 'beginner',
    questions: [
      {
        id: 'q1',
        question: 'What is the correct way to declare a variable in JavaScript?',
        options: ['var name = "John"', 'variable name = "John"', 'v name = "John"', 'declare name = "John"'],
        correctAnswer: 0,
        explanation: 'The correct way to declare a variable in JavaScript is using var, let, or const keywords.',
        category: 'Technical Skills'
      },
      {
        id: 'q2',
        question: 'Which method is used to add an element to the end of an array?',
        options: ['push()', 'pop()', 'shift()', 'unshift()'],
        correctAnswer: 0,
        explanation: 'The push() method adds one or more elements to the end of an array.',
        category: 'Technical Skills'
      },
      {
        id: 'q3',
        question: 'What does the === operator do in JavaScript?',
        options: ['Assigns a value', 'Compares values and types', 'Compares only values', 'Checks if a variable exists'],
        correctAnswer: 1,
        explanation: 'The === operator compares both the value and the type of the operands.',
        category: 'Technical Skills'
      }
    ]
  },
  {
    id: 'communication',
    title: 'Communication Skills',
    description: 'Assess your communication abilities',
    duration: 5,
    category: 'Communication & Leadership',
    difficulty: 'beginner',
    questions: [
      {
        id: 'q1',
        question: 'What is the most important aspect of effective communication?',
        options: ['Speaking clearly', 'Active listening', 'Using complex vocabulary', 'Speaking quickly'],
        correctAnswer: 1,
        explanation: 'Active listening is crucial for effective communication as it ensures understanding.',
        category: 'Communication & Leadership'
      },
      {
        id: 'q2',
        question: 'Which communication style is most effective in professional settings?',
        options: ['Aggressive', 'Passive', 'Assertive', 'Passive-aggressive'],
        correctAnswer: 2,
        explanation: 'Assertive communication is most effective as it respects both your needs and others.',
        category: 'Communication & Leadership'
      }
    ]
  },
  {
    id: 'problem-solving',
    title: 'Problem Solving',
    description: 'Test your analytical thinking skills',
    duration: 5,
    category: 'Personal Development',
    difficulty: 'intermediate',
    questions: [
      {
        id: 'q1',
        question: 'What is the first step in the problem-solving process?',
        options: ['Implement solution', 'Define the problem', 'Generate alternatives', 'Evaluate options'],
        correctAnswer: 1,
        explanation: 'Defining the problem clearly is the first and most important step.',
        category: 'Personal Development'
      },
      {
        id: 'q2',
        question: 'Which technique helps in breaking down complex problems?',
        options: ['Decomposition', 'Procrastination', 'Avoidance', 'Overthinking'],
        correctAnswer: 0,
        explanation: 'Decomposition breaks complex problems into smaller, manageable parts.',
        category: 'Personal Development'
      }
    ]
  }
]

export default function QuickAssessmentPage() {
  const router = useRouter()
  const [selectedAssessment, setSelectedAssessment] = useState<QuickAssessment | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [isStarted, setIsStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [score, setScore] = useState(0)

  const startAssessment = (assessment: QuickAssessment) => {
    setSelectedAssessment(assessment)
    setTimeLeft(assessment.duration * 60) // Convert minutes to seconds
    setCurrentQuestion(0)
    setAnswers([])
    setIsStarted(true)
    setIsCompleted(false)
    setScore(0)
  }

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)

    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (currentQuestion < selectedAssessment!.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
      } else {
        completeAssessment(newAnswers)
      }
    }, 1000)
  }

  const completeAssessment = (finalAnswers: number[]) => {
    let correctAnswers = 0
    selectedAssessment!.questions.forEach((question, index) => {
      if (finalAnswers[index] === question.correctAnswer) {
        correctAnswers++
      }
    })
    
    const finalScore = Math.round((correctAnswers / selectedAssessment!.questions.length) * 100)
    setScore(finalScore)
    setIsCompleted(true)
    setIsStarted(false)
  }

  const resetAssessment = () => {
    setSelectedAssessment(null)
    setCurrentQuestion(0)
    setAnswers([])
    setTimeLeft(0)
    setIsStarted(false)
    setIsCompleted(false)
    setScore(0)
  }

  // Timer effect
  React.useEffect(() => {
    if (isStarted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (isStarted && timeLeft === 0) {
      completeAssessment(answers)
    }
  }, [isStarted, timeLeft, answers])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isCompleted && selectedAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mx-auto mb-6">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
              <p className="text-gray-600">Great job completing the {selectedAssessment.title}</p>
            </motion.div>

            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-blue-600 mb-2">{score}%</div>
                  <div className="text-xl text-gray-600 mb-4">Your Score</div>
                  <div className="flex items-center justify-center space-x-2">
                    {score >= 80 ? (
                      <>
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <span className="text-green-600 font-medium">Excellent!</span>
                      </>
                    ) : score >= 60 ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                        <span className="text-blue-600 font-medium">Good Job!</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        <span className="text-orange-600 font-medium">Keep Learning!</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{selectedAssessment.questions.length}</div>
                    <div className="text-sm text-gray-600">Questions</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{Math.round((score / 100) * selectedAssessment.questions.length)}</div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{selectedAssessment.duration}</div>
                    <div className="text-sm text-gray-600">Minutes</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Question Review</h3>
                  {selectedAssessment.questions.map((question, index) => {
                    const userAnswer = answers[index]
                    const isCorrect = userAnswer === question.correctAnswer
                    
                    return (
                      <div key={question.id} className={`p-4 rounded-lg border ${
                        isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-start space-x-3">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                            <p className="text-sm text-gray-600 mb-2">
                              Your answer: {question.options[userAnswer] || 'Not answered'}
                            </p>
                            {!isCorrect && (
                              <p className="text-sm text-gray-600 mb-2">
                                Correct answer: {question.options[question.correctAnswer]}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button onClick={resetAssessment} className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Take Another Assessment
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/assessments')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Assessments
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (isStarted && selectedAssessment) {
    const question = selectedAssessment.questions[currentQuestion]
    const progress = ((currentQuestion + 1) / selectedAssessment.questions.length) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                onClick={resetAssessment}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Exit Assessment
              </Button>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Timer className="h-5 w-5 text-red-500" />
                  <span className="font-mono text-lg font-bold text-red-600">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <Badge variant="outline">
                  Question {currentQuestion + 1} of {selectedAssessment.questions.length}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <Progress value={progress} className="w-full h-2" />
            </div>

            {/* Question */}
            <Card>
              <CardContent className="p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {question.question}
                  </h2>
                  
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto p-4 text-left"
                        onClick={() => handleAnswer(index)}
                        disabled={answers[currentQuestion] !== undefined}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            answers[currentQuestion] === index
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-gray-300'
                          }`}>
                            {answers[currentQuestion] === index && (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </div>
                          <span>{option}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mx-auto mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick Skill Check</h1>
            <p className="text-gray-600">Take a quick 5-minute assessment to test your skills</p>
          </div>

          {/* Assessment Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {QUICK_ASSESSMENTS.map((assessment) => (
              <motion.div
                key={assessment.id}
                whileHover={{ y: -5 }}
                className="cursor-pointer"
                onClick={() => startAssessment(assessment)}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{assessment.category}</Badge>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{assessment.duration} min</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{assessment.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{assessment.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {assessment.difficulty}
                      </Badge>
                      <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-600">
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Info Section */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About Quick Assessments</h3>
                  <p className="text-gray-600 mb-4">
                    These quick assessments are designed to give you a fast overview of your skills in specific areas. 
                    Each assessment takes only 5 minutes and provides immediate feedback.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>5 minutes each</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span>Immediate results</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span>Skill-focused</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
