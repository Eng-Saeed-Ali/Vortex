/**
 * Vortex Pipeline - Technology Detector Interfaces
 * 
 * Interfaces for technology stack detection (Wappalyzer, BuiltWith, Custom detectors).
 * 
 * @module shared/interfaces
 * @version 1.0.0
 */

import { ProviderHealthStatus, ProviderCapabilities } from './provider.interface';

/**
 * Technology category
 */
export type TechnologyCategory = 
  | 'cms'
  | 'ecommerce'
  | 'frameworks'
  | 'javascript-frameworks'
  | 'programming-languages'
  | 'web-servers'
  | 'operating-systems'
  | 'databases'
  | 'analytics'
  | 'advertising'
  | 'marketing-automation'
  | 'customer-support'
  | 'social-media'
  | 'tag-managers'
  | 'cdn'
  | 'hosting'
  | 'security'
  | 'ssl'
  | 'payment-processors'
  | 'fonts'
  | 'widgets'
  | 'miscellaneous'
  | string; // Allow custom categories

/**
 * Technology detection confidence
 */
export type DetectionConfidence = 'certain' | 'high' | 'medium' | 'low';

/**
 * Detected technology
 */
export interface DetectedTechnology {
  /** Technology name */
  name: string;
  /** Technology slug/identifier */
  slug: string;
  /** Category */
  categories: TechnologyCategory[];
  /** Version if detected */
  version?: string;
  /** Confidence level */
  confidence: DetectionConfidence;
  /** Detection method */
  detectionMethod: DetectionMethod;
  /** Evidence found */
  evidence: DetectionEvidence[];
  /** Website URL where detected */
  detectedUrl?: string;
  /** Icon URL */
  icon?: string;
  /** Website */
  website?: string;
  /** Description */
  description?: string;
  /** Tags */
  tags?: string[];
  /** Parent technology (if sub-technology) */
  parent?: string;
  /** Whether deprecated */
  deprecated?: boolean;
}

/**
 * Detection method
 */
export type DetectionMethod = 
  | 'html'
  | 'headers'
  | 'scripts'
  | 'cookies'
  | 'meta-tags'
  | 'dns'
  | 'ssl'
  | 'robots-txt'
  | 'sitemap'
  | 'api'
  | 'behavioral'
  | 'fingerprint'
  | string;

/**
 * Detection evidence
 */
export interface DetectionEvidence {
  /** Evidence type */
  type: DetectionMethod;
  /** Evidence value/** Evidence description */
  description: string;
  /** Selector or pattern used */
  selector?: string;
  /** Matched value */
  value?: string;
  /** Location in page */
  location?: string;
}

/**
 * Technology detection options
 */
export interface TechDetectionOptions {
  /** URLs to analyze */
  urls: string[];
  /** Include subdomains */
  includeSubdomains?: boolean;
  /** Maximum pages to crawl */
  maxPages?: number;
  /** Crawl depth */
  crawlDepth?: number;
  /** Follow redirects */
  followRedirects?: boolean;
  /** Timeout per page (ms) */
  pageTimeout?: number;
  /** Use specific proxy */
  proxy?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** User agent */
  userAgent?: string;
  /** Categories to detect (empty = all) */
  categories?: TechnologyCategory[];
  /** Minimum confidence */
  minConfidence?: DetectionConfidence;
  /** Detect only specific technologies */
  technologies?: string[];
  /** Exclude technologies */
  excludeTechnologies?: string[];
  /** Enable behavioral detection */
  behavioralDetection?: boolean;
  /** Enable fingerprinting */
  fingerprinting?: boolean;
}

/**
 * Technology detection result
 */
export interface TechDetectionResult {
  /** Analyzed URL */
  url: string;
  /** Final URL after redirects */
  finalUrl?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Detected technologies */
  technologies: DetectedTechnology[];
  /** Technology categories found */
  categories: TechnologyCategory[];
  /** Total technologies detected */
  totalTechnologies: number;
  /** Detection duration (ms) */
  durationMs: number;
  /** Pages analyzed */
  pagesAnalyzed: number;
  /** Errors encountered */
  errors?: DetectionError[];
  /** Detected at */
  detectedAt: Date;
  /** Response headers */
  headers?: Record<string, string>;
  /** SSL info */
  sslInfo?: SslInfo;
  /** Performance metrics */
  performance?: PerformanceMetrics;
}

