import { Command } from "commander";
import { createProvider } from "../config.js";

export const statsCommand = new Command("stats")
  .description("Display task statistics")
  .action(async () => {
    const provider = createProvider(process.cwd());

    try {
      const all = await provider.listTasks();
      const total = all.length;
      const pending = all.filter((t) => t.status === "todo").length;
      const completed = all.filter((t) => t.status === "done").length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      console.log(`Total:       ${total}`);
      console.log(`Pending:     ${pending}`);
      console.log(`Completed:   ${completed}`);
      console.log(`Completion:  ${pct}%`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
