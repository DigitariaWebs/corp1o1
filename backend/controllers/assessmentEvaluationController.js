const { AppError } = require('../middleware/errorHandler');
const openaiService = require('../services/openaiService');
const aiEvaluationService = require('../services/aiEvaluationService');

// AI Personality configurations
const AI_PERSONALITIES = {
  ARIA: {
    name: "ARIA",
    style: "encouraging and supportive",
    systemPrompt: `You are ARIA, an encouraging and supportive AI learning assistant. Your role is to:
    - Provide warm, motivational feedback
    - Focus on what the student did well
    - Gently guide them towards improvement
    - Use positive reinforcement
    - Be patient and empathetic
    - Celebrate effort as much as accuracy
    Always maintain an uplifting and encouraging tone.`,
    traits: ["Motivational", "Patient", "Empathetic"]
  },
  SAGE: {
    name: "SAGE",
    style: "analytical and detailed",
    systemPrompt: `You are SAGE, an analytical and thorough AI learning assistant. Your role is to:
    - Provide comprehensive, detailed analysis
    - Focus on underlying principles and concepts
    - Give thorough explanations of correct and incorrect aspects
    - Reference relevant theories and best practices
    - Provide deep insights into the subject matter
    - Suggest additional resources for learning
    Always maintain a professional and educational tone.`,
    traits: ["Precise", "Thorough", "Knowledgeable"]
  },
  COACH: {
    name: "COACH",
    style: "motivational and goal-oriented",
    systemPrompt: `You are COACH, a dynamic and results-focused AI learning assistant. Your role is to:
    - Push students towards excellence
    - Set high standards and expectations
    - Provide direct, actionable feedback
    - Focus on performance improvement
    - Challenge students to reach their potential
    - Emphasize achievement and mastery
    Always maintain an energetic and challenging tone.`,
    traits: ["Dynamic", "Results-focused", "Challenging"]
  }
};

/**
 * Evaluate a text/paragraph answer using AI
 */
exports.evaluateAnswer = async (req, res, next) => {
  try {
    const {
      question,
      answer,
      personality = 'ARIA',
      difficulty: rawDifficulty = 'medium',
      points = 10,
      rubric = null,
      context = null
    } = req.body;

    // Normalize 4-level difficulty to 3-level scale for evaluation prompt
    const difficulty = (
      rawDifficulty === 'beginner' ? 'easy' :
      rawDifficulty === 'intermediate' ? 'medium' :
      rawDifficulty === 'advanced' || rawDifficulty === 'expert' ? 'hard' :
      rawDifficulty
    );

    // Validate inputs
    if (!question || !answer) {
      throw new AppError('Question and answer are required', 400);
    }

    if (!AI_PERSONALITIES[personality]) {
      throw new AppError('Invalid AI personality selected', 400);
    }

    const selectedPersonality = AI_PERSONALITIES[personality];

    // Build the evaluation prompt
    const evaluationPrompt = `
    You are evaluating a student's answer to an assessment question.
    
    Question: ${question}
    Student's Answer: ${answer}
    Difficulty Level: ${difficulty}
    Maximum Points: ${points}
    ${rubric ? `Evaluation Rubric: ${rubric}` : ''}
    ${context ? `Additional Context: ${context}` : ''}
    
    Please evaluate the answer and provide:
    1. A score out of ${points} points
    2. Detailed feedback in your characteristic ${selectedPersonality.style} style
    3. Key strengths in the answer
    4. Areas for improvement
    5. Suggestions for further learning
    
    Format your response as JSON with the following structure:
    {
      "score": <number between 0 and ${points}>,
      "feedback": "<detailed feedback in your style>",
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"],
      "suggestions": ["suggestion1", "suggestion2"],
      "overallAssessment": "<brief overall assessment>"
    }
    `;

    // Call OpenAI for evaluation
    const completion = await openaiService.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: selectedPersonality.systemPrompt
        },
        {
          role: 'user',
          content: evaluationPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    let evaluationResult;
    try {
      evaluationResult = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      evaluationResult = {
        score: Math.floor(points * 0.7), // Default to 70% score
        feedback: completion.choices[0].message.content,
        strengths: ["Shows understanding of the topic"],
        improvements: ["Could provide more detail"],
        suggestions: ["Review the material and practice more"],
        overallAssessment: "Good effort with room for improvement"
      };
    }

    // Add personality-specific encouragement
    const personalityMessages = {
      ARIA: [
        "Keep up the great work! Every step forward is progress! 🌟",
        "You're doing amazingly! I believe in your potential! 💪",
        "Your effort is truly inspiring! Keep learning and growing! 🚀"
      ],
      SAGE: [
        "Your analytical approach shows promise. Continue exploring the depths of this subject.",
        "Consider the theoretical implications of your answer for deeper understanding.",
        "This demonstrates solid foundational knowledge. Build upon it systematically."
      ],
      COACH: [
        "Push yourself to the next level! Excellence is within reach!",
        "Champions are made through challenges like this! Keep pushing!",
        "You've got what it takes to master this! Stay focused on the goal!"
      ]
    };

    // Add a personality-specific message
    const randomMessage = personalityMessages[personality][
      Math.floor(Math.random() * personalityMessages[personality].length)
    ];
    
    evaluationResult.personalityMessage = randomMessage;
    evaluationResult.personality = personality;

    res.status(200).json({
      success: true,
      data: evaluationResult
    });

  } catch (error) {
    console.error('Error in evaluateAnswer:', error);
    // Always provide a safe fallback so frontend doesn't break in dev
    const maxPoints = Number(req.body.points) || 10;
    const fallbackScore = Math.floor(maxPoints * 0.65);
    const p = (req.body.personality && AI_PERSONALITIES[req.body.personality]) ? req.body.personality : 'ARIA';
    return res.status(200).json({
      success: true,
      data: {
        score: fallbackScore,
        feedback: `Your answer shows understanding of the topic. ${AI_PERSONALITIES[p].style}.`,
        strengths: ["Shows effort", "Addresses the question"],
        improvements: ["Provide more detail", "Add concrete examples"],
        suggestions: ["Review the core concepts", "Practice similar questions"],
        overallAssessment: "Good attempt with room for growth",
        personalityMessage: "Keep working hard! You're on the right path!",
        personality: p,
        isFallback: true
      }
    });
  }
};

