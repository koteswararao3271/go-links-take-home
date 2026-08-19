export type LinkHealth = "unknown" | "healthy" | "broken";

export interface GoLink {
  slug: string;
  url: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  visitCount: number;
  lastVisitedAt?: string;
  health: LinkHealth;
  lastCheckedAt?: string;
  lastCheckStatus?: number;
  lastCheckError?: string;
}

export interface CreateLinkInput {
  slug: string;
  url: string;
  description?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
