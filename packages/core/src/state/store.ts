import { Database } from "bun:sqlite";
import { SCHEMA_STATEMENTS } from "./schema.ts";
import type {
  SessionStateEntry,
  ProjectStateEntry,
  RetentionConfig,
  RetentionLogEntry,
} from "./types.ts";
import { DEFAULT_RETENTION } from "./types.ts";
import type { SessionStateType, ProjectStateType, RetentionStrategy } from "./schema.ts";

function generateId(): string {
  return crypto.randomUUID();
}

function now(): number {
  return Date.now();
}

export class StateStore {
  private db: Database;
  private retention: RetentionConfig;

  constructor(dbPath: string, retention?: Partial<RetentionConfig>) {
    this.db = new Database(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    for (const stmt of SCHEMA_STATEMENTS) {
      this.db.exec(stmt);
    }
    this.retention = { ...DEFAULT_RETENTION, ...retention };
  }

  // --- Session State CRUD ---

  createSession(
    sessionId: string,
    type: SessionStateType,
    content: string,
  ): SessionStateEntry {
    const entry: SessionStateEntry = {
      id: generateId(),
      session_id: sessionId,
      type,
      content,
      created_at: now(),
      accessed_at: now(),
      expires_at: this.retention.session.time
        ? now() + this.retention.session.time.ttl
        : null,
      compressed: false,
    };

    this.db
      .prepare(
        `INSERT INTO session_state (id, session_id, type, content, created_at, accessed_at, expires_at, compressed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        entry.id,
        entry.session_id,
        entry.type,
        entry.content,
        entry.created_at,
        entry.accessed_at,
        entry.expires_at,
        entry.compressed ? 1 : 0,
      );

    return entry;
  }

  getSession(id: string): SessionStateEntry | null {
    const row = this.db
      .prepare("SELECT * FROM session_state WHERE id = ?")
      .get(id) as any;

    if (!row) return null;

    this.db
      .prepare("UPDATE session_state SET accessed_at = ? WHERE id = ?")
      .run(now(), id);

    return { ...row, compressed: row.compressed === 1 };
  }

  listSessions(sessionId?: string): SessionStateEntry[] {
    const query = sessionId
      ? this.db
          .prepare("SELECT * FROM session_state WHERE session_id = ? ORDER BY created_at DESC")
          .all(sessionId)
      : this.db
          .prepare("SELECT * FROM session_state ORDER BY created_at DESC")
          .all();

    return (query as any[]).map((row) => ({
      ...row,
      compressed: row.compressed === 1,
    }));
  }

  updateSession(id: string, content: string): boolean {
    const result = this.db
      .prepare(
        "UPDATE session_state SET content = ?, accessed_at = ? WHERE id = ?",
      )
      .run(content, now(), id);

    return result.changes > 0;
  }

  deleteSession(id: string): boolean {
    const result = this.db
      .prepare("DELETE FROM session_state WHERE id = ?")
      .run(id);

    if (result.changes > 0) {
      this.logRetention("session", id, "deleted", "manual");
      return true;
    }
    return false;
  }

  // --- Project State CRUD ---

  createProject(type: ProjectStateType, content: string): ProjectStateEntry {
    const entry: ProjectStateEntry = {
      id: generateId(),
      type,
      content,
      created_at: now(),
      accessed_at: now(),
      expires_at: this.retention.project.time
        ? now() + this.retention.project.time.ttl
        : null,
      compressed: false,
    };

    this.db
      .prepare(
        `INSERT INTO project_state (id, type, content, created_at, accessed_at, expires_at, compressed)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        entry.id,
        entry.type,
        entry.content,
        entry.created_at,
        entry.accessed_at,
        entry.expires_at,
        entry.compressed ? 1 : 0,
      );

    return entry;
  }

  getProject(id: string): ProjectStateEntry | null {
    const row = this.db
      .prepare("SELECT * FROM project_state WHERE id = ?")
      .get(id) as any;

    if (!row) return null;

    this.db
      .prepare("UPDATE project_state SET accessed_at = ? WHERE id = ?")
      .run(now(), id);

    return { ...row, compressed: row.compressed === 1 };
  }

  listProjects(type?: ProjectStateType): ProjectStateEntry[] {
    const query = type
      ? this.db
          .prepare("SELECT * FROM project_state WHERE type = ? ORDER BY created_at DESC")
          .all(type)
      : this.db
          .prepare("SELECT * FROM project_state ORDER BY created_at DESC")
          .all();

    return (query as any[]).map((row) => ({
      ...row,
      compressed: row.compressed === 1,
    }));
  }

  updateProject(id: string, content: string): boolean {
    const result = this.db
      .prepare(
        "UPDATE project_state SET content = ?, accessed_at = ? WHERE id = ?",
      )
      .run(content, now(), id);

    return result.changes > 0;
  }

  deleteProject(id: string): boolean {
    const result = this.db
      .prepare("DELETE FROM project_state WHERE id = ?")
      .run(id);

    if (result.changes > 0) {
      this.logRetention("project", id, "deleted", "manual");
      return true;
    }
    return false;
  }

  // --- Retention Policy Enforcement ---

  enforceRetention(): void {
    this.enforceTimePolicy();
    this.enforceSizePolicy();
    this.enforceRelevancePolicy();
    this.enforceCompressionPolicy();
  }

  private enforceTimePolicy(): void {
    const current = now();

    const sessionExpired = this.db
      .prepare(
        "SELECT id FROM session_state WHERE expires_at IS NOT NULL AND expires_at < ?",
      )
      .all(current) as { id: string }[];

    for (const { id } of sessionExpired) {
      this.db.prepare("DELETE FROM session_state WHERE id = ?").run(id);
      this.logRetention("session", id, "expired", "time");
    }

    const projectExpired = this.db
      .prepare(
        "SELECT id FROM project_state WHERE expires_at IS NOT NULL AND expires_at < ?",
      )
      .all(current) as { id: string }[];

    for (const { id } of projectExpired) {
      this.db.prepare("DELETE FROM project_state WHERE id = ?").run(id);
      this.logRetention("project", id, "expired", "time");
    }
  }

  private enforceSizePolicy(): void {
    const sessionMax = this.retention.session.size?.max_entries;
    if (sessionMax) {
      const overflow = this.db
        .prepare(
          `SELECT id FROM session_state ORDER BY created_at ASC
           LIMIT max(0, (SELECT count(*) FROM session_state) - ?)`,
        )
        .all(sessionMax) as { id: string }[];

      for (const { id } of overflow) {
        this.db.prepare("DELETE FROM session_state WHERE id = ?").run(id);
        this.logRetention("session", id, "evicted", "size");
      }
    }

    const projectMax = this.retention.project.size?.max_entries;
    if (projectMax) {
      const overflow = this.db
        .prepare(
          `SELECT id FROM project_state ORDER BY created_at ASC
           LIMIT max(0, (SELECT count(*) FROM project_state) - ?)`,
        )
        .all(projectMax) as { id: string }[];

      for (const { id } of overflow) {
        this.db.prepare("DELETE FROM project_state WHERE id = ?").run(id);
        this.logRetention("project", id, "evicted", "size");
      }
    }
  }

  private enforceRelevancePolicy(): void {
    const current = now();

    const sessionTtl = this.retention.session.relevance?.unreferenced_ttl;
    if (sessionTtl) {
      const cutoff = current - sessionTtl;
      const unreferenced = this.db
        .prepare(
          "SELECT id FROM session_state WHERE accessed_at < ?",
        )
        .all(cutoff) as { id: string }[];

      for (const { id } of unreferenced) {
        this.db.prepare("DELETE FROM session_state WHERE id = ?").run(id);
        this.logRetention("session", id, "evicted", "relevance");
      }
    }

    const projectTtl = this.retention.project.relevance?.unreferenced_ttl;
    if (projectTtl) {
      const cutoff = current - projectTtl;
      const unreferenced = this.db
        .prepare(
          "SELECT id FROM project_state WHERE accessed_at < ?",
        )
        .all(cutoff) as { id: string }[];

      for (const { id } of unreferenced) {
        this.db.prepare("DELETE FROM project_state WHERE id = ?").run(id);
        this.logRetention("project", id, "evicted", "relevance");
      }
    }
  }

  private enforceCompressionPolicy(): void {
    const current = now();

    const sessionCompressAfter = this.retention.session.time?.compress_after;
    if (sessionCompressAfter) {
      const cutoff = current - sessionCompressAfter;
      const candidates = this.db
        .prepare(
          "SELECT id FROM session_state WHERE created_at < ? AND compressed = 0",
        )
        .all(cutoff) as { id: string }[];

      for (const { id } of candidates) {
        this.db
          .prepare(
            "UPDATE session_state SET compressed = 1, accessed_at = ? WHERE id = ?",
          )
          .run(current, id);
        this.logRetention("session", id, "compressed", "compression");
      }
    }

    const projectCompressAfter = this.retention.project.time?.compress_after;
    if (projectCompressAfter) {
      const cutoff = current - projectCompressAfter;
      const candidates = this.db
        .prepare(
          "SELECT id FROM project_state WHERE created_at < ? AND compressed = 0",
        )
        .all(cutoff) as { id: string }[];

      for (const { id } of candidates) {
        this.db
          .prepare(
            "UPDATE project_state SET compressed = 1, accessed_at = ? WHERE id = ?",
          )
          .run(current, id);
        this.logRetention("project", id, "compressed", "compression");
      }
    }
  }

  // --- Retention Log ---

  private logRetention(
    tier: "session" | "project" | "knowledge",
    targetId: string,
    action: string,
    strategy: string,
  ): void {
    this.db
      .prepare(
        `INSERT INTO retention_log (id, tier, target_id, action, strategy, executed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(generateId(), tier, targetId, action, strategy, now());
  }

  getRetentionLog(tier?: string): RetentionLogEntry[] {
    const query = tier
      ? this.db
          .prepare("SELECT * FROM retention_log WHERE tier = ? ORDER BY executed_at DESC")
          .all(tier)
      : this.db
          .prepare("SELECT * FROM retention_log ORDER BY executed_at DESC")
          .all();

    return query as RetentionLogEntry[];
  }

  // --- Lifecycle ---

  close(): void {
    this.db.close();
  }
}
