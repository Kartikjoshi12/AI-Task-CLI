# Specification V1

## 1. Project Scope
The AI Task CLI is a command-line interface that manages personal tasks and project plans using natural language. It leverages AI to transform intentions into structured tasks while using Markdown files within a local directory (Obsidian vault) as the persistent storage.

## 2. Features Included in V1
- **Natural Language Task Entry**: Create tasks by describing them in plain English.
- **Task Decomposition**: AI-powered breakdown of a high-level goal into a set of actionable sub-tasks.
- **Task Lifecycle Management**: Ability to mark tasks as pending, in-progress, or completed.
- **Task Querying**: List tasks filtered by state or keywords.
- **Vault Integration**: Read and write tasks directly to Markdown files to maintain a single source of truth.
- **Context Awareness**: AI reads existing tasks to avoid duplication and ensure consistency.

## 3. Features NOT Included
- GUI or Web interface.
- Real-time synchronization/collaboration.
- Calendar integration or time-tracking.
- Complex project management (Gantt charts, dependencies).
- Integration with external task managers (Jira, Trello).

## 4. Functional Requirements
- **FR1**: The system shall accept natural language input to create a new task.
- **FR2**: The system shall allow the user to request a "plan" for a goal, which the AI converts into a sequence of tasks.
- **FR3**: The system shall allow updating the status of a task (e.g., `todo` -> `done`).
- **FR4**: The system shall list all active tasks from the vault.
- **FR5**: The system shall persist all changes in Markdown format.

## 5. Non-Functional Requirements
- **Local-First**: Data must be stored locally; no mandatory cloud database.
- **Transparency**: AI actions (creation/modification) must be clearly reflected in the Markdown files.
- **Performance**: CLI responses must be snappy; AI latency should be managed with clear feedback.
- **Portability**: The storage format (Markdown) must be readable by any standard text editor.

## 6. User Stories
- **As a developer**, I want to say "I need to set up the project structure" and have the CLI create the necessary tasks in my vault.
- **As a planner**, I want to ask "How do I implement feature X?" and have the AI generate a step-by-step task list.
- **As a user**, I want to quickly list all my pending tasks without opening my vault.
- **As a user**, I want to mark a task as complete from the terminal and have it updated in my Markdown note immediately.

## 7. Success Criteria
- Successfully creating a task via CLI that appears as a Markdown checkbox in the vault.
- Successfully decomposing a complex goal into 3+ structured sub-tasks.
- Updating a task status via CLI and verifying the change in the source file.
- Listing tasks accurately based on their current state.

## 8. Future Versions
- **V2**: Support for task priorities, tags, and deadlines.
- **V3**: Automated progress tracking and summary reports based on completed tasks.
- **V4**: Integration with external APIs for notifications.
