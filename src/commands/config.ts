import { Command } from "commander";
import { ConfigService } from "../services/config.js";
import { Renderer } from "../renderer.js";
import { isValidProvider, AI_PROVIDER_TYPES } from "../ai/provider.js";

export const configCommand = new Command("config")
  .description("Display or modify configuration")
  .action(async () => {
    const renderer = new Renderer();
    try {
      const config = new ConfigService(process.cwd());
      const cfg = await config.getConfig();
      renderer.message(`Workspace:   ${cfg.workspace}`);
      renderer.message(`Project:     ${cfg.project}`);
      renderer.message(`Projects:    ${cfg.projects.join(", ") || "(none)"}`);
      renderer.message(`AI Provider: ${cfg.aiProvider}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      renderer.error(message);
      process.exit(1);
    }
  });

configCommand
  .command("ai.provider")
  .argument("<name>", `AI provider name (${AI_PROVIDER_TYPES.join(", ")})`)
  .description("Set the AI provider for parsing natural language tasks")
  .action(async (name: string) => {
    const renderer = new Renderer();
    const trimmed = name.trim().toLowerCase();
    if (!isValidProvider(trimmed)) {
      renderer.error(
        `Unknown provider '${trimmed}'. Valid options: ${AI_PROVIDER_TYPES.join(", ")}`,
      );
      process.exit(1);
    }

    try {
      const config = new ConfigService(process.cwd());
      await config.setAIProvider(trimmed);
      renderer.success(`AI provider set to '${trimmed}'.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      renderer.error(message);
      process.exit(1);
    }
  });
