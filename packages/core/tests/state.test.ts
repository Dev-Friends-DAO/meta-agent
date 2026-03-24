import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { StateStore } from "../src/state/store.ts";
import { KnowledgeStore } from "../src/state/knowledge.ts";
import { unlinkSync, rmSync, existsSync } from "node:fs";

const TEST_DB = ":memory:";
const TEST_KNOWLEDGE = "/tmp/meta-agent-test-knowledge";

describe("StateStore", () => {
  let store: StateStore;

  beforeEach(() => {
    store = new StateStore(TEST_DB);
  });

  afterEach(() => {
    store.close();
  });

  describe("Session State CRUD", () => {
    it("creates and retrieves a session entry", () => {
      const entry = store.createSession("sess-1", "task", '{"name": "refactor auth"}');
      expect(entry.id).toBeTruthy();
      expect(entry.session_id).toBe("sess-1");
      expect(entry.type).toBe("task");

      const retrieved = store.getSession(entry.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.content).toBe('{"name": "refactor auth"}');
    });

    it("lists sessions by session_id", () => {
      store.createSession("sess-1", "task", "task 1");
      store.createSession("sess-1", "diff", "diff 1");
      store.createSession("sess-2", "task", "task 2");

      const sess1 = store.listSessions("sess-1");
      expect(sess1.length).toBe(2);

      const all = store.listSessions();
      expect(all.length).toBe(3);
    });

    it("updates a session entry", () => {
      const entry = store.createSession("sess-1", "task", "original");
      const updated = store.updateSession(entry.id, "modified");
      expect(updated).toBe(true);

      const retrieved = store.getSession(entry.id);
      expect(retrieved!.content).toBe("modified");
    });

    it("deletes a session entry", () => {
      const entry = store.createSession("sess-1", "task", "to delete");
      const deleted = store.deleteSession(entry.id);
      expect(deleted).toBe(true);

      const retrieved = store.getSession(entry.id);
      expect(retrieved).toBeNull();
    });
  });

  describe("Project State CRUD", () => {
    it("creates and retrieves a project entry", () => {
      const entry = store.createProject("structure", '{"files": 42}');
      expect(entry.id).toBeTruthy();

      const retrieved = store.getProject(entry.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.type).toBe("structure");
    });

    it("lists project entries by type", () => {
      store.createProject("structure", "struct 1");
      store.createProject("decision", "decision 1");
      store.createProject("structure", "struct 2");

      const structures = store.listProjects("structure");
      expect(structures.length).toBe(2);

      const all = store.listProjects();
      expect(all.length).toBe(3);
    });

    it("updates a project entry", () => {
      const entry = store.createProject("summary", "original");
      store.updateProject(entry.id, "updated");

      const retrieved = store.getProject(entry.id);
      expect(retrieved!.content).toBe("updated");
    });

    it("deletes a project entry", () => {
      const entry = store.createProject("dependency", "dep graph");
      store.deleteProject(entry.id);

      const retrieved = store.getProject(entry.id);
      expect(retrieved).toBeNull();
    });
  });

  describe("Retention Policy", () => {
    it("enforces time-based expiration", () => {
      const entry = store.createSession("sess-1", "task", "old task");

      // Manually set expires_at to the past
      store["db"]
        .prepare("UPDATE session_state SET expires_at = ? WHERE id = ?")
        .run(Date.now() - 1000, entry.id);

      store.enforceRetention();

      const retrieved = store.getSession(entry.id);
      expect(retrieved).toBeNull();
    });

    it("enforces size-based eviction", () => {
      const smallStore = new StateStore(":memory:", {
        session: { size: { max_entries: 2 } },
      });

      smallStore.createSession("s", "task", "first");
      smallStore.createSession("s", "task", "second");
      smallStore.createSession("s", "task", "third");

      smallStore.enforceRetention();

      const remaining = smallStore.listSessions();
      expect(remaining.length).toBe(2);

      smallStore.close();
    });

    it("marks entries for compression", () => {
      const entry = store.createSession("sess-1", "task", "compressible");

      // Set created_at to well beyond compress_after threshold
      store["db"]
        .prepare("UPDATE session_state SET created_at = ? WHERE id = ?")
        .run(Date.now() - 99999999, entry.id);

      store.enforceRetention();

      const retrieved = store.getSession(entry.id);
      expect(retrieved!.compressed).toBe(true);
    });

    it("logs retention actions", () => {
      const entry = store.createSession("sess-1", "task", "will expire");
      store["db"]
        .prepare("UPDATE session_state SET expires_at = ? WHERE id = ?")
        .run(Date.now() - 1000, entry.id);

      store.enforceRetention();

      const log = store.getRetentionLog("session");
      expect(log.length).toBeGreaterThan(0);
      expect(log[0].action).toBe("expired");
      expect(log[0].strategy).toBe("time");
    });
  });
});

describe("KnowledgeStore", () => {
  let store: KnowledgeStore;

  beforeEach(async () => {
    if (existsSync(TEST_KNOWLEDGE)) rmSync(TEST_KNOWLEDGE, { recursive: true });
    store = new KnowledgeStore(TEST_KNOWLEDGE);
    await store.init();
  });

  afterEach(() => {
    if (existsSync(TEST_KNOWLEDGE)) rmSync(TEST_KNOWLEDGE, { recursive: true });
  });

  it("initializes default categories", async () => {
    const categories = await store.getCategories();
    expect(categories).toContain("preferences");
    expect(categories).toContain("architecture");
    expect(categories).toContain("decisions");
    expect(categories).toContain("context");
  });

  it("creates and retrieves a knowledge entry", async () => {
    const entry = await store.create(
      "preferences",
      "testing-strategy",
      "Always use integration tests with real databases.",
      { type: "preference", tags: ["testing", "ci"], priority: "high" },
    );

    expect(entry.category).toBe("preferences");
    expect(entry.frontmatter.priority).toBe("high");

    const retrieved = await store.get("preferences", "testing-strategy");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.content).toBe("Always use integration tests with real databases.");
    expect(retrieved!.frontmatter.tags).toContain("testing");
  });

  it("lists entries across categories", async () => {
    await store.create("preferences", "style", "Use tabs.", { type: "preference", tags: [] });
    await store.create("decisions", "db-choice", "Use SQLite.", { type: "decision", tags: [] });

    const all = await store.list();
    expect(all.length).toBe(2);

    const prefs = await store.list("preferences");
    expect(prefs.length).toBe(1);
  });

  it("updates a knowledge entry", async () => {
    await store.create("preferences", "style", "Use tabs.", { type: "preference", tags: [] });
    const updated = await store.update("preferences", "style", "Use spaces.", {
      tags: ["formatting"],
    });
    expect(updated).toBe(true);

    const retrieved = await store.get("preferences", "style");
    expect(retrieved!.content).toBe("Use spaces.");
    expect(retrieved!.frontmatter.tags).toContain("formatting");
    expect(retrieved!.frontmatter.updated).toBeTruthy();
  });

  it("deletes a knowledge entry", async () => {
    await store.create("context", "auth", "OAuth2 flow.", { type: "context", tags: [] });
    const deleted = await store.delete("context", "auth");
    expect(deleted).toBe(true);

    const retrieved = await store.get("context", "auth");
    expect(retrieved).toBeNull();
  });

  it("creates custom categories on the fly", async () => {
    await store.create("custom-category", "note", "Custom note.", { type: "context", tags: [] });
    const categories = await store.getCategories();
    expect(categories).toContain("custom-category");
  });
});
