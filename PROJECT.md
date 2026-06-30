# AI Task CLI

## Vision

A CLI that acts as your AI task companion — turning natural language into actionable tasks, plans, and workflows, all managed from the terminal.

## Problem

Managing tasks across the terminal, Obsidian, and project files is fragmented. You switch between editing markdown, running scripts, and tracking progress — losing context and momentum. AI assistants exist, but they're chat-first, not integrated into your actual workflow or file system.

## Solution

AI Task CLI is a command-line tool that uses an AI agent to understand your intent, break it into tasks, and manage the full lifecycle — from creation to completion — directly from your terminal. It reads and writes your existing project files, so tasks live where your code does.

## Goals

- Understand natural language task descriptions and convert them into structured tasks.
- Manage task state (todo, doing, done) across sessions.
- Break large goals into subtasks and plans.
- Surface relevant context from the project when planning or resuming work.
- Work offline-first with local storage, optionally syncing to Obsidian or git.

## Non Goals (V1)

- Real-time collaboration or multi-user workflows.
- A GUI or web dashboard — terminal only.
- Plugin/extension system for third-party tools.
- Calendar or time-based scheduling.
- Integration with external task services (Jira, Linear, etc.).

## Target Users

- Developers and power users who live in the terminal.
- Obsidian users who want task management tied to their vault.
- Anyone who wants an AI-assisted workflow without leaving their editor or CLI.

## Core Principles

- **AI-first, not AI-only** — AI accelerates, but you stay in control.
- **Files over databases** — tasks are markdown files you can read, edit, and version with git.
- **Local-first** — no cloud dependency. Your data stays on your machine.
- **Progressive disclosure** — simple commands for simple needs, powerful flags for power users.
- **Unix philosophy** — compose with pipes, scripts, and existing tools. One thing well.
