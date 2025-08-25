// services/onboardingService.js
const OnboardingQuestion = require("../models/OnboardingQuestion");
const OnboardingSession = require("../models/OnboardingSession");
const Assessment = require("../models/Assessment");
const User = require("../models/User");
const { openAIService } = require("./openaiService");
const { v4: uuidv4 } = require("uuid");
const { AppError } = require("../middleware/errorHandler");

class OnboardingService {
  constructor() {
    this.aiModels = {
      analysis: process.env.OPENAI_ANALYSIS_MODEL || 'gpt-4o',
      assessmentGeneration: process.env.OPENAI_ASSESSMENT_MODEL || 'gpt-4o',
      questionGeneration: process.env.OPENAI_QUESTION_MODEL || 'gpt-4o'
    };
  }

  /**
   * Start a new onboarding session for a user
   * @param {string} clerkUserId - Clerk user ID
   * @param {string} userId - Internal user ID
   * @returns {Promise<Object>} Onboarding session data
   */
  async startOnboardingSession(clerkUserId, userId) {
    try {
      console.log(`🚀 Starting onboarding session for user: ${userId}`);

      // Get onboarding questions
      const questions = await OnboardingQuestion.getOnboardingFlow();
      
      if (questions.length === 0) {
        throw new AppError("No onboarding questions available", 500);
      }

      // Create onboarding session
      const session = new OnboardingSession({
        sessionId: uuidv4(),
        userId,
        clerkUserId,
        totalQuestions: questions.length,
        aiProcessingStatus: {
          profileAnalysis: { status: "pending" },
          assessmentGeneration: { status: "pending" }
        }
      });

      await session.save();

      console.log(`✅ Onboarding session created: ${session.sessionId}`);

      return {
        sessionId: session.sessionId,
        questions: questions.map(q => ({
          questionId: q.questionId,
          question: q.question,
          description: q.description,
          type: q.type,
          category: q.category,
          options: q.options,
          expectedLength: q.expectedLength,
          flow: q.flow
        })),
        progress: session.getProgress()
      };

    } catch (error) {
      console.error("❌ Error starting onboarding session:", error);
      throw error;
    }
  }

  /**
   * Submit an answer to an onboarding question
   * @param {string} sessionId - Session ID
   * @param {string} questionId - Question ID
   * @param {*} answer - User's answer
   * @param {number} timeSpent - Time spent on question
   * @returns {Promise<Object>} Updated session data
   */
  async submitAnswer(sessionId, questionId, answer, timeSpent = 0) {
    try {
      console.log(`📝 Submitting answer for question: ${questionId}`);

      // Get session and question
      const [session, question] = await Promise.all([
        OnboardingSession.findOne({ sessionId }),
        OnboardingQuestion.getQuestionWithAnalysis(questionId)
      ]);

      if (!session) {
        throw new AppError("Onboarding session not found", 404);
      }

      if (!question) {
        throw new AppError("Question not found", 404);
      }

      // Analyze answer with AI
      const aiAnalysis = await this.analyzeAnswer(question, answer, timeSpent);

      // Add answer to session
      await session.addAnswer(
        questionId,
        question.question,
        answer,
        question.type,
        timeSpent
      );

      // Update AI analysis
      const answerIndex = session.answers.findIndex(a => a.questionId === questionId);
      if (answerIndex >= 0) {
        session.answers[answerIndex].aiAnalysis = aiAnalysis;
      }

      await session.save();

      // Check if all questions are answered
      if (session.questionsAnswered >= session.totalQuestions) {
        await this.completeOnboarding(session);
      }

      return {
        sessionId: session.sessionId,
        progress: session.getProgress(),
        nextQuestion: this.getNextQuestion(session, question),
        aiAnalysis: aiAnalysis
      };

    } catch (error) {
      console.error("❌ Error submitting answer:", error);
      throw error;
    }
  }

