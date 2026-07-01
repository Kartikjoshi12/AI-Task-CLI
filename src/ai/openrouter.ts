import type { AIProvider } from "./provider.js";
import type { ParseResult } from "./types.js";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat-v3.1";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

const SYSTEM_PROMPT = `You are a task parser. Extract task details from natural language input and return JSON with these fields:

- title: string (required, the main task description)
- assignee: string (who is assigned, or empty)
- due: string (relative or absolute due date like "today", "tomorrow", "next week", "2026-07-15", or empty)
- priority: "none" | "low" | "medium" | "high" | "urgent" (default "medium")
- tags: string (comma-separated, or empty)
- project: string (project name, or empty)
- content: string (additional notes, or empty)
- dependsOn: string (task ID this depends on, or empty)
- recurring: string (recurrence pattern like "daily", "weekly", "monthly", or empty)`;

export interface OpenRouterOptions {
  apiKey?: string;
  model?: string;
}

interface OpenRouterErrorBody {
  error?: { message?: string };
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(options?: OpenRouterOptions) {
    this.apiKey = options?.apiKey ?? process.env.OPENROUTER_API_KEY ?? "";
    this.model = options?.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
  }

  async parse(input: string): Promise<ParseResult> {
    if (!this.apiKey) {
      throw new Error(
        'OpenRouter API key not found. Set OPENROUTER_API_KEY environment variable or add "openrouterApiKey" to .taskrc.',
      );
    }

    const text = await this.fetchWithRetry(input);

    if (!text) {
      throw new Error("OpenRouter returned an empty response. Try again.");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(
        `OpenRouter returned invalid JSON. Try rephrasing your input.\nResponse: ${text.slice(0, 500)}`,
      );
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("OpenRouter returned an unexpected response format.");
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

  private async fetchWithRetry(input: string, attempt = 0): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        signal: controller.signal,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: input },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as OpenRouterErrorBody;
        const detail = body?.error?.message ?? "";

        if (attempt < MAX_RETRIES && (response.status === 429 || response.status >= 500)) {
          const delay = Math.min(1000 * 2 ** attempt, 8000);
          await new Promise((r) => setTimeout(r, delay));
          return this.fetchWithRetry(input, attempt + 1);
        }

        const msg = detail
          ? `OpenRouter API error (${response.status}): ${detail}`
          : `OpenRouter API error (${response.status}): ${response.statusText}`;
        throw new Error(msg);
      }

      const body = (await response.json()) as OpenRouterResponse;
      return body?.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          `OpenRouter request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Try again or use a shorter input.`,
          { cause: err },
        );
      }
      if (err instanceof Error && err.message.startsWith("OpenRouter")) {
        throw err;
      }
      throw new Error(
        "Failed to call OpenRouter API",
        err instanceof Error ? { cause: err } : undefined,
      );
    } finally {
      clearTimeout(timer);
    }
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
