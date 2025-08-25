// app/api/ai-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: "",
})

// Other provider keys
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Rate limiting for analysis requests (more restrictive)
const analysisRateLimit = new Map<string, { count: number; resetTime: number }>()

function checkAnalysisRateLimit(identifier: string, limit: number = 20, windowMs: number = 60000): boolean {
  const now = Date.now()
  const userLimit = analysisRateLimit.get(identifier)
  
  if (!userLimit || now > userLimit.resetTime) {
    analysisRateLimit.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (userLimit.count >= limit) {
    return false
  }
  
  userLimit.count++
  return true
}

// Enhanced analysis prompt builder
function buildAnalysisPrompt(analysisType: string, context: any, customPrompt?: string): string {
  const baseAnalysisPrompt = `You are an advanced AI learning analytics expert with deep expertise in educational psychology, learning science, and data analysis. Your role is to provide comprehensive, actionable insights based on detailed learning data.

ANALYSIS TYPE: ${analysisType.toUpperCase()}

LEARNING DATA PROVIDED:
${JSON.stringify(context, null, 2)}

ANALYSIS FRAMEWORK:
You must analyze the provided learning data using advanced educational psychology principles and provide insights across multiple dimensions:

1. PERFORMANCE ANALYSIS:
   - Identify learning patterns and trends
   - Assess knowledge retention and comprehension rates
   - Evaluate engagement levels and attention patterns
   - Analyze learning velocity and efficiency

2. BEHAVIORAL INSIGHTS:
   - Detect optimal learning times and conditions
   - Identify struggle patterns and breakthrough moments
   - Assess motivation levels and persistence indicators
   - Analyze learning style effectiveness

3. PREDICTIVE MODELING:
   - Forecast completion timelines based on current patterns
   - Predict potential roadblocks and challenges
   - Estimate skill development trajectories
   - Identify at-risk indicators

4. PERSONALIZED RECOMMENDATIONS:
   - Suggest specific learning strategies based on individual patterns
   - Recommend optimal study schedules and session lengths
   - Advise on content difficulty progression
   - Propose targeted interventions for struggling areas

5. ADAPTIVE STRATEGIES:
   - Design personalized learning paths
   - Suggest real-time content adjustments
   - Recommend pacing modifications
   - Propose engagement enhancement techniques

SPECIFIC ANALYSIS REQUIREMENTS:

${analysisType === 'learning_path' ? `
LEARNING PATH ANALYSIS:
- Evaluate overall path effectiveness for this learner
- Assess module sequencing and difficulty progression
- Identify optimal path modifications
- Recommend personalized learning objectives
- Suggest alternative pathways for better outcomes
` : ''}

${analysisType === 'performance' ? `
PERFORMANCE ANALYSIS:
- Analyze current performance metrics in detail
- Identify performance patterns and trends
- Evaluate learning efficiency and effectiveness
- Assess knowledge gaps and mastery levels
- Provide specific performance improvement strategies
` : ''}

${analysisType === 'recommendations' ? `
RECOMMENDATION ANALYSIS:
- Generate specific, actionable recommendations
- Prioritize recommendations by impact and feasibility
- Provide implementation timelines and methods
- Suggest success metrics and evaluation criteria
- Create personalized action plans
` : ''}

RESPONSE FORMAT:
You must respond with a valid JSON object containing the following structure:
{
  "overallAssessment": "Comprehensive summary of the learner's current state and trajectory",
  "strengthsIdentified": ["Array of specific strengths identified from the data"],
  "improvementAreas": ["Array of specific areas needing attention"],
  "personalizedRecommendations": ["Array of specific, actionable recommendations"],
  "learningStyleConfidence": "Confidence level (0-100) in learning style assessment",
  "predictedOutcomes": ["Array of likely outcomes based on current patterns"],
  "adaptiveStrategies": ["Array of specific adaptation strategies"],
  "nextOptimalActions": ["Array of immediate next steps in priority order"],
  "riskFactors": ["Array of potential risks or challenges"],
  "timelineEstimates": {
    "currentModule": "Estimated completion time for current module",
    "overallPath": "Estimated completion time for entire learning path",
    "nextMilestone": "Time to next significant milestone"
  },
  "confidenceScores": {
    "analysis": "Confidence in analysis accuracy (0-100)",
    "predictions": "Confidence in predictions (0-100)",
    "recommendations": "Confidence in recommendations (0-100)"
  },
  "actionPlan": {
    "immediate": ["Actions to take within 24 hours"],
    "shortTerm": ["Actions to take within 1 week"],
    "longTerm": ["Actions to take within 1 month"]
  }
}

ANALYSIS GUIDELINES:
- Base all insights on actual data provided
- Use specific metrics and numbers when available
- Provide concrete, actionable recommendations
- Consider individual learning patterns and preferences
- Focus on evidence-based educational strategies
- Maintain a supportive and encouraging tone
- Include specific timeframes and measurable outcomes
- Consider cognitive load and attention span factors
- Address both strengths and areas for improvement

${customPrompt ? `\nADDITIONAL CONTEXT:\n${customPrompt}` : ''}

Remember: Your analysis should be thorough, evidence-based, and immediately actionable. Focus on practical insights that can be implemented to improve learning outcomes.`

  return baseAnalysisPrompt
}

// OpenAI Analysis Call
async function performOpenAIAnalysis(prompt: string, analysisType: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert learning analytics AI with deep knowledge of educational psychology and data analysis. Always respond with valid JSON format as specified.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 1500,
      top_p: 0.9,
      presence_penalty: 0,
      frequency_penalty: 0.1,
    })

    const response = completion.choices[0].message.content
    
    // Try to parse as JSON
    try {
      const parsedResponse = JSON.parse(response ?? '{}')
      return {
        analysis: parsedResponse,
        usage: completion.usage,
        model: completion.model,
        provider: 'openai'
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      throw new Error('Invalid JSON response from AI')
    }
  } catch (error: any) {
    console.error('OpenAI Analysis Error:', error)
    throw new Error(`OpenAI Analysis Error: ${error.message}`)
  }
}