/**
 * Detection error
 */
export interface DetectionError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** URL that caused error */
  url?: string;
  /** Recoverable */
  recoverable: boolean;
}

/**
 * SSL information
 */
export interface SslInfo {
  /** Has valid SSL */
  valid: boolean;
  /** Issuer */
  issuer?: string;
  /** Valid from */
  validFrom?: Date;
  /** Valid to */
  validTo?: Date;
  /** Protocol version */
  protocol?: string;
  /** Cipher suite */
  cipher?: string;
  /** Certificate fingerprint */
  fingerprint?: string;
  /** Subject alternative names */
  subjectAltNames?: string[];
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Page load time (ms) */
  loadTime?: number;
  /** DOM content loaded (ms) */
  domContentLoaded?: number;
  /** First contentful paint (ms) */
  firstContentfulPaint?: number;
  /** Time to interactive (ms) */
  timeToInteractive?: number;
  /** Total page size (bytes) */
  pageSize?: number;
  /** Resource count */
  resourceCount?: number;
  /** Request count */
  requestCount?: number;
}

/**
 * Batch technology detection request
 */
export interface BatchTechDetectionRequest {
  /** URLs to analyze */
  urls: string[];
  /** Options for detection */
  options?: TechDetectionOptions;
  /** Correlation ID */
  correlationId?: string;
  /** Callback URL for async results */
  callbackUrl?: string;
}

/**
 * Batch technology detection result
 */
export interface BatchTechDetectionResult {
  /** Request ID */
  requestId: string;
  /** Total URLs */
  total: number;
  /** Processed count */
  processed: number;
  /** Successful count */
  successful: number;
  /** Failed count */
  failed: number;
  /** Results */
  results: TechDetectionResult[];
  /** Started at */
  startedAt: Date;
  /** Completed at */
  completedAt?: Date;
  /** Status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Technology detector configuration
 */
export interface TechDetectorConfig {
  /** Default timeout (ms) */
  defaultTimeout: number;
  /** Max concurrent detections */
  maxConcurrency: number;
  /** Max pages per site */
  maxPagesPerSite: number;
  /** Default crawl depth */
  defaultCrawlDepth: number;
  /** Enable caching */
  enableCache: boolean;
  /** Cache TTL (ms) */
  cacheTtl: number;
  /** User agent */
  userAgent: string;
  /** Follow redirects */
  followRedirects: boolean;
  /** Retry attempts */
  maxRetries: number;
  /** Retry delay (ms) */
  retryDelay: number;
  /** Default categories to detect */
  defaultCategories?: TechnologyCategory[];
  /** Custom technology definitions */
  customTechnologies?: CustomTechnology[];
}

/**
 * Custom technology definition
 */
export interface CustomTechnology {
  /** Technology name */
  name: string;
  /** Technology slug */
  slug: string;
  /** Categories */
  categories: TechnologyCategory[];
  /** Detection patterns */
  patterns: DetectionPattern[];
  /** Website */
  website?: string;
  /** Description */
  description?: string;
  /** Icon */
  icon?: string;
  /** Tags */
  tags?: string[];
}

/**
 * Detection pattern
 */
export interface DetectionPattern {
  /** Pattern type */
  type: DetectionMethod;
  /** Pattern (regex, selector, header name, etc.) */
  pattern: string;
  /** Pattern flags (for regex) */
  flags?: string;
  /** Version extraction pattern */
  versionPattern?: string;
  /** Confidence weight (1-100) */
  confidence: number;
  /** Description */
  description?: string;
}

/**
 * Technology detector interface
 * Implementations: Wappalyzer, BuiltWith, Custom fingerprinting
 */
export interface ITechDetector {
  /** Detector unique identifier */
  readonly detectorId: string;
  /** Detector display name */
  readonly name: string;
  /** Supported detection methods */
  readonly supportedMethods: DetectionMethod[];
  /** Maximum concurrent detections */
  readonly maxConcurrency: number;
  /** Request timeout (ms) */
  readonly timeoutMs: number;

