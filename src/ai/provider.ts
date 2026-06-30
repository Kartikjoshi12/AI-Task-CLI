import type { ParseResult } from "./types.js";
import { DummyProvider } from "./dummy.js";
import { GeminiProvider } from "./gemini.js";
import { OpenAIProvider } from "./openai.js";
import { ClaudeProvider } from "./claude.js";
import { OllamaProvider } from "./ollama.js";

export interface AIProvider {
  parse(input: string): Promise<ParseResult>;
}

export const AI_PROVIDER_TYPES = ["dummy", "gemini", "openai", "claude", "ollama"] as const;

export type AIProviderType = (typeof AI_PROVIDER_TYPES)[number];

export class NotConfiguredError extends Error {
  constructor(provider: string) {
    super(`Provider '${provider}' is not configured yet.`);
    this.name = "NotConfiguredError";
  }
}

export function isValidProvider(value: string): value is AIProviderType {
  return AI_PROVIDER_TYPES.includes(value as AIProviderType);
}

export function createProvider(type: AIProviderType): AIProvider {
  switch (type) {
    case "dummy":
      return new DummyProvider();
    case "gemini":
      return new GeminiProvider();
    case "openai":
      return new OpenAIProvider();
    case "claude":
      return new ClaudeProvider();
    case "ollama":
      return new OllamaProvider();
  }
}
