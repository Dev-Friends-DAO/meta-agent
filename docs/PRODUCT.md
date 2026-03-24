# Meta Agent — Product Document

## What is Meta Agent?

A runtime governance layer for AI coding agents. Unified state management and context compilation across sessions, tools, and models.

---

## Problem

### Fragmentation of AI Coding Tools

Just as engineers choose their preferred editor, they choose their preferred AI tool. Yet each tool has its own instruction format with no interoperability.

| Tool | Instruction File |
|------|-----------------|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursor/rules/*.mdc` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Codex CLI | `AGENTS.md` |
| Gemini CLI | `GEMINI.md` |
| Windsurf | `.windsurfrules` |
| Aider | `CONVENTIONS.md` |

When multiple engineers on the same project use different tools, instructions scatter, duplicate, and diverge.

### Limitations of Existing Tools

AGENTS.md (governed by Linux Foundation/AAIF) is the closest thing to a de facto standard, but it is fundamentally a **naming convention, not a specification** — no schema, no priority system, no conditional logic.

Sync tools like rulesync, block/ai-rules, and ai-rulez exist, but all remain **static file generators**.

### Unsolved Fundamental Problems

1. **No semantic scoping** — No tool supports context-dependent rule activation (e.g., "apply security rules when editing auth modules")
2. **Build-time wall** — All existing tools pre-generate files. No runtime resolution exists
3. **No rule relationships** — Contradictions and dependencies between rules cannot be expressed
4. **No multi-agent governance** — No concept of master AI, consensus patterns, or coordination
5. **Agent state fragmentation** — Context is lost across sessions, across tools, and across time

---

## Philosophy

### A Different Layer

Existing tools generate files. Meta Agent governs the execution of AI agents.

```
Existing tools:  File converters / Static generators
Meta Agent:      AI instruction runtime / Governance layer
```

### Non-Destructive by Design

Meta Agent does not replace CLAUDE.md, AGENTS.md, or .cursorrules. It sits as a meta-layer on top, maintaining full compatibility with the existing ecosystem while providing independent value.

### User Choice

- Keep existing files alongside Meta Agent (mirror mode) or use only Meta Agent's entry point (hub-only mode)
- Choose optimization strategy (accuracy / cost / speed)
- Select consensus patterns for multi-agent coordination

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Meta Agent                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ Rule Engine  │ │  Optimizer  │ │State Manager │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬───────┘  │
│         │               │               │           │
│  ┌──────▼───────────────▼───────────────▼───────┐   │
│  │           Context Compiler                    │   │
│  └──────────────────────┬────────────────────────┘   │
│                         │                            │
│  ┌──────────────────────▼────────────────────────┐   │
│  │         Instruction Hub                        │   │
│  └──────────────────────┬────────────────────────┘   │
│                         │                            │
│  ┌──────────────────────▼────────────────────────┐   │
│  │        Consensus Engine                        │   │
│  └──────────────────────┬────────────────────────┘   │
│                         │                            │
│  ┌──────────────────────▼────────────────────────┐   │
│  │           Adapter Layer                        │   │
│  │   Claude │ GPT │ Gemini │ Local LLM │ ...     │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Core Components

#### 1. State Manager

Solves agent state fragmentation with a three-tier architecture:

- **Session State (short-term)** — Current task and progress, recent diffs, active files, unresolved decisions
- **Project State (mid-term)** — Codebase structure cache, dependency graph, change summaries over recent days, decisions from past sessions
- **Knowledge State (long-term)** — Project-specific knowledge, user preferences and feedback history, accumulated rules and constraints

**State Retention Policy** — Each tier's lifecycle is user-configurable:

| Strategy | Description |
|----------|-------------|
| **Time-based** | Auto-expire after a duration (e.g., session: 24h, project: 30d) |
| **Size-based** | Evict oldest entries when exceeding a max count |
| **Relevance-based** | Remove entries not referenced within a given period |
| **Compression** | Summarize raw data after a threshold, discard originals but keep the summary |
| **Manual** | User explicitly manages retention |

All strategies are composable. Users can combine multiple strategies per tier (e.g., "compress after 7 days, delete after 30 days, max 500 entries"). Defaults are provided but fully overridable.

#### 2. Context Compiler

Assembles the optimal context for a given agent at a given moment, from all State layers + rules + optimization strategy.

- Extracts task-relevant information from all State layers
- Compresses and prioritizes to fit the target agent's context window
- Converts to agent-specific format
- Extracts new State from agent responses and writes it back

#### 3. Instruction Hub

Unified management layer for AI instructions.

- **Entry Point Manager** — Mirror / hub-only mode selection, auto-detection of existing instruction files
- **Instruction Registry** — Dynamic add/remove of AI documents, plugin-style management
- **Primary Source Designation** — Designate which tool's instructions are authoritative, resolve conflicts accordingly

#### 4. Rule Engine

Runtime rule resolution. Not static generation — rules are dynamically applied based on current context.

- **Type system** — constraint (mandatory), preference (recommended), context (informational), skill (behavioral)
- **Scoping** — File globs, language, task type, CI/interactive mode
- **Priority resolution** — Type-based automatic resolution (constraints always override preferences)

#### 5. Consensus Engine

Decision-making patterns for multi-agent environments:

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Dictator** | Single master makes all final decisions | Standard development |
| **Validator** | Primary implements, others verify specific aspects | Security review |
| **Quorum** | Multiple agents vote, threshold determines adoption | Architecture decisions |
| **Pipeline** | Each agent handles a different stage sequentially | Implement → review → optimize |
| **Specialist** | Auto-route by domain or file type | Monorepo development |
| **Auction** | All agents execute in parallel, best output is selected | Optimal solution search |

#### 6. Optimizer

Three-axis optimization tradeoff under user control:

```
                    Accuracy
                        ▲
                       ╱ ╲
                      ╱   ╲
                     ╱     ╲
                    ╱ User   ╲
                   ╱ chooses  ╲
                  ╱  position  ╲
                 ╱   in this    ╲
                ╱     space      ╲
               ▼─────────────────▶
            Cost               Speed
```

- **Accuracy** — Multi-model consensus, validation pipelines, prefer larger models
- **Cost** — Route simple tasks to smaller models, cache, deduplicate
- **Speed** — Parallel execution, prefer fastest models, prefetch

Configurable via presets (accurate / fast / cheap / balanced) or custom ratios. Per-task-type overrides supported.

---

## Competitive Landscape

| Dimension | AGENTS.md | block/ai-rules | rulesync | ai-rulez | **Meta Agent** |
|---|---|---|---|---|---|
| Data model | None | Shallow | Moderate | Deep | **Runtime** |
| Conflict resolution | Closest file wins | None | Last wins | 3-tier hierarchy | **Type + priority** |
| State management | None | None | None | None | **3-tier state** |
| Multi-agent governance | None | None | None | None | **6 patterns** |
| Optimization control | None | None | None | None | **3-axis control** |
| Context continuity | None | None | None | None | **Context Compiler** |
| Approach | Naming convention | Static gen | Static gen | Static gen | **Runtime governance** |

### Adjacent Projects

Projects that overlap with individual aspects of Meta Agent but do not combine them:

**Orchestration**

| Project | What It Does | Gap |
|---------|-------------|-----|
| [MCO](https://github.com/mco-org/mco) | Dispatches prompts to multiple agent CLIs in parallel, aggregates results | No persistent state, no governance, no context compilation |
| [Composio Agent-Orchestrator](https://github.com/ComposioHQ/agent-orchestrator) | Spawns parallel coding agents in isolated worktrees | Not a meta-layer across tools, no governance policies |
| [Agent-MCP](https://github.com/rinadelph/Agent-MCP) | Multi-agent coordination through MCP with shared memory bank | Framework-specific, not cross-tool |

**Session Management**

| Project | What It Does | Gap |
|---------|-------------|-----|
| [ccmanager](https://github.com/kbwo/ccmanager) | Copies session data across worktrees for multiple AI CLIs | No governance, no consensus, no context compilation |
| [Agent Deck](https://github.com/asheshgoplani/agent-deck) | TUI for managing multiple AI agent sessions | No persistent state or governance |

**Persistent Memory / State**

| Project | What It Does | Gap |
|---------|-------------|-----|
| [memctl](https://memctl.com) | Branch-aware persistent memory for AI coding agents via MCP | No governance, no multi-agent consensus |
| [Mem0 / OpenMemory](https://mem0.ai/openmemory) | Universal memory layer for AI agents with MCP server | General-purpose, not a governance layer |
| [ContextStream](https://contextstream.io/) | Cloud-based persistent memory with semantic search | No governance, no multi-agent coordination |
| [AgentKits Memory](https://www.agentkits.net/memory) | Local persistent memory via MCP + SQLite | Local-only, no multi-agent coordination |

**Context Engineering**

| Project | What It Does | Gap |
|---------|-------------|-----|
| [Aura (Auralith)](https://aura.auralith.org) | "Universal Context Compiler" with 3-tier memory | Document-focused, not a runtime governance layer |
| [HumanLayer ACE](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents) | Context engineering methodology for coding agents | Methodology/IDE, not a runtime layer |

**Runtime Governance**

| Project | What It Does | Gap |
|---------|-------------|-----|
| [Microsoft Agent-Governance-Toolkit](https://github.com/microsoft/agent-governance-toolkit) | Policy enforcement, zero-trust identity, sandboxing | Security/compliance-focused, not coding workflows |

**Key Finding**: No existing project combines runtime governance + persistent state management + context compilation + multi-agent consensus for AI coding workflows as a unified meta-layer. Individual pieces exist across 15+ projects, but the integration is unoccupied.

---

## Technology

### Language: TypeScript (Bun)

- MCP official SDK is TypeScript — use it directly with no wrapper overhead
- Fastest development velocity (critical for early phases)
- Bun enables single-binary compilation via `bun build --compile`
- Cross-compilation targets: macOS (arm64/x64), Linux (x64), Windows (x64)

### Storage: SQLite + File Hybrid

| Data | Storage | Rationale |
|------|---------|-----------|
| Session State | SQLite | Structured data, needs querying |
| Project State | SQLite | Structured data, needs querying |
| Knowledge State | Markdown files | Human-readable, git-diffable |
| Rules / Instructions | Markdown files | Human-editable, versionable |

Rules and knowledge are intentionally file-based. Locking them inside a database would remove the ability for users to directly read, edit, and version-control them.

### Protocol: MCP Server + Thin CLI

The MCP server is the core. It holds all functionality. The CLI is a thin client for management commands (`meta-agent init`, `meta-agent status`, etc.) and connects to the same MCP server that Claude Code / Cursor / other tools use.

```
User → meta-agent CLI → MCP Server (core)
Claude Code ──────────→ MCP Server (core)
Cursor ───────────────→ MCP Server (core)
```

### Distribution

| Channel | Command | Platform |
|---------|---------|----------|
| npm | `npx meta-agent` | All |
| Homebrew | `brew install meta-agent` | macOS / Linux |
| Scoop | `scoop install meta-agent` | Windows |
| winget | `winget install meta-agent` | Windows |
| GitHub Releases | Binary download | macOS (arm64/x64), Linux (x64), Windows (x64) |
| curl installer | `curl -fsSL ... \| sh` | macOS / Linux |

All binaries are built automatically via GitHub Actions CI. Cross-compiled from a single codebase using `bun build --compile --target`.

### Monorepo Structure

```
meta-agent/
├─ packages/
│   ├─ core/          # State Manager, Context Compiler, Rule Engine
│   ├─ mcp-server/    # MCP Server
│   ├─ cli/           # CLI commands
│   └─ ui/            # Dashboard (React + Vite)
├─ docs/
├─ package.json       # Bun workspace root
└─ README.md
```

### CLI Commands and Dashboard

Everything visible in the dashboard is also accessible via CLI commands. The dashboard is a visual layer over the same data source.

```
meta-agent state list          # List all state entries
meta-agent state show <id>     # Show a specific state entry
meta-agent sessions            # List session history
meta-agent rules list          # List active rules and scoping
meta-agent cost summary        # Token usage and cost tracking
meta-agent ui                  # Launch dashboard in browser
```

`meta-agent ui` starts a local web server (Bun built-in HTTP) and opens the dashboard. The frontend (React + Vite) is bundled into the CLI binary — no separate install required.
