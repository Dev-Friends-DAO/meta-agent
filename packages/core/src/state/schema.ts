/**
 * State Storage Layer — SQLite Schema
 *
 * Session State and Project State are stored in SQLite.
 * Knowledge State is stored as Markdown files with YAML frontmatter.
 */

export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS session_state (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    accessed_at INTEGER NOT NULL,
    expires_at INTEGER,
    compressed INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS project_state (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    accessed_at INTEGER NOT NULL,
    expires_at INTEGER,
    compressed INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS retention_log (
    id TEXT PRIMARY KEY,
    tier TEXT NOT NULL,
    target_id TEXT NOT NULL,
    action TEXT NOT NULL,
    strategy TEXT NOT NULL,
    executed_at INTEGER NOT NULL
  )`,

  "CREATE INDEX IF NOT EXISTS idx_session_state_session_id ON session_state(session_id)",
  "CREATE INDEX IF NOT EXISTS idx_session_state_type ON session_state(type)",
  "CREATE INDEX IF NOT EXISTS idx_session_state_created_at ON session_state(created_at)",
  "CREATE INDEX IF NOT EXISTS idx_session_state_expires_at ON session_state(expires_at)",

  "CREATE INDEX IF NOT EXISTS idx_project_state_type ON project_state(type)",
  "CREATE INDEX IF NOT EXISTS idx_project_state_created_at ON project_state(created_at)",
  "CREATE INDEX IF NOT EXISTS idx_project_state_expires_at ON project_state(expires_at)",

  "CREATE INDEX IF NOT EXISTS idx_retention_log_tier ON retention_log(tier)",
];

/** Session state entry types */
export type SessionStateType = "task" | "diff" | "decision" | "file" | "question";

/** Project state entry types */
export type ProjectStateType = "structure" | "dependency" | "summary" | "decision";

/** Retention actions */
export type RetentionAction = "expired" | "evicted" | "compressed" | "deleted";

/** Retention strategies */
export type RetentionStrategy = "time" | "size" | "relevance" | "compression" | "manual";