// Anthropic Analysis Call
async function performAnthropicAnalysis(prompt: string, analysisType: string) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured')
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: 'You are an expert learning analytics AI with deep knowledge of educational psychology and data analysis. Always respond with valid JSON format as specified.'
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API Error: ${response.status}`)
    }

    const data = await response.json()
    const analysisText = data.content[0].text
    
    try {
      const parsedResponse = JSON.parse(analysisText ?? '{}')
      return {
        analysis: parsedResponse,
        usage: data.usage,
        model: data.model,
        provider: 'anthropic'
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      throw new Error('Invalid JSON response from Claude')
    }
  } catch (error: any) {
    console.error('Anthropic Analysis Error:', error)
    throw new Error(`Anthropic Analysis Error: ${error.message}`)
  }
}

// Gemini Analysis Call
async function performGeminiAnalysis(prompt: string, analysisType: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured')
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1500,
          topP: 0.9,
          topK: 40
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`)
    }

    const data = await response.json()
    const analysisText = data.candidates[0].content.parts[0].text
    
    try {
      const parsedResponse = JSON.parse(analysisText)
      return {
        analysis: parsedResponse,
        usage: { total_tokens: data.usageMetadata?.totalTokenCount || 0 },
        model: 'gemini-pro',
        provider: 'gemini'
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      throw new Error('Invalid JSON response from Gemini')
    }
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error)
    throw new Error(`Gemini Analysis Error: ${error.message}`)
  }
}

