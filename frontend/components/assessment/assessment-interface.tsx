"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  Users, 
  Target, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Eye, 
  Heart, 
  MessageSquare, 
  Code, 
  Palette, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  Sparkles, 
  Activity, 
  Volume2, 
  Headphones, 
  Camera, 
  Shield, 
  Award, 
  ArrowRight, 
  ChevronRight,
  Lightbulb,
  Settings,
  Info,
  Star
} from 'lucide-react';

const AdvancedAssessmentInterface = () => {
  const [currentPhase, setCurrentPhase] = useState('selection'); // selection, setup, assessment, results
  const [assessmentType, setAssessmentType] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState({
    confidence: 0,
    emotionalState: 'neutral',
    stressLevel: 0,
    communicationClarity: 0,
    technicalAccuracy: 0,
    creativity: 0,
    leadership: 0
  });
  const [detectedSkills, setDetectedSkills] = useState([]);
  const [realTimeFeedback, setRealTimeFeedback] = useState([]);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);

  // Assessment types available
  const assessmentTypes = [
    {
      id: 'communication',
      title: 'Communication Interpersonnelle',
      description: 'Évaluation complète de vos compétences relationnelles et empathiques',
      icon: MessageSquare,
      color: 'from-cyan-500 to-blue-600',
      duration: '45 min',
      difficulty: 'Adaptatif',
      aiFeatures: ['Analyse vocale', 'Détection émotionnelle', 'Feedback comportemental'],
      scenarios: ['Gestion de conflit', 'Présentation publique', 'Écoute active', 'Négociation']
    },
    {
      id: 'leadership',
      title: 'Leadership & Management',
      description: 'Simulation de situations de leadership avec IA comportementale',
      icon: Users,
      color: 'from-amber-500 to-orange-600',
      duration: '60 min',
      difficulty: 'Expert',
      aiFeatures: ['Simulation d\'équipe', 'Analyse décisionnelle', 'Coaching temps réel'],
      scenarios: ['Crise d\'équipe', 'Prise de décision', 'Motivation', 'Délégation']
    },
    {
      id: 'creativity',
      title: 'Innovation & Créativité',
      description: 'Défis créatifs adaptatifs avec analyse de votre processus innovant',
      icon: Palette,
      color: 'from-purple-500 to-pink-600',
      duration: '50 min',
      difficulty: 'Créatif',
      aiFeatures: ['Analyse créative', 'Génération de défis', 'Évaluation d\'originalité'],
      scenarios: ['Brainstorming', 'Design thinking', 'Innovation produit', 'Résolution créative']
    },
    {
      id: 'emotional-intelligence',
      title: 'Intelligence Émotionnelle',
      description: 'Évaluation approfondie de votre QE avec scénarios immersifs',
      icon: Heart,
      color: 'from-green-500 to-teal-600',
      duration: '40 min',
      difficulty: 'Introspectif',
      aiFeatures: ['Analyse émotionnelle', 'Détection micro-expressions', 'Coaching empathique'],
      scenarios: ['Gestion du stress', 'Empathie', 'Auto-régulation', 'Relations sociales']
    },
    {
      id: 'technical',
      title: 'Compétences Techniques',
      description: 'Évaluation technique avec défis de programmation en temps réel',
      icon: Code,
      color: 'from-indigo-500 to-purple-600',
      duration: '90 min',
      difficulty: 'Technique',
      aiFeatures: ['Analyse de code', 'Révision automatique', 'Optimisation suggérée'],
      scenarios: ['Problem solving', 'Architecture', 'Debugging', 'Code review']
    },
    {
      id: 'comprehensive',
      title: 'Évaluation Globale 360°',
      description: 'Assessment complet multi-domaines avec IA holistique',
      icon: Target,
      color: 'from-rose-500 to-pink-600',
      duration: '120 min',
      difficulty: 'Complet',
      aiFeatures: ['Analyse multi-modale', 'Profil holistique', 'Recommandations personnalisées'],
      scenarios: ['Multi-domaines', 'Cas complexes', 'Intégration', 'Synthèse']
    }
  ];

  // Real-time analysis simulation
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        
        // Simulate real-time AI analysis
        setAiAnalysis(prev => ({
          confidence: Math.min(prev.confidence + Math.random() * 3, 95),
          emotionalState: ['calm', 'confident', 'focused', 'engaged'][Math.floor(Math.random() * 4)],
          stressLevel: Math.max(0, prev.stressLevel + (Math.random() - 0.5) * 10),
          communicationClarity: Math.min(prev.communicationClarity + Math.random() * 2, 90),
          technicalAccuracy: Math.min(prev.technicalAccuracy + Math.random() * 2, 85),
          creativity: Math.min(prev.creativity + Math.random() * 2, 88),
          leadership: Math.min(prev.leadership + Math.random() * 2, 82)
        }));

        // Add real-time feedback
        if (Math.random() > 0.7) {
          const feedbackOptions = [
            'Excellente articulation détectée',
            'Ton confiant identifié',
            'Usage de terminologie appropriée',
            'Structure de réponse claire',
            'Empathie perceptible dans la voix',
            'Créativité dans l\'approche'
          ];
          setRealTimeFeedback(prev => [
            ...prev.slice(-3),
            {
              id: Date.now(),
              text: feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)],
              type: 'positive',
              timestamp: recordingTime
            }
          ]);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRecording, recordingTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const Progress = ({ value, className = "" }) => (
    <div className={`w-full bg-slate-700 rounded-full h-2 ${className}`}>
      <motion.div
        className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );

  const Badge = ({ children, variant = "default", className = "" }) => {
    const variants = {
      default: "bg-slate-700 text-gray-300",
      success: "bg-green-500/20 text-green-400",
      warning: "bg-amber-500/20 text-amber-400",
      info: "bg-cyan-500/20 text-cyan-400",
      purple: "bg-purple-500/20 text-purple-400",
      danger: "bg-red-500/20 text-red-400"
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${variants[variant]} ${className}`}>
        {children}
      </span>
    );
  };

  const Button = ({ children, variant = "default", size = "default", className = "", ...props }) => {
    const variants = {
      default: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white",
      outline: "border border-slate-600 text-white hover:bg-slate-800 bg-transparent",
      ghost: "text-gray-300 hover:text-white hover:bg-slate-800/50"
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      default: "px-4 py-2",
      lg: "px-6 py-3 text-lg"
    };
    
    return (
      <button 
        className={`font-medium rounded-lg transition-all duration-300 ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  };

  const Card = ({ children, className = "" }) => (
    <div className={`bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg ${className}`}>
      {children}
    </div>
  );

  const renderAssessmentSelection = () => (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">Évaluation IA Avancée</h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Choisissez votre type d'évaluation. Notre IA s'adaptera en temps réel à vos réponses pour une expérience personnalisée.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessmentTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              setAssessmentType(type);
              setCurrentPhase('setup');
            }}
            className="cursor-pointer group"
          >
            <Card className="h-full overflow-hidden hover:scale-105 transition-all duration-300 hover:border-slate-500/50">
              <div className={`h-32 bg-gradient-to-r ${type.color} relative`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-4 left-4">
                  <type.icon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/30 text-white border-0">
                    <Brain className="h-3 w-3 mr-1" />
                    IA Adaptatif
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-lg">{type.title}</h3>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-300 text-sm mb-4">{type.description}</p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Durée</span>
                    <span className="text-white">{type.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Difficulté</span>
                    <Badge variant="info">{type.difficulty}</Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2">Fonctionnalités IA:</p>
                  <div className="flex flex-wrap gap-1">
                    {type.aiFeatures.map((feature, idx) => (
                      <Badge key={idx} variant="purple" className="text-xs">{feature}</Badge>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2">Scénarios inclus:</p>
                  <div className="flex flex-wrap gap-1">
                    {type.scenarios.slice(0, 3).map((scenario, idx) => (
                      <Badge key={idx} className="text-xs">{scenario}</Badge>
                    ))}
                    {type.scenarios.length > 3 && (
                      <Badge variant="info" className="text-xs">+{type.scenarios.length - 3}</Badge>
                    )}
                  </div>
                </div>

                <Button className="w-full group-hover:scale-105 transition-transform duration-300">
                  <Play className="h-4 w-4 mr-2" />
                  Commencer l'Évaluation
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderAssessmentSetup = () => (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Button 
          variant="outline" 
          onClick={() => setCurrentPhase('selection')}
          className="mb-4"
        >
          ← Retour à la sélection
        </Button>
        <h1 className="text-3xl font-bold text-white mb-2">{assessmentType?.title}</h1>
        <p className="text-gray-300">{assessmentType?.description}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Setup Options */}
        <Card className="p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Configuration de l'Évaluation</h3>
          
          <div className="space-y-6">
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Mode d'interaction</label>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="flex flex-col items-center p-3">
                  <Mic className="h-5 w-5 mb-1" />
                  <span className="text-xs">Vocal</span>
                </Button>
                <Button variant="outline" size="sm" className="flex flex-col items-center p-3">
                  <Video className="h-5 w-5 mb-1" />
                  <span className="text-xs">Vidéo</span>
                </Button>
                <Button variant="outline" size="sm" className="flex flex-col items-center p-3">
                  <Monitor className="h-5 w-5 mb-1" />
                  <span className="text-xs">Écran</span>
                </Button>
              </div>
            </div>

            <div>
              <label className="text-gray-300 text-sm mb-2 block">Niveau de difficulté</label>
              <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
                <option>Adaptatif (Recommandé)</option>
                <option>Débutant</option>
                <option>Intermédiaire</option>
                <option>Avancé</option>
                <option>Expert</option>
              </select>
            </div>

            <div>
              <label className="text-gray-300 text-sm mb-2 block">Focus spécifiques</label>
              <div className="space-y-2">
                {['Analyse comportementale', 'Feedback en temps réel', 'Simulation de stress', 'Coaching adaptatif'].map((option) => (
                  <label key={option} className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-gray-300 text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* AI Preparation */}
        <Card className="p-6">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-400" />
            Préparation IA
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center mb-2">
                <Sparkles className="h-4 w-4 text-purple-400 mr-2" />
                <span className="text-purple-400 font-medium">Personnalisation en cours</span>
              </div>
              <p className="text-gray-300 text-sm">
                L'IA analyse votre profil existant pour adapter l'évaluation à vos compétences actuelles.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Analyse du profil', progress: 100, status: 'completed' },
                { label: 'Génération des scénarios', progress: 75, status: 'processing' },
                { label: 'Calibrage vocal', progress: 45, status: 'processing' },
                { label: 'Configuration adaptative', progress: 20, status: 'pending' }
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.label}</span>
                    <span className={`${item.status === 'completed' ? 'text-green-400' : item.status === 'processing' ? 'text-cyan-400' : 'text-gray-400'}`}>
                      {item.progress}%
                    </span>
                  </div>
                  <Progress value={item.progress} />
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Button 
                className="w-full"
                onClick={() => setCurrentPhase('assessment')}
              >
                <Zap className="h-4 w-4 mr-2" />
                Lancer l'Évaluation IA
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderAssessmentInterface = () => (
    <div className="space-y-8">
      {/* Header with Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{assessmentType?.title}</h2>
              <p className="text-gray-300">Scénario {currentStep} sur 8 - Analyse temps réel active</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{Math.floor(aiAnalysis.confidence)}%</div>
                <div className="text-xs text-gray-400">Confiance IA</div>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>
          
          <Progress value={(currentStep / 8) * 100} className="h-2" />
          
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Analyse multi-dimensionnelle en cours</span>
            <span>{Math.floor((currentStep / 8) * 100)}% complété</span>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Assessment Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Scenario */}
          <Card className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">Scénario Adaptatif</h3>
                <Badge variant="purple">
                  <Brain className="h-3 w-3 mr-1" />
                  IA Active
                </Badge>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30 mb-6">
                <h4 className="text-white font-medium mb-3">
                  Situation de Communication Complexe
                </h4>
                <p className="text-gray-300 mb-4">
                  Vous êtes responsable d'équipe et devez gérer un conflit entre deux membres de votre équipe qui impacte la productivité. L'un accuse l'autre de ne pas respecter les délais, créant des tensions. Comment abordez-vous cette situation?
                </p>
                <div className="flex items-center space-x-2 text-sm text-amber-400">
                  <Lightbulb className="h-4 w-4" />
                  <span>Tip IA: Concentrez-vous sur l'écoute active et la recherche de solutions</span>
                </div>
              </div>

              {/* Recording Interface */}
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/30">
                <div className="flex items-center justify-center mb-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsRecording(!isRecording)}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording
                        ? "bg-gradient-to-r from-red-500 to-red-600 animate-pulse"
                        : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="h-8 w-8 text-white" />
                    ) : (
                      <Mic className="h-8 w-8 text-white" />
                    )}
                  </motion.button>
                </div>

                <div className="text-center mb-4">
                  <p className="text-white font-semibold mb-2">
                    {isRecording ? 'Enregistrement en cours...' : 'Cliquez pour commencer votre réponse'}
                  </p>
                  <p className="text-gray-300 text-sm">
                    Temps: {formatTime(recordingTime)} | IA: Analyse en temps réel
                  </p>
                </div>

                {/* Audio Waveform */}
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center mb-4 gap-1"
                  >
                    {[...Array(25)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full"
                        animate={{
                          height: [4, Math.random() * 50 + 10, 4],
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.05,
                        }}
                      />
                    ))}
                  </motion.div>
                )}

                {/* Live Transcription */}
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600/30"
                  >
                    <div className="flex items-center mb-2">
                      <Activity className="h-4 w-4 text-cyan-400 mr-2 animate-pulse" />
                      <span className="text-cyan-400 text-sm font-semibold">Transcription Temps Réel</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      "D'abord, je rencontrerais chaque membre individuellement pour comprendre leur perspective. L'écoute active est cruciale pour identifier les vrais problèmes sous-jacents..."
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Refaire
              </Button>
              <Button 
                onClick={() => setCurrentStep(prev => Math.min(prev + 1, 8))}
                disabled={!isRecording && recordingTime === 0}
              >
                <Send className="mr-2 h-4 w-4" />
                Scénario Suivant
              </Button>
            </div>
          </Card>

          {/* Real-time Feedback */}
          <Card className="p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-amber-400" />
              Feedback IA Temps Réel
            </h3>
            <div className="space-y-3">
              {realTimeFeedback.map((feedback) => (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center p-3 bg-green-900/20 border border-green-500/30 rounded-lg"
                >
                  <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                  <span className="text-gray-300 text-sm flex-1">{feedback.text}</span>
                  <span className="text-xs text-gray-500">{formatTime(feedback.timestamp)}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* AI Analysis Sidebar */}
        <div className="space-y-6">
          {/* Real-time Analysis */}
          <Card className="p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-400" />
              Analyse IA Multi-Dimensionnelle
            </h3>
            
            <div className="space-y-4">
              {[
                { label: 'Confiance Vocale', value: aiAnalysis.confidence, color: 'cyan' },
                { label: 'Clarté Communication', value: aiAnalysis.communicationClarity, color: 'blue' },
                { label: 'Précision Technique', value: aiAnalysis.technicalAccuracy, color: 'green' },
                { label: 'Leadership', value: aiAnalysis.leadership, color: 'amber' },
                { label: 'Créativité', value: aiAnalysis.creativity, color: 'purple' }
              ].map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{metric.label}</span>
                    <span className="text-white font-medium">{Math.floor(metric.value)}%</span>
                  </div>
                  <Progress value={metric.value} />
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg">
              <div className="flex items-center mb-2">
                <Eye className="h-4 w-4 text-cyan-400 mr-2" />
                <span className="text-cyan-400 font-medium text-sm">État Émotionnel</span>
              </div>
              <p className="text-white capitalize">{aiAnalysis.emotionalState}</p>
              <p className="text-gray-400 text-xs">Niveau de stress: {Math.floor(aiAnalysis.stressLevel)}%</p>
            </div>
          </Card>

          {/* Detected Skills */}
          <Card className="p-6">
            <h3 className="text-white font-semibold mb-4">Compétences Détectées</h3>
            <div className="space-y-3">
              {[
                { skill: 'Communication Empathique', level: 'Expert', confidence: 95 },
                { skill: 'Gestion de Conflit', level: 'Avancé', confidence: 88 },
                { skill: 'Leadership Collaboratif', level: 'Avancé', confidence: 82 },
                { skill: 'Écoute Active', level: 'Expert', confidence: 92 }
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium text-sm">{item.skill}</p>
                    <p className="text-gray-400 text-xs">{item.confidence}% confiance</p>
                  </div>
                  <Badge variant={item.level === 'Expert' ? 'success' : 'info'}>
                    {item.level}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Recommendations */}
          <Card className="p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-400" />
              Recommandations Adaptatives
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-medium text-sm">Suggestion d'Amélioration</p>
                <p className="text-gray-300 text-xs">Elaborez davantage sur les solutions concrètes</p>
              </div>
              
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-medium text-sm">Point Fort Identifié</p>
                <p className="text-gray-300 text-xs">Excellent usage de l'empathie cognitive</p>
              </div>
              
              <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <p className="text-cyan-400 font-medium text-sm">Adaptation IA</p>
                <p className="text-gray-300 text-xs">Niveau de difficulté augmenté pour le prochain scénario</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800 text-white">
      {/* Navigation Header */}
      <nav className="bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Corp1o1</h1>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-gray-400">IA Évaluation Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="purple" className="hidden md:flex">
              <Brain className="h-3 w-3 mr-1" />
              Mode Évaluation Avancée
            </Badge>
            <Button variant="outline" size="sm">
              Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {currentPhase === 'selection' && renderAssessmentSelection()}
          {currentPhase === 'setup' && renderAssessmentSetup()}
          {currentPhase === 'assessment' && renderAssessmentInterface()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdvancedAssessmentInterface;