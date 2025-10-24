// services/titleGenerationService.js
const { openAIService } = require('./openaiService');

class TitleGenerationService {
  /**
   * Generate a concise, meaningful title for a conversation based on messages
   * @param {Array} messages - Array of conversation messages
   * @param {number} maxLength - Maximum title length (default: 50)
   * @returns {Promise<string>} - Generated title
   */
  async generateTitle(messages, maxLength = 50) {
    try {
      // Filter user messages only (first 3-5 messages for context)
      const userMessages = messages
        .filter(msg => msg.role === 'user')
        .slice(0, 5)
        .map(msg => msg.content);

      if (userMessages.length === 0) {
        return 'New Conversation';
      }

      // If only one message and it's short enough, use it as title
      if (userMessages.length === 1 && userMessages[0].length <= maxLength) {
        return userMessages[0].trim();
      }

      // Use AI to generate a concise title
      const conversationContext = userMessages.join('\n');
      
      const prompt = `Based on the following conversation messages, generate a concise, descriptive title (maximum ${maxLength} characters). The title should capture the main topic or question.

Messages:
${conversationContext}

Rules:
- Maximum ${maxLength} characters
- Be specific and descriptive
- No quotes around the title
- No punctuation at the end
- Capture the core topic or question
- Make it sound natural

Title:`;

      const response = await openAIService.createChatCompletion(
        [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise, descriptive titles for conversations. Generate only the title text, nothing else.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          model: 'gpt-4o-mini', // Use faster, cheaper model for titles
          temperature: 0.7,
          max_tokens: 30,
        }
      );

      let generatedTitle = response.content.trim();
      
      // Clean up the title
      generatedTitle = generatedTitle
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/[.!?]+$/, '') // Remove ending punctuation
        .trim();

      // Truncate if too long
      if (generatedTitle.length > maxLength) {
        generatedTitle = generatedTitle.substring(0, maxLength - 3) + '...';
      }

      // Fallback to first message if generation failed
      if (!generatedTitle || generatedTitle.length < 3) {
        generatedTitle = userMessages[0].substring(0, maxLength - 3) + '...';
      }

      return generatedTitle;

    } catch (error) {
      console.error('❌ Title generation error:', error);
      
      // Fallback: use first user message
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        const fallbackTitle = firstUserMessage.content.substring(0, maxLength - 3).trim();
        return fallbackTitle.length > 0 ? fallbackTitle + '...' : 'New Conversation';
      }
      
      return 'New Conversation';
    }
  }

  /**
   * Generate title from a session's messages
   * @param {Object} session - AISession document
   * @returns {Promise<string>} - Generated title
   */
  async generateTitleFromSession(session) {
    if (!session || !session.messages || session.messages.length === 0) {
      return 'New Conversation';
    }

    return this.generateTitle(session.messages);
  }

  /**
   * Check if a conversation needs a title update
   * (e.g., still has default title and has messages)
   * @param {Object} session - AISession document
   * @returns {boolean}
   */
  needsTitleGeneration(session) {
    if (!session) return false;
    
    const hasDefaultTitle = !session.title || 
                           session.title === 'New Conversation' ||
                           session.title.trim() === '';
    
    const hasMessages = session.messages && session.messages.length > 0;
    const hasUserMessage = session.messages.some(msg => msg.role === 'user');
    
    return hasDefaultTitle && hasMessages && hasUserMessage;
  }

  /**
   * Generate titles for multiple sessions in batch
   * @param {Array} sessions - Array of AISession documents
   * @returns {Promise<Array>} - Array of titles
   */
  async generateTitlesBatch(sessions) {
    const titlePromises = sessions.map(session => 
      this.generateTitleFromSession(session).catch(err => {
        console.error(`Failed to generate title for session ${session.sessionId}:`, err);
        return 'New Conversation';
      })
    );

    return Promise.all(titlePromises);
  }
}

// Export singleton instance
const titleGenerationService = new TitleGenerationService();
module.exports = { titleGenerationService, TitleGenerationService };

