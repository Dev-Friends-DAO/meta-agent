# Meta Agent Roadmap

A runtime governance layer for AI coding agents. Unified state management and context compilation across sessions, tools, and models.

---

## Phase 1 — "Remember Everything" (State Manager + Context Compiler)

```
Phase 1
│
├─ 1.1 State Storage Layer
│   ├─ Design state persistence format
│   ├─ Implement 3-tier store (Session / Project / Knowledge)
│   ├─ State CRUD API
│   └─ State Retention Policy (time / size / relevance / compression / manual)
│
├─ 1.2 State Extractor
│   ├─ Extract state from agent responses
│   ├─ Auto-ingest git diff / file changes
│   └─ Structure user intent and decisions
│
├─ 1.3 Context Compiler
│   ├─ Relevance extraction algorithm from state
│   ├─ Context window fitting
│   └─ Agent-specific formatters
│
├─ 1.4 MCP Server
│   ├─ MCP protocol implementation
│   ├─ Claude Code / Cursor connectivity
│   └─ Basic CLI interface
│
├─ 1.5 CLI Commands
│   ├─ meta-agent state list / show <id>
│   ├─ meta-agent sessions
│   ├─ meta-agent rules list
│   ├─ meta-agent cost summary
│   └─ meta-agent init / status
│
└─ 1.6 Dashboard UI
    ├─ meta-agent ui (launch local web server)
    ├─ Session history and active state display
    ├─ 3-tier state contents and remaining TTL visualization
    ├─ Retention policy status display
    └─ React + Vite (bundled into CLI)
```

---

## Phase 1.5 — "One Hub, All Agents" (Instruction Hub)

```
Phase 1.5
│
├─ 1.5.1 Entry Point Manager
│   ├─ Dedicated entry point (.meta-agent/)
│   ├─ Mode selection: mirror (preserve existing files) / hub-only (single entry point)
│   └─ Auto-detect existing CLAUDE.md / AGENTS.md / etc.
│
├─ 1.5.2 Instruction Registry
│   ├─ Dynamic add/remove of AI documents
│   ├─ Plugin-style instruction management
│   └─ Version control and diff tracking
│
└─ 1.5.3 Primary Source Designation
    ├─ Designate primary AI (which tool's instructions are authoritative)
    ├─ Conflict resolution rules (primary's content wins)
    └─ Per-tool overrides
```

---

## Phase 2 — "Smart Rules" (Rule Engine)

```
Phase 2
│
├─ 2.1 Rule Schema
│   ├─ Rule type definitions (constraint / preference / context / skill)
│   ├─ Scoping conditions (glob, language, task type)
│   └─ Priority model
│
├─ 2.2 Runtime Resolver
│   ├─ Dynamic resolution of applicable rules based on current context
│   ├─ Inter-rule conflict detection and resolution
│   └─ State Manager integration
│
└─ 2.3 Compatibility Layer
    ├─ Read AGENTS.md / CLAUDE.md / .cursorrules
    ├─ Export to existing formats
    └─ Migration tool for existing projects
```

---

## Phase 3 — "Multi-Agent Governance" (Consensus Engine)

```
Phase 3
│
├─ 3.1 Adapter Layer
│   ├─ Claude API adapter
│   ├─ OpenAI API adapter
│   ├─ Gemini API adapter
│   └─ Local LLM adapter (Ollama, etc.)
│
├─ 3.2 Consensus Patterns
│   ├─ Dictator (single master — who makes the final call at runtime)
│   ├─ Validator (implement + verify)
│   ├─ Quorum (majority vote)
│   ├─ Pipeline (sequential stages)
│   ├─ Specialist (expert committee)
│   └─ Auction (competitive bidding)
│
└─ 3.3 Orchestrator
    ├─ Pattern-based task distribution
    ├─ Cross-agent context handoff
    └─ Result aggregation and final output generation
```

---

## Phase 4 — "Optimize Everything" (Optimizer)

```
Phase 4
│
├─ 4.1 Cost Tracker
│   ├─ Token usage tracking
│   ├─ Per-model cost calculation
│   └─ Budget constraint enforcement
│
├─ 4.2 Routing Engine
│   ├─ 3-axis optimization (accuracy / cost / speed)
│   ├─ Task classifier (task characteristics → optimal model)
│   └─ Dynamic routing based on user settings
│
└─ 4.3 Analytics
    ├─ Session analysis dashboard
    ├─ Per-model performance comparison
    └─ Auto-generated optimization recommendations
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Meta Agent                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ Rule Engine  │ │  Optimizer  │ │State Manager │  │
│  │  (Phase 2)  │ │  (Phase 4)  │ │  (Phase 1)   │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬───────┘  │
│         │               │               │           │
│  ┌──────▼───────────────▼───────────────▼───────┐   │
│  │           Context Compiler (Phase 1)          │   │
│  └──────────────────────┬────────────────────────┘   │
│                         │                            │
│  ┌──────────────────────▼────────────────────────┐   │
│  │     Instruction Hub (Phase 1.5)                │   │
│  └──────────────────────┬────────────────────────┘   │
│                         │                            │
│  ┌──────────────────────▼────────────────────────┐   │
│  │        Consensus Engine (Phase 3)              │   │
│  └──────────────────────┬────────────────────────┘   │
│                         │                            │
│  ┌──────────────────────▼────────────────────────┐   │
│  │           Adapter Layer (Phase 3.1)            │   │
│  │   Claude │ GPT │ Gemini │ Local LLM │ ...     │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Optimization Tradeoff

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
