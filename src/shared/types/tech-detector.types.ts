/**
 * Vortex Pipeline - Tech Detector Types
 *
 * Shared type definitions for technology detection.
 *
 * @module shared/types
 * @version 1.0.0
 */

/**
 * Technology detection result
 */
export interface TechDetectionResult {
  /** URL that was analyzed */
  url: string;

  /** Detected technologies */
  technologies: Technology[];

  /** Detection metadata */
  metadata: DetectionMetadata;

  /** Errors encountered during detection */
  errors: DetectionError[];

  /** Warnings */
  warnings: string[];

  /** Processing time in milliseconds */
  processingTimeMs: number;

  /** Timestamp of detection */
  detectedAt: Date;

  /** Detector ID that performed detection */
  detectorId: string;
}

/**
 * Technology information
 */
export interface Technology {
  /** Unique technology identifier */
  id: string;

  /** Technology name */
  name: string;

  /** Technology version (if detected) */
  version?: string;

  /** Technology category */
  category: TechnologyCategory;

  /** Confidence level */
  confidence: ConfidenceLevel;

  /** Confidence score (0-1) */
  confidenceScore: number;

  /** Detection method used */
  detectionMethod: DetectionMethod;

  /** Evidence found */
  evidence: DetectionEvidence[];

  /** Website URL where detected */
  websiteUrl: string;

  /** First detected timestamp */
  firstDetectedAt: Date;

  /** Last detected timestamp */
  lastDetectedAt: Date;

  /** Technology description */
  description?: string;

  /** Technology website */
  website?: string;

  /** Technology tags */
  tags?: string[];

  /** Parent technology (for frameworks/libraries) */
  parentId?: string;

  /** Child technologies */
  children?: Technology[];

  /** Market share data */
  marketShare?: MarketShareData;

  /** Vulnerability information */
  vulnerabilities?: VulnerabilityInfo[];
}

/**
 * Technology categories
 */
export type TechnologyCategory =
  | 'cms'
  | 'ecommerce'
  | 'framework'
  | 'javascript-framework'
  | 'css-framework'
  | 'ui-library'
  | 'analytics'
  | 'advertising'
  | 'marketing-automation'
  | 'crm'
  | 'customer-support'
  | 'payment'
  | 'cdn'
  | 'hosting'
  | 'security'
  | 'font'
  | 'widget'
  | 'social'
  | 'tag-manager'
  | 'a-b-testing'
  | 'personalization'
  | 'search'
  | 'monitoring'
  | 'development'
  | 'build-tool'
  | 'package-manager'
  | 'language'
  | 'database'
  | 'cache'
  | 'queue'
  | 'api-gateway'
  | 'load-balancer'
  | 'dns'
  | 'email'
  | 'sms'
  | 'push-notification'
  | 'authentication'
  | 'authorization'
  | 'logging'
  | 'error-tracking'
  | 'performance'
  | 'seo'
  | 'accessibility'
  | 'other';

/**
 * Confidence levels
 */
export type ConfidenceLevel = 'certain' | 'high' | 'medium' | 'low' | 'implied';

/**
 * Detection methods
 */
export type DetectionMethod =
  | 'html-pattern'
  | 'header-pattern'
  | 'script-src'
  | 'meta-tag'
  | 'cookie-pattern'
  | 'dns-record'
  | 'ssl-certificate'
  | 'wappalyzer'
  | 'custom';

/**
 * Detection evidence
 */
export interface DetectionEvidence {
  /** Type of evidence */
  type: DetectionMethod;

  /** Pattern or rule that matched */
  pattern: string;

  /** Matched content (truncated) */
  match: string;

  /** Location in response */
  location: 'html' | 'header' | 'script' | 'meta' | 'cookie' | 'dns' | 'ssl';

  /** Selector or path */
  selector?: string;

  /** Confidence contribution */
  confidenceContribution: number;
}

/**
 * Market share data
 */
export interface MarketShareData {
  /** Global market share percentage */
  global?: number;

  /** Regional market share */
  regional?: Record<string, number>;

  /** Category market share */
  category?: number;

  /** Trend (growing, stable, declining) */
  trend?: 'growing' | 'stable' | 'declining';

  /** Data source */
  source?: string;

  /** Last updated */
  lastUpdated?: Date;
}

/**
 * Vulnerability information
 */
export interface VulnerabilityInfo {
  /** CVE ID */
  cveId: string;

  /** Severity */
  severity: 'critical' | 'high' | 'medium' | 'low';

  /** Description */
  description: string;

  /** Affected versions */
  affectedVersions: string[];

  /** Fixed versions */
  fixedVersions: string[];

  /** Published date */
  publishedAt: Date;

  /** References */
  references: string[];
}

/**
 * Detection options
 */
export interface TechDetectionOptions {
  /** Categories to detect (empty = all) */
  categories?: TechnologyCategory[];

  /** Specific technologies to detect (empty = all) */
  technologies?: string[];

