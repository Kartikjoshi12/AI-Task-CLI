# CLI Interface Specification

## Design Philosophy
The CLI follows a command-pattern architecture: `task <command> [arguments] [flags]`. It is designed to be predictable, scriptable, and minimalist.

## Command Set

### 1. Task Creation
- `task add "description"`
  - Creates a new task from the provided description.
  - AI handles the parsing of the description to extract title and metadata.
- `task plan "goal"`
  - AI decomposes a high-level goal into multiple structured tasks.
  - Outputs the proposed plan for user confirmation before writing to storage.

### 2. Task Management
- `task list [filter]`
  - Lists tasks. 
  - Filter options: `todo`, `doing`, `done`, or keyword search.
- `task done <task_id>`
  - Marks a specific task as completed.
- `task start <task_id>`
  - Marks a specific task as in-progress.

### 3. System & Config
- `task config`
  - Displays current configuration (e.g., vault path, AI provider).
- `task help`
  - Displays usage instructions.

## Interaction Flow
1. **Input**: User enters a command.
2. **Parsing**: If the command is `add` or `plan`, the input is sent to the AI provider for structured parsing.
3. **Execution**: The system calls the current Storage Provider to write/read the data.
4. **Output**: The CLI returns a concise confirmation or a list of tasks.

## Error Handling
- **Invalid Input**: Display a helpful usage hint and the `task help` command.
- **Storage Error**: Notify the user if the vault is inaccessible or files are read-only.
- **AI Failure**: Fallback to creating a simple task without AI enhancement if the AI provider is unavailable.
