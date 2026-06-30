import { Command } from "commander";
import { ConfigService } from "../services/config.js";
import { TaskService } from "../services/task.js";
import { Renderer } from "../renderer.js";

export const addCommand = new Command("add")
  .argument("<description>", "task description")
  .option("-w, --workspace <workspace>", "Override the active workspace")
  .option("-p, --project <project>", "Override the active project")
  .description("Create a new task")
  .action(async (description: string, options: { workspace?: string; project?: string }) => {
    try {
      const config = new ConfigService(process.cwd());
      if (options.project) {
        await config.addProject(options.project);
      }
      const provider = config.createProvider(options.workspace, options.project);
      const service = new TaskService(provider);
      const renderer = new Renderer();
      const task = await service.createTask({ title: description, project: options.project });
      renderer.success(`Created task ${task.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      new Renderer().error(message);
      process.exit(1);
    }
  });
