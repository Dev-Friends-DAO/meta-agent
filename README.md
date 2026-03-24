# Meta Agent

A runtime governance layer for AI coding agents.

Engineers choose their preferred editor. They also choose their preferred AI. But today, each AI tool lives in its own silo — separate instruction files, separate context, separate memory. Meta Agent sits above all of them as a unified layer.

## The Problem

Every AI coding tool has invented its own instruction format: `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and more. Existing solutions (rulesync, ai-rulez, etc.) attempt to bridge these by generating static files. They are file converters. They do not solve the deeper problems:

- **State dies between sessions.** Switch tools or close a terminal, and all context is gone.
- **Rules are static.** No tool applies different rules based on what you're actually doing.
- **No agent coordination.** When multiple AI agents work on the same project, there is no governance.

## What Meta Agent Does

**State Manager** — Persistent, three-tier memory (session / project / knowledge) that survives across sessions, tools, and time.

**Context Compiler** — Assembles the right context for the right agent at the right moment, fitted to its context window.

**Instruction Hub** — One entry point for all AI instructions. Non-destructive: works alongside existing files or replaces them. Your choice.

**Rule Engine** — Runtime rule resolution with types (constraint > preference > context > skill), scoping, and priority.

**Consensus Engine** — Multi-agent decision patterns: dictator, validator, quorum, pipeline, specialist, auction.

**Optimizer** — User-controlled tradeoff between accuracy, cost, and speed.

## How It's Different

Existing tools generate files. Meta Agent governs execution.

```
Existing tools:  Static file generators
Meta Agent:      Runtime governance layer
```

It does not compete with AGENTS.md or CLAUDE.md. It sits on top of them.

## Documentation

- [PRODUCT.md](docs/PRODUCT.md) — Architecture, philosophy, and competitive analysis
- [ROADMAP.md](docs/ROADMAP.md) — Phased delivery plan

## License

AGPL-3.0
