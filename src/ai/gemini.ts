import type { AIProvider } from "./provider.js";
import type { ParseResult } from "./types.js";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are a task parser. Analyze the user's natural language input and extract task details.

Return ONLY valid JSON with these fields:
- "title": string (required, the main task description)
- "assignee": string (who is assigned, or empty)
- "due": string (due date like "today", "tomorrow", "next week", or empty)
- "priority": "none" | "low" | "medium" | "high" | "urgent" (default "medium")
- "tags": string (comma-separated, or empty)
- "project": string (project name, or empty)
- "content": string (additional notes, or empty)
- "dependsOn": string (task ID this depends on, or empty)
- "recurring": string (recurrence pattern like "daily", "weekly", or empty)

Do NOT include markdown code fences or any text outside the JSON.`;

export class GeminiProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.GEMINI_API_KEY ?? "";
  }

  async parse(input: string): Promise<ParseResult> {
    if (!this.apiKey) {
      throw new Error(
        "Gemini API key not found. Set GEMINI_API_KEY environment variable or configure it in .taskrc.",
      );
    }

    const prompt = `${SYSTEM_PROMPT}\n\nUser input: "${input}"`;

    let response: Response;
    try {
      response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
    } catch (err) {
      throw new Error(
        "Failed to call Gemini API",
        err instanceof Error ? { cause: err } : undefined,
      );
    }

    if (!response.ok) {
      let detail = "";
      try {
        const errBody = (await response.json()) as { error?: { message?: string } };
        detail = errBody.error?.message ?? "";
      } catch {
        // ignore parse error
      }
      throw new Error(`Gemini API error (${response.status}): ${detail || response.statusText}`);
    }

    const body = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini returned an empty response. Try again.");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(
        `Gemini returned invalid JSON. Try rephrasing your input.\nResponse: ${text}`,
      );
    }

    return {
      title: this.stringField(parsed.title) || input,
      assignee: this.stringField(parsed.assignee),
      due: this.stringField(parsed.due),
      priority: this.priorityField(parsed.priority),
      tags: this.stringField(parsed.tags),
      project: this.stringField(parsed.project),
      content: this.stringField(parsed.content),
      dependsOn: this.stringField(parsed.dependsOn),
      recurring: this.stringField(parsed.recurring),
    };
  }

  private stringField(value: unknown): string {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    return "";
  }

  private priorityField(value: unknown): ParseResult["priority"] {
    if (typeof value === "string") {
      const valid = ["none", "low", "medium", "high", "urgent"] as const;
      if (valid.includes(value as (typeof valid)[number])) {
        return value as ParseResult["priority"];
      }
    }
    return "medium";
  }
}
