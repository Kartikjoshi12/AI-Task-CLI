import type { AIProvider } from "./provider.js";
import type { ParseResult } from "./types.js";
import { NotConfiguredError } from "./provider.js";

export class GeminiProvider implements AIProvider {
  async parse(_input: string): Promise<ParseResult> {
    void _input;
    throw new NotConfiguredError("gemini");
  }
}
