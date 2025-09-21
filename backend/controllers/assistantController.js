// backend/controllers/assistantController.js
const { v4: uuidv4 } = require('uuid');
const { openAIService } = require('../services/openaiService');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

/**
 * Lightweight AI assistant: no personality, no DB prompt lookup.
 * POST /api/assistant/chat  (optionally ?stream=1 for SSE streaming)
 */
exports.chat = async (req, res, next) => {
  try {
    const user = req.user; // set by authenticateWithClerk
    if (!user) throw new AppError('Authentication required', 401);

    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new AppError('Message is required', 400);
    }

    // Ensure aiChats array exists
    if (!user.aiChats) user.aiChats = [];

    // Ensure an active session in embedded array
    let session = user.aiChats[user.aiChats.length - 1];
    if (!session || session.status === 'closed') {
      session = {
        sessionId: uuidv4(),
        aiPersonality: 'NEUTRAL',
        startTime: new Date(),
        status: 'active',
        messages: [],
        lastInteraction: new Date(),
        messageCount: 0,
      };
      user.aiChats.push(session);
    }

    // Add user message
    const userMsg = {
      messageId: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    session.messages.push(userMsg);
    session.lastInteraction = new Date();
    session.messageCount += 1;

    // Prepare prompt: system + recent
    const recent = session.messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    const messages = [
      { role: 'system', content: 'You are a helpful learning assistant.' },
      ...recent,
    ];

    const wantStream = req.query.stream === '1' || req.headers.accept === 'text/event-stream';

    if (wantStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.flushHeaders && res.flushHeaders();

      const { stream } = await openAIService.createChatCompletion(messages, {
        model: 'gpt-3.5-turbo',
        stream: true,
      });

      let assistantContent = '';
      let buffer = '';
      for await (const chunk of stream) {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete
        for (const l of lines) {
          if (!l.startsWith('data:')) continue;
          const data = l.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const obj = JSON.parse(data);
            const token = obj.choices?.[0]?.delta?.content || '';
            if (token) {
              assistantContent += token;
              res.write(`data:${token}\n\n`);
            }
          } catch (_) {
            // ignore parse errors
          }
        }
      }
      res.end();

      session.messages.push({
        messageId: uuidv4(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      });
      session.messageCount += 1;
      if (typeof user.save === 'function') await user.save();
      return;
    }

    // Non-streaming mode
    const aiResp = await openAIService.createChatCompletion(messages, { model: 'gpt-3.5-turbo' });

    session.messages.push({
      messageId: uuidv4(),
      role: 'assistant',
      content: aiResp.content,
      timestamp: new Date(),
    });
    session.messageCount += 1;
    if (typeof user.save === 'function') await user.save();

    res.json({ reply: aiResp.content, sessionId: session.sessionId });
  } catch (err) {
    next(err);
  }
};
