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
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS_ASSESSMENT) || 6000, // Increased for detailed responses
        purpose: 'Complex assessment and question generation',
      },
      evaluation: {
        model: process.env.OPENAI_MODEL_EVALUATION || 'gpt-4o',
        temperature: 0.2, // Low temperature for consistent grading
        maxTokens: 2000, // Increased for detailed feedback
        purpose: 'Accurate evaluation and grading',
      },
      conversation: {
        model: process.env.OPENAI_MODEL_CONVERSATION || 'gpt-4o',
        temperature: 0.7,
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS_CONVERSATION) || 4000, // Increased for detailed responses
        purpose: 'Comprehensive conversational responses',
      },
      analysis: {
        model: process.env.OPENAI_MODEL_ANALYSIS || 'gpt-4o',
        temperature: 0.4,
        maxTokens: 3000, // Increased for detailed analysis
        purpose: 'Comprehensive data analysis and insights',
      },
    };

    // Single lightweight assistant persona to minimize prompt tokens
    this.personalities = {
      ASSISTANT: {
        name: 'ASSISTANT',
        description: 'Generic helpful assistant',
        temperature: 0.7,
        model: 'gpt-4o',
        maxTokens: 2000,
        systemPrompt: 'You are a concise, helpful AI assistant. Respond clearly and directly to the user\'s question.',
        traits: {
          tone: 'neutral',
          focus: 'helpfulness',
          responseStyle: 'concise and direct',
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
  async generateQuestions(title, category, topic, difficulty, count, types, options = {}) {
    const config = this.getServiceConfig('assessment');
    const { avoidQuestions = [], subtopics = [] } = options;
    
    const prompt = `You must generate exactly ${count} assessment questions about "${topic}" in valid JSON format.

IMPORTANT: Focus specifically on "${topic}" - create real, practical questions about this exact subject.

Context:
- Assessment Title: ${title}
- Topic/Subject: ${topic}
- Category: ${category}  
- Difficulty Level: ${difficulty}
- Question Types: ${types.join(', ')}
${subtopics && subtopics.length > 0 ? `- Target Subtopics (spread coverage across the set): ${subtopics.join(', ')}` : ''}

${avoidQuestions && avoidQuestions.length > 0 ? `Avoid duplicating or closely paraphrasing ANY of these existing questions:
${avoidQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
` : ''}

CRITICAL: 
1. Generate questions SPECIFICALLY about "${topic}" - not generic assessment questions
2. Return ONLY valid JSON. No explanations, no markdown, no extra text.
3. Make questions practical and real-world focused for ${topic}

Create a JSON object with this exact structure (ALL questions must be multiple_choice):
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Specific technical question about ${topic}",
      "options": ["Real option A", "Real option B", "Real option C", "Real option D"],
      "correctAnswer": "Real option B",
      "points": 10,
      "difficulty": "${difficulty}",
      "timeLimit": 300,
      "hints": ["Specific hint about ${topic}"],
      "explanation": "Why this answer is correct and what ${topic} concept it tests"
    }
  ]
}

CRITICAL REQUIREMENTS for answer randomization:
1. Generate exactly ${count} multiple choice questions about ${topic}
2. Each question must have 4 realistic, plausible options
3. RANDOMLY place the correct answer in positions A, B, C, or D (don't always make A correct)
4. Vary the correct answer position across questions - mix them up!
5. Make all wrong options believable but clearly incorrect to someone who knows ${topic}
 6. Test practical ${topic} knowledge that professionals would encounter
 7. Ensure each question is unique across this set and not a trivial rewording of previously listed questions
 8. Keep options concise, unambiguous, and mutually exclusive
 9. Prefer scenario-based or code/snippet-based questions when appropriate for ${topic}`;

    try {
      console.log(`📝 Generating ${count} questions for ${topic} using ${config.model}`);
      
      const response = await openAIService.createChatCompletion(
        [
          { 
            role: 'system', 
            content: `You are an expert ${category} educator and assessment designer specializing in ${topic}. 

CRITICAL REQUIREMENTS:
1. You MUST respond with valid JSON only - no explanations, no markdown, no extra text
2. Generate ONLY multiple choice questions - no text or essay questions
3. Generate REAL, SPECIFIC questions about "${topic}" - never generic assessment questions  
4. Focus on practical, real-world ${topic} scenarios and concepts
5. Test actual ${topic} knowledge, skills, and best practices
6. Each question should be directly related to ${topic} subject matter
7. All 4 options should be plausible but only one correct
8. IMPORTANT: Randomize correct answer positions - don't always put correct answer first!
9. Mix up correct answers across A, B, C, D positions throughout the question set

Example for "Python for Data Science": Ask about pandas operations, numpy functions, matplotlib syntax, data cleaning methods, etc.
Example for "JavaScript Fundamentals": Ask about variable types, function syntax, DOM methods, etc.
Example for "SQL Mastery": Ask about specific query syntax, join types, optimization techniques, etc.

Create multiple choice questions that a ${topic} professional would actually encounter.`,
          },
          { role: 'user', content: prompt },
        ],
        {
          model: config.model,
          temperature: config.temperature + 0.1, // Slightly higher for variety but not too much to avoid formatting issues
          max_tokens: Math.max(6000, config.maxTokens * 2), // Significantly more tokens to prevent truncation
          response_format: { type: 'json_object' }, // Force JSON output
        },
      );

      // Handle both direct content and nested response formats
      const content = response.content || response.choices?.[0]?.message?.content || '{"questions":[]}';
      
      // Clean the response - remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      console.log('📝 Raw AI response (first 500 chars):', cleanContent.substring(0, 500));
      
      // Parse the JSON response
      let parsedResponse;
      let questions = [];
      
      try {
        // Parse the main JSON object
        parsedResponse = JSON.parse(cleanContent);
        
        // Extract questions from the response
        if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
          questions = parsedResponse.questions;
        } else if (Array.isArray(parsedResponse)) {
          // Handle case where AI returns array directly (backward compatibility)
          questions = parsedResponse;
        } else {
          console.warn('⚠️ Unexpected response structure:', Object.keys(parsedResponse));
          questions = [];
        }
        
      } catch (parseError) {
        console.error('❌ JSON parse failed:', parseError.message);
        console.error('Raw content snippet:', cleanContent.substring(0, 300));
        
        // Try multiple fallback parsing strategies
        questions = this.tryFallbackParsing(cleanContent);
      }
      
      // Validate and fix incomplete questions
      questions = this.validateAndFixQuestions(questions, count);
      
      console.log(`✅ Generated ${questions.length} complete questions`);
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
   * Try multiple fallback parsing strategies for incomplete JSON
   */
  tryFallbackParsing(content) {
    console.log('🔄 Attempting fallback JSON parsing strategies...');
    
    // Strategy 1: Try to extract questions array
    try {
      const questionsMatch = content.match(/"questions"\s*:\s*\[[\s\S]*?\]/);
      if (questionsMatch) {
        const questionsStr = '{' + questionsMatch[0] + '}';
        const fallbackParse = JSON.parse(questionsStr);
        console.log('✅ Strategy 1 successful: Extracted questions array');
        return fallbackParse.questions || [];
      }
    } catch (error) {
      console.log('❌ Strategy 1 failed');
    }
    
    // Strategy 2: Try to fix incomplete JSON by adding closing brackets
    try {
      let fixedContent = content.trim();
      if (!fixedContent.endsWith('}')) {
        // Count opening vs closing braces
        const openBraces = (fixedContent.match(/\{/g) || []).length;
        const closeBraces = (fixedContent.match(/\}/g) || []).length;
        const missingCloseBraces = openBraces - closeBraces;
        
        // Add missing closing braces
        if (missingCloseBraces > 0) {
          fixedContent += '}'.repeat(missingCloseBraces);
        }
        
        // Try to close incomplete arrays
        const openArrays = (fixedContent.match(/\[/g) || []).length;
        const closeArrays = (fixedContent.match(/\]/g) || []).length;
        const missingCloseArrays = openArrays - closeArrays;
        
        if (missingCloseArrays > 0) {
          fixedContent = fixedContent.replace(/,$/, '') + ']'.repeat(missingCloseArrays);
        }
      }
      
      const parsed = JSON.parse(fixedContent);
      console.log('✅ Strategy 2 successful: Fixed incomplete JSON');
      return parsed.questions || parsed || [];
      
    } catch (error) {
      console.log('❌ Strategy 2 failed');
    }
    
    // Strategy 3: Try to extract individual question objects
    try {
      const questionObjects = [];
      const questionMatches = content.matchAll(/\{[^{}]*"question"[^{}]*"options"[^{}]*\}/g);
      
      for (const match of questionMatches) {
        try {
          const questionObj = JSON.parse(match[0]);
          if (questionObj.question && questionObj.options) {
            questionObjects.push(questionObj);
          }
        } catch (objError) {
          // Skip invalid question objects
        }
      }
      
      if (questionObjects.length > 0) {
        console.log(`✅ Strategy 3 successful: Extracted ${questionObjects.length} individual question objects`);
        return questionObjects;
      }
    } catch (error) {
      console.log('❌ Strategy 3 failed');
    }
    
    console.log('❌ All fallback parsing strategies failed');
    return [];
  }

  /**
   * Validate and fix incomplete questions
   */
  validateAndFixQuestions(questions, expectedCount) {
    if (!Array.isArray(questions)) {
      console.warn('⚠️ Questions is not an array, returning empty array');
      return [];
    }

    const validQuestions = [];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      // Check if question has all required fields
      if (!question || typeof question !== 'object') {
        console.warn(`⚠️ Question ${i + 1} is not a valid object, skipping`);
        continue;
      }
      
      // Validate required fields
      if (!question.question || typeof question.question !== 'string') {
        console.warn(`⚠️ Question ${i + 1} missing or invalid question text, skipping`);
        continue;
      }
      
      if (!question.options || !Array.isArray(question.options)) {
        console.warn(`⚠️ Question ${i + 1} missing or invalid options, skipping`);
        continue;
      }
      
      // Check if all options are complete (not empty or just partial text)
      const completeOptions = question.options.filter(opt => 
        opt && typeof opt === 'string' && opt.trim().length > 0
      );
      
      if (completeOptions.length < 4) {
        console.warn(`⚠️ Question ${i + 1} has incomplete options (${completeOptions.length}/4), skipping`);
        continue;
      }
      
      // Ensure we have a correct answer
      if (!question.correctAnswer || typeof question.correctAnswer !== 'string') {
        console.warn(`⚠️ Question ${i + 1} missing correct answer, skipping`);
        continue;
      }
      
      // Check if correct answer exists in options
      if (!question.options.includes(question.correctAnswer)) {
        console.warn(`⚠️ Question ${i + 1} correct answer not found in options, skipping`);
        continue;
      }
      
      // Question is valid, add it to valid questions
      validQuestions.push({
        ...question,
        options: completeOptions, // Use only complete options
        type: question.type || 'multiple_choice',
        difficulty: question.difficulty || 'medium',
        points: question.points || 10,
        timeLimit: question.timeLimit || 300,
        hints: Array.isArray(question.hints) ? question.hints : [],
        explanation: question.explanation || ''
      });
    }
    
    console.log(`📊 Validation results: ${validQuestions.length} valid questions out of ${questions.length} total`);
    
    // If we have fewer valid questions than expected, log a warning
    if (validQuestions.length < expectedCount) {
      console.warn(`⚠️ Only ${validQuestions.length} valid questions out of ${expectedCount} expected. Some questions may have been truncated due to token limits.`);
    }
    
    return validQuestions;
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