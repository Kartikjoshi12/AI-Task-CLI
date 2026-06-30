import { Command } from "commander";
import { Renderer } from "../renderer.js";

export const initCommand = new Command("init")
  .description("Initialize a new workspace in the current directory")
  .action(() => {
    new Renderer().message("Workspace initialized (coming soon)");
  });