  /** Minimum confidence level */
  minConfidence?: ConfidenceLevel;

  /** Maximum technologies to return */
  maxTechnologies?: number;

  /** Include evidence in results */
  includeEvidence?: boolean;

  /** Include version information (may require additional requests) */
  includeVersions?: boolean;

  /** Include market share data */
  includeMarketShare?: boolean;

  /** Include vulnerability information */
  includeVulnerabilities?: boolean;

  /** Timeout in milliseconds */
  timeoutMs?: number;

  /** Follow redirects */
  followRedirects?: boolean;

  /** Maximum redirects */
  maxRedirects?: number;

  /** Custom headers to send */
  headers?: Record<string, string>;

  /** User agent to use */
  userAgent?: string;

  /** Proxy configuration */
  proxy?: {
    host: string;
    port: number;
    protocol?: 'http' | 'https' | 'socks4' | 'socks5';
    auth?: { username: string; password: string };
  };

  /** Enable JavaScript rendering (requires headless browser) */
  enableJsRendering?: boolean;

  /** Wait for selectors before detection (JS rendering) */
  waitForSelectors?: string[];

  /** Custom detection rules */
  customRules?: DetectionRule[];

  /** Exclude categories */
  excludeCategories?: TechnologyCategory[];

  /** Exclude technologies */
  excludeTechnologies?: string[];

  /** Only return technologies with version info */
  onlyWithVersions?: boolean;

  /** Group by category */
  groupByCategory?: boolean;
}

/**
 * Detection metadata
 */
export interface DetectionMetadata {
  /** Total technologies detected */
  totalDetected: number;

  /** Technologies by category */
  byCategory: Record<TechnologyCategory, number>;

  /** Technologies by confidence level */
  byConfidence: Record<ConfidenceLevel, number>;

  /** Technologies by detection method */
  byMethod: Record<DetectionMethod, number>;

  /** Response info */
  response: {
    statusCode: number;
    contentType: string;
    contentLength: number;
    responseTimeMs: number;
    redirectCount: number;
    finalUrl: string;
  };

  /** Detection methods used */
  methodsUsed: DetectionMethod[];

  /** Rules evaluated */
  rulesEvaluated: number;

  /** Rules matched */
  rulesMatched: number;

  /** Custom rules used */
  customRulesUsed: number;

  /** Wappalyzer patterns used */
  wappalyzerPatternsUsed?: number;
}

/**
 * Detection error
 */
export interface DetectionError {
  /** Error code */
  code: TechDetectionErrorCode;

  /** Error message */
  message: string;

  /** Technology ID if related */
  technologyId?: string;

  /** Category if related */
  category?: TechnologyCategory;

  /** Whether error is recoverable */
  recoverable: boolean;

  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Technology detection error codes
 */
export enum TechDetectionErrorCode {
  INVALID_URL = 'INVALID_URL',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  HTTP_ERROR = 'HTTP_ERROR',
  TLS_ERROR = 'TLS_ERROR',
  DNS_RESOLUTION_FAILED = 'DNS_RESOLUTION_FAILED',
  CONTENT_TOO_LARGE = 'CONTENT_TOO_LARGE',
  INVALID_CONTENT_TYPE = 'INVALID_CONTENT_TYPE',
  PARSING_ERROR = 'PARSING_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  BLOCKED = 'BLOCKED',
  JS_RENDERING_FAILED = 'JS_RENDERING_FAILED',
  RULE_PARSING_ERROR = 'RULE_PARSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Detection context (for rule evaluation)
 */
export interface DetectionContext {
  /** URL being analyzed */
  url: string;

  /** HTML content */
  html: string;

  /** HTTP headers */
  headers: Record<string, string>;

  /** Cookies */
  cookies: Record<string, string>;

  /** Scripts found */
  scripts: ScriptInfo[];

  /** Meta tags */
  metaTags: MetaTagInfo[];

  /** DNS records */
  dnsRecords?: DnsRecord[];

  /** SSL certificate */
  sslCertificate?: SslCertificateInfo;

  /** Response info */
  response: {
    statusCode: number;
    contentType: string;
    contentLength: number;
  };
}

/**
 * Script information
 */
export interface ScriptInfo {
  /** Script src URL */
  src?: string;

  /** Script content (inline) */
  content?: string;

  /** Script type */
  type?: string;

  /** Async attribute */
  async?: boolean;

  /** Defer attribute */
  defer?: boolean;

  /** Integrity attribute */
  integrity?: string;

  /** Crossorigin attribute */
  crossorigin?: string;
}

/**
 * Meta tag information
 */
export interface MetaTagInfo {
  /** Name attribute */
  name?: string;

  /** Property attribute (Open Graph) */
  property?: string;

  /** Http-equiv attribute */
  httpEquiv?: string;

  /** Content attribute */
  content?: string;

  /** Charset attribute */
  charset?: string;
}

/**
 * DNS record
 */
export interface DnsRecord {
  /** Record type */
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'CAA';

