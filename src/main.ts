import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";
import { listCommand } from "./commands/list.js";
import { showCommand } from "./commands/show.js";
import { updateCommand } from "./commands/update.js";
import { doneCommand } from "./commands/done.js";
import { deleteCommand } from "./commands/delete.js";
import { searchCommand } from "./commands/search.js";
import { pendingCommand } from "./commands/pending.js";
import { completedCommand } from "./commands/completed.js";
import { todayCommand } from "./commands/today.js";
import { statsCommand } from "./commands/stats.js";
import { workspaceCommand } from "./commands/workspace.js";
import { projectCommand } from "./commands/project.js";
import { configCommand } from "./commands/config.js";
import { ConfigService } from "./services/config.js";
import { TaskService } from "./services/task.js";
import { AIService } from "./ai/service.js";
import { createProvider, isValidProvider } from "./ai/provider.js";
import { Renderer } from "./renderer.js";

export function createProgram(): Command {
  const program = new Command();

  program.name("task").description("AI-first task management from the terminal").version("1.0.0");

  program.addCommand(initCommand);
  program.addCommand(addCommand);
  program.addCommand(listCommand);
  program.addCommand(showCommand);
  program.addCommand(updateCommand);
  program.addCommand(doneCommand);
  program.addCommand(deleteCommand);
  program.addCommand(searchCommand);
  program.addCommand(pendingCommand);
  program.addCommand(completedCommand);
  program.addCommand(todayCommand);
  program.addCommand(statsCommand);
  program.addCommand(workspaceCommand);
  program.addCommand(projectCommand);
  program.addCommand(configCommand);

  program.arguments("[text...]").action(async (texts: string[]) => {
    const input = texts.join(" ").trim();
    if (!input) {
      program.help();
      return;
    }

    const renderer = new Renderer();

    try {
      const cfgService = new ConfigService(process.cwd());
      const cfg = await cfgService.getConfig();
      const providerType = isValidProvider(cfg.aiProvider) ? cfg.aiProvider : "dummy";
      const aiProvider = createProvider(providerType, { geminiApiKey: cfg.geminiApiKey });
      const ai = new AIService(aiProvider);
      const parsed = await ai.parse(input);

      if (!parsed.title) {
        renderer.error("Could not parse a task from that input. Try being more specific.");
        process.exit(1);
      }

      const storageProvider = cfgService.createProvider();
      const service = new TaskService(storageProvider);
      const task = await service.createTask({
        title: parsed.title,
        assignee: parsed.assignee || undefined,
        due: parsed.due || undefined,
        priority: parsed.priority !== "none" ? parsed.priority : undefined,
        tags: parsed.tags || undefined,
        content: parsed.content || undefined,
        project: parsed.project || undefined,
        dependsOn: parsed.dependsOn || undefined,
        recurring: parsed.recurring || undefined,
      });

      renderer.taskCreated(task);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      renderer.error(message);
      process.exit(1);
    }
  });

  return program;
}
