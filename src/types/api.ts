// API and HTTP request types (for future extensions)

// Generic API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// HTTP request types
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

export interface RequestConfig extends RequestOptions {
  url: string;
  baseURL?: string;
  params?: Record<string, any>;
}

// Template API types (for future cloud storage)
export interface TemplateApiData {
  id: string;
  name: string;
  description?: string;
  paperFormat: string;
  elements: any[];
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  paperFormat: string;
  elements: any[];
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {
  version: number;
}

export interface TemplateSearchParams {
  query?: string;
  tags?: string[];
  paperFormat?: string;
  isPublic?: boolean;
  createdBy?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// File API types (for future cloud storage)
export interface FileUploadRequest {
  file: File;
  filename?: string;
  folder?: string;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
}

export interface FileDownloadRequest {
  id: string;
  filename?: string;
}

// User API types (for future authentication)
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  language: 'ru' | 'en';
  theme: 'light' | 'dark' | 'auto';
  defaultPaperFormat: string;
  autoSave: boolean;
  notifications: {
    email: boolean;
    push: boolean;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

// Analytics API types (for future usage tracking)
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: string;
}

export interface UsageStats {
  templatesCreated: number;
  documentsGenerated: number;
  filesUploaded: number;
  lastActivity: string;
  totalTime: number;
}

// Webhook types (for future integrations)
export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  signature: string;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

// Rate limiting types
export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Health check types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  checks: {
    database: 'up' | 'down';
    storage: 'up' | 'down';
    cache: 'up' | 'down';
  };
  timestamp: string;
}