  /** Record value */
  value: string;

  /** TTL */
  ttl?: number;

  /** Priority (for MX) */
  priority?: number;
}

/**
 * SSL certificate info
 */
export interface SslCertificateInfo {
  /** Subject */
  subject: string;

  /** Issuer */
  issuer: string;

  /** Valid from */
  validFrom: Date;

  /** Valid to */
  validTo: Date;

  /** Subject alternative names */
  sanList: string[];

  /** Fingerprint (SHA256) */
  fingerprint: string;

  /** Signature algorithm */
  signatureAlgorithm?: string;

  /** Public key algorithm */
  publicKeyAlgorithm?: string;

  /** Public key size */
  publicKeySize?: number;
}

/**
 * Detection rule (Wappalyzer-compatible)
 */
export interface DetectionRule {
  /** Unique rule identifier */
  id: string;

  /** Technology name */
  name: string;

  /** Technology category */
  category: TechnologyCategory;

  /** Technology description */
  description?: string;

  /** Technology website */
  website?: string;

  /** Confidence level */
  confidence?: ConfidenceLevel;

  /** Version detection */
  version?: VersionDetection;

  /** HTML patterns */
  html?: PatternRule[];

  /** Header patterns */
  headers?: PatternRule[];

  /** Script patterns */
  scripts?: PatternRule[];

  /** Meta tag patterns */
  meta?: PatternRule[];

  /** Cookie patterns */
  cookies?: PatternRule[];

  /** DNS patterns */
  dns?: DnsPatternRule[];

  /** SSL patterns */
  ssl?: SslPatternRule[];

  /** Implies other technologies */
  implies?: string[];

  /** Requires other technologies */
  requires?: string[];

  /** Excludes other technologies */
  excludes?: string[];

  /** Rule priority (higher = evaluated first) */
  priority?: number;

  /** Rule enabled */
  enabled?: boolean;

  /** Tags */
  tags?: string[];
}

/**
 * Version detection rule
 */
export interface VersionDetection {
  /** Pattern to extract version */
  pattern: string;

  /** Regex group to capture version */
  group?: number;

  /** Version format */
  format?: string;
}

/**
 * Pattern rule for HTML, headers, scripts, meta, cookies
 */
export interface PatternRule {
  /** Regex pattern */
  pattern: string;

  /** Confidence contribution (0-1) */
  confidence?: number;

  /** Version extraction pattern */
  version?: string;

  /** Pattern flags */
  flags?: string;

  /** Description */
  description?: string;
}

/**
 * DNS pattern rule
 */
export interface DnsPatternRule {
  /** Record type */
  type: 'CNAME' | 'TXT' | 'A' | 'AAAA';

  /** Pattern to match */
  pattern: string;

  /** Confidence contribution */
  confidence?: number;
}

/**
 * SSL pattern rule
 */
export interface SslPatternRule {
  /** Pattern to match in certificate */
  pattern: string;

  /** Field to search */
  field: 'subject' | 'issuer' | 'san' | 'fingerprint';

  /** Confidence contribution */
  confidence?: number;
}

/**
 * Batch detection result
 */
export interface BatchDetectionResult {
  /** Individual results */
  results: TechDetectionResult[];

  /** Summary */
  summary: BatchDetectionSummary;

  /** Total processing time */
  totalProcessingTimeMs: number;

  /** Timestamp */
  detectedAt: Date;
}

/**
 * Batch detection summary
 */
export interface BatchDetectionSummary {
  /** Total URLs processed */
  totalUrls: number;

  /** Successful detections */
  successful: number;

  /** Failed detections */
  failed: number;

  /** Total technologies found */
  totalTechnologies: number;

  /** Unique technologies found */
  uniqueTechnologies: number;

  /** Technologies by category */
  byCategory: Record<TechnologyCategory, number>;

  /** Average processing time per URL */
  avgProcessingTimeMs: number;

  /** Average technologies per URL */
  avgTechnologiesPerUrl: number;
}

/**
 * Technology database entry (for building detection rules)
 */
export interface TechnologyDatabaseEntry {
  /** Technology ID */
  id: string;

  /** Technology name */
  name: string;

  /** Category */
  category: TechnologyCategory;

  /** Description */
  description: string;

  /** Website */
  website: string;

  /** Tags */
  tags: string[];

  /** Detection rules */
  rules: DetectionRule[];

  /** Market share */
  marketShare?: MarketShareData;

  /** Vulnerabilities */
  vulnerabilities?: VulnerabilityInfo[];

  /** Parent technology */
  parent?: string;

  /** Child technologies */
  children?: string[];

  /** Last updated */
  lastUpdated: Date;

  /** Source */
  source: 'wappalyzer' | 'builtwith' | 'custom' | 'manual';
}

/**
 * Technology index entry (for fast lookups)
 */
export interface TechnologyIndexEntry {
  id: string;
  name: string;
  category: TechnologyCategory;
  tags: string[];
  confidence: ConfidenceLevel;
}