import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GeminiProvider } from "../../src/ai/gemini.js";

function mockFetch(response: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: vi.fn().mockResolvedValue(response),
  });
}

describe("GeminiProvider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("throws when no API key is available", async () => {
    delete process.env.GEMINI_API_KEY;
    const provider = new GeminiProvider();
    await expect(provider.parse("test")).rejects.toThrow(
      "Gemini API key not found",
    );
  });

  it("uses the constructor apiKey over the env var", async () => {
    process.env.GEMINI_API_KEY = "env-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      mockFetch({
        candidates: [
          {
            content: {
              parts: [{ text: '{"title":"Buy milk"}' }],
            },
          },
        ],
      }),
    );

    const provider = new GeminiProvider("explicit-key");
    const result = await provider.parse("buy milk");
    expect(result.title).toBe("Buy milk");

    const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(callUrl).toContain("explicit-key");
    expect(callUrl).not.toContain("env-key");
  });

  describe("parse", () => {
    it("returns a valid ParseResult from Gemini JSON response", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      title: "Fix login bug",
                      assignee: "Rahul",
                      due: "tomorrow",
                      priority: "high",
                      tags: "bug, auth",
                      project: "webapp",
                      content: "Check the JWT token expiry",
                      dependsOn: "",
                      recurring: "",
                    }),
                  },
                ],
              },
            },
          ],
        }),
      );

      const provider = new GeminiProvider("test-key");
      const result = await provider.parse("Rahul ko kal tak login bug theek karna hai");

      expect(result.title).toBe("Fix login bug");
      expect(result.assignee).toBe("Rahul");
      expect(result.due).toBe("tomorrow");
      expect(result.priority).toBe("high");
      expect(result.tags).toBe("bug, auth");
      expect(result.project).toBe("webapp");
      expect(result.content).toBe("Check the JWT token expiry");
      expect(result.dependsOn).toBe("");
      expect(result.recurring).toBe("");
    });

    it("handles missing optional fields with defaults", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          candidates: [
            {
              content: {
                parts: [{ text: '{"title":"Buy groceries"}' }],
              },
            },
          ],
        }),
      );

      const provider = new GeminiProvider("test-key");
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

    it("uses original input as title when JSON title is missing", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          candidates: [
            {
              content: {
                parts: [{ text: "{}" }],
              },
            },
          ],
        }),
      );

      const provider = new GeminiProvider("test-key");
      const result = await provider.parse("My custom task");
      expect(result.title).toBe("My custom task");
    });

    it("throws on invalid JSON from Gemini", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          candidates: [
            {
              content: {
                parts: [{ text: "this is not json" }],
              },
            },
          ],
        }),
      );

      const provider = new GeminiProvider("test-key");
      await expect(provider.parse("test")).rejects.toThrow(
        "Gemini returned invalid JSON",
      );
    });

    it("throws on empty response from Gemini", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          candidates: [
            {
              content: {
                parts: [{ text: "" }],
              },
            },
          ],
        }),
      );

      const provider = new GeminiProvider("test-key");
      await expect(provider.parse("test")).rejects.toThrow(
        "Gemini returned an empty response",
      );
    });

    it("throws on API HTTP error", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch(
          { error: { message: "API key not valid" } },
          false,
          403,
        ),
      );

      const provider = new GeminiProvider("bad-key");
      await expect(provider.parse("test")).rejects.toThrow(
        "Gemini API error (403): API key not valid",
      );
    });

    it("throws on network failure", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("ENOTFOUND"),
      );

      const provider = new GeminiProvider("test-key");
      await expect(provider.parse("test")).rejects.toThrow(
        "Failed to call Gemini API",
      );
    });

    it("normalizes priority to 'medium' for invalid values", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          candidates: [
            {
              content: {
                parts: [{ text: '{"title":"Test","priority":"super-urgent"}' }],
              },
            },
          ],
        }),
      );

      const provider = new GeminiProvider("test-key");
      const result = await provider.parse("test");
      expect(result.priority).toBe("medium");
    });

    it("accepts 'none' and 'urgent' as valid priorities", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        mockFetch({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      title: "No priority",
                      priority: "none",
                    }),
                  },
                ],
              },
            },
          ],
        }),
      );

      const provider = new GeminiProvider("test-key");
      const result = await provider.parse("test");
      expect(result.priority).toBe("none");
    });
  });

  it("calls Gemini API with correct URL and prompt", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: '{"title":"Test"}' }],
            },
          },
        ],
      }),
    });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      fetchMock,
    );

    const provider = new GeminiProvider("my-key");
    await provider.parse("hello world");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("generativelanguage.googleapis.com");
    expect(url).toContain("key=my-key");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body.contents[0].parts[0].text).toContain("hello world");
    expect(body.contents[0].parts[0].text).toContain("task parser");
  });
});
