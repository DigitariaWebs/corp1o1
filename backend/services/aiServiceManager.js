// services/aiServiceManager.js
/**
 * Central AI Service Manager
 * Orchestrates different AI services based on context and optimizes for performance/cost
 */

const { openAIService } = require('./openaiService');
const { AppError } = require('../middleware/errorHandler');

class AIServiceManager {
  constructor() {
    // Model configuration for different use cases
    this.modelConfig = {
      assessment: {
        model: process.env.OPENAI_MODEL_ASSESSMENT || 'gpt-4o',
        temperature: parseFloat(process.env.OPENAI_TEMP_ASSESSMENT) || 0.5,
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS_ASSESSMENT) || 2000,
        purpose: 'Complex assessment and question generation',
      },
      evaluation: {
        model: process.env.OPENAI_MODEL_EVALUATION || 'gpt-4o',
        temperature: 0.2, // Low temperature for consistent grading
        maxTokens: 1000,
        purpose: 'Accurate evaluation and grading',
      },
      conversation: {
        model: process.env.OPENAI_MODEL_CONVERSATION || 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS_CONVERSATION) || 500,
        purpose: 'Quick conversational responses',
      },
      analysis: {
        model: process.env.OPENAI_MODEL_ANALYSIS || 'gpt-4o-mini',
        temperature: 0.4,
        maxTokens: 800,
        purpose: 'Data analysis and insights',
      },
    };

    // AI Personality configurations
    this.personalities = {
      ARIA: {
        name: 'ARIA',
        description: 'Encouraging and supportive assistant',
        temperature: parseFloat(process.env.OPENAI_TEMP_ARIA) || 0.9,
        model: 'gpt-4o-mini', // Fast, conversational
        systemPrompt: `You are ARIA, an encouraging and supportive learning assistant. 
        Your personality is warm, patient, and motivating. You celebrate small wins, 
        provide emotional support, and help learners build confidence. Use positive 
        language, emojis when appropriate, and always find something to praise.`,
        traits: {
          tone: 'warm and encouraging',
          focus: 'motivation and confidence building',
          responseStyle: 'supportive with positive reinforcement',
        },
      },
      SAGE: {
        name: 'SAGE',
        description: 'Analytical and knowledgeable expert',
        temperature: parseFloat(process.env.OPENAI_TEMP_SAGE) || 0.3,
        model: 'gpt-4o', // Complex reasoning needed
        systemPrompt: `You are SAGE, an analytical and knowledgeable learning expert. 
        Your personality is precise, thorough, and intellectually rigorous. You provide 
        detailed explanations, explore concepts deeply, and ensure complete understanding. 
        Use clear, structured responses with examples and logical reasoning.`,
        traits: {
          tone: 'professional and informative',
          focus: 'deep understanding and mastery',
          responseStyle: 'detailed with comprehensive explanations',
        },
      },
      COACH: {
        name: 'COACH',
        description: 'Goal-oriented motivational mentor',
        temperature: parseFloat(process.env.OPENAI_TEMP_COACH) || 0.7,
        model: 'gpt-4o-mini', // Balanced performance
        systemPrompt: `You are COACH, a goal-oriented motivational mentor. 
        Your personality is dynamic, challenging, and results-focused. You push learners 
        to achieve their best, set ambitious goals, and overcome obstacles. Use action-oriented 
        language, provide clear challenges, and track progress toward objectives.`,
        traits: {
          tone: 'motivational and challenging',
          focus: 'achievement and goal completion',
          responseStyle: 'direct with actionable challenges',
        },
      },
    };

    // Cache for responses (simple in-memory cache)
    this.responseCache = new Map();
    this.cacheTimeout = parseInt(process.env.OPENAI_CACHE_TTL) || 300; // 5 minutes default
  }

  /**
   * Get appropriate service configuration based on task type
   */
  getServiceConfig(taskType) {
    const config = this.modelConfig[taskType];
    if (!config) {
      console.warn(`Unknown task type: ${taskType}, using conversation model`);
      return this.modelConfig.conversation;
    }
    return config;
  }

  /**
   * Generate assessment plan with optimized settings
   */
  async generateAssessmentPlan(domain, subdomains, experience, goals, difficulty) {
    const config = this.getServiceConfig('assessment');
    
    const prompt = `Create a personalized learning assessment plan for:
- Domain: ${domain}
- Topics: ${subdomains.length > 0 ? subdomains.join(', ') : 'general ' + domain}
- Experience: ${experience}
- Goals: ${goals}
- Difficulty: ${difficulty}

Generate exactly 3 assessments as a JSON object with this exact structure:
{
  "assessments": [
    {
      "id": "diagnostic",
      "title": "${domain}: Diagnostic Assessment",
      "description": "Evaluate baseline understanding of ${domain} fundamentals",
      "targetSkills": ["core concepts", "basic syntax", "problem solving"],
      "difficulty": "beginner",
      "questionCount": 7,
      "estimatedDurationMinutes": 15,
      "rationale": "Establishes baseline knowledge for personalized learning"
    },
    {
      "id": "skills-focus",
      "title": "${domain}: Practical Skills Assessment",
      "description": "Test hands-on application of ${subdomains[0] || domain} concepts",
      "targetSkills": ["implementation", "best practices", "real-world application"],
      "difficulty": "intermediate",
      "questionCount": 8,
      "estimatedDurationMinutes": 20,
      "rationale": "Measures practical competency and application skills"
    },
    {
      "id": "stretch",
      "title": "${domain}: Advanced Challenge",
      "description": "Complex problems testing deep ${domain} expertise",
      "targetSkills": ["advanced patterns", "optimization", "architecture"],
      "difficulty": "advanced",
      "questionCount": 6,
      "estimatedDurationMinutes": 18,
      "rationale": "Identifies mastery level and growth opportunities"
    }
  ]
}

Customize the skills and descriptions based on the specific domain and topics provided.`;

    try {
      console.log(`🎯 Generating assessment plan using ${config.model}`);
      
      const response = await openAIService.createChatCompletion(
        [
          { 
            role: 'system', 
            content: 'You are an expert educational assessment designer specializing in creating personalized learning assessments. Generate detailed, relevant assessment plans tailored to the learner\'s needs. Return valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        {
          model: config.model,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        },
      );

      // Handle both direct content and nested response formats
      const content = response.content || response.choices?.[0]?.message?.content || '{"assessments":[]}';
      
      // Clean the response - remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Log first 500 chars to see what we're getting
      console.log('📝 Raw AI response:', cleanContent.substring(0, 500));
      
      let parsed;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', parseError.message);
        console.error('Raw content:', cleanContent);
        // Try to extract JSON from the response
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);  
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (secondError) {
            throw new AppError('Invalid JSON from AI service', 500);
          }
        } else {
          throw new AppError('No valid JSON found in AI response', 500);
        }
      }
      
      const assessments = parsed.assessments || parsed.plan || [];
      
      // Validate we got actual assessments
      if (!Array.isArray(assessments) || assessments.length === 0) {
        console.error('⚠️ No assessments in response:', parsed);
        // Generate a basic plan as fallback for now
        return this.generateBasicPlan(domain, subdomains, difficulty);
      }
      
      console.log(`✅ Generated ${assessments.length} assessments:`, assessments.map(a => a.title));
      return assessments;
      
    } catch (error) {
      console.error('❌ Assessment generation failed:', error.message);
      throw new AppError('Failed to generate assessment plan', 500);
    }
  }

  /**
   * Generate questions with appropriate model and settings
   */
  async generateQuestions(title, category, topic, difficulty, count, types) {
    const config = this.getServiceConfig('assessment');
    
    const prompt = `Generate ${count} real, practical assessment questions about ${topic}.

Context:
- Assessment Title: ${title}
- Category: ${category}
- Difficulty Level: ${difficulty}
- Question Types: ${types.join(', ')}

IMPORTANT: Create REAL questions that test actual ${topic} knowledge, not generic placeholders.

For multiple_choice questions, provide this structure:
{
  "id": "q1",
  "type": "multiple_choice",
  "question": "[Specific technical question about ${topic}]",
  "options": ["[Real option A]", "[Real option B]", "[Real option C]", "[Real option D]"],
  "correctAnswer": "[The correct option]",
  "points": 10,
  "difficulty": "${difficulty}",
  "timeLimit": 120,
  "hints": ["[Helpful hint specific to the question]"],
  "explanation": "[Why this answer is correct and what concept it tests]"
}

For text/essay questions:
{
  "id": "q2",
  "type": "text",
  "question": "[Open-ended question about ${topic}]",
  "points": 15,
  "difficulty": "${difficulty}",
  "timeLimit": 180,
  "hints": ["[Guidance for answering]"],
  "explanation": "[What makes a good answer]"
}

Return ONLY a JSON array of ${count} questions. Start with [`;

    try {
      console.log(`📝 Generating ${count} questions for ${topic} using ${config.model}`);
      
      const response = await openAIService.createChatCompletion(
        [
          { 
            role: 'system', 
            content: `You are an expert ${category} educator and assessment designer. Create real, specific questions that test actual ${topic} knowledge and skills. Focus on practical, real-world scenarios and actual technical concepts. Never use placeholder content.`,
          },
          { role: 'user', content: prompt },
        ],
        {
          model: config.model,
          temperature: config.temperature + 0.2, // Slightly higher for variety
          max_tokens: config.maxTokens * 2, // More tokens for detailed questions
        },
      );

      // Handle both direct content and nested response formats
      const content = response.content || response.choices?.[0]?.message?.content || '[]';
      
      // Clean the response
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Extract JSON array
      let questions;
      try {
        // First try direct parse
        questions = JSON.parse(cleanContent);
      } catch (e) {
        // Try to extract array from content
        const arrayMatch = cleanContent.match(/\[[\s\S]*\]/);  
        if (arrayMatch) {
          questions = JSON.parse(arrayMatch[0]);
        } else {
          console.error('Failed to parse questions:', cleanContent.substring(0, 200));
          questions = [];
        }
      }
      
      console.log(`✅ Generated ${questions.length} questions`);
      return questions;
      
    } catch (error) {
      console.error('❌ Question generation failed:', error.message);
      throw new AppError('Failed to generate questions', 500);
    }
  }

  /**
   * Evaluate answer with appropriate model
   */
  async evaluateAnswer(question, userAnswer, rubric) {
    const config = this.getServiceConfig('evaluation');
    
    const prompt = `Evaluate this answer:
Question: ${question}
User Answer: ${userAnswer}
Rubric: ${rubric || 'Standard academic grading'}

Provide: score (0-100), feedback, strengths (array), improvements (array), isCorrect (boolean).
Return as JSON object.`;

    try {
      const response = await openAIService.createChatCompletion(
        [
          { 
            role: 'system', 
            content: 'You are an expert evaluator. Be fair but thorough. Provide constructive feedback.',
          },
          { role: 'user', content: prompt },
        ],
        {
          model: config.model,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          response_format: { type: 'json_object' },
        },
      );

      const evaluation = JSON.parse(response.choices?.[0]?.message?.content || '{}');
      return evaluation;
      
    } catch (error) {
      console.error('❌ Evaluation failed:', error.message);
      throw new AppError('Failed to evaluate answer', 500);
    }
  }

  /**
   * Get AI personality response
   */
  async getPersonalityResponse(personality, userMessage, context = {}) {
    const persona = this.personalities[personality];
    if (!persona) {
      throw new AppError(`Unknown personality: ${personality}`, 400);
    }

    // Check cache first
    const cacheKey = `${personality}:${userMessage}:${JSON.stringify(context)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📋 Using cached response for ${personality}`);
      return cached;
    }

    try {
      console.log(`🤖 ${personality} responding with ${persona.model}`);
      
      // Build context-aware prompt
      const contextPrompt = this.buildContextPrompt(context);
      
      const response = await openAIService.createChatCompletion(
        [
          { role: 'system', content: persona.systemPrompt + contextPrompt },
          { role: 'user', content: userMessage },
        ],
        {
          model: persona.model,
          temperature: persona.temperature,
          max_tokens: 500,
        },
      );

      // Handle both direct content and nested response formats
      const reply = response.content || response.choices?.[0]?.message?.content;
      
      // Cache the response
      this.saveToCache(cacheKey, reply);
      
      return {
        message: reply,
        personality: personality,
        traits: persona.traits,
      };
      
    } catch (error) {
      console.error(`❌ ${personality} response failed:`, error.message);
      throw new AppError(`Failed to get ${personality} response`, 500);
    }
  }

  /**
   * Build context prompt from user data
   */
  buildContextPrompt(context) {
    let contextPrompt = '\n\nContext:';
    
    if (context.userName) {
      contextPrompt += `\nUser Name: ${context.userName}`;
    }
    if (context.currentTopic) {
      contextPrompt += `\nCurrent Topic: ${context.currentTopic}`;
    }
    if (context.performance) {
      contextPrompt += `\nRecent Performance: ${context.performance}`;
    }
    if (context.learningStyle) {
      contextPrompt += `\nLearning Style: ${context.learningStyle}`;
    }
    if (context.goals) {
      contextPrompt += `\nGoals: ${context.goals}`;
    }
    
    return contextPrompt;
  }

  /**
   * Simple cache management
   */
  getFromCache(key) {
    const cached = this.responseCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < (this.cacheTimeout * 1000)) {
      return cached.data;
    }
    return null;
  }

  saveToCache(key, data) {
    this.responseCache.set(key, {
      data,
      timestamp: Date.now(),
    });
    
    // Clean old cache entries
    if (this.responseCache.size > 100) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
  }

  /**
   * Generate basic plan when AI fails
   */
  generateBasicPlan(domain, subdomains, difficulty) {
    console.log('📋 Generating basic assessment plan as fallback');
    const skills = subdomains.length > 0 ? subdomains : [domain];
    
    return [
      {
        id: 'diagnostic',
        title: `${domain}: Diagnostic Assessment`,
        description: `Evaluate your current understanding of core ${domain} concepts and identify knowledge gaps.`,
        targetSkills: skills.slice(0, 3),
        difficulty: 'beginner',
        questionCount: 7,
        estimatedDurationMinutes: 15,
        rationale: 'Establishes your baseline knowledge to personalize your learning path',
      },
      {
        id: 'skills-focus',
        title: `${domain}: Skills Deep Dive`,
        description: `Test your practical application skills in ${skills[0] || domain} with real-world scenarios.`,
        targetSkills: skills.slice(0, 3),
        difficulty: difficulty || 'intermediate',
        questionCount: 8,
        estimatedDurationMinutes: 20,
        rationale: 'Identifies specific strengths and areas for improvement in key competencies',
      },
      {
        id: 'stretch',
        title: `${domain}: Advanced Challenge`,
        description: `Push your limits with complex problems that test advanced ${domain} concepts.`,
        targetSkills: skills.slice(0, 2),
        difficulty: 'advanced',
        questionCount: 6,
        estimatedDurationMinutes: 18,
        rationale: 'Challenges you beyond your comfort zone to identify growth opportunities',
      },
    ];
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      cacheSize: this.responseCache.size,
      models: Object.keys(this.modelConfig).map(key => ({
        type: key,
        model: this.modelConfig[key].model,
        purpose: this.modelConfig[key].purpose,
      })),
      personalities: Object.keys(this.personalities),
    };
  }
}

// Create singleton instance
const aiServiceManager = new AIServiceManager();

module.exports = {
  aiServiceManager,
  AIServiceManager,
};