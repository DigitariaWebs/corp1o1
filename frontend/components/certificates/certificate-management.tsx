"use client"

import React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Award,
  Download,
  Share2,
  QrCode,
  Shield,
  Sparkles,
  TrendingUp,
  CheckCircle,
  Star,
  Globe,
  BookOpen,
  Zap,
  MessageSquare,
  Heart,
  Users,
  Target,
  AlertCircle,
} from "lucide-react"
import Image from "next/image"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/contexts/auth-context"

interface Certificate {
  id: string
  certificateId: string
  userName: string
  dateOfIssue: string
  status: string
  pdfPath?: string
  // Legacy fields for backward compatibility
  title?: string
  type?: string
  category?: string
  level?: string
  issueDate?: string
  validUntil?: string
  isValid?: boolean
  isExpired?: boolean
  finalScore?: number
  skillsVerified?: number
  assets?: {
    pdf?: string
    image?: string
    thumbnail?: string
  }
  verification?: {
    verificationCode: string
    verificationUrl: string
  }
}

export function CertificateManagement() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  // Load certificates from API
  useEffect(() => {
    loadCertificates()
  }, [])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // Fetch user certificates from backend (public route)
      try {
        const certificatesResponse = await fetch(`${API_BASE_URL}/api/certificates?limit=50`, { headers })
        if (certificatesResponse.ok) {
          const certificatesData = await certificatesResponse.json()
          const certs = certificatesData.data?.certificates || []
          setCertificates(certs)
          if (certs.length > 0) {
            setSelectedCertificate(certs[0])
          }
        } else {
          // Use empty array if API fails
          console.log('Certificates API not available, using empty state')
          setCertificates([])
        }
      } catch (fetchError) {
        console.log('Error fetching certificates, using empty state:', fetchError)
        setCertificates([])
      }

    } catch (err) {
      console.error('Error loading certificates:', err)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load certificates'
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to the server. Please check your connection.'
        } else if (err.message.includes('401')) {
          errorMessage = 'Authentication error. Please sign in again.'
        } else if (err.message.includes('403')) {
          errorMessage = 'Access denied.'
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error. Please try again in a few moments.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCertificate = async () => {
    try {
      setGenerating(true)
      setError(null)

      // Get user name from auth context or use default
      const userName = user?.name || user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user?.email?.split('@')[0] || 'User'

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      const response = await fetch(`${API_BASE_URL}/api/certificates/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userName })
      })

      if (response.ok) {
        const data = await response.json()
        // Reload certificates to show the new one
        await loadCertificates()
        // Show success message (you can add a toast notification here)
        console.log('Certificate generated successfully!')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to generate certificate')
      }
    } catch (err) {
      console.error('Error generating certificate:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate certificate')
    } finally {
      setGenerating(false)
    }
  }

  const rarityColors = {
    common: "from-gray-500 to-gray-600",
    rare: "from-blue-500 to-blue-600",
    epic: "from-purple-500 to-purple-600",
    legendary: "from-amber-500 to-orange-600",
  }

  const typeIcons = {
    diploma: Award,
    certificate: Shield,
    award: Star,
    nft: Sparkles,
    blockchain: Zap,
  }

  const levelColors = {
    beginner: "bg-green-500/20 text-green-400",
    intermediate: "bg-blue-500/20 text-blue-400",
    advanced: "bg-purple-500/20 text-purple-400",
    expert: "bg-amber-500/20 text-amber-400",
  }

  const domainIcons = {
    "Communication & Leadership": MessageSquare,
    "Innovation & Créativité": Sparkles,
    "Leadership & Management": Users,
    "Intelligence Émotionnelle": Heart,
    "Stratégie & Analyse": TrendingUp,
  }

  const handleShare = async (certificate: Certificate) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      }

      // Share certificate (this would track sharing analytics)
      await fetch(`/api/certificates/${certificate.id}/share`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          platform: 'other',
          message: `Check out my ${certificate.title} certificate!`
        })
      })

      // Copy verification URL to clipboard
      await navigator.clipboard.writeText(certificate.verification.verificationUrl)
      // TODO: Show toast notification
      console.log('Certificate verification link copied to clipboard!')
    } catch (err) {
      console.error('Error sharing certificate:', err)
    }
  }

  const handleDownload = async (certificate: Certificate, format: 'pdf' | 'png' | 'jpg' = 'pdf') => {
    try {
      const headers: HeadersInit = {}

      const response = await fetch(`${API_BASE_URL}/api/certificates/${certificate.id}/download?format=${format}`, {
        headers
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const fileName = certificate.title || `certificate-${certificate.certificateId}`
        a.download = `${fileName}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        console.log(`Certificate downloaded as ${format}`)
      } else {
        throw new Error('Download failed')
      }
    } catch (err) {
      console.error('Error downloading certificate:', err)
      // Fallback: try to open the PDF URL directly if available
      if (certificate.pdfPath) {
        window.open(`${API_BASE_URL}${certificate.pdfPath}`, '_blank')
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <Shield className="h-8 w-8 text-cyan-400 animate-spin mr-3" />
          <span className="text-white text-lg">Loading certificates...</span>
        </div>
      </div>
    )
  }

  if (error) {
    const isNoCertificatesError = error.includes('haven\'t earned any certificates') || 
                                  error.includes('certificates') ||
                                  error.includes('complete assessments') ||
                                  error.includes('403')

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Certificates</h2>
          <div className={`${isNoCertificatesError ? 'bg-blue-500/20 border-blue-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-lg p-8 max-w-3xl mx-auto`}>
            {isNoCertificatesError ? (
              <Award className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            ) : (
              <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            )}
            
            <h3 className={`text-2xl font-semibold mb-4 ${isNoCertificatesError ? 'text-blue-300' : 'text-red-300'}`}>
              {isNoCertificatesError ? 'Start Earning Certificates' : 'Error Loading Certificates'}
            </h3>
            
            <p className={`text-lg mb-8 ${isNoCertificatesError ? 'text-blue-200' : 'text-red-400'}`}>
              {isNoCertificatesError ? 
                'You haven\'t earned any certificates yet. Complete skill assessments and learning paths to earn verified certificates that showcase your expertise.' :
                error
              }
            </p>
            
            <div className="space-y-4">
              {!isNoCertificatesError && (
                <Button onClick={loadCertificates} className="bg-red-500 hover:bg-red-600 px-8 py-3">
                  <Shield className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => window.location.href = '/assessments'} 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-8 py-3"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {isNoCertificatesError ? 'Take Skill Assessments' : 'Start with Assessments'}
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/learning'} 
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 px-8 py-3"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Explore Learning Paths
                </Button>
              </div>
              
              {isNoCertificatesError && (
                <div className="mt-8 p-6 bg-slate-700/30 rounded-lg">
                  <h4 className="text-white font-medium mb-3">How to Earn Certificates:</h4>
                  <div className="text-left text-gray-300 space-y-2">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                      <span>Complete skill assessments with passing scores</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
                      <span>Finish learning paths and demonstrate mastery</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</div>
                      <span>Receive verified, downloadable certificates</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check if user has no certificates (successful load but empty)
  if (!loading && !error && certificates.length === 0) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Certificates</h2>
            <p className="text-gray-300 text-lg">Showcase your verified skills and achievements</p>
          </div>
          <Button
            onClick={handleGenerateCertificate}
            disabled={generating}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3"
          >
            {generating ? (
              <>
                <Shield className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Certificate
              </>
            )}
          </Button>
        </motion.div>

        {/* Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center py-16"
        >
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg p-12 max-w-4xl mx-auto">
            <Award className="h-20 w-20 text-cyan-400 mx-auto mb-6" />
            <h3 className="text-3xl font-semibold text-white mb-4">Start Building Your Certificate Portfolio</h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg">
              You haven't earned any certificates yet. Complete skill assessments and learning paths to earn verified, 
              downloadable certificates that demonstrate your professional expertise.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                onClick={handleGenerateCertificate}
                disabled={generating}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 text-lg"
              >
                {generating ? (
                  <>
                    <Shield className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate My Certificate
                  </>
                )}
              </Button>
              <Button 
                onClick={() => window.location.href = '/assessments'} 
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 px-8 py-4 text-lg"
              >
                <Target className="h-5 w-5 mr-2" />
                Take Skill Assessments
              </Button>
              <Button 
                onClick={() => window.location.href = '/learning'} 
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 px-8 py-4 text-lg"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Explore Learning Paths
              </Button>
            </div>

            {/* Certificate Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                <Shield className="h-8 w-8 text-cyan-400 mb-3" />
                <h4 className="text-white font-semibold mb-2">Verified Skills</h4>
                <p className="text-gray-300 text-sm">AI-analyzed certificates that prove your actual competencies</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                <Users className="h-8 w-8 text-purple-400 mb-3" />
                <h4 className="text-white font-semibold mb-2">Share & Network</h4>
                <p className="text-gray-300 text-sm">Share certificates on LinkedIn and professional networks</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
                <TrendingUp className="h-8 w-8 text-amber-400 mb-3" />
                <h4 className="text-white font-semibold mb-2">Career Growth</h4>
                <p className="text-gray-300 text-sm">Demonstrate expertise to employers and advance your career</p>
              </div>
            </div>

            <p className="text-sm text-gray-400 mt-8">
              Complete assessments → Finish learning paths → Earn verified certificates
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">{t("certificates.title")}</h2>
          <p className="text-gray-300 text-lg">{t("certificates.subtitle")}</p>
        </div>
        <Button
          onClick={handleGenerateCertificate}
          disabled={generating}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3"
        >
          {generating ? (
            <>
              <Shield className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Certificate
            </>
          )}
        </Button>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {[
          { label: t("certificates.certificates_obtained"), value: "12", icon: Award, color: "from-cyan-500 to-blue-600" },
          { label: t("certificates.nfts_collected"), value: "3", icon: Sparkles, color: "from-purple-500 to-pink-600" },
          { label: t("skills.average_level"), value: "Expert", icon: TrendingUp, color: "from-amber-500 to-orange-600" },
          { label: t("certificates.verifications"), value: "100%", icon: Shield, color: "from-green-500 to-teal-600" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Certificate Gallery */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">{t("certificates.certificate_gallery")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certificates.map((certificate, index) => (
                    <motion.div
                      key={certificate.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      onClick={() => setSelectedCertificate(certificate)}
                      className="cursor-pointer group"
                    >
                      <Card
                        className={`overflow-hidden transition-all duration-300 hover:scale-105 ${
                          selectedCertificate?.id === certificate.id
                            ? "ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20"
                            : "hover:shadow-lg"
                        }`}
                      >
                        <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 p-6 h-48 flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-white font-semibold text-lg mb-2">
                                {certificate.title || 'Certificate of Completion'}
                              </h3>
                              <p className="text-gray-300 text-sm mb-1">{certificate.userName}</p>
                              <p className="text-gray-400 text-xs">
                                {new Date(certificate.dateOfIssue || certificate.issueDate || '').toLocaleDateString()}
                              </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                              {certificate.certificateId}
                            </Badge>
                            <Badge className={certificate.status === 'issued' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                              {certificate.status}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Certificate Details */}
        <div>
          <AnimatePresence mode="wait">
            {selectedCertificate && (
              <motion.div
                key={selectedCertificate.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                  <CardHeader>
                    <CardTitle className="text-white text-xl flex items-center">
                      <Award className="h-6 w-6 mr-3" />
                      {selectedCertificate.title || 'Certificate of Completion'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Certificate Preview */}
                    <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 p-8 rounded-lg border border-slate-600">
                      <div className="text-center">
                        <Award className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
                        <h3 className="text-white font-bold text-xl mb-2">
                          {selectedCertificate.title || 'Certificate of Completion'}
                        </h3>
                        <p className="text-gray-300 text-lg mb-4">{selectedCertificate.userName}</p>
                        <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                          <span>ID: {selectedCertificate.certificateId}</span>
                          <span>•</span>
                          <span>{new Date(selectedCertificate.dateOfIssue || selectedCertificate.issueDate || '').toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Certificate Details */}
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Certificate ID</span>
                        <span className="text-white font-medium font-mono text-sm">{selectedCertificate.certificateId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Recipient</span>
                        <span className="text-white font-medium">{selectedCertificate.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t("certificates.issue_date") || "Issue Date"}</span>
                        <span className="text-white font-medium">
                          {new Date(selectedCertificate.dateOfIssue || selectedCertificate.issueDate || '').toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <Badge className={selectedCertificate.status === 'issued' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                          {selectedCertificate.status}
                        </Badge>
                      </div>
                    </div>


                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleDownload(selectedCertificate)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t("certificates.download")}
                      </Button>
                      <Button
                        onClick={() => handleShare(selectedCertificate)}
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        {t("certificates.share")}
                      </Button>
                      <Button
                        onClick={() => setShowVerification(!showVerification)}
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        {t("certificates.qr_code")}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        {t("certificates.verify")}
                      </Button>
                    </div>

                    {/* QR Code Verification */}
                    <AnimatePresence>
                      {showVerification && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 rounded-lg bg-slate-800/50 border border-slate-600/30 text-center"
                        >
                          <div className="w-32 h-32 bg-white rounded-lg mx-auto mb-3 flex items-center justify-center">
                            <QrCode className="h-16 w-16 text-slate-900" />
                          </div>
                          <p className="text-gray-300 text-sm">
                            {t("certificates.scan_qr")}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
