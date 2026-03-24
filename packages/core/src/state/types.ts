import type {
  SessionStateType,
  ProjectStateType,
  RetentionAction,
  RetentionStrategy,
} from "./schema.ts";

/** Base state entry */
export interface StateEntry {
  id: string;
  content: string;
  created_at: number;
  accessed_at: number;
  expires_at: number | null;
  compressed: boolean;
}

/** Session state entry */
export interface SessionStateEntry extends StateEntry {
  session_id: string;
  type: SessionStateType;
}

/** Project state entry */
export interface ProjectStateEntry extends StateEntry {
  type: ProjectStateType;
}

/** Knowledge state frontmatter */
export interface KnowledgeFrontmatter {
  type: string;
  tags: string[];
  priority?: "critical" | "high" | "medium" | "low";
  created: string;
  updated?: string;
}

/** Knowledge state entry (file-based) */
export interface KnowledgeStateEntry {
  path: string;
  category: string;
  frontmatter: KnowledgeFrontmatter;
  content: string;
}

/** Retention policy configuration per tier */
export interface RetentionPolicy {
  time?: {
    ttl: number;
    compress_after?: number;
  };
  size?: {
    max_entries: number;
  };
  relevance?: {
    unreferenced_ttl: number;
  };
  compression?: {
    enabled: boolean;
    after: number;
  };
}

/** Full retention configuration */
export interface RetentionConfig {
  session: RetentionPolicy;
  project: RetentionPolicy;
  knowledge: {
    review_interval?: number;
  };
}

/** Retention log entry */
export interface RetentionLogEntry {
  id: string;
  tier: "session" | "project" | "knowledge";
  target_id: string;
  action: RetentionAction;
  strategy: RetentionStrategy;
  executed_at: number;
}

/** Default retention configuration */
export const DEFAULT_RETENTION: RetentionConfig = {
  session: {
    time: { ttl: 86400000, compress_after: 43200000 },
    size: { max_entries: 500 },
  },
  project: {
    time: { ttl: 2592000000, compress_after: 604800000 },
    size: { max_entries: 1000 },
  },
  knowledge: {
    review_interval: 7776000000,
  },
};
