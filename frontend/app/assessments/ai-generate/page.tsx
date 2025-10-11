"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Sparkles,
  Brain,
  Target,
  Clock,
  Users,
  BookOpen,
  Zap,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lightbulb,
  TrendingUp,
  Award,
  FileCheck,
  Settings,
  HelpCircle,
  Star,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  CheckCircle2,
  Timer,
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
  Zap as Lightning,
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
  Play,
  Pause,
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
  RotateCcw,
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

interface AssessmentForm {
  title: string
  description: string
  category: string
  difficulty: string
  targetSkills: string[]
  questionCount: number
  estimatedDuration: number
  goals: string
  experience: string
  domain: string
}

const SKILL_CATEGORIES = [
  'Communication & Leadership',
  'Innovation & Creativity', 
  'Technical Skills',
  'Business Strategy',
  'Personal Development',
  'Data & Analytics'
]

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Basic concepts and fundamentals' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience required' },
  { value: 'advanced', label: 'Advanced', description: 'Significant experience needed' },
  { value: 'expert', label: 'Expert', description: 'Mastery level knowledge' },
  { value: 'mixed', label: 'Mixed', description: 'Various difficulty levels' }
]

const COMMON_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS',
  'Communication', 'Leadership', 'Project Management', 'Problem Solving',
  'Data Analysis', 'Machine Learning', 'UI/UX Design', 'Agile', 'DevOps',
  'Cybersecurity', 'Cloud Computing', 'Mobile Development', 'Web Development'
]

export default function AIGenerateAssessmentPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAssessment, setGeneratedAssessment] = useState<any>(null)
  const [formData, setFormData] = useState<AssessmentForm>({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    targetSkills: [],
    questionCount: 10,
    estimatedDuration: 30,
    goals: '',
    experience: '',
    domain: ''
  })

  const totalSteps = 4

  const handleInputChange = (field: keyof AssessmentForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      targetSkills: prev.targetSkills.includes(skill)
        ? prev.targetSkills.filter(s => s !== skill)
        : [...prev.targetSkills, skill]
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    
    try {
      // Simulate API call to generate assessment
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock generated assessment
      const mockAssessment = {
        id: `ai-assessment-${Date.now()}`,
        title: formData.title || `AI-Generated ${formData.category} Assessment`,
        description: formData.description || `A personalized assessment for ${formData.targetSkills.join(', ')}`,
        category: formData.category,
        difficulty: formData.difficulty,
        questionCount: formData.questionCount,
        estimatedDuration: formData.estimatedDuration,
        targetSkills: formData.targetSkills,
        questions: Array.from({ length: formData.questionCount }, (_, i) => ({
          id: `q-${i + 1}`,
          question: `Sample question ${i + 1} about ${formData.targetSkills[0] || 'your skills'}`,
          type: 'multiple_choice',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          explanation: `Explanation for question ${i + 1}`
        })),
        generatedAt: new Date().toISOString(),
        aiConfidence: 95
      }
      
      setGeneratedAssessment(mockAssessment)
      setCurrentStep(4)
    } catch (error) {
      console.error('Error generating assessment:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveAssessment = async () => {
    try {
      // Here you would save the assessment to the backend
      console.log('Saving assessment:', generatedAssessment)
      router.push('/assessments')
    } catch (error) {
      console.error('Error saving assessment:', error)
    }
  }

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Assessment Generator</h2>
        <p className="text-gray-600">Let our AI create a personalized assessment tailored to your needs</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assessment Title
          </label>
          <Input
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., JavaScript Fundamentals Assessment"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what this assessment will cover..."
            rows={3}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {SKILL_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  )

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mx-auto mb-4">
          <Target className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Target Skills</h2>
        <p className="text-gray-600">Select the skills you want to assess</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Skills to Assess
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {COMMON_SKILLS.map(skill => (
              <Button
                key={skill}
                variant={formData.targetSkills.includes(skill) ? "default" : "outline"}
                size="sm"
                onClick={() => handleSkillToggle(skill)}
                className="justify-start"
              >
                {skill}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty level" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  <div>
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm text-gray-500">{level.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  )

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mx-auto mb-4">
          <Settings className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Settings</h2>
        <p className="text-gray-600">Configure the assessment parameters</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <Input
              type="number"
              value={formData.questionCount}
              onChange={(e) => handleInputChange('questionCount', parseInt(e.target.value))}
              min="5"
              max="50"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <Input
              type="number"
              value={formData.estimatedDuration}
              onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value))}
              min="10"
              max="180"
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Goals
          </label>
          <Textarea
            value={formData.goals}
            onChange={(e) => handleInputChange('goals', e.target.value)}
            placeholder="What do you want to achieve with this assessment?"
            rows={2}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience Level
          </label>
          <Input
            value={formData.experience}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            placeholder="e.g., 2 years in web development"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Domain/Industry
          </label>
          <Input
            value={formData.domain}
            onChange={(e) => handleInputChange('domain', e.target.value)}
            placeholder="e.g., Fintech, Healthcare, E-commerce"
            className="w-full"
          />
        </div>
      </div>
    </motion.div>
  )

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {isGenerating ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Your Assessment</h2>
          <p className="text-gray-600 mb-6">Our AI is creating a personalized assessment for you...</p>
          <Progress value={75} className="w-full max-w-md mx-auto" />
        </div>
      ) : generatedAssessment ? (
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Generated!</h2>
            <p className="text-gray-600">Your personalized assessment is ready</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span>{generatedAssessment.title}</span>
                <Badge variant="secondary">AI Generated</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">{generatedAssessment.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{generatedAssessment.questionCount}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{generatedAssessment.estimatedDuration}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{generatedAssessment.targetSkills.length}</div>
                  <div className="text-sm text-gray-600">Skills</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{generatedAssessment.aiConfidence}%</div>
                  <div className="text-sm text-gray-600">AI Confidence</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Target Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {generatedAssessment.targetSkills.map(skill => (
                    <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleSaveAssessment} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Assessment
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Create Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Assessment Generator</h1>
            <p className="text-gray-600">Create personalized assessments with the power of AI</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
          </div>

          {/* Main Content */}
          <Card className="mb-8">
            <CardContent className="p-8">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          {currentStep < 4 && !isGenerating && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep === 3 ? (
                <Button onClick={handleGenerate} className="bg-gradient-to-r from-blue-500 to-purple-600">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Assessment
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
