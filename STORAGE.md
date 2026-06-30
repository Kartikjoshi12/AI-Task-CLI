# Storage Architecture

## Storage Philosophy
The system treats storage as a pluggable provider. The core logic interacts with a generic `StorageProvider` interface, ensuring the system is agnostic to how and where data is persisted.

## Storage Provider Interface
The `StorageProvider` must implement the following operations:
- `createTask(task)`: Persists a new task.
- `getTasks(filter)`: Retrieves tasks based on state or keyword.
- `updateTaskStatus(taskId, status)`: Updates the state of a task.
- `getTaskById(taskId)`: Retrieves a single task by its unique identifier.

## V1 Implementation: Markdown (Obsidian)
For V1, the `MarkdownProvider` will be the sole implementation.

### Data Model
Tasks are stored as Markdown checkboxes within specific files.
- **Location**: A dedicated tasks folder or a specific task-tracking file within the Obsidian vault.
- **Format**: `- [ ] Task description #id`
- **State Mapping**:
  - `[ ]` $\rightarrow$ `todo`
  - `[/]` $\rightarrow$ `doing` (or a custom tag/prefix)
  - `[x]` $\rightarrow$ `done`

### Unique Identifiers
To ensure reliability, each task will be assigned a short, unique ID (e.g., `task-123`) appended to the line. This allows the CLI to target specific tasks even if the description changes.

## Future Provider Support
The interface allows seamless addition of other providers without changing the CLI logic:
- **Database Providers**: SQLite, PostgreSQL, Supabase.
- **API Providers**: Notion, Jira, GitHub Issues.
- **File-based Providers**: JSON, YAML.
