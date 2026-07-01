# AI Provider Interface

## Overview

The AI layer provides a pluggable abstraction for parsing natural language task descriptions into structured data. It follows the same provider pattern as the storage layer.

## Interface

```typescript
interface AIProvider {
  parse(input: string): Promise<ParseResult>;
}
```

Any provider that implements this single method can be injected into the `AIService`.

## ParseResult

```typescript
interface ParseResult {
  title: string;
  assignee: string;
  due: string;
  priority: TaskPriority;
  tags: string;
  project: string;
  content: string;
  dependsOn: string;
  recurring: string;
}
```

Fields extracted from natural language input. Empty strings indicate the field was not detected.

## AIService

The `AIService` wraps any `AIProvider` and provides consistent error handling (e.g., rejecting empty input).

```typescript
const service = new AIService(new DummyProvider());
const result = await service.parse("Rahul ko kal tak OTP banana hai");
// -> { title: "Build OTP", assignee: "Rahul", due: "tomorrow", priority: "medium", ... }
```

## Built-in Providers

### DummyProvider

A local-only provider that uses simple keyword matching. Useful for development, testing, and offline use.

- Extracts `assignee` from `<name> ko` patterns
- Recognises Hindi/English time keywords: `kal`, `aaj`, `parson`, `today`, `tomorrow`
- Detects priority: `urgent`, `jaldi`, `important`, `low`
  - Detects tags: `bug`, `feature`, `fix`

### GeminiProvider

Connects to the Google Gemini API (`gemini-2.0-flash`) for natural language parsing.

#### Setup

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Set it via one of:
   - Environment variable: `export GEMINI_API_KEY=<your-key>`
   - Config file: add `"geminiApiKey": "<your-key>"` to `.taskrc`
3. Switch to the Gemini provider:
   ```bash
   task config ai.provider gemini
   ```
4. Verify:
   ```bash
   task "Buy groceries tomorrow"
   ```

The API key is resolved in order: constructor argument > `GEMINI_API_KEY` env var > (future: `.taskrc` config).

#### How It Works

1. Sends a structured system prompt + user input to Gemini.
2. Gemini returns a JSON object matching `ParseResult`.
3. The provider parses and validates the JSON.
4. Missing or invalid fields fall back to safe defaults (`""`, `"medium"`).

#### Error Handling

| Scenario | Error Message |
|---|---|
| No API key configured | `Gemini API key not found. Set GEMINI_API_KEY...` |
| Network failure | `Failed to call Gemini API` |
| HTTP error (403, 429, etc.) | `Gemini API error (status): detail` |
| Empty response | `Gemini returned an empty response. Try again.` |
| Invalid JSON | `Gemini returned invalid JSON. Try rephrasing...` |

### OpenRouterProvider

Connects to the OpenRouter API (OpenAI‑compatible endpoint) for natural language parsing. Default model: `deepseek/deepseek-chat-v3.1`.

#### Setup

1. Get an OpenRouter API key from [openrouter.ai/keys](https://openrouter.ai/keys).
2. Set it via one of:
   - Environment variable: `export OPENROUTER_API_KEY=<your-key>`
   - Config file: add `"openrouterApiKey": "<your-key>"` to `.taskrc`
3. (Optional) Override the model:
   - Environment variable: `export OPENROUTER_MODEL=anthropic/claude-3.5-sonnet`
   - Config file: add `"openrouterModel": "<model>"` to `.taskrc`
4. Switch to the OpenRouter provider:
   ```bash
   task config ai.provider openrouter
   ```
5. Verify:
   ```bash
   task "Buy groceries tomorrow"
   ```

#### How It Works

1. Sends a system prompt + user message to the OpenRouter Chat Completions API.
2. Uses `response_format: { type: "json_object" }` to force JSON output.
3. Parses and validates the JSON into a `ParseResult`.
4. Missing or invalid fields fall back to safe defaults (`""`, `"medium"`).

#### Error Handling

| Scenario | Error Message |
|---|---|
| No API key configured | `OpenRouter API key not found. Set OPENROUTER_API_KEY...` |
| Network failure | `Failed to call OpenRouter API` |
| HTTP error (401, 402, 429, etc.) | `OpenRouter API error (status): detail` |
| Empty response | `OpenRouter returned an empty response. Try again.` |
| Invalid JSON | `OpenRouter returned invalid JSON. Try rephrasing...` |
| Rate‑limited / server error | Auto‑retries up to 2 times with exponential backoff |

## Creating a Custom Provider

```typescript
import type { AIProvider } from "./ai/provider.js";
import type { ParseResult } from "./ai/types.js";

class MyProvider implements AIProvider {
  async parse(input: string): Promise<ParseResult> {
    // Call OpenAI, Gemini, Claude, etc.
    return { title: input, ... };
  }
}

const service = new AIService(new MyProvider());
```

## File Organisation

```
src/
├── ai/
│   ├── types.ts       — ParseResult type
│   ├── provider.ts    — AIProvider interface & factory
│   ├── service.ts     — AIService
│   ├── dummy.ts       — DummyProvider (keyword matching)
│   ├── gemini.ts      — GeminiProvider (Google Gemini API)
│   └── openrouter.ts  — OpenRouterProvider (OpenRouter API)
```
