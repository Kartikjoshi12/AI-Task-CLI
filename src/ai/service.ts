import type { AIProvider } from "./provider.js";
import type { ParseResult } from "./types.js";

export class AIService {
  constructor(private provider: AIProvider) {}

  async parse(input: string): Promise<ParseResult> {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error("Input cannot be empty");
    }
    return this.provider.parse(trimmed);
  }

  getProvider(): AIProvider {
    return this.provider;
  }
}