  /**
   * Check if detector is healthy
   */
  healthCheck(): Promise<ProviderHealthStatus>;

  /**
   * Detect technologies on a single URL
   */
  detect(url: string, options?: Partial<TechDetectionOptions>): Promise<TechDetectionResult>;

  /**
   * Detect technologies on multiple URLs
   */
  detectBatch(urls: string[], options?: Partial<TechDetectionOptions>): Promise<TechDetectionResult[]>;

  /**
   * Start async batch detection
   */
  startBatchDetection(request: BatchTechDetectionRequest): Promise<string>;

  /**
   * Get batch detection status
   */
  getBatchStatus(requestId: string): Promise<BatchTechDetectionResult>;

  /**
   * Get detector capabilities
   */
  getCapabilities(): ProviderCapabilities;

  /**
   * Get all known technologies
   */
  getTechnologies(): Promise<DetectedTechnology[]>;

  /**
   * Get technologies by category
   */
  getTechnologiesByCategory(category: TechnologyCategory): Promise<DetectedTechnology[]>;

  /**
   * Search technologies
   */
  searchTechnologies(query: string): Promise<DetectedTechnology[]>;

  /**
   * Add custom technology
   */
  addCustomTechnology(tech: CustomTechnology): Promise<void>;

  /**
   * Remove custom technology
   */
  removeCustomTechnology(slug: string): Promise<void>;

  /**
   * Clear detection cache
   */
  clearCache(): Promise<void>;

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total entries */
  totalEntries: number;
  /** Hit count */
  hits: number;
  /** Miss count */
  misses: number;
  /** Hit rate */
  hitRate: number;
  /** Memory usage (bytes) */
  memoryUsage: number;
  /** Oldest entry */
  oldestEntry?: Date;
  /** Newest entry */
  newestEntry?: Date;
}

/**
 * Wappalyzer specific configuration
 */
export interface WappalyzerConfig extends TechDetectorConfig {
  /** Wappalyzer API key (if using cloud) */
  apiKey?: string;
  /** Wappalyzer API URL */
  apiUrl?: string;
  /** Use local Wappalyzer */
  useLocal: boolean;
  /** Local Wappalyzer path */
  localPath?: string;
  /** Driver (chrome, firefox, jsdom) */
  driver?: 'chrome' | 'firefox' | 'jsdom' | 'playwright';
  /** Proxy for local driver */
  proxy?: string;
}

/**
 * BuiltWith specific configuration
 */
export interface BuiltWithConfig extends TechDetectorConfig {
  /** BuiltWith API key */
  apiKey: string;
  /** API base URL */
  apiUrl?: string;
  /** Include meta data */
  includeMeta?: boolean;
  /** Include verticals */
  includeVerticals?: boolean;
  /** Include technologies */
  includeTechnologies?: boolean;
  /** Include subdomains */
  includeSubdomains?: boolean;
}

/**
 * Custom fingerprint detector configuration
 */
export interface CustomFingerprintConfig extends TechDetectorConfig {
  /** Technology definitions */
  technologies: CustomTechnology[];
  /** Default headers */
  defaultHeaders?: Record<string, string>;
  /** Enable JavaScript rendering */
  enableJsRendering: boolean;
  /** JavaScript rendering timeout (ms) */
  jsTimeout: number;
  /** Screenshot on detection */
  screenshot?: boolean;
}

/**
 * Technology fingerprint result
 */
export interface TechnologyFingerprint {
  /** Technology slug */
  slug: string;
  /** Matched patterns */
  matchedPatterns: MatchedPattern[];
  /** Overall confidence */
  confidence: number;
  /** Inferred version */
  version?: string;
}

/**
 * Matched pattern
 */
export interface MatchedPattern {
  /** Pattern that matched */
  pattern: DetectionPattern;
  /** Matched value */
  value: string;
  /** Location */
  location: string;
}