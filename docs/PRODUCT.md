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