/**
 * Evaluate multiple choice answer
 */
exports.evaluateMultipleChoice = async (req, res, next) => {
  try {
    const {
      question,
      selectedAnswer,
      correctAnswer,
      options,
      personality = 'ARIA',
      points = 10
    } = req.body;

    const isCorrect = selectedAnswer === correctAnswer;
    const earnedPoints = isCorrect ? points : 0;
    const selectedPersonality = AI_PERSONALITIES[personality];

    // Generate personality-specific feedback
    let feedback;
    if (isCorrect) {
      feedback = {
        ARIA: "Excellent work! You got it right! Your understanding is growing stronger! 🎉",
        SAGE: "Correct. This demonstrates a solid grasp of the underlying concept. Well reasoned.",
        COACH: "YES! That's what I'm talking about! You nailed it! Keep this momentum going!"
      }[personality];
    } else {
      feedback = {
        ARIA: `Not quite right, but that's okay! The correct answer was "${correctAnswer}". Every mistake is a learning opportunity! Keep trying! 💪`,
        SAGE: `Incorrect. The correct answer is "${correctAnswer}". Let's analyze why this is the case and understand the underlying principles.`,
        COACH: `Wrong answer! The correct one was "${correctAnswer}". Champions learn from mistakes. Analyze, adapt, and come back stronger!`
      }[personality];
    }

    res.status(200).json({
      success: true,
      data: {
        correct: isCorrect,
        score: earnedPoints,
        feedback: feedback,
        correctAnswer: correctAnswer,
        personality: personality
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get AI personality details
 */
exports.getPersonalities = async (req, res, next) => {
  try {
    const personalities = Object.entries(AI_PERSONALITIES).map(([key, value]) => ({
      id: key,
      name: value.name,
      style: value.style,
      traits: value.traits,
      description: `${value.name} is ${value.style} and focuses on ${value.traits.join(', ').toLowerCase()}.`
    }));

    res.status(200).json({
      success: true,
      data: {
        personalities,
        default: 'ARIA'
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Generate personalized study recommendations based on assessment performance
 */
exports.generateStudyRecommendations = async (req, res, next) => {
  try {
    const {
      assessmentResults,
      personality = 'ARIA',
      learningGoals,
      timeAvailable
    } = req.body;

    const selectedPersonality = AI_PERSONALITIES[personality];

    const recommendationPrompt = `
    Based on the following assessment results, generate personalized study recommendations:
    
    Assessment Score: ${assessmentResults.score}%
    Strengths: ${assessmentResults.strengths?.join(', ') || 'Not specified'}
    Weaknesses: ${assessmentResults.weaknesses?.join(', ') || 'Not specified'}
    Learning Goals: ${learningGoals || 'General improvement'}
    Time Available: ${timeAvailable || 'Flexible'}
    
    Provide recommendations in your ${selectedPersonality.style} style including:
    1. Priority topics to study
    2. Suggested learning resources
    3. Practice exercises
    4. Timeline for improvement
    5. Motivational message
    
    Format as JSON with structure:
    {
      "priorityTopics": ["topic1", "topic2"],
      "resources": ["resource1", "resource2"],
      "exercises": ["exercise1", "exercise2"],
      "timeline": "suggested timeline",
      "motivation": "personalized motivational message"
    }
    `;

    const completion = await openaiService.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: selectedPersonality.systemPrompt
        },
        {
          role: 'user',
          content: recommendationPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 600
    });

    let recommendations;
    try {
      recommendations = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback recommendations
      recommendations = {
        priorityTopics: ["Review fundamental concepts", "Practice problem-solving"],
        resources: ["Online tutorials", "Practice assessments", "Study guides"],
        exercises: ["Daily practice problems", "Timed quizzes"],
        timeline: "2-3 weeks of consistent study",
        motivation: AI_PERSONALITIES[personality].traits[0] + " message: Keep pushing forward!"
      };
    }

    recommendations.personality = personality;

    res.status(200).json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    next(error);
  }
};