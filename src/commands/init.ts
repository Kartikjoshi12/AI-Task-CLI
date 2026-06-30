import { Command } from "commander";

export const initCommand = new Command("init")
  .description("Initialize a new workspace in the current directory")
  .action(() => {
    console.log("Workspace initialized (coming soon)");
  });
