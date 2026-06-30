import { describe, it, expect } from "vitest";
import {
  createProvider,
  isValidProvider,
  AI_PROVIDER_TYPES,
  NotConfiguredError,
} from "../../src/ai/provider.js";
import { DummyProvider } from "../../src/ai/dummy.js";

describe("createProvider", () => {
  it("returns DummyProvider for type 'dummy'", () => {
    const provider = createProvider("dummy");
    expect(provider).toBeInstanceOf(DummyProvider);
  });

  it("dummy provider parses without error", async () => {
    const provider = createProvider("dummy");
    const result = await provider.parse("test");
    expect(result.title).toBe("test");
  });

  it.each(["gemini", "openai", "claude", "ollama"] as const)(
    "throws NotConfiguredError for %s provider",
    async (type) => {
      const provider = createProvider(type);
      await expect(provider.parse("test")).rejects.toThrow(NotConfiguredError);
    },
  );

  it.each(["gemini", "openai", "claude", "ollama"] as const)(
    "shows friendly message for %s provider",
    async (type) => {
      const provider = createProvider(type);
      try {
        await provider.parse("test");
      } catch (err) {
        expect(err).toBeInstanceOf(NotConfiguredError);
        expect((err as Error).message).toBe(
          `Provider '${type}' is not configured yet.`,
        );
      }
    },
  );
});

describe("isValidProvider", () => {
  it("returns true for valid provider types", () => {
    for (const type of AI_PROVIDER_TYPES) {
      expect(isValidProvider(type)).toBe(true);
    }
  });

  it("returns false for invalid provider types", () => {
    expect(isValidProvider("invalid")).toBe(false);
    expect(isValidProvider("chatgpt")).toBe(false);
    expect(isValidProvider("")).toBe(false);
  });
});

describe("AI_PROVIDER_TYPES", () => {
  it("contains all provider names", () => {
    expect(AI_PROVIDER_TYPES).toEqual([
      "dummy",
      "gemini",
      "openai",
      "claude",
      "ollama",
    ]);
  });
});
