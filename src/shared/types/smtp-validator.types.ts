/**
 * Vortex Pipeline - SMTP Validator Types
 *
 * Shared type definitions for SMTP email validation.
 *
 * @module shared/types
 * @version 1.0.0
 */

/**
 * Email address structure
 */
export interface EmailAddress {
  /** Full email address */
  email: string;

  /** Local part (before @) */
  localPart: string;

  /** Domain part (after @) */
  domain: string;

  /** Whether syntax is valid */
  syntaxValid: boolean;
}

/**
 * SMTP validation options
 */
export interface SmtpValidationOptions {
  /** Validation level */
  level?: 'syntax' | 'dns' | 'smtp' | 'full';

  /** Timeout in milliseconds */
  timeoutMs?: number;

  /** Port to use for SMTP (default: 25) */
  port?: number;

  /** Use TLS/SSL */
  useTls?: boolean;

  /** Skip certificate verification */
  skipCertVerify?: boolean;

  /** Local hostname for HELO/EHLO */
  localHostname?: string;

  /** Sender email for MAIL FROM */
  senderEmail?: string;

  /** Custom DNS servers */
  dnsServers?: string[];

  /** Whether to detect catch-all domains */
  detectCatchAll?: boolean;

  /** Whether to check disposable domains */
  checkDisposable?: boolean;

  /** Whether to check role-based emails */
  checkRoleBased?: boolean;

  /** Maximum retries */
  maxRetries?: number;

  /** Retry delay in milliseconds */
  retryDelayMs?: number;

  /** Custom validation steps */
  customSteps?: ValidationStep[];
}

/**
 * Custom validation step
 */
export interface ValidationStep {
  /** Step name */
  name: string;

  /** Step function (for internal use) */
  execute?: (email: EmailAddress, context: ValidationContext) => Promise<ValidationStepResult>;
}

/**
 * Validation context passed between steps
 */
export interface ValidationContext {
  /** Original email */
  email: string;

  /** Parsed email address */
  emailAddress: EmailAddress;

  /** Results from previous steps */
  results: Record<string, ValidationStepResult>;

  /** Shared data between steps */
  data: Record<string, any>;
}

/**
 * Validation step result
 */
export interface ValidationStepResult {
  /** Whether step passed */
  passed: boolean;

  /** Step score (0-1) */
  score?: number;

  /** Error code if failed */
  errorCode?: string;

  /** Error message */
  message?: string;

  /** Additional data */
  data?: Record<string, any>;
}

/**
 * SMTP validation result
 */
export interface SmtpValidationResult {
  /** Original email */
  email: string;

  /** Overall validation status */
  status: SmtpValidationStatus;

  /** Overall validity */
  valid: boolean;

  /** Confidence score (0-1) */
  confidence: number;

  /** Validation details */
  details: ValidationDetails;

  /** Errors encountered */
  errors: ValidationError[];

  /** Warnings */
  warnings: string[];

  /** Processing time in milliseconds */
  processingTimeMs: number;

  /** Timestamp of validation */
  validatedAt: Date;

  /** Validator ID that performed validation */
  validatorId: string;
}

/**
 * SMTP validation status
 */
export type SmtpValidationStatus =
  | 'valid'
  | 'invalid'
  | 'risky'
  | 'unknown'
  | 'catch-all'
  | 'disposable'
  | 'role-based';

/**
 * Detailed validation results
 */
export interface ValidationDetails {
  /** Syntax validation result */
  syntax: SyntaxValidationResult;

  /** DNS validation result */
  dns: DnsValidationResult;

  /** SMTP validation result */
  smtp: SmtpValidationResultDetail;

  /** Catch-all detection result */
  catchAll?: CatchAllDetectionResult;

  /** Disposable domain detection result */
  disposable?: DisposableDetectionResult;

  /** Role-based detection result */
  roleBased?: RoleBasedDetectionResult;
}

/**
 * Syntax validation result
 */
export interface SyntaxValidationResult {
  /** Whether syntax is valid */
  valid: boolean;

  /** Email address structure */
  emailAddress: EmailAddress;

  /** RFC compliance level */
  rfcCompliance: 'rfc5322' | 'rfc6531' | 'strict' | 'loose';

  /** Issues found */
  issues: string[];
}

/**
 * DNS validation result
 */
export interface DnsValidationResult {
  /** Whether DNS validation passed */
  valid: boolean;

  /** Domain exists */
  domainExists: boolean;

  /** MX records found */
  mxRecords: MxRecord[];

  /** A records for domain */
  aRecords?: string[];

  /** AAAA records for domain */
  aaaaRecords?: string[];

  /** SPF record */
  spfRecord?: string;

  /** DMARC record */
  dmarcRecord?: string;

  /** DKIM selectors found */
  dkimSelectors?: string[];

  /** DNS resolution time in ms */
  resolutionTimeMs: number;

  /** Errors */
  errors: string[];
}

/**
 * MX record
 */
export interface MxRecord {
  /** Hostname of mail server */
  host: string;

  /** Priority (lower = higher priority) */
  priority: number;

  /** IP addresses (resolved) */
  ips?: string[];

  /** TTL */
  ttl?: number;
}

/**
 * SMTP validation result detail
 */
export interface SmtpValidationResultDetail {
  /** Whether SMTP validation passed */
  valid: boolean;

  /** Connected to SMTP server */
  connected: boolean;

  /** SMTP server hostname */
  serverHost?: string;

  /** SMTP server IP */
  serverIp?: string;

  /** SMTP conversation log */
  conversation?: SmtpConversationStep[];

  /** Mailbox exists */
  mailboxExists?: boolean;

  /** Catch-all detected */
  catchAllDetected?: boolean;

  /** Greylisted */
  greylisted?: boolean;

