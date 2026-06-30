# Roadmap

## V1 — Core Engine (Current)
- **CLI Framework**: Command parser, help, config.
- **Markdown Provider**: Read/write tasks from Obsidian vault.
- **Task Lifecycle**: `add`, `list`, `start`, `done`.
- **AI Parser**: Natural language task creation via AI provider.
- **AI Planner**: Goal decomposition into structured tasks.
- **Provider Interface**: Storage abstraction layer for future backends.

## V2 — Rich Task Model
- Task priorities (`p0`–`p3`).
- Tags and categories.
- Due dates and deadlines.
- Filtering & searching improvements.

## V3 — Progress & Reports
- Auto-generated status reports from completed/active tasks.
- Burndown-style summaries.
- Vault dashboard generation.

## V4 — External Integrations
- Sync via Git (push/pull task state).
- Optional API providers: GitHub Issues, Notion, Jira.
- Multi-vault or multi-project support.

## Future Considerations
- Plugin system for custom commands.
- Interactive TUI (terminal UI) mode for browsing tasks.
