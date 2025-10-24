// app/api/ai-chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: "",
})

// Anthropic client setup (if you want to add Claude support)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Rate limiting map (in production, use Redis or similar)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

// Helper function to check rate limits
function checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimit.get(identifier)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (userLimit.count >= limit) {
    return false
  }
  
  userLimit.count++
  return true
}

// Enhanced prompt builder for learning contexts
function buildEnhancedPrompt(
  provider: string,
  personality: string,
  context: any,
  messageAnalysis: any
): string {
  const basePrompt = `You are an advanced AI assistant that always provides long, deeply detailed, and well-structured answers.

When responding, always:

Give thorough explanations with clear reasoning.

Include examples, comparisons, and real-world context where helpful.

Use organized formatting (headings, bullet points, numbered steps) for readability.

Expand on implications, pros and cons, and related concepts when relevant.

Avoid one-sentence or overly brief answers.

When including code in your responses:
- ALWAYS wrap code snippets in code blocks using triple backticks (\`\`\`)
- Specify the programming language after the opening backticks (e.g., \`\`\`javascript, \`\`\`python, \`\`\`typescript)
- Optionally add a filename after a colon (e.g., \`\`\`javascript:app.js)
- Format: \`\`\`language:filename (optional)
- Use inline code with single backticks for short code references (\`variable\`)
- Always format code properly for better readability

Your goal is to make every response educational, comprehensive, and satisfying, even for complex or open-ended questions.

CORE IDENTITY & STYLE:
- You are an expert learning companion with deep knowledge of educational psychology
- Your responses should be encouraging, insightful, and highly personalized
- Use specific data points from the user's learning journey to provide context
- Maintain a conversational yet professional tone
- Always provide actionable advice and next steps

CURRENT LEARNING CONTEXT:
${context.currentModule ? `- Active Module: "${context.currentModule}"` : '- No active module'}
- Overall Progress: ${context.progress || 0}%
- Learning Style: ${context.learningStyle || 'Unknown'}
- Session Duration: ${context.sessionDuration || 0} minutes
- Current Focus Score: ${context.focusScore || 'Unknown'}%
- Learning Streak: ${context.currentStreak || 0} days
- Total Learning Hours: ${context.totalHours || 0}
- Average Performance: ${context.averageScore || 'Unknown'}%

STRENGTHS & AREAS FOR IMPROVEMENT:
- Strong Areas: ${context.strongAreas?.join(', ') || 'None identified yet'}
- Weak Areas: ${context.weakAreas?.join(', ') || 'None identified yet'}
- Struggling Topics: ${context.strugglingTopics?.join(', ') || 'None identified'}
- Completed Modules: ${context.completedModules?.join(', ') || 'None completed yet'}

USER MESSAGE ANALYSIS:
- Intent: ${messageAnalysis.intent || 'general'}
- Emotional State: ${messageAnalysis.emotion || 'neutral'}
- Urgency: ${messageAnalysis.urgency || 'low'}
- Complexity: ${messageAnalysis.complexity || 'simple'}
- Topics Mentioned: ${messageAnalysis.topics?.join(', ') || 'none'}

ADVANCED CAPABILITIES TO UTILIZE:

1. PERSONALIZED LEARNING ANALYSIS:
   - Reference specific progress data and learning patterns
   - Identify knowledge gaps using the context provided
   - Suggest learning strategies based on their documented style
   - Predict optimal next steps based on their current performance

2. CONTEXTUAL PROBLEM SOLVING:
   - Break down complex concepts into digestible parts
   - Provide examples relevant to their learning level
   - Connect new information to their existing knowledge base
   - Offer multiple approaches for different learning styles

3. MOTIVATIONAL PSYCHOLOGY:
   - Use their specific achievements and progress to encourage
   - Address their emotional state appropriately
   - Set realistic micro-goals based on their current performance
   - Celebrate milestones with context-aware recognition

4. ADAPTIVE GUIDANCE:
   - Adjust explanation complexity based on their demonstrated understanding
   - Suggest study timing based on their focus patterns
   - Recommend resources that match their learning preferences
   - Provide difficulty adjustments based on their struggle areas

5. PREDICTIVE INSIGHTS:
   - Estimate completion times based on their learning velocity
   - Identify potential roadblocks from their struggle patterns
   - Suggest preventive measures for common learning obstacles
   - Forecast skill development based on their current trajectory

RESPONSE GUIDELINES:
- Provide comprehensive, detailed responses (minimum 300-500 words)
- Start by acknowledging their current situation/emotional state
- Include multiple specific references to their learning data
- Provide 3-5 concrete, actionable recommendations with detailed explanations
- Use organized formatting with headings, bullet points, and numbered steps
- Include examples, comparisons, and real-world context
- Expand on implications, pros and cons, and related concepts
- End with personalized encouragement and next steps
- Ask clarifying questions when more context would help

RESPONSE STRUCTURE:
1. Acknowledge their current state/question with context
2. Provide comprehensive main response with detailed explanations
3. Include multiple actionable recommendations with step-by-step guidance
4. Add examples, comparisons, and real-world applications
5. Discuss implications, pros and cons, and related concepts
6. End with personalized encouragement and clear next steps

Remember: You have access to detailed learning analytics. Use this data to provide responses that feel like they come from someone who truly understands their unique learning journey and current challenges. Always aim for educational, comprehensive, and satisfying responses.`

  return basePrompt
}

