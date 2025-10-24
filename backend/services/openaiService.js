// services/openaiService.js
const { AppError, catchAsync } = require('../middleware/errorHandler');

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY?.trim();
    this.baseURL = 'https://api.openai.com/v1';
    this.defaultModel = process.env.OPENAI_MODEL || 'o3-deep-research';
    this.fallbackModel = 'gpt-4o-mini';
    
    // Advanced models for different use cases
    this.models = {
      evaluation: process.env.OPENAI_EVALUATION_MODEL || 'gpt-4o',
      analysis: process.env.OPENAI_ANALYSIS_MODEL || 'gpt-4o-mini', 
      recommendations: process.env.OPENAI_RECOMMENDATIONS_MODEL || 'gpt-4o',
    };
    
    if (!this.apiKey || this.apiKey === '' || this.apiKey === 'your-api-key-here') {
      console.warn('⚠️  OPENAI_API_KEY not configured properly in environment variables');
      console.warn('⚠️  Please set OPENAI_API_KEY in your .env file');
      this.apiKey = null; // Ensure it's null for proper validation
    } else {
      console.log('✅ OpenAI service initialized with advanced configuration');
      console.log(`📋 Models configured: evaluation=${this.models.evaluation}, analysis=${this.models.analysis}, recommendations=${this.models.recommendations}`);
      console.log(`🔑 API key configured (${this.apiKey.substring(0, 7)}...)`);
    }
  }

  /**
   * Create chat completion with OpenAI (Enhanced with advanced features)
   * @param {Array} messages - Array of message objects [{role, content}]
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} OpenAI response with usage stats and logprobs
   */
  async createChatCompletion(messages, options = {}) {
    if (!this.apiKey) {
      throw new AppError('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.', 500);
    }

    const config = {
      model: options.model || this.defaultModel,
      messages: messages,
      temperature: options.temperature || parseFloat(process.env.OPENAI_TEMPERATURE) || 0.1,
      max_tokens: options.max_tokens || options.maxTokens || parseInt(process.env.OPENAI_MAX_TOKENS) || 1500,
      top_p: options.top_p || options.topP || 1,
      frequency_penalty: options.frequency_penalty || options.frequencyPenalty || parseFloat(process.env.OPENAI_FREQUENCY_PENALTY) || 0.1,
      presence_penalty: options.presence_penalty || options.presencePenalty || parseFloat(process.env.OPENAI_PRESENCE_PENALTY) || 0.1,
      user: options.userId || undefined,
    };

    // Add advanced features if requested
    if (options.logprobs || process.env.OPENAI_ENABLE_LOGPROBS === 'true') {
      config.logprobs = true;
      config.top_logprobs = options.top_logprobs || parseInt(process.env.OPENAI_TOP_LOGPROBS) || 5;
    }

    // Add structured output if requested
    if (options.response_format) {
      config.response_format = options.response_format;
    }

    // Add tool support if requested
    if (options.tools) {
      config.tools = options.tools;
    }

    if (options.tool_choice) {
      config.tool_choice = options.tool_choice;
    }

    try {
      console.log(`🤖 Making OpenAI request with model: ${config.model} | temp: ${config.temperature} | max_tokens: ${config.max_tokens}`);
      
      if (config.logprobs) {
        console.log(`🎯 Logprobs enabled with top_logprobs: ${config.top_logprobs}`);
      }

      if (config.response_format) {
        console.log(`📋 Structured output requested: ${config.response_format.type}`);
      }
      
      // Enable streaming if requested
      if (options.stream) {
        config.stream = true;
      }

      const response = await this.makeAPIRequest('/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      // If streaming, return async iterator of chunks
      if (options.stream) {
        if (!response.ok) {
          const errText = await response.text();
          throw new AppError(`OpenAI stream error: ${errText}`, response.status);
        }

        const reader = response.body.getReader();
        async function* streamGenerator() {
          const decoder = new TextDecoder();
          let done, value;
          while (true) {
            ({ done, value } = await reader.read());
            if (done) break;
            yield decoder.decode(value, { stream: true });
          }
        }
        return { stream: streamGenerator() };
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, try to get text response for better error message
        const textResponse = await response.text().catch(() => 'Unable to read response');
        if (textResponse.includes('<!DOCTYPE') || textResponse.includes('<html')) {
          throw new AppError(
            'OpenAI API returned HTML instead of JSON. This usually means:\n' +
            '1. Invalid or missing API key\n' +
            '2. API endpoint is incorrect\n' +
            '3. Network/proxy issue\n' +
            'Please verify your OPENAI_API_KEY in .env file.',
            response.status || 500,
          );
        }
        throw new AppError(
          `Invalid response from OpenAI API: ${jsonError.message}`,
          response.status || 500,
        );
      }

      if (!response.ok) {
        throw new AppError(
          `OpenAI API error: ${data.error?.message || 'Unknown error'}`,
          response.status,
        );
      }

      // Log usage for monitoring
      this.logUsage(data.usage, config.model);

      const result = {
        content: data.choices[0].message.content,
        role: data.choices[0].message.role,
        finishReason: data.choices[0].finish_reason,
        usage: data.usage,
        model: data.model,
        id: data.id,
        created: data.created,
      };

      // Add logprobs if available
      if (data.choices[0].logprobs) {
        result.logprobs = data.choices[0].logprobs;
        console.log(`📊 Logprobs included in response (${data.choices[0].logprobs.content?.length || 0} tokens)`);
      }

      // Add tool calls if available
      if (data.choices[0].message.tool_calls) {
        result.tool_calls = data.choices[0].message.tool_calls;
      }

      return result;

    } catch (error) {
      // Retry with fallback model if primary fails
      if (config.model === this.defaultModel && !options.noFallback) {
        console.log(`🔄 Retrying with fallback model: ${this.fallbackModel}`);
        
        return this.createChatCompletion(messages, {
          ...options,
          model: this.fallbackModel,
          noFallback: true,
        });
      }
      
      throw this.handleAPIError(error);
    }
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Fetch configuration
   * @param {number} retries - Number of retries remaining
   * @returns {Promise<Response>} Fetch response
   */
  async makeAPIRequest(endpoint, config, retries = 3) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, config);
      return response;
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.log(`🔄 Retrying API request (${retries} retries left)...`);
        await this.sleep(Math.pow(2, 4 - retries) * 1000); // Exponential backoff
        return this.makeAPIRequest(endpoint, config, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Estimate token count for text (rough approximation)
   * @param {string} text - Text to count tokens for
   * @returns {number} Estimated token count
   */
  estimateTokenCount(text) {
    if (!text || typeof text !== 'string') return 0;
    
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate and optimize messages for token limits
   * @param {Array} messages - Array of message objects
   * @param {number} maxTokens - Maximum token limit
   * @returns {Array} Optimized messages array
   */
  optimizeMessages(messages, maxTokens = 3500) {
    let totalTokens = messages.reduce((sum, msg) => 
      sum + this.estimateTokenCount(msg.content), 0,
    );

    // If within limits, return as-is
    if (totalTokens <= maxTokens) {
      return messages;
    }

    console.log(`📝 Optimizing messages: ${totalTokens} tokens → target: ${maxTokens}`);

    // Keep system message and most recent user/assistant messages
    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    // Start with system messages
    let optimizedMessages = [...systemMessages];
    let currentTokens = systemMessages.reduce((sum, msg) => 
      sum + this.estimateTokenCount(msg.content), 0,
    );

    // Add recent conversation messages from the end
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
      const msg = conversationMessages[i];
      const msgTokens = this.estimateTokenCount(msg.content);
      
      if (currentTokens + msgTokens <= maxTokens) {
        optimizedMessages.unshift(msg);
        currentTokens += msgTokens;
      } else {
        break;
      }
    }

    console.log(`✂️  Trimmed to ${optimizedMessages.length} messages (${currentTokens} tokens)`);
    return optimizedMessages;
  }

  /**
   * Validate OpenAI response quality
   * @param {Object} response - OpenAI response object
   * @returns {boolean} Whether response is valid
   */
  validateResponse(response) {
    if (!response || !response.content) {
      return false;
    }

    // Check for common OpenAI error patterns
    const errorPatterns = [
      'I apologize, but I cannot',
      'I\'m not able to help',
      'I don\'t have access to',
      'As an AI language model',
    ];

    const hasErrorPattern = errorPatterns.some(pattern => 
      response.content.toLowerCase().includes(pattern.toLowerCase()),
    );

    // Check minimum content length
    const hasMinimumContent = response.content.trim().length >= 10;

    // Check finish reason
    const completedProperly = response.finishReason === 'stop';

    return !hasErrorPattern && hasMinimumContent && completedProperly;
  }

  /**
   * Handle API errors with appropriate error types
   * @param {Error} error - Original error
   * @returns {AppError} Formatted application error
   */
  handleAPIError(error) {
    console.error('🚨 OpenAI API Error:', error);

    if (error.name === 'AppError') {
      return error;
    }

    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new AppError('Unable to connect to OpenAI service', 503);
    }

    // Timeout errors
    if (error.code === 'ETIMEDOUT') {
      return new AppError('OpenAI request timeout', 504);
    }

    // Default error
    return new AppError(`OpenAI service error: ${error.message}`, 500);
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error should be retried
   */
  isRetryableError(error) {
    const retryableCodes = [
      'ECONNRESET',
      'ETIMEDOUT', 
      'ECONNREFUSED',
      'ENOTFOUND',
    ];
    
    const retryableStatusCodes = [429, 500, 502, 503, 504];
    
    return retryableCodes.includes(error.code) || 
           retryableStatusCodes.includes(error.status);
  }

  /**
   * Log API usage for monitoring
   * @param {Object} usage - OpenAI usage object
   * @param {string} model - Model used
   */
  logUsage(usage, model) {
    if (!usage) return;

    const { prompt_tokens, completion_tokens, total_tokens } = usage;
    
    console.log(`📊 OpenAI Usage - Model: ${model} | Prompt: ${prompt_tokens} | Completion: ${completion_tokens} | Total: ${total_tokens} tokens`);
    
    // In production, you might want to store this in database for cost tracking
    // await UsageLog.create({ model, promptTokens: prompt_tokens, completionTokens: completion_tokens, totalTokens: total_tokens, timestamp: new Date() });
  }

  /**
   * Get available models
   * @returns {Array} Array of available model names
   */
  getAvailableModels() {
    return [
      'gpt-4',
      'gpt-4-turbo-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'o3-deep-research',
    ];
  }

  /**
   * Get model pricing (tokens per dollar - approximate)
   * @param {string} model - Model name
   * @returns {Object} Pricing information
   */
  getModelPricing(model) {
    const pricing = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
      'o3-deep-research': { input: 0.05, output: 0.15 }, // Estimated pricing for o3-deep-research
    };

    return pricing[model] || pricing['gpt-3.5-turbo'];
  }

  /**
   * Calculate cost for usage
   * @param {Object} usage - Usage object from OpenAI
   * @param {string} model - Model used
   * @returns {number} Cost in USD
   */
  calculateCost(usage, model) {
    if (!usage) return 0;

    const pricing = this.getModelPricing(model);
    const inputCost = (usage.prompt_tokens / 1000) * pricing.input;
    const outputCost = (usage.completion_tokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Sleep utility for delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for OpenAI service
   * @returns {Promise<boolean>} Whether service is available
   */
  async healthCheck() {
    try {
      const response = await this.createChatCompletion([
        { role: 'user', content: 'Hello' },
      ], { 
        maxTokens: 5,
        model: this.fallbackModel, // Use cheaper model for health check
      });

      return response && response.content;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const openAIService = new OpenAIService();

module.exports = {
  openAIService,
  OpenAIService,
};