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
│   ├── types.ts      — ParseResult type
│   ├── provider.ts   — AIProvider interface
│   ├── service.ts    — AIService
│   └── dummy.ts      — DummyProvider
```