  /**
   * Analyze user answer using AI
   * @param {Object} question - Question object
   * @param {*} answer - User's answer
   * @param {number} timeSpent - Time spent on question
   * @returns {Promise<Object>} AI analysis result
   */
  async analyzeAnswer(question, answer, timeSpent) {
    try {
      console.log(`🤖 Analyzing answer with AI for question: ${question.questionId}`);

      const prompt = this.buildAnalysisPrompt(question, answer, timeSpent);

      const response = await openAIService.createChatCompletion([
        {
          role: "system",
          content: "You are an expert educational psychologist and career counselor analyzing user responses to understand their learning profile, career goals, and skill levels."
        },
        {
          role: "user",
          content: prompt
        }
      ], {
        model: this.aiModels.analysis,
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const analysis = this.parseAnalysisResponse(response.content);
      
      console.log(`✅ AI analysis completed for question: ${question.questionId}`);

      return analysis;

    } catch (error) {
      console.error("❌ AI analysis failed:", error);
      
      // Return fallback analysis
      return {
        score: 70,
        confidence: 60,
        insights: ["Analysis could not be completed"],
        categories: ["general"],
        recommendations: ["Continue with onboarding"],
        requiresFollowUp: false
      };
    }
  }

  /**
   * Build AI analysis prompt for a question
   * @param {Object} question - Question object
   * @param {*} answer - User's answer
   * @param {number} timeSpent - Time spent
   * @returns {string} Analysis prompt
   */
  buildAnalysisPrompt(question, answer, timeSpent) {
    return `Analyze this user response to an onboarding question:

QUESTION: ${question.question}
CATEGORY: ${question.category}
TYPE: ${question.type}
TIME SPENT: ${timeSpent} seconds

USER ANSWER: ${typeof answer === 'object' ? JSON.stringify(answer) : answer}

ANALYSIS PROMPT: ${question.aiAnalysisPrompt}

Provide your analysis in this JSON format:
{
  "score": <number 0-100>,
  "confidence": <number 0-100>,
  "insights": ["<key insight 1>", "<key insight 2>"],
  "categories": ["<category 1>", "<category 2>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"],
  "requiresFollowUp": <boolean>
}

Focus on extracting meaningful insights about the user's learning style, experience level, career goals, and interests.`;
  }

  /**
   * Parse AI analysis response
   * @param {string} response - AI response content
   * @returns {Object} Parsed analysis
   */
  parseAnalysisResponse(response) {
    try {
      const cleaned = response.trim();
      const analysis = JSON.parse(cleaned);

      return {
        score: Math.max(0, Math.min(100, analysis.score || 70)),
        confidence: Math.max(0, Math.min(100, analysis.confidence || 70)),
        insights: analysis.insights || [],
        categories: analysis.categories || [],
        recommendations: analysis.recommendations || [],
        requiresFollowUp: analysis.requiresFollowUp || false
      };

    } catch (error) {
      console.error("Failed to parse AI analysis:", error);
      
      return {
        score: 70,
        confidence: 60,
        insights: ["Analysis parsing failed"],
        categories: ["general"],
        recommendations: ["Continue with onboarding"],
        requiresFollowUp: false
      };
    }
  }

  /**
   * Complete onboarding and generate personalized assessments
   * @param {Object} session - Onboarding session
   * @returns {Promise<Object>} Completion results
   */
  async completeOnboarding(session) {
    try {
      console.log(`🎯 Completing onboarding for session: ${session.sessionId}`);

      // Update AI processing status
      session.aiProcessingStatus.profileAnalysis.status = "processing";
      session.aiProcessingStatus.profileAnalysis.startedAt = new Date();
      await session.save();

      // Generate AI profile
      const aiProfile = await this.generateAIProfile(session.answers);
      session.aiProfile = aiProfile;
      session.aiProcessingStatus.profileAnalysis.status = "completed";
      session.aiProcessingStatus.profileAnalysis.completedAt = new Date();

      // Update AI processing status for assessment generation
      session.aiProcessingStatus.assessmentGeneration.status = "processing";
      session.aiProcessingStatus.assessmentGeneration.startedAt = new Date();
      await session.save();

      // Generate personalized assessments
      const generatedAssessments = await this.generatePersonalizedAssessments(
        session.answers,
        aiProfile
      );
      session.generatedAssessments = generatedAssessments;
      session.aiProcessingStatus.assessmentGeneration.status = "completed";
      session.aiProcessingStatus.assessmentGeneration.completedAt = new Date();

      // Complete session
      await session.complete();

      // Update user profile
      await this.updateUserProfile(session.userId, aiProfile);

      console.log(`✅ Onboarding completed successfully for session: ${session.sessionId}`);

      return {
        sessionId: session.sessionId,
        aiProfile,
        generatedAssessments,
        recommendedAssessments: await this.getRecommendedPrebuiltAssessments(aiProfile)
      };

    } catch (error) {
      console.error("❌ Error completing onboarding:", error);
      
      // Mark as failed
      session.aiProcessingStatus.profileAnalysis.status = "failed";
      session.aiProcessingStatus.profileAnalysis.error = error.message;
      await session.save();
      
      throw error;
    }
  }

  /**
   * Generate AI profile based on onboarding answers
   * @param {Array} answers - User answers
   * @returns {Promise<Object>} AI-generated profile
   */
  async generateAIProfile(answers) {
    try {
      console.log("🤖 Generating AI profile from onboarding answers");

      const prompt = this.buildProfileGenerationPrompt(answers);

      const response = await openAIService.createChatCompletion([
        {
          role: "system",
          content: "You are an expert educational psychologist and career counselor. Analyze user responses to create a comprehensive learning and career profile."
        },
        {
          role: "user",
          content: prompt
        }
      ], {
        model: this.aiModels.analysis,
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const profile = this.parseProfileResponse(response.content);
      
      console.log("✅ AI profile generated successfully");

      return profile;

    } catch (error) {
      console.error("❌ AI profile generation failed:", error);
      throw error;
    }
  }

  /**
   * Build profile generation prompt
   * @param {Array} answers - User answers
   * @returns {string} Profile generation prompt
   */
  buildProfileGenerationPrompt(answers) {
    let prompt = "Based on these user responses to onboarding questions, create a comprehensive profile:\n\n";

    answers.forEach((answer, index) => {
      prompt += `Question ${index + 1}: ${answer.question}\n`;
      prompt += `Answer: ${typeof answer.answer === 'object' ? JSON.stringify(answer.answer) : answer.answer}\n`;
      prompt += `AI Insights: ${answer.aiAnalysis?.insights?.join(', ') || 'None'}\n\n`;
    });

    prompt += `Generate a comprehensive profile in this JSON format:
{
  "learningStyle": {
    "primary": "<primary learning style>",
    "secondary": "<secondary learning style>",
    "confidence": <number 0-100>,
    "reasoning": "<explanation>"
  },
  "experienceLevel": {
    "overall": "<beginner|intermediate|advanced|expert>",
    "technical": "<beginner|intermediate|advanced|expert>",
    "business": "<beginner|intermediate|advanced|expert>",
    "confidence": <number 0-100>,
    "reasoning": "<explanation>"
  },
  "careerGoals": ["<goal 1>", "<goal 2>", "<goal 3>"],
  "interests": ["<interest 1>", "<interest 2>", "<interest 3>"],
  "motivation": "<primary motivation>",
  "timeAvailability": "<time availability>",
  "preferredFormat": "<preferred learning format>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "areasForGrowth": ["<area 1>", "<area 2>"],
  "recommendedPaths": ["<path 1>", "<path 2>"]
}

Focus on extracting clear patterns and providing actionable insights.`;

    return prompt;
  }

  /**
   * Parse AI profile response
   * @param {string} response - AI response content
   * @returns {Object} Parsed profile
   */
  parseProfileResponse(response) {
    try {
      const cleaned = response.trim();
      const profile = JSON.parse(cleaned);

      return {
        learningStyle: {
          primary: profile.learningStyle?.primary || "adaptive",
          secondary: profile.learningStyle?.secondary || "visual",
          confidence: Math.max(0, Math.min(100, profile.learningStyle?.confidence || 70)),
          reasoning: profile.learningStyle?.reasoning || "Based on user responses"
        },
        experienceLevel: {
          overall: profile.experienceLevel?.overall || "intermediate",
          technical: profile.experienceLevel?.technical || "intermediate",
          business: profile.experienceLevel?.business || "intermediate",
          confidence: Math.max(0, Math.min(100, profile.experienceLevel?.confidence || 70)),
          reasoning: profile.experienceLevel?.reasoning || "Based on user responses"
        },
        careerGoals: profile.careerGoals || ["Professional development"],
        interests: profile.interests || ["Learning and growth"],
        motivation: profile.motivation || "Skill development",
        timeAvailability: profile.timeAvailability || "moderate",
        preferredFormat: profile.preferredFormat || "interactive",
        strengths: profile.strengths || ["Adaptability"],
        areasForGrowth: profile.areasForGrowth || ["Technical skills"],
        recommendedPaths: profile.recommendedPaths || ["General development"]
      };

    } catch (error) {
      console.error("Failed to parse AI profile:", error);
      throw new AppError("Failed to generate user profile", 500);
    }
  }

  /**
   * Generate personalized assessments based on user profile
   * @param {Array} answers - User answers
   * @param {Object} aiProfile - AI-generated profile
   * @returns {Promise<Array>} Generated assessments
   */
  async generatePersonalizedAssessments(answers, aiProfile) {
    try {
      console.log("🤖 Generating personalized assessments");

      const prompt = this.buildAssessmentGenerationPrompt(answers, aiProfile);

      const response = await openAIService.createChatCompletion([
        {
          role: "system",
          content: "You are an expert assessment designer and educational content creator. Create personalized assessments based on user profiles and responses."
        },
        {
          role: "user",
          content: prompt
        }
      ], {
        model: this.aiModels.assessmentGeneration,
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const assessments = this.parseAssessmentGenerationResponse(response.content);
      
      console.log(`✅ Generated ${assessments.length} personalized assessments`);

      return assessments;

    } catch (error) {
      console.error("❌ Assessment generation failed:", error);
      throw error;
    }
  }

  /**
   * Build assessment generation prompt
   * @param {Array} answers - User answers
   * @param {Object} aiProfile - AI profile
   * @returns {string} Assessment generation prompt
   */
  buildAssessmentGenerationPrompt(answers, aiProfile) {
    return `Create 3 personalized assessments based on this user profile:

USER PROFILE:
${JSON.stringify(aiProfile, null, 2)}

ONBOARDING RESPONSES:
${answers.map((a, i) => `Q${i+1}: ${a.question}\nA: ${a.answer}`).join('\n\n')}

Generate 3 assessments in this JSON format:
{
  "assessments": [
    {
      "title": "<assessment title>",
      "description": "<detailed description>",
      "category": "<category>",
      "difficulty": "<beginner|intermediate|advanced|expert>",
      "reason": "<why this assessment was recommended>",
      "priority": <1-3>,
      "questionCount": <number>,
      "estimatedDuration": <minutes>,
      "focusAreas": ["<focus area 1>", "<focus area 2>"]
    }
  ]
}

Focus on:
1. Technical skills assessment based on experience level
2. Learning style assessment based on preferences
3. Career goals assessment based on aspirations

Make assessments challenging but appropriate for the user's level.`;
  }

  /**
   * Parse assessment generation response
   * @param {string} response - AI response content
   * @returns {Array} Parsed assessments
   */
  parseAssessmentGenerationResponse(response) {
    try {
      const cleaned = response.trim();
      const data = JSON.parse(cleaned);

      if (!data.assessments || !Array.isArray(data.assessments)) {
        throw new Error("Invalid assessment format");
      }

      return data.assessments.map((assessment, index) => ({
        title: assessment.title || `Personalized Assessment ${index + 1}`,
        description: assessment.description || "AI-generated personalized assessment",
        category: assessment.category || "Personal Development",
        difficulty: assessment.difficulty || "intermediate",
        reason: assessment.reason || "Based on your profile and responses",
        priority: Math.max(1, Math.min(3, assessment.priority || index + 1)),
        questionCount: assessment.questionCount || 15,
        estimatedDuration: assessment.estimatedDuration || 30,
        focusAreas: assessment.focusAreas || ["Personal development"],
        questions: [] // Will be populated later
      }));

    } catch (error) {
      console.error("Failed to parse assessment generation:", error);
      
      // Return fallback assessments
      return [
        {
          title: "Technical Skills Assessment",
          description: "Evaluate your current technical capabilities",
          category: "Technical Skills",
          difficulty: "intermediate",
          reason: "Based on your technical background",
          priority: 1,
          questionCount: 15,
          estimatedDuration: 30,
          focusAreas: ["Programming", "Problem solving"],
          questions: []
        },
        {
          title: "Learning Style Assessment",
          description: "Understand your preferred learning methods",
          category: "Personal Development",
          difficulty: "beginner",
          reason: "Based on your learning preferences",
          priority: 2,
          questionCount: 12,
          estimatedDuration: 25,
          focusAreas: ["Learning methods", "Study habits"],
          questions: []
        },
        {
          title: "Career Goals Assessment",
          description: "Evaluate your career readiness and goals",
          category: "Career Development",
          difficulty: "intermediate",
          reason: "Based on your career aspirations",
          priority: 3,
          questionCount: 18,
          estimatedDuration: 35,
          focusAreas: ["Career planning", "Professional skills"],
          questions: []
        }
      ];
    }
  }

  /**
   * Get recommended prebuilt assessments based on user profile
   * @param {Object} aiProfile - AI-generated profile
   * @returns {Promise<Array>} Recommended assessments
   */
  async getRecommendedPrebuiltAssessments(aiProfile) {
    try {
      console.log("🔍 Finding recommended prebuilt assessments");

      // Get all available assessments
      const allAssessments = await Assessment.find({ 
        isActive: true, 
        isPublished: true 
      }).select('title description category difficulty tags');

      // Score assessments based on user profile
      const scoredAssessments = allAssessments.map(assessment => {
        let score = 0;
        
        // Category match
        if (aiProfile.interests.some(interest => 
          assessment.category.toLowerCase().includes(interest.toLowerCase())
        )) {
          score += 30;
        }
        
        // Difficulty match
        const userLevel = aiProfile.experienceLevel.overall;
        if (assessment.difficulty === userLevel) {
          score += 25;
        } else if (
          (userLevel === "beginner" && assessment.difficulty === "intermediate") ||
          (userLevel === "intermediate" && ["beginner", "advanced"].includes(assessment.difficulty)) ||
          (userLevel === "advanced" && ["intermediate", "expert"].includes(assessment.difficulty))
        ) {
          score += 15;
        }
        
        // Tag matches
        if (assessment.tags) {
          const tagMatches = assessment.tags.filter(tag => 
            aiProfile.interests.some(interest => 
              tag.toLowerCase().includes(interest.toLowerCase())
            )
          ).length;
          score += tagMatches * 5;
        }
        
        return { assessment, score };
      });

      // Sort by score and return top 7
      return scoredAssessments
        .sort((a, b) => b.score - a.score)
        .slice(0, 7)
        .map(({ assessment, score }) => ({
          id: assessment._id,
          title: assessment.title,
          description: assessment.description,
          category: assessment.category,
          difficulty: assessment.difficulty,
          score: score,
          reason: this.getAssessmentReason(score, assessment, aiProfile)
        }));

    } catch (error) {
      console.error("❌ Error getting recommended assessments:", error);
      return [];
    }
  }

  /**
   * Get reason for assessment recommendation
   * @param {number} score - Recommendation score
   * @param {Object} assessment - Assessment object
   * @param {Object} aiProfile - User profile
   * @returns {string} Recommendation reason
   */
  getAssessmentReason(score, assessment, aiProfile) {
    if (score >= 80) {
      return `Perfect match for your ${assessment.category.toLowerCase()} interests and ${aiProfile.experienceLevel.overall} level`;
    } else if (score >= 60) {
      return `Good match for your background in ${assessment.category.toLowerCase()}`;
    } else if (score >= 40) {
      return `Relevant to your learning goals and current skill level`;
    } else {
      return `General assessment to broaden your skills`;
    }
  }

  /**
   * Update user profile with AI-generated insights
   * @param {string} userId - User ID
   * @param {Object} aiProfile - AI-generated profile
   * @returns {Promise<void>}
   */
  async updateUserProfile(userId, aiProfile) {
    try {
      console.log(`👤 Updating user profile: ${userId}`);

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Update learning profile
      user.learningProfile = {
        ...user.learningProfile,
        currentLevel: aiProfile.experienceLevel.overall,
        learningStyle: aiProfile.learningStyle.primary,
        goals: aiProfile.careerGoals,
        interests: aiProfile.interests,
        aiPersonality: this.mapLearningStyleToAIPersonality(aiProfile.learningStyle.primary)
      };

      // Add AI insights to user profile
      user.aiInsights = {
        profileGeneratedAt: new Date(),
        learningStyle: aiProfile.learningStyle,
        experienceLevel: aiProfile.experienceLevel,
        strengths: aiProfile.strengths,
        areasForGrowth: aiProfile.areasForGrowth,
        recommendedPaths: aiProfile.recommendedPaths
      };

      await user.save();

      console.log(`✅ User profile updated successfully`);

    } catch (error) {
      console.error("❌ Error updating user profile:", error);
      // Don't throw error as this is not critical for onboarding completion
    }
  }

  /**
   * Map learning style to AI personality
   * @param {string} learningStyle - Learning style
   * @returns {string} AI personality
   */
  mapLearningStyleToAIPersonality(learningStyle) {
    const mapping = {
      'visual': 'ARIA',
      'auditory': 'SAGE',
      'kinesthetic': 'COACH',
      'reading': 'SAGE',
      'adaptive': 'ARIA'
    };
    
    return mapping[learningStyle] || 'ARIA';
  }

  /**
   * Get next question based on current session and last question
   * @param {Object} session - Onboarding session
   * @param {Object} lastQuestion - Last answered question
   * @returns {Object|null} Next question or null if complete
   */
  getNextQuestion(session, lastQuestion) {
    if (session.currentQuestionIndex >= session.totalQuestions) {
      return null;
    }

    // For now, return simple next question logic
    // In the future, this could implement adaptive questioning based on answers
    return {
      questionIndex: session.currentQuestionIndex,
      isLast: session.currentQuestionIndex === session.totalQuestions - 1
    };
  }

  /**
   * Get onboarding session status
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session status
   */
  async getSessionStatus(sessionId) {
    try {
      const session = await OnboardingSession.findOne({ sessionId });
      
      if (!session) {
        throw new AppError("Onboarding session not found", 404);
      }

      return {
        sessionId: session.sessionId,
        status: session.status,
        progress: session.getProgress(),
        aiProcessingStatus: session.aiProcessingStatus,
        generatedAssessments: session.generatedAssessments || [],
        aiProfile: session.aiProfile || null
      };

    } catch (error) {
      console.error("❌ Error getting session status:", error);
      throw error;
    }
  }

  /**
   * Resume onboarding session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session data
   */
  async resumeSession(sessionId) {
    try {
      const session = await OnboardingSession.findOne({ sessionId });
      
      if (!session) {
        throw new AppError("Onboarding session not found", 404);
      }

      if (session.status === "completed") {
        throw new AppError("Onboarding session already completed", 400);
      }

      // Get remaining questions
      const questions = await OnboardingQuestion.getOnboardingFlow();
      const remainingQuestions = questions.slice(session.currentQuestionIndex);

      return {
        sessionId: session.sessionId,
        questions: remainingQuestions.map(q => ({
          questionId: q.questionId,
          question: q.question,
          description: q.description,
          type: q.type,
          category: q.category,
          options: q.options,
          expectedLength: q.expectedLength,
          flow: q.flow
        })),
        progress: session.getProgress(),
        answers: session.answers
      };

    } catch (error) {
      console.error("❌ Error resuming session:", error);
      throw error;
    }
  }
}

// Export singleton instance
const onboardingService = new OnboardingService();

module.exports = {
  onboardingService,
  OnboardingService
};
