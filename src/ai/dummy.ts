import type { AIProvider } from "./provider.js";
import type { ParseResult } from "./types.js";
import type { TaskPriority } from "../types/task.js";

const DUE_KEYWORDS: Record<string, string> = {
  aaj: "today",
  aj: "today",
  kal: "tomorrow",
  "kal subah": "tomorrow morning",
  "kal shaam": "tomorrow evening",
  parson: "day after tomorrow",
  "next week": "next week",
  "next month": "next month",
  today: "today",
  tomorrow: "tomorrow",
};

const PRIORITY_KEYWORDS: Record<string, TaskPriority> = {
  urgent: "urgent",
  jaldi: "urgent",
  "high priority": "high",
  important: "high",
  low: "low",
  "low priority": "low",
};

export class DummyProvider implements AIProvider {
  async parse(input: string): Promise<ParseResult> {
    const lower = input.toLowerCase();

    const title = this.extractTitle(input);
    const assignee = this.extractAssignee(input, lower);
    const due = this.extractDue(lower);
    const priority = this.extractPriority(lower);
    const tags = this.extractTags(input, lower);
    const project = this.extractProject(input, lower);
    const content = "";
    const dependsOn = "";
    const recurring = "";

    return { title, assignee, due, priority, tags, project, content, dependsOn, recurring };
  }

  private extractTitle(input: string): string {
    let cleaned = input.trim();

    // Remove "<name> ko " prefix (Hindi-style assignment)
    const nameMatch = cleaned.match(/(\w+)\s+ko\s+/);
    if (nameMatch) {
      cleaned = cleaned.slice(nameMatch[0].length).trim();
    }

    // Remove time keywords from anywhere in the text
    const timeKws = [
      "kal tak",
      "kal subah",
      "kal shaam",
      "aaj",
      "aj",
      "parson",
      "today",
      "tomorrow",
    ];
    for (const kw of timeKws) {
      const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      cleaned = cleaned.replace(re, "").trim();
    }

    // Remove "by " prefix left after removing time references
    cleaned = cleaned.replace(/^by\s+/i, "").trim();

    // Remove Hindi action suffixes
    const suffixes = [" banana hai", " karna hai", " karo", " banao"];
    for (const suffix of suffixes) {
      if (cleaned.toLowerCase().endsWith(suffix)) {
        cleaned = cleaned.slice(0, -suffix.length).trim();
      }
    }

    return cleaned || input;
  }

  private extractAssignee(input: string, lower: string): string {
    const match = lower.match(/(\w+)\s+ko\s+/);
    if (match) {
      const name = match[1];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return "";
  }

  private extractDue(lower: string): string {
    for (const [key, val] of Object.entries(DUE_KEYWORDS)) {
      if (lower.includes(key)) {
        return val;
      }
    }
    return "";
  }

  private extractPriority(lower: string): TaskPriority {
    for (const [key, val] of Object.entries(PRIORITY_KEYWORDS)) {
      if (lower.includes(key)) {
        return val;
      }
    }
    return "medium";
  }

  private extractTags(input: string, lower: string): string {
    if (lower.includes("bug")) return "bug";
    if (lower.includes("feature") || lower.includes("new")) return "feature";
    if (lower.includes("fix") || lower.includes("repair")) return "fix";
    return "";
  }

  private extractProject(input: string, lower: string): string {
    const match = lower.match(/project\s+(\w+)/i);
    if (match) return match[1];
    return "";
  }
}
