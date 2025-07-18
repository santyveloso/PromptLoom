import { describe, it, expect, vi, beforeEach } from "vitest";
import GeminiClient from "../geminiClient.js";

// Mock fetch
global.fetch = vi.fn();

describe("GeminiClient", () => {
  let client;
  const mockApiKey = "test-api-key";

  beforeEach(() => {
    client = new GeminiClient(mockApiKey);
    vi.clearAllMocks();
  });

  it("should create client with API key", () => {
    expect(client.apiKey).toBe(mockApiKey);
    expect(client.model).toBe("gemini-2.0-flash");
  });

  it("should make successful API request", async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: "Generated content" }],
          },
        },
      ],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.makeRequest("Test prompt");
    expect(result).toBe("Generated content");
  });

  it("should handle API errors gracefully", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    await expect(client.makeRequest("Test prompt")).rejects.toThrow(
      "Too many requests. Please wait a moment and try again."
    );
  });

  it("should generate block content for different types", async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: "Task content" }],
          },
        },
      ],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.generateBlockContent("Task");
    expect(result).toBe("Task content");
  });

  it("should enforce rate limiting", async () => {
    // Fill up the rate limit
    for (let i = 0; i < 15; i++) {
      client.requestTimes.push(Date.now());
    }

    await expect(client.makeRequest("Test prompt")).rejects.toThrow(
      "Please wait a moment before making another request."
    );
  });
});
