import type { ParseResult } from "./types.js";

export interface AIProvider {
  parse(input: string): Promise<ParseResult>;
}
