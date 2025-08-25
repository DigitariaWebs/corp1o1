// services/personalizationService.js
const { openAIService } = require('./openaiService');
const { AppError } = require('../middleware/errorHandler');

/**
 * AI-Powered Personalization Service
 * Creates customized learning experiences based on user onboarding data
 */
class PersonalizationService {
  constructor() {
    this.model = process.env.OPENAI_PERSONALIZATION_MODEL || 'gpt-4o-mini';
    this.settings = {
      temperature: 0.3, // Slightly more creative for personalization
      maxTokens: 2000,
      presencePenalty: 0.1,
      frequencyPenalty: 0.1
    };
  }

  /**
   * Generate personalized content recommendations based on onboarding data
   */
  async generatePersonalizedExperience(onboardingData, userId) {
    try {
      console.log(`🤖 Generating personalized experience for user: ${userId}`);
      console.log(`🤖 Input data:`, JSON.stringify(onboardingData, null, 2));

      // Generate all components in parallel for better performance
      const [personalizedContent, assessmentPlan, learningPath, motivationalProfile] = await Promise.all([
        this.generatePersonalizedContent(onboardingData),
        this.generateAssessmentPlan(onboardingData),
        this.generateLearningPath(onboardingData),
        this.generateMotivationalProfile(onboardingData)
      ]);

      console.log(`✅ All personalization components generated`);
      console.log(`📊 personalizedContent keys:`, Object.keys(personalizedContent));
      console.log(`📊 assessmentPlan keys:`, Object.keys(assessmentPlan));
      console.log(`📊 learningPath keys:`, Object.keys(learningPath));
      console.log(`📊 motivationalProfile keys:`, Object.keys(motivationalProfile));

      const result = {
        personalizedContent,
        assessmentPlan,
        learningPath,
        motivationalProfile,
        confidence: this.calculatePersonalizationConfidence(onboardingData),
        generatedAt: new Date()
      };

      console.log(`🎯 Final personalization structure:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Personalization generation failed:', error);
      throw new AppError('Failed to generate personalized experience', 500);
    }
  }

  /**
   * Generate personalized content recommendations
   */
  async generatePersonalizedContent(data) {
    const prompt = this.buildPersonalizationPrompt(data, 'content');
    
    const response = await openAIService.createChatCompletion(
      [
        {
          role: 'system',
          content: `You are an expert learning experience designer and career coach. Generate personalized content recommendations based on user preferences. Return a JSON object with specific, actionable recommendations.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      {
        model: this.model,
        ...this.settings,
        response_format: { type: 'json_object' }
      }
    );

    return JSON.parse(response.content);
  }

  /**
   * Generate personalized assessment plan
   */
  async generateAssessmentPlan(data) {
    const prompt = this.buildPersonalizationPrompt(data, 'assessment');
    
    const response = await openAIService.createChatCompletion(
      [
        {
          role: 'system',
          content: `You are an expert assessment designer. Create a personalized assessment strategy that matches the user's experience level and goals. Return a detailed JSON plan.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      {
        model: this.model,
        ...this.settings,
        response_format: { type: 'json_object' }
      }
    );

    return JSON.parse(response.content);
  }

  /**
   * Generate personalized learning path
   */
  async generateLearningPath(data) {
    const prompt = this.buildPersonalizationPrompt(data, 'learning');
    
    const response = await openAIService.createChatCompletion(
      [
        {
          role: 'system',
          content: `You are a learning path architect. Design a structured, progressive learning journey that aligns with the user's goals, time constraints, and learning style. Return a detailed JSON learning plan.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      {
        model: this.model,
        ...this.settings,
        response_format: { type: 'json_object' }
      }
    );

    return JSON.parse(response.content);
  }

  /**
   * Generate motivational profile and coaching style
   */
  async generateMotivationalProfile(data) {
    const prompt = this.buildPersonalizationPrompt(data, 'motivation');
    
    const response = await openAIService.createChatCompletion(
      [
        {
          role: 'system',
          content: `You are a motivational psychology expert. Analyze the user's profile and create a personalized motivational strategy including communication style, feedback approach, and engagement tactics. Return a JSON profile.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      {
        model: this.model,
        ...this.settings,
        response_format: { type: 'json_object' }
      }
    );

    return JSON.parse(response.content);
  }

  /**
   * Build personalized prompts based on onboarding data and type
   */
  buildPersonalizationPrompt(data, type) {
    const baseContext = `
User Profile:
- Current Role: ${data.currentRole || 'Not specified'}
- Primary Goal: ${data.primaryGoal || 'General skill development'}
- Experience Level: ${data.experience || 'Not specified'}
- Time Commitment: ${data.timeCommitment || 'Flexible'}
- Preferred Learning Style: ${data.preferredLearningStyle || 'Not specified'}
- Interested Domains: ${(data.preferredDomains || []).join(', ') || 'General'}
- Industry: ${data.industry || 'Not specified'}
- Career Goals: ${(data.careerGoals || []).join(', ') || 'Not specified'}
    `.trim();

    switch (type) {
      case 'content':
        return `${baseContext}

Generate personalized content recommendations with this JSON structure:
{
  "welcomeMessage": "Personalized welcome message addressing their specific goals",
  "prioritySkills": ["List of 3-5 skills to focus on first"],
  "contentTypes": ["Recommended content formats based on learning style"],
  "difficultyLevel": "beginner|intermediate|advanced|expert",
  "focusAreas": ["Specific areas to concentrate on"],
  "quickWins": ["3-4 immediate actions they can take"],
  "longTermPath": "Brief description of their learning journey",
  "motivationalTips": ["Personalized motivation strategies"],
  "industryInsights": ["Relevant industry trends and opportunities"]
}`;

      case 'assessment':
        return `${baseContext}

Create a personalized assessment strategy with this JSON structure:
{
  "assessmentSequence": [
    {
      "title": "Assessment name",
      "description": "What it evaluates",
      "difficulty": "beginner|intermediate|advanced|expert",
      "estimatedTime": "Duration in minutes",
      "priority": "high|medium|low",
      "reasoning": "Why this assessment first"
    }
  ],
  "initialDifficulty": "Starting difficulty level",
  "adaptationStrategy": "How to adjust based on performance",
  "evaluationCriteria": ["What to focus on in evaluations"],
  "feedbackStyle": "How to deliver results",
  "retakeStrategy": "When and how to allow retakes",
  "certificationPath": "Path to earning certificates"
}`;

      case 'learning':
        return `${baseContext}

Design a learning path with this JSON structure:
{
  "pathName": "Customized learning path name",
  "description": "What this path achieves",
  "estimatedDuration": "Total time to completion",
  "modules": [
    {
      "title": "Module name",
      "description": "What this module covers",
      "duration": "Time to complete",
      "difficulty": "beginner|intermediate|advanced|expert",
      "skills": ["Skills developed"],
      "prerequisites": ["What's needed before this"],
      "deliverables": ["What they'll create/achieve"]
    }
  ],
  "milestones": ["Key achievement points"],
  "practicalProjects": ["Hands-on projects to complete"],
  "resourceRecommendations": ["External resources to supplement"],
  "skillProgression": "How skills build on each other",
  "careerAlignment": "How this supports their career goals"
}`;

      case 'motivation':
        return `${baseContext}

Create a motivational profile with this JSON structure:
{
  "motivationStyle": "intrinsic|extrinsic|achievement|social|autonomy",
  "communicationTone": "formal|friendly|encouraging|direct|supportive",
  "feedbackPreference": "immediate|detailed|progress-focused|solution-oriented",
  "engagementTactics": ["Specific ways to keep them engaged"],
  "challengeLevel": "How much challenge they prefer",
  "recognitionStyle": "How they like to be recognized for achievements",
  "progressTracking": "How they prefer to see progress",
  "socialLearning": "Whether they prefer solo or group activities",
  "gamificationElements": ["Game-like features that would motivate them"],
  "personalityInsights": "Key personality traits relevant to learning",
  "potentialObstacles": ["Challenges they might face"],
  "successStrategies": ["Specific strategies for their success"]
}`;

      default:
        throw new Error(`Unknown personalization type: ${type}`);
    }
  }

  /**
   * Calculate confidence in personalization based on data completeness
   */
  calculatePersonalizationConfidence(data) {
    const requiredFields = [
      'primaryGoal', 'currentRole', 'experience', 
      'timeCommitment', 'preferredLearningStyle', 'preferredDomains'
    ];
    
    const completedFields = requiredFields.filter(field => 
      data[field] && (Array.isArray(data[field]) ? data[field].length > 0 : true)
    );
    
    const completeness = completedFields.length / requiredFields.length;
    
    // Adjust for quality of responses
    let qualityBonus = 0;
    if (data.preferredDomains && data.preferredDomains.length >= 2) qualityBonus += 0.1;
    if (data.currentRole && data.currentRole.length > 10) qualityBonus += 0.1;
    if (data.careerGoals && data.careerGoals.length > 0) qualityBonus += 0.1;
    
    return Math.min(95, Math.round((completeness + qualityBonus) * 100));
  }

  /**
   * Update personalization based on user behavior and feedback
   */
  async updatePersonalization(userId, behaviorData, feedbackData) {
    try {
      console.log(`🔄 Updating personalization for user: ${userId}`);
      
      const prompt = `
Behavior Data: ${JSON.stringify(behaviorData)}
Feedback Data: ${JSON.stringify(feedbackData)}

Based on this user behavior and feedback, suggest adjustments to their personalized experience. Return JSON with:
{
  "adjustments": ["List of specific adjustments to make"],
  "reasoning": "Why these adjustments are recommended",
  "confidenceChange": "How this affects confidence in personalization",
  "newRecommendations": ["Updated recommendations based on new data"]
}`;

      const response = await openAIService.createChatCompletion(
        [
          {
            role: 'system',
            content: 'You are an adaptive learning system that updates personalization based on user behavior and feedback.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        {
          model: this.model,
          ...this.settings,
          response_format: { type: 'json_object' }
        }
      );

      return JSON.parse(response.content);
    } catch (error) {
      console.error('Personalization update failed:', error);
      throw new AppError('Failed to update personalization', 500);
    }
  }

  /**
   * Generate context-aware content based on current progress
   */
  async generateContextualContent(userId, currentContext) {
    try {
      const prompt = `
Current Context: ${JSON.stringify(currentContext)}

Generate contextual content that responds to the user's current situation. Return JSON with:
{
  "contextualMessage": "Message relevant to their current progress/situation",
  "suggestedActions": ["3-4 specific next steps"],
  "adaptedDifficulty": "Adjusted difficulty based on recent performance",
  "motivationalBoost": "Encouragement tailored to current challenges",
  "resourceSuggestions": ["Relevant resources for current needs"]
}`;

      const response = await openAIService.createChatCompletion(
        [
          {
            role: 'system',
            content: 'You are a contextual learning assistant that adapts to user\'s current progress and needs.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        {
          model: this.model,
          ...this.settings,
          response_format: { type: 'json_object' }
        }
      );

      return JSON.parse(response.content);
    } catch (error) {
      console.error('Contextual content generation failed:', error);
      throw new AppError('Failed to generate contextual content', 500);
    }
  }
}

const personalizationService = new PersonalizationService();

module.exports = {
  personalizationService,
  PersonalizationService
};