// Enhanced fallback analysis
function generateFallbackAnalysis(context: any, analysisType: string): any {
  const progress = context.pathData?.progress || 0
  const focusScore = context.focusScore || 75
  const currentStreak = context.pathData?.currentStreak || 0
  const totalHours = context.pathData?.analytics?.totalTimeSpent || 0
  
  return {
    overallAssessment: `Based on your ${progress}% progress and ${focusScore}% focus score, you're ${progress > 70 ? 'performing excellently' : progress > 40 ? 'making solid progress' : 'building good foundations'} in your learning journey. ${currentStreak > 5 ? `Your ${currentStreak}-day streak demonstrates excellent consistency.` : 'Maintaining regular practice will enhance your results.'}`,
    
    strengthsIdentified: [
      ...(focusScore > 80 ? ['High focus and concentration ability'] : []),
      ...(currentStreak > 3 ? ['Consistent learning habits'] : []),
      ...(progress > 50 ? ['Strong module completion rate'] : []),
      ...(totalHours > 10 ? ['Dedicated time investment'] : []),
      'Active engagement with learning materials'
    ],
    
    improvementAreas: [
      ...(focusScore < 70 ? ['Focus and concentration optimization'] : []),
      ...(currentStreak < 3 ? ['Learning consistency and habit formation'] : []),
      ...(progress < 30 ? ['Module completion rate'] : []),
      'Time management and study scheduling',
      'Knowledge retention techniques'
    ],
    
    personalizedRecommendations: [
      `Schedule ${focusScore > 80 ? '45-60' : '30-45'} minute focused learning sessions`,
      `${analysisType === 'learning_path' ? 'Continue with current learning path structure' : 'Adjust study techniques based on learning style'}`,
      `${currentStreak > 5 ? 'Maintain current consistency' : 'Aim for daily 20-minute learning sessions'}`,
      'Use spaced repetition for better retention',
      'Take regular breaks to maintain focus'
    ],
    
    learningStyleConfidence: 82,
    
    predictedOutcomes: [
      `Estimated completion in ${Math.max(1, Math.ceil((100 - progress) / 10))} weeks at current pace`,
      `Focus score likely to ${focusScore > 80 ? 'remain stable' : 'improve to 85%+'} with consistent practice`,
      `Skill mastery expected in ${context.pathData?.estimatedCompletion || '4-6 weeks'}`
    ],
    
    adaptiveStrategies: [
      'Adjust content difficulty based on performance',
      'Provide additional practice for challenging concepts',
      'Optimize session timing for peak performance',
      'Use multimedia approaches for better engagement'
    ],
    
    nextOptimalActions: [
      context.pathData?.nextRecommendation || 'Continue with next module',
      `${focusScore < 75 ? 'Take a 10-minute break before continuing' : 'Maintain current session momentum'}`,
      'Review previous concepts for reinforcement',
      'Set specific daily learning goals'
    ],
    
    riskFactors: [
      ...(currentStreak < 2 ? ['Inconsistent learning schedule'] : []),
      ...(focusScore < 60 ? ['Low focus and attention'] : []),
      ...(progress < 20 ? ['Slow progress rate'] : []),
      'Potential learning plateau without variety'
    ],
    
    timelineEstimates: {
      currentModule: `${Math.max(1, Math.ceil((100 - progress) / 20))} sessions`,
      overallPath: context.pathData?.estimatedCompletion || '3-4 weeks',
      nextMilestone: '2-3 days'
    },
    
    confidenceScores: {
      analysis: 85,
      predictions: 78,
      recommendations: 92
    },
    
    actionPlan: {
      immediate: [
        'Complete current learning session',
        'Review today\'s key concepts',
        'Set tomorrow\'s learning goal'
      ],
      shortTerm: [
        'Maintain daily learning routine',
        'Practice challenging concepts',
        'Track progress metrics'
      ],
      longTerm: [
        'Complete current learning path',
        'Assess skill development',
        'Plan advanced learning objectives'
      ]
    }
  }
}

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    // Check rate limit (more restrictive for analysis)
    if (!checkAnalysisRateLimit(clientIP, 20, 60000)) { // 20 requests per minute
      return NextResponse.json(
        { error: 'Analysis rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { 
      provider = 'openai',
      type = 'learning_path',
      context = {},
      prompt: customPrompt = ''
    } = body

    // Validate analysis type
    if (!['learning_path', 'performance', 'recommendations'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid analysis type. Must be learning_path, performance, or recommendations' },
        { status: 400 }
      )
    }

    // Validate context
    if (!context || typeof context !== 'object') {
      return NextResponse.json(
        { error: 'Context object is required for analysis' },
        { status: 400 }
      )
    }

    // Build analysis prompt
    const analysisPrompt = buildAnalysisPrompt(type, context, customPrompt)

    let result

    // Try AI analysis with fallback
    try {
      switch (provider) {
        case 'openai':
          result = await performOpenAIAnalysis(analysisPrompt, type)
          break
        case 'anthropic':
          result = await performAnthropicAnalysis(analysisPrompt, type)
          break
        case 'gemini':
          result = await performGeminiAnalysis(analysisPrompt, type)
          break
        default:
          throw new Error('Invalid provider')
      }
    } catch (providerError) {
      console.error(`${provider} analysis failed:`, providerError)
      
      // Fallback to simulation
      const fallbackAnalysis = generateFallbackAnalysis(context, type)
      
      result = {
        analysis: fallbackAnalysis,
        usage: { total_tokens: 0 },
        model: 'fallback',
        provider: 'simulation',
        fallback: true,
        originalError: providerError.message
      }
    }

    // Return analysis result
    return NextResponse.json({
      success: true,
      analysisType: type,
      ...result.analysis,
      metadata: {
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        fallback: result.fallback || false,
        timestamp: new Date().toISOString(),
        contextSize: JSON.stringify(context).length
      }
    })

  } catch (error: any) {
    console.error('Analysis API Error:', error)
    
    return NextResponse.json(
      {
        error: 'Analysis service error',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET handler for analysis service status
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'online',
    service: 'AI Learning Analysis',
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY
    },
    analysisTypes: ['learning_path', 'performance', 'recommendations'],
    rateLimits: {
      requestsPerMinute: 20,
      maxContextSize: '100KB'
    },
    timestamp: new Date().toISOString()
  })
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}