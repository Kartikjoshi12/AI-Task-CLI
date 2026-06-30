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
    const lower = input.toLowerCase();
    let cleaned = input;

    const nameMatch = lower.match(/(\w+)\s+ko\s+/);
    if (nameMatch) {
      cleaned = cleaned.slice(nameMatch[0].length).trim();
    }

    for (const kw of [
      "kal tak",
      "kal subah",
      "kal shaam",
      "aaj",
      "aj",
      "parson",
      "today",
      "tomorrow",
    ]) {
      const idx = lower.indexOf(kw);
      if (idx !== -1) {
        cleaned = cleaned.slice(0, idx).trim();
        break;
      }
    }

    const suffixes = [" banana hai", " karna hai", " karo", " banao"];
    for (const suffix of suffixes) {
      if (lower.endsWith(suffix)) {
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