  /** Response time in ms */
  responseTimeMs: number;

  /** Errors */
  errors: ValidationError[];
}

/**
 * SMTP conversation step
 */
export interface SmtpConversationStep {
  /** Step number */
  step: number;

  /** Command sent */
  command: string;

  /** Response received */
  response: string;

  /** Response code */
  code: number;

  /** Timestamp */
  timestamp: Date;

  /** Duration in ms */
  durationMs: number;
}

/**
 * Catch-all detection result
 */
export interface CatchAllDetectionResult {
  /** Whether domain is catch-all */
  isCatchAll: boolean;

  /** Confidence (0-1) */
  confidence: number;

  /** Test email used */
  testEmail?: string;

  /** Method used */
  method: 'smtp' | 'heuristic' | 'known-list';

  /** Details */
  details?: string;
}

/**
 * Disposable domain detection result
 */
export interface DisposableDetectionResult {
  /** Whether domain is disposable */
  isDisposable: boolean;

  /** Confidence (0-1) */
  confidence: number;

  /** Provider name if known */
  provider?: string;

  /** Source of detection */
  source: 'known-list' | 'heuristic' | 'api';
}

/**
 * Role-based detection result
 */
export interface RoleBasedDetectionResult {
  /** Whether email is role-based */
  isRoleBased: boolean;

  /** Role type */
  roleType?: 'info' | 'admin' | 'support' | 'sales' | 'contact' | 'help' | 'billing' | 'hr' | 'security' | 'other';

  /** Confidence (0-1) */
  confidence: number;

  /** Matched pattern */
  matchedPattern?: string;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Validation step where error occurred */
  step: string;

  /** Whether error is recoverable */
  recoverable: boolean;

  /** Additional data */
  data?: Record<string, any>;
}

/**
 * SMTP connection test result
 */
export interface SmtpConnectionTest {
  /** Domain tested */
  domain: string;

  /** Whether connection succeeded */
  success: boolean;

  /** MX records tested */
  mxRecords: MxRecord[];

  /** Connection results per MX */
  connections: MxConnectionResult[];

  /** Overall response time in ms */
  totalTimeMs: number;

  /** Errors */
  errors: ValidationError[];
}

/**
 * MX connection result
 */
export interface MxConnectionResult {
  /** MX record */
  mxRecord: MxRecord;

  /** Whether connection succeeded */
  connected: boolean;

  /** IP address connected to */
  ip?: string;

  /** Response time in ms */
  responseTimeMs: number;

  /** SMTP banner */
  banner?: string;

  /** TLS info if used */
  tlsInfo?: TlsInfo;

  /** Errors */
  errors: ValidationError[];
}

/**
 * TLS information
 */
export interface TlsInfo {
  /** Whether TLS was used */
  used: boolean;

  /** TLS version */
  version?: string;

  /** Cipher suite */
  cipher?: string;

  /** Certificate info */
  certificate?: CertificateInfo;

  /** Certificate verification result */
  verified: boolean;
}

/**
 * Certificate information
 */
export interface CertificateInfo {
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
}

/**
 * Batch validation result
 */
export interface BatchValidationResult {
  /** Individual results */
  results: SmtpValidationResult[];

  /** Summary */
  summary: BatchValidationSummary;

  /** Total processing time in ms */
  totalProcessingTimeMs: number;

  /** Timestamp */
  validatedAt: Date;
}

/**
 * Batch validation summary
 */
export interface BatchValidationSummary {
  /** Total emails validated */
  total: number;

  /** Valid emails */
  valid: number;

  /** Invalid emails */
  invalid: number;

  /** Risky emails */
  risky: number;

  /** Unknown emails */
  unknown: number;

  /** Catch-all emails */
  catchAll: number;

  /** Disposable emails */
  disposable: number;

  /** Role-based emails */
  roleBased: number;

  /** Average confidence */
  averageConfidence: number;

  /** Average processing time per email (ms) */
  averageProcessingTimeMs: number;
}

/**
 * SMTP validator configuration
 */
export interface SmtpValidatorConfig {
  /** Default validation level */
  defaultLevel: 'syntax' | 'dns' | 'smtp' | 'full';

  /** Default timeout in ms */
  defaultTimeoutMs: number;

  /** Default port */
  defaultPort: number;

  /** Use TLS by default */
  useTlsByDefault: boolean;

  /** Skip cert verification by default */
  skipCertVerifyByDefault: boolean;

  /** Default sender email */
  defaultSenderEmail: string;

  /** Default local hostname */
  defaultLocalHostname: string;

  /** DNS servers */
  dnsServers: string[];

  /** Enable catch-all detection by default */
  detectCatchAllByDefault: boolean;

  /** Enable disposable detection by default */
  checkDisposableByDefault: boolean;

  /** Enable role-based detection by default */
  checkRoleBasedByDefault: boolean;

  /** Maximum concurrent validations */
  maxConcurrency: number;

  /** Maximum batch size */
  maxBatchSize: number;

  /** Cache configuration */
  cache?: CacheConfig;

  /** Rate limiting */
  rateLimits?: RateLimitConfig;

  /** Disposable domains list source */
  disposableDomainsSource?: string;

  /** Custom disposable domains */
  customDisposableDomains?: string[];

  /** Role-based patterns */
  roleBasedPatterns?: string[];
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Enable caching */
  enabled: boolean;

  /** TTL in seconds */
  ttlSeconds: number;

  /** Maximum cache size */
  maxSize: number;

  /** Cache provider */
  provider: 'memory' | 'redis';
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Requests per minute */
  requestsPerMinute: number;

  /** Requests per hour */
  requestsPerHour: number;

  /** Requests per day */
  requestsPerDay: number;

  /** Burst allowance */
  burstAllowance: number;
}