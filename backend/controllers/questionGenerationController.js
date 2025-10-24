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
    const wantStream = req.query.stream === '1' || req.headers.accept === 'text/event-stream';

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

    // Non-streaming mode (default): generate all at once
    if (!wantStream) {
      let questions;
      try {
        questions = await aiServiceManager.generateQuestions(
          title,
          category,
          topic || title,
          difficulty,
          questionCount,
          includeTypes,
          { subtopics: _subtopics },
        );
        console.log(`✅ Successfully generated ${questions.length} questions`);
      } catch (aiError) {
        console.error('❌ Question generation failed:', aiError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate questions',
          message: aiError.message,
          hint: 'Check AI service configuration',
        });
      }

      if (!questions || questions.length === 0) {
        console.warn('⚠️ AI did not return any valid questions – generating fallback questions');
        questions = generateFallbackQuestions(title, category, difficulty, questionCount);
      }

      questions = questions.map((q, index) => ({
        ...q,
        id: `${assessmentId}_q${index + 1}`,
        difficulty: q.difficulty || difficulty,
        points: q.points || (difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10),
        timeLimit: q.timeLimit || 300,
      }));

      return res.status(200).json({
        success: true,
        data: {
          assessmentId,
          questions,
          totalQuestions: questions.length,
          totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
          estimatedDuration: Math.ceil(questions.reduce((sum, q) => sum + (q.timeLimit || 300), 0) / 60),
        },
      });
    }

    // Streaming mode: send first 5, then stream the rest in batches
    const totalCount = Math.min(parseInt(questionCount, 10) || 10, 40);
    const chunkSize = Math.max(1, Math.min(parseInt(req.query.chunkSize, 10) || 5, 10));
    const topicText = topic || title;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    function sse(obj) {
      try {
        res.write(`data:${JSON.stringify(obj)}\n\n`);
      } catch (_) {
        // ignore write errors
      }
    }

    // Send init event
    sse({ type: 'init', payload: { assessmentId, totalQuestions: totalCount, chunkSize } });

    const allQuestions = [];
    const seenQuestions = new Set();
    let generated = 0;

    async function generateBatch(batchCount) {
      const avoid = Array.from(seenQuestions);
      let batch = [];
      try {
        batch = await aiServiceManager.generateQuestions(
          title,
          category,
          topicText,
          difficulty,
          batchCount,
          includeTypes,
          { avoidQuestions: avoid, subtopics: _subtopics },
        );
      } catch (err) {
        console.error('❌ Batch generation failed:', err.message);
        return [];
      }

      if (!batch || batch.length === 0) {
        // try fallback for this batch
        batch = generateFallbackQuestions(title, category, difficulty, batchCount);
      }

      const mapped = batch.map((q, i) => {
        const idx = generated + i;
        return {
          ...q,
          id: `${assessmentId}_q${idx + 1}`,
          difficulty: q.difficulty || difficulty,
          points: q.points || (difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10),
          timeLimit: q.timeLimit || 300,
        };
      });

      // track seen
      for (const q of mapped) {
        if (q && typeof q.question === 'string') seenQuestions.add(q.question);
      }

      return mapped;
    }

    try {
      // First chunk
      const firstCount = Math.min(chunkSize, totalCount);
      const firstBatch = await generateBatch(firstCount);
      allQuestions.push(...firstBatch);
      generated += firstBatch.length;
      sse({ type: 'batch', payload: { startIndex: 0, questions: firstBatch } });

      // Remaining chunks
      while (generated < totalCount) {
        const remaining = totalCount - generated;
        const nextCount = Math.min(chunkSize, remaining);
        const nextBatch = await generateBatch(nextCount);
        const startIndex = generated;
        allQuestions.push(...nextBatch);
        generated += nextBatch.length;
        sse({ type: 'batch', payload: { startIndex, questions: nextBatch } });
      }

      // Summary event
      const totalPoints = allQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
      const estimatedDuration = Math.ceil(allQuestions.reduce((sum, q) => sum + (q.timeLimit || 300), 0) / 60);
      sse({ type: 'complete', payload: { totalQuestions: allQuestions.length, totalPoints, estimatedDuration } });
    } catch (streamErr) {
      console.error('❌ Streaming generation error:', streamErr);
      sse({ type: 'error', payload: { message: streamErr.message || 'Unknown error' } });
    } finally {
      res.end();
    }

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
      timeLimit: 300,
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