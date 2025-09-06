const { AppError } = require('../middleware/errorHandler');
const { aiServiceManager } = require('../services/aiServiceManager');

/**
 * Generate assessment questions using AI based on topic and difficulty
 */
exports.generateQuestions = async (req, res, next) => {
  try {
    const {
      assessmentId,
      title,
      category,
      difficulty: rawDifficulty = 'intermediate',
      questionCount = 10,
      includeTypes = ['multiple_choice'], // Only multiple choice questions
      topic,
      subtopics: _subtopics = [],
    } = req.body;

    // Normalize difficulty to easy/medium/hard for consistent scoring/prompts
    const difficulty = (
      rawDifficulty === 'beginner' ? 'easy' :
        rawDifficulty === 'intermediate' ? 'medium' :
          (rawDifficulty === 'advanced' || rawDifficulty === 'expert') ? 'hard' :
            rawDifficulty
    );

    // Validate inputs
    if (!title || !category) {
      throw new AppError('Title and category are required', 400);
    }

    // Questions will be generated using AI Service Manager with optimized prompts

    let questions;
    try {
      // Use AI Service Manager for optimized question generation
      questions = await aiServiceManager.generateQuestions(
        title,
        category,
        topic || title,
        difficulty,
        questionCount,
        includeTypes,
      );
      
      console.log(`✅ Successfully generated ${questions.length} questions`);
      
    } catch (aiError) {
      console.error('❌ Question generation failed:', aiError.message);
      
      // Return error instead of fallback - we want real AI content only
      return res.status(500).json({
        success: false,
        error: 'Failed to generate questions',
        message: aiError.message,
        hint: 'Check AI service configuration',
      });
    }

    // If the AI returned no valid questions, generate sensible fallback ones
    if (!questions || questions.length === 0) {
      console.warn('⚠️ AI did not return any valid questions – generating fallback questions');
      questions = generateFallbackQuestions(title, category, difficulty, questionCount);
      console.log(`✅ Generated ${questions.length} fallback questions for "${title}"`);
    }

    // Add unique IDs and validate questions
    questions = questions.map((q, index) => ({
      ...q,
      id: `${assessmentId}_q${index + 1}`,
      difficulty: q.difficulty || difficulty,
      points: q.points || (difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10),
      timeLimit: q.timeLimit || 120,
    }));

    res.status(200).json({
      success: true,
      data: {
        assessmentId,
        questions,
        totalQuestions: questions.length,
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
        estimatedDuration: Math.ceil(questions.reduce((sum, q) => sum + (q.timeLimit || 120), 0) / 60),
      },
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    next(error);
  }
};

/**
 * Generate fallback questions if AI fails
 */
function generateFallbackQuestions(title, category, difficulty, count) {
  const questions = [];
  
  for (let i = 1; i <= count; i++) {
    // Create 4 options
    const options = [
      `Core concept A related to ${title}`,
      `Core concept B related to ${title}`,
      `Core concept C related to ${title}`,
      `Core concept D related to ${title}`,
    ];
    
    // Randomly select which option is correct (0-3)
    const correctIndex = Math.floor(Math.random() * 4);
    const correctAnswer = options[correctIndex];
    
    questions.push({
      id: `q${i}`,
      type: 'multiple_choice',
      question: `Question ${i}: What is a key concept in ${title}?`,
      options: options,
      correctAnswer: correctAnswer,
      points: difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10,
      difficulty,
      timeLimit: 120,
      hints: [`Think about the fundamentals of ${category}`],
      explanation: `This tests your understanding of ${title} concepts. The correct answer is "${correctAnswer}".`,
    });
  }
  
  return questions;
}

/**
 * Regenerate a specific question
 */
exports.regenerateQuestion = async (req, res, next) => {
  try {
    const {
      questionId,
      currentQuestion,
      reason,
      preferences,
    } = req.body;

    const prompt = `Regenerate this assessment question with improvements:

Current Question: ${currentQuestion.question}
Type: ${currentQuestion.type}
Reason for regeneration: ${reason || 'User requested a different question'}
${preferences ? `Preferences: ${preferences}` : ''}

Generate a new question that:
1. Tests the same concept differently
2. Maintains the same difficulty level (${currentQuestion.difficulty})
3. Uses the same question type
4. Avoids similarity to the original question

Provide the response in the same JSON format as before.`;

    const completion = await aiServiceManager.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert assessment designer. Create an alternative question that tests the same knowledge differently.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000, // Increased from 500 to ensure complete questions
    });

    let newQuestion;
    try {
      newQuestion = JSON.parse(completion.choices[0].message.content);
    } catch (_parseError) {
      // Return a slightly modified version of the original
      newQuestion = {
        ...currentQuestion,
        question: `Alternative: ${currentQuestion.question}`,
        id: questionId,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        question: {
          ...newQuestion,
          id: questionId,
        },
      },
    });

  } catch (error) {
    console.error('Error regenerating question:', error);
    next(error);
  }
};