// OpenAI API call with enhanced prompting
async function callOpenAI(messages: any[], model: string, temperature: number, context: any) {
  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: 4000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      top_p: 0.9,
    })

    return {
      response: completion.choices[0].message.content,
      usage: completion.usage,
      model: completion.model,
      provider: 'openai'
    }
  } catch (error: any) {
    console.error('OpenAI API Error:', error)
    throw new Error(`OpenAI API Error: ${error.message}`)
  }
}

// Anthropic API call (Claude)
async function callAnthropic(messages: any[], model: string, temperature: number, context: any) {
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
        model: model,
        max_tokens: 4000,
        temperature: temperature,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content || ''
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API Error: ${response.status}`)
    }

    const data = await response.json()
    return {
      response: data.content[0].text,
      usage: data.usage,
      model: data.model,
      provider: 'anthropic'
    }
  } catch (error: any) {
    console.error('Anthropic API Error:', error)
    throw new Error(`Anthropic API Error: ${error.message}`)
  }
}

// Gemini API call
async function callGemini(messages: any[], model: string, temperature: number, context: any) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured')
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: 4000,
          topP: 0.9,
          topK: 40
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`)
    }

    const data = await response.json()
    return {
      response: data.candidates[0].content.parts[0].text,
      usage: { total_tokens: data.usageMetadata?.totalTokenCount || 0 },
      model: model,
      provider: 'gemini'
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error)
    throw new Error(`Gemini API Error: ${error.message}`)
  }
}

