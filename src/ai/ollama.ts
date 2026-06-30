import type { AIProvider } from "./provider.js";
import type { ParseResult } from "./types.js";
import { NotConfiguredError } from "./provider.js";

export class OllamaProvider implements AIProvider {
  async parse(_input: string): Promise<ParseResult> {
    void _input;
    throw new NotConfiguredError("ollama");
  }
}
