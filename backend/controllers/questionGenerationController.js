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
      includeTypes = ['multiple_choice', 'text', 'essay'],
      topic,
      subtopics = [],
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

    // Build the prompt for question generation
    const prompt = `Generate ${questionCount} assessment questions for an assessment titled "${title}" in the category "${category}".

Topic: ${topic || title}
${subtopics.length > 0 ? `Subtopics to cover: ${subtopics.join(', ')}` : ''}
Difficulty Level: ${difficulty}
Question Types to include: ${includeTypes.join(', ')}

For each question, provide:
1. A clear, specific question
2. The question type (multiple_choice, text, essay, or code)
3. For multiple choice: 4 options with one correct answer
4. Points value (easy: 5-10, medium: 10-15, hard: 15-20)
5. Estimated time to answer (in seconds)
6. A hint to help the student
7. An explanation of the correct answer

Please ensure questions progressively increase in complexity and cover different aspects of the topic.
Mix theoretical knowledge with practical application.

Format the response as a JSON array with the following structure:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "question text",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": "correct option",
    "points": 10,
    "difficulty": "${difficulty}",
    "timeLimit": 120,
    "category": "subcategory",
    "hints": ["hint text"],
    "explanation": "explanation text"
  },
  {
    "id": "q2",
    "type": "text",
    "question": "question text",
    "points": 15,
    "difficulty": "${difficulty}",
    "timeLimit": 180,
    "category": "subcategory",
    "hints": ["hint text"],
    "explanation": "what makes a good answer"
  }
]`;

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
  const types = ['multiple_choice', 'text', 'essay'];
  
  for (let i = 1; i <= count; i++) {
    const type = types[i % types.length];
    
    if (type === 'multiple_choice') {
      questions.push({
        id: `q${i}`,
        type: 'multiple_choice',
        question: `Question ${i}: What is a key concept in ${title}?`,
        options: [
          `Option A for question ${i}`,
          `Option B for question ${i}`,
          `Option C for question ${i}`,
          `Option D for question ${i}`,
        ],
        correctAnswer: `Option A for question ${i}`,
        points: difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10,
        difficulty,
        timeLimit: 120,
        hints: [`Think about the fundamentals of ${category}`],
        explanation: `This tests your understanding of ${title} concepts.`,
      });
    } else if (type === 'text') {
      questions.push({
        id: `q${i}`,
        type: 'text',
        question: `Question ${i}: Explain a concept related to ${title} in your own words.`,
        points: difficulty === 'easy' ? 10 : difficulty === 'hard' ? 20 : 15,
        difficulty,
        timeLimit: 180,
        hints: [`Consider the practical applications in ${category}`],
        explanation: `A good answer should demonstrate understanding of ${title}.`,
      });
    } else {
      questions.push({
        id: `q${i}`,
        type: 'essay',
        question: `Question ${i}: Discuss the importance of ${title} in the context of ${category}.`,
        points: difficulty === 'easy' ? 15 : difficulty === 'hard' ? 25 : 20,
        difficulty,
        timeLimit: 300,
        hints: ['Think about real-world applications and best practices'],
        explanation: `This requires comprehensive understanding of ${title}.`,
      });
    }
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
      max_tokens: 500,
    });

    let newQuestion;
    try {
      newQuestion = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
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