// Enhanced fallback responses with context awareness
function generateEnhancedFallback(messages: any[], context: any): string {
  const userMessage = messages[messages.length - 1]?.content || ''
  const lowerMessage = userMessage.toLowerCase()
  
  // Analyze user intent
  let intent = 'general'
  if (lowerMessage.includes('help') || lowerMessage.includes('stuck')) intent = 'help'
  if (lowerMessage.includes('motivat') || lowerMessage.includes('encourage')) intent = 'motivation'
  if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing')) intent = 'progress'
  if (lowerMessage.includes('explain') || lowerMessage.includes('understand')) intent = 'explanation'

  // Context-aware responses
  const contextualResponses = {
    help: [
    `I understand you need help${context.currentModule ? ` with "${context.currentModule}"` : ''}. Based on your ${context.learningStyle || 'learning'} style and ${context.progress || 0}% progress, let me break this down step by step. ${context.strongAreas?.length ? `You've shown strength in ${context.strongAreas[0]}, so we can build on that foundation.` : ''}`,
    `Don't worry, I'm here to help! ${context.focusScore && context.focusScore > 80 ? 'Your focus score is strong at ' + context.focusScore + '%' : "Let's work through this together"}. ${context.currentStreak && context.currentStreak > 3 ? `Your ${context.currentStreak}-day streak shows great consistency!` : ''}`
    ],
    motivation: [
    `You're doing amazing! ${context.progress ? `At ${context.progress}% completion, you're making real progress.` : ''} ${context.currentStreak ? `Your ${context.currentStreak}-day learning streak is impressive!` : ''} ${context.totalHours ? `With ${context.totalHours} hours invested, you're building genuine expertise.` : ''}`,
      `I believe in you! ${context.averageScore && context.averageScore > 80 ? `Your ${context.averageScore}% average score shows you're truly mastering this material.` : ''} ${context.completedModules?.length ? `You've completed ${context.completedModules.length} modules - that's real achievement!` : ''}`
    ],
    progress: [
      `Your progress looks excellent! ${context.progress ? `You're at ${context.progress}% completion` : ''} ${context.focusScore ? `with a ${context.focusScore}% focus score` : ''}. ${context.learningStyle ? `Your ${context.learningStyle} learning approach is working well.` : ''} ${context.strongAreas?.length ? `You're particularly strong in ${context.strongAreas.slice(0, 2).join(' and ')}.` : ''}`,
      `You're on a great trajectory! ${context.totalHours ? `${context.totalHours} hours of learning time invested` : ''} ${context.currentStreak ? `and a ${context.currentStreak}-day streak` : ''} shows real commitment. ${context.strugglingTopics?.length ? `Focus on ${context.strugglingTopics[0]} for your next breakthrough.` : ''}`
    ],
    explanation: [
      `Let me explain this clearly for you. ${context.learningStyle === 'visual' ? "I'll use examples and visual concepts since you learn best that way." : context.learningStyle === 'auditory' ? "I'll explain this step by step since you process information well through listening." : "I'll break this down into manageable pieces."} ${context.currentModule ? `This builds on what you've learned in ${context.currentModule}.` : ''}`,
      `Great question! ${context.averageScore && context.averageScore > 85 ? 'Your high comprehension scores show you grasp concepts well.' : ''} ${context.strongAreas?.length ? `Your strength in ${context.strongAreas[0]} will help you understand this concept.` : ''}`
    ],
    general: [
      `Thanks for reaching out! ${context.currentModule ? `I see you're working on "${context.currentModule}".` : ''} ${context.progress ? `Your ${context.progress}% progress shows great momentum.` : ''} ${context.learningStyle ? `Your ${context.learningStyle} learning style means I can tailor my explanations perfectly for you.` : ''} How can I help you today?`,
      `I'm here to support your learning journey! ${context.focusScore && context.focusScore > 80 ? `Your ${context.focusScore}% focus score shows you're in great learning mode.` : ''} ${context.currentStreak ? `Your ${context.currentStreak}-day streak is impressive!` : ''} What would you like to explore?`
    ]
  }

  const responses = contextualResponses[intent as keyof typeof contextualResponses] || contextualResponses.general
  const selectedResponse = responses[Math.floor(Math.random() * responses.length)]
  
  return selectedResponse
}

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    // Check rate limit
    if (!checkRateLimit(clientIP, 100, 60000)) { // 100 requests per minute
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { 
      provider = 'openai', 
      model = 'gpt-4o', 
      messages = [], 
      temperature = 0.7,
      context = {},
      messageAnalysis = {}
    } = body

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and cannot be empty' },
        { status: 400 }
      )
    }

    // Validate provider
    if (!['openai', 'anthropic', 'gemini'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be openai, anthropic, or gemini' },
        { status: 400 }
      )
    }

    // Build enhanced system prompt
    const lastMessage = messages[messages.length - 1]
    const personality = messages.find(m => m.role === 'system')?.content?.split(',')[0] || 'ARIA'
    
    const enhancedSystemPrompt = buildEnhancedPrompt(
      provider, 
      personality, 
      context, 
      messageAnalysis
    )

    // Replace or add system message
    const enhancedMessages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...messages.filter(m => m.role !== 'system')
    ]

    let result

    // Call appropriate AI provider
    try {
      switch (provider) {
        case 'openai':
          result = await callOpenAI(enhancedMessages, model, temperature, context)
          break
        case 'anthropic':
          result = await callAnthropic(enhancedMessages, model, temperature, context)
          break
        case 'gemini':
          result = await callGemini(enhancedMessages, model, temperature, context)
          break
        default:
          throw new Error('Invalid provider')
      }
    } catch (providerError) {
      console.error(`${provider} provider failed:`, providerError)
      
      // Fallback to enhanced simulation
      const fallbackResponse = generateEnhancedFallback(messages, context)
      
      result = {
        response: fallbackResponse,
        usage: { total_tokens: 0 },
        model: 'fallback',
        provider: 'simulation',
        fallback: true,
        originalError: typeof providerError === 'object' && providerError !== null && 'message' in providerError ? (providerError as { message: string }).message : String(providerError)
      }
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      response: result.response,
      metadata: {
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        fallback: 'fallback' in result ? result.fallback : false,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('API Error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET handler for API status
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'online',
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY
    },
    timestamp: new Date().toISOString()
  })
} 