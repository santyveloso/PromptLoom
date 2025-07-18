/**
 * Simple Gemini API Client for PromptStitch v2
 * Basic API communication with user-friendly error handling
 */

class GeminiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = "https://generativelanguage.googleapis.com/v1beta";
    this.model = "gemini-2.5-flash";

    // Simple rate limiting - track requests per minute
    this.requestTimes = [];
    this.maxRequestsPerMinute = 9;
  }

  /**
   * Simple rate limiting check
   */
  checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old requests
    this.requestTimes = this.requestTimes.filter((time) => time > oneMinuteAgo);

    if (this.requestTimes.length >= this.maxRequestsPerMinute) {
      throw new Error("Please wait a moment before making another request.");
    }

    this.requestTimes.push(now);
  }

  /**
   * Make API request with basic error handling
   */
  async makeRequest(prompt, options = {}) {
    this.checkRateLimit();

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 256,
      },
    };

    try {
      const response = await fetch(
        `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}:`, errorText);

        if (response.status === 429) {
          throw new Error(
            "Too many requests. Please wait a moment and try again."
          );
        } else if (response.status === 401 || response.status === 403) {
          throw new Error("Invalid API key. Please check your settings.");
        } else if (response.status === 400) {
          throw new Error("Invalid request. Please try a different prompt.");
        } else {
          throw new Error(
            `API Error (${response.status}): ${
              errorText || "Something went wrong. Please try again."
            }`
          );
        }
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No content generated. Please try again.");
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  /**
   * Generate content for specific block types
   */
  async generateBlockContent(blockType, existingBlocks = []) {
    const prompts = {
      Task: "Write a clear, specific task for an AI prompt. Make it actionable and focused. Just the task, no extra text.",

      Tone: "Suggest an appropriate tone for an AI prompt. Choose from: professional, casual, friendly, authoritative, creative. Just the tone word.",

      Format:
        "Suggest a good output format for an AI response. Options: paragraph, list, steps, table, bullet points. Just the format word.",

      Persona:
        'Describe a helpful persona/role for an AI assistant. Keep it brief and specific. Start with "You are a..."',

      Constraint:
        'Suggest a useful constraint or guideline for an AI response. Be specific and practical. Start with "Please..."',
    };

    const prompt =
      prompts[blockType] ||
      `Generate helpful content for a ${blockType} block.`;

    return this.makeRequest(prompt, {
      maxOutputTokens: 100,
      temperature: 0.8,
    });
  }

  /**
   * Generate suggestions for a block
   */
  async generateSuggestions(blockType, count = 3) {
    const suggestions = [];

    for (let i = 0; i < count; i++) {
      try {
        const content = await this.generateBlockContent(blockType);
        suggestions.push(content);

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to generate suggestion ${i + 1}:`, error);
        break; // Stop if we hit an error
      }
    }

    return suggestions;
  }
}

export default GeminiClient;
