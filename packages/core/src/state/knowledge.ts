import { readdir, readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { join, relative, basename, dirname } from "node:path";
import { existsSync } from "node:fs";
import type { KnowledgeStateEntry, KnowledgeFrontmatter } from "./types.ts";

const DEFAULT_CATEGORIES = ["preferences", "architecture", "decisions", "context"];

function parseFrontmatter(raw: string): { frontmatter: KnowledgeFrontmatter; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return {
      frontmatter: { type: "context", tags: [], created: new Date().toISOString().split("T")[0] },
      content: raw.trim(),
    };
  }

  const yamlBlock = match[1];
  const content = match[2].trim();

  const frontmatter: KnowledgeFrontmatter = {
    type: "context",
    tags: [],
    created: new Date().toISOString().split("T")[0],
  };

  for (const line of yamlBlock.split("\n")) {
    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":").trim();
    if (!key || !value) continue;

    const k = key.trim();
    if (k === "type") frontmatter.type = value;
    else if (k === "tags") {
      frontmatter.tags = value
        .replace(/^\[/, "")
        .replace(/\]$/, "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (k === "priority") frontmatter.priority = value as any;
    else if (k === "created") frontmatter.created = value;
    else if (k === "updated") frontmatter.updated = value;
  }

  return { frontmatter, content };
}

function serializeFrontmatter(frontmatter: KnowledgeFrontmatter, content: string): string {
  const lines = [
    "---",
    `type: ${frontmatter.type}`,
    `tags: [${frontmatter.tags.join(", ")}]`,
  ];

  if (frontmatter.priority) lines.push(`priority: ${frontmatter.priority}`);
  lines.push(`created: ${frontmatter.created}`);
  if (frontmatter.updated) lines.push(`updated: ${frontmatter.updated}`);

  lines.push("---", "", content, "");
  return lines.join("\n");
}

export class KnowledgeStore {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async init(): Promise<void> {
    if (!existsSync(this.basePath)) {
      await mkdir(this.basePath, { recursive: true });
    }
    for (const category of DEFAULT_CATEGORIES) {
      const categoryPath = join(this.basePath, category);
      if (!existsSync(categoryPath)) {
        await mkdir(categoryPath, { recursive: true });
      }
    }
  }

  async create(
    category: string,
    name: string,
    content: string,
    frontmatter: Partial<KnowledgeFrontmatter> = {},
  ): Promise<KnowledgeStateEntry> {
    const categoryPath = join(this.basePath, category);
    if (!existsSync(categoryPath)) {
      await mkdir(categoryPath, { recursive: true });
    }

    const filename = name.endsWith(".md") ? name : `${name}.md`;
    const filePath = join(categoryPath, filename);

    const fm: KnowledgeFrontmatter = {
      type: frontmatter.type ?? "context",
      tags: frontmatter.tags ?? [],
      priority: frontmatter.priority,
      created: frontmatter.created ?? new Date().toISOString().split("T")[0],
    };

    const raw = serializeFrontmatter(fm, content);
    await writeFile(filePath, raw, "utf-8");

    return { path: filePath, category, frontmatter: fm, content };
  }

  async get(category: string, name: string): Promise<KnowledgeStateEntry | null> {
    const filename = name.endsWith(".md") ? name : `${name}.md`;
    const filePath = join(this.basePath, category, filename);

    if (!existsSync(filePath)) return null;

    const raw = await readFile(filePath, "utf-8");
    const { frontmatter, content } = parseFrontmatter(raw);

    return { path: filePath, category, frontmatter, content };
  }

  async list(category?: string): Promise<KnowledgeStateEntry[]> {
    const entries: KnowledgeStateEntry[] = [];
    const categories = category
      ? [category]
      : await this.getCategories();

    for (const cat of categories) {
      const categoryPath = join(this.basePath, cat);
      if (!existsSync(categoryPath)) continue;

      const files = await readdir(categoryPath);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const filePath = join(categoryPath, file);
        const raw = await readFile(filePath, "utf-8");
        const { frontmatter, content } = parseFrontmatter(raw);
        entries.push({ path: filePath, category: cat, frontmatter, content });
      }
    }

    return entries;
  }

  async update(
    category: string,
    name: string,
    content: string,
    frontmatterUpdates?: Partial<KnowledgeFrontmatter>,
  ): Promise<boolean> {
    const existing = await this.get(category, name);
    if (!existing) return false;

    const fm: KnowledgeFrontmatter = {
      ...existing.frontmatter,
      ...frontmatterUpdates,
      updated: new Date().toISOString().split("T")[0],
    };

    const raw = serializeFrontmatter(fm, content);
    await writeFile(existing.path, raw, "utf-8");
    return true;
  }

  async delete(category: string, name: string): Promise<boolean> {
    const filename = name.endsWith(".md") ? name : `${name}.md`;
    const filePath = join(this.basePath, category, filename);

    if (!existsSync(filePath)) return false;
    await unlink(filePath);
    return true;
  }

  async getCategories(): Promise<string[]> {
    if (!existsSync(this.basePath)) return [];
    const entries = await readdir(this.basePath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  }
}
