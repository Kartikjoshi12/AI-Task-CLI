import { describe, it, expect } from "vitest";
import { AIService } from "../../src/ai/service.js";
import { DummyProvider } from "../../src/ai/dummy.js";
import type { AIProvider } from "../../src/ai/provider.js";
import type { ParseResult } from "../../src/ai/types.js";

describe("AIService", () => {
  it("accepts any AIProvider", () => {
    const dummy = new DummyProvider();
    const service = new AIService(dummy);
    expect(service.getProvider()).toBe(dummy);
  });

  it("rejects empty input", async () => {
    const service = new AIService(new DummyProvider());
    await expect(service.parse("")).rejects.toThrow("Input cannot be empty");
    await expect(service.parse("   ")).rejects.toThrow("Input cannot be empty");
  });

  it("parses input using the injected provider", async () => {
    const service = new AIService(new DummyProvider());
    const result = await service.parse("Buy groceries");
    expect(result.title).toBe("Buy groceries");
  });
});

describe("DummyProvider", () => {
  it("returns ParseResult with correct shape", async () => {
    const provider = new DummyProvider();
    const result = await provider.parse("Test task");

    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("assignee");
    expect(result).toHaveProperty("due");
    expect(result).toHaveProperty("priority");
    expect(result).toHaveProperty("tags");
    expect(result).toHaveProperty("project");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("dependsOn");
    expect(result).toHaveProperty("recurring");
  });

  it("extracts assignee from Hindi-style input", async () => {
    const provider = new DummyProvider();
    const result = await provider.parse("Rahul ko kal tak OTP banana hai");
    expect(result.title).toContain("OTP");
    expect(result.assignee).toBe("Rahul");
    expect(result.due).toBe("tomorrow");
  });

  it("extracts due date keywords", async () => {
    const provider = new DummyProvider();
    expect((await provider.parse("Do it today")).due).toBe("today");
    expect((await provider.parse("Do it kal")).due).toBe("tomorrow");
    expect((await provider.parse("Do it aaj")).due).toBe("today");
  });

  it("detects priority keywords", async () => {
    const provider = new DummyProvider();
    expect((await provider.parse("urgent: fix login")).priority).toBe("urgent");
    expect((await provider.parse("jaldi karo")).priority).toBe("urgent");
    expect((await provider.parse("normal task")).priority).toBe("medium");
  });

  it("extracts tags from keywords", async () => {
    const provider = new DummyProvider();
    expect((await provider.parse("Fix login bug")).tags).toBe("bug");
    expect((await provider.parse("New feature request")).tags).toBe("feature");
  });

  it("can be swapped via the AIProvider interface", () => {
    const custom: AIProvider = {
      async parse(input: string): Promise<ParseResult> {
        return {
          title: input,
          assignee: "",
          due: "",
          priority: "low",
          tags: "",
          project: "",
          content: "",
          dependsOn: "",
          recurring: "",
        };
      },
    };

    const service = new AIService(custom);
    expect(service.getProvider()).toBe(custom);
  });

  it("custom provider returns expected data", async () => {
    const custom: AIProvider = {
      async parse(_input: string): Promise<ParseResult> {
        return {
          title: "Build OTP",
          assignee: "Rahul",
          due: "tomorrow",
          priority: "medium",
          tags: "feature",
          project: "Auth",
          content: "",
          dependsOn: "",
          recurring: "",
        };
      },
    };

    const service = new AIService(custom);
    const result = await service.parse("anything");
    expect(result.title).toBe("Build OTP");
    expect(result.assignee).toBe("Rahul");
    expect(result.due).toBe("tomorrow");
    expect(result.priority).toBe("medium");
    expect(result.tags).toBe("feature");
    expect(result.project).toBe("Auth");
  });
});
