# Architecture

## Layered Architecture

The CLI is organized into four distinct layers, each with a single responsibility.

```
┌─────────────────────────────────────────────────┐
│                    CLI Layer                     │
│          (commands/*.ts — thin handlers)         │
│                                                   │
│  Parse args → call service → let renderer output │
├─────────────────────────────────────────────────┤
│                 Service Layer                     │
│           (services/task.ts, config.ts)           │
│                                                   │
│  Business logic, validation, orchestration        │
├─────────────────────────────────────────────────┤
│              Storage Provider Layer                │
│         (providers/markdown.ts, storage.ts)        │
│                                                   │
│  Pure persistence — no business logic             │
├─────────────────────────────────────────────────┤
│              Presentation Layer                   │
│               (renderer.ts)                       │
│                                                   │
│  All CLI output — tables, details, errors         │
└─────────────────────────────────────────────────┘
```

## Module Responsibilities

### 1. CLI Layer (`src/commands/`)
- Parse command-line arguments via Commander
- Create service instances (ConfigService, TaskService)
- Call service methods and pass results to Renderer
- No business logic — just orchestration

### 2. Service Layer (`src/services/`)

#### `TaskService` (`services/task.ts`)
- Validates input (empty titles, missing IDs, etc.)
- Orchestrates multi-step operations (e.g., `markDone` checks if already done)
- Delegates persistence to the StorageProvider
- Throws `TaskServiceError` for recoverable failures

#### `ConfigService` (`services/config.ts`)
- Reads/writes `.taskrc` configuration file
- Manages workspace and project state
- Creates MarkdownProvider instances with the correct config
- Provides `createProvider()` factory method

### 3. Storage Provider Layer (`src/providers/`)

#### `StorageProvider` Interface (`providers/storage.ts`)
- Defines the contract: `createTask`, `getTaskById`, `updateTask`, `deleteTask`, `listTasks`
- Provider-agnostic — enables swapping backends

#### `MarkdownProvider` (`providers/markdown.ts`)
- Persists tasks as individual Markdown files with YAML frontmatter
- File format: `<vault>/workspaces/<workspace>/tasks/<task-id>.md`
- No validation or business logic — pure read/write

### 4. Presentation Layer (`src/renderer.ts`)

#### `Renderer`
- `success(msg)` — success messages
- `error(msg)` — error messages (via stderr)
- `message(msg)` — informational messages
- `taskTable(tasks)` — table output for `list`, `search`, etc.
- `taskDetail(task)` — detailed view for `show`
- `stats(total, pending, completed)` — statistics for `stats`

## Data Flow

```
User input
    │
    ▼
CLI Command (add/list/show/...)
    │
    ├── ConfigService.getConfig() / createProvider()
    │
    ├── TaskService.createTask() / getTask() / etc.
    │       │
    │       ▼
    │   StorageProvider (MarkdownProvider)
    │       │
    │       └── Persist to filesystem
    │
    └── Renderer.success() / taskTable() / error()
            │
            ▼
        stdout/stderr
```

## Task Model

The unified `Task` interface in `types/task.ts`:

| Field        | Type           | Description                    |
|-------------|----------------|--------------------------------|
| id          | string         | Unique identifier (task-N)     |
| title       | string         | Task title/description         |
| content     | string         | Extended notes/body            |
| status      | todo/doing/done| Current state                  |
| workspace   | string         | Owning workspace               |
| project     | string         | Owning project                 |
| priority    | none/low/medium/high/urgent | Priority level   |
| due         | string         | Due date (ISO)                 |
| tags        | string         | Comma-separated tags           |
| assignee    | string         | Assigned user                  |
| parent      | string         | Parent task ID                 |
| dependsOn   | string         | Dependency task ID             |
| recurring   | string         | Recurrence rule                |
| createdAt   | string         | Creation timestamp (ISO)       |
| updatedAt   | string         | Last update timestamp (ISO)    |
| completedAt | string         | Completion timestamp (ISO)     |

## File Organization

```
src/
├── cli.ts                  — Entry point
├── main.ts                 — Program definition
├── renderer.ts             — Presentation layer
├── types/
│   └── task.ts             — Task model
├── services/
│   ├── config.ts           — ConfigService
│   └── task.ts             — TaskService, TaskServiceError
├── providers/
│   ├── storage.ts          — StorageProvider interface
│   └── markdown.ts         — MarkdownProvider
└── commands/
    ├── add.ts
    ├── list.ts
    ├── show.ts
    ├── update.ts
    ├── done.ts
    ├── delete.ts
    ├── search.ts
    ├── pending.ts
    ├── completed.ts
    ├── today.ts
    ├── stats.ts
    ├── init.ts
    ├── workspace.ts
    └── project.ts
```

## Config File

`.taskrc` (JSON in project root):

```json
{
  "workspace": "default",
  "project": "default",
  "projects": ["default"]
}
```

## Markdown File Format

```
---
id: task-1
status: todo
created: 2026-06-30T18:25:09.755Z
updated: 2026-06-30T18:25:09.755Z
project: default
---
- [ ] Buy groceries for the week
```

Location: `<vault>/workspaces/<workspace>/tasks/<task-id>.md`
