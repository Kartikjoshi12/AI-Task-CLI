import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { OpenRouterProvider } from "../../src/ai/openrouter.js";

const VALID_RESPONSE = {
  choices: [
    {
      message: {
        content: '{"title":"Buy milk","priority":"medium"}',
      },
    },
  ],
};

function mockFetch(response: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: vi.fn().mockResolvedValue(response),
  });
}

describe("OpenRouterProvider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("constructor / API key resolution", () => {
    it("throws when no API key is available", async () => {
      delete process.env.OPENROUTER_API_KEY;
      const provider = new OpenRouterProvider();
      await expect(provider.parse("test")).rejects.toThrow(
        "OpenRouter API key not found",
      );
    });

    it("reads API key from env when not passed to constructor", async () => {
      process.env.OPENROUTER_API_KEY = "sk-env-key";
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch(VALID_RESPONSE),
      );

      const provider = new OpenRouterProvider();
      await provider.parse("test");
      const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0][1] as { headers: Record<string, string> };
      expect(headers.headers.Authorization).toBe("Bearer sk-env-key");
    });

    it("prefers constructor apiKey over env var", async () => {
      process.env.OPENROUTER_API_KEY = "sk-env-key";
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch(VALID_RESPONSE),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-explicit" });
      await provider.parse("test");
      const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0][1] as { headers: Record<string, string> };
      expect(headers.headers.Authorization).toBe("Bearer sk-explicit");
    });
  });

  describe("model configuration", () => {
    it("uses default model when not configured", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch(VALID_RESPONSE),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      await provider.parse("test");
      const body = JSON.parse(
        ((globalThis.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0][1] as { body: string }).body,
      );
      expect(body.model).toBe("deepseek/deepseek-chat-v3.1");
    });

    it("respects constructor model option", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch(VALID_RESPONSE),
      );

      const provider = new OpenRouterProvider({
        apiKey: "sk-key",
        model: "anthropic/claude-3.5-sonnet",
      });
      await provider.parse("test");
      const body = JSON.parse(
        ((globalThis.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0][1] as { body: string }).body,
      );
      expect(body.model).toBe("anthropic/claude-3.5-sonnet");
    });

    it("reads model from OPENROUTER_MODEL env var", async () => {
      process.env.OPENROUTER_MODEL = "google/gemini-2.0-flash-001";
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch(VALID_RESPONSE),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      await provider.parse("test");
      const body = JSON.parse(
        ((globalThis.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0][1] as { body: string }).body,
      );
      expect(body.model).toBe("google/gemini-2.0-flash-001");

      delete process.env.OPENROUTER_MODEL;
    });
  });

  describe("API request structure", () => {
    it("sends messages, response_format, and temperature", async () => {
      const fetchMock = mockFetch(VALID_RESPONSE);
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        fetchMock,
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      await provider.parse("hello");

      const body = JSON.parse(
        (fetchMock.mock.calls[0][1] as { body: string }).body,
      );
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe("system");
      expect(body.messages[0].content).toContain("task parser");
      expect(body.messages[1].role).toBe("user");
      expect(body.messages[1].content).toBe("hello");
      expect(body.response_format).toEqual({ type: "json_object" });
      expect(body.temperature).toBe(0);
    });

    it("sends Authorization header", async () => {
      const fetchMock = mockFetch(VALID_RESPONSE);
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        fetchMock,
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-secret" });
      await provider.parse("test");

      const headers = (fetchMock.mock.calls[0][1] as { headers: Record<string, string> }).headers;
      expect(headers.Authorization).toBe("Bearer sk-secret");
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("calls the correct OpenRouter URL", async () => {
      const fetchMock = mockFetch(VALID_RESPONSE);
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        fetchMock,
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      await provider.parse("test");

      const url = fetchMock.mock.calls[0][0];
      expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    });
  });

  describe("parse / successful responses", () => {
    it("returns a full ParseResult from valid JSON", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "Fix login bug",
                  assignee: "Rahul",
                  due: "tomorrow",
                  priority: "high",
                  tags: "bug, auth",
                  project: "webapp",
                  content: "Check JWT expiry",
                  dependsOn: "",
                  recurring: "",
                }),
              },
            },
          ],
        }),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      const result = await provider.parse("Rahul ko login bug theek karna hai");

      expect(result.title).toBe("Fix login bug");
      expect(result.assignee).toBe("Rahul");
      expect(result.due).toBe("tomorrow");
      expect(result.priority).toBe("high");
      expect(result.tags).toBe("bug, auth");
      expect(result.project).toBe("webapp");
      expect(result.content).toBe("Check JWT expiry");
      expect(result.dependsOn).toBe("");
      expect(result.recurring).toBe("");
    });

    it("fills defaults for missing optional fields", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          choices: [
            {
              message: {
                content: '{"title":"Buy groceries"}',
              },
            },
          ],
        }),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      const result = await provider.parse("Buy groceries");

      expect(result.title).toBe("Buy groceries");
      expect(result.assignee).toBe("");
      expect(result.due).toBe("");
      expect(result.priority).toBe("medium");
      expect(result.tags).toBe("");
      expect(result.project).toBe("");
      expect(result.content).toBe("");
      expect(result.dependsOn).toBe("");
      expect(result.recurring).toBe("");
    });

    it("falls back to original input when title is missing", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          choices: [
            {
              message: {
                content: "{}",
              },
            },
          ],
        }),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      const result = await provider.parse("My custom task");
      expect(result.title).toBe("My custom task");
    });

    it("normalises invalid priority to medium", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          choices: [
            {
              message: {
                content: '{"title":"T","priority":"super-urgent"}',
              },
            },
          ],
        }),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      const result = await provider.parse("t");
      expect(result.priority).toBe("medium");
    });

    it("accepts 'none' and 'urgent' as valid priorities", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          choices: [
            {
              message: {
                content: '{"title":"T","priority":"none"}',
              },
            },
          ],
        }),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      const result = await provider.parse("t");
      expect(result.priority).toBe("none");
    });
  });

  describe("error handling", () => {
    it("throws on HTTP 401 with API error detail", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({ error: { message: "Invalid API key" } }, false, 401),
      );

      const provider = new OpenRouterProvider({ apiKey: "bad-key" });
      await expect(provider.parse("test")).rejects.toThrow(
        "OpenRouter API error (401): Invalid API key",
      );
    });

    it("throws on HTTP 402 (insufficient credits)", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch(
          { error: { message: "Insufficient credits" } },
          false,
          402,
        ),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      await expect(provider.parse("test")).rejects.toThrow(
        "OpenRouter API error (402): Insufficient credits",
      );
    });

    it("retries on 429 then succeeds", async () => {
      const successResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(VALID_RESPONSE),
      };
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
          json: vi.fn().mockResolvedValue({ error: { message: "rate limit" } }),
        })
        .mockResolvedValueOnce(successResponse);

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        fetchMock,
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      const result = await provider.parse("test");
      expect(result.title).toBe("Buy milk");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("retries on 503 then succeeds", async () => {
      const successResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(VALID_RESPONSE),
      };
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: "Service Unavailable",
          json: vi.fn().mockResolvedValue({}),
        })
        .mockResolvedValueOnce(successResponse);

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        fetchMock,
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      const result = await provider.parse("test");
      expect(result.title).toBe("Buy milk");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("gives up after max retries and throws", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: vi.fn().mockResolvedValue({ error: { message: "rate limit" } }),
      });

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        fetchMock,
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      await expect(provider.parse("test")).rejects.toThrow(
        "OpenRouter API error (429): rate limit",
      );
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("throws on non-retryable 4xx immediately", async () => {
      const fetchMock = mockFetch(
        { error: { message: "bad request" } },
        false,
        400,
      );
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        fetchMock,
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      await expect(provider.parse("test")).rejects.toThrow(
        "OpenRouter API error (400): bad request",
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("throws on network failure", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("ENOTFOUND"),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      await expect(provider.parse("test")).rejects.toThrow(
        "Failed to call OpenRouter API",
      );
    });

    it("throws on request timeout", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        Object.assign(new Error("The operation was aborted"), {
          name: "AbortError",
        }),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      await expect(provider.parse("test")).rejects.toThrow(
        "OpenRouter request timed out after 30s",
      );
    });

    it("throws on empty response content", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          choices: [
            {
              message: {
                content: "",
              },
            },
          ],
        }),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      await expect(provider.parse("test")).rejects.toThrow(
        "OpenRouter returned an empty response",
      );
    });

    it("throws on invalid JSON", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          choices: [
            {
              message: {
                content: "this is not json",
              },
            },
          ],
        }),
      );

      const provider = new OpenRouterProvider({ apiKey: "sk-key" });
      await expect(provider.parse("test")).rejects.toThrow(
        "OpenRouter returned invalid JSON",
      );
    });
  });
});
