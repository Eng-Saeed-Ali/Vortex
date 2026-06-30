/**
 * Vortex Pipeline - SMTP Validator Interfaces
 * 
 * Interfaces for email validation and SMTP verification providers.
 * 
 * @module shared/interfaces
 * @version 1.0.0
 */

import { ProviderHealthStatus, ProviderCapabilities } from './provider.interface';

/**
 * Email validation result status
 */
export type EmailValidationStatus = 
  | 'valid'
  | 'invalid'
  | 'risky'
  | 'unknown'
  | 'catch-all'
  | 'disposable'
  | 'role-based'
  | 'syntax-error'
  | 'domain-error'
  | 'mailbox-full'
  | 'greylisted'
  | 'timeout'
  | 'connection-error';

/**
 * Email validation result
 */
export interface EmailValidationResult {
  /** Original email */
  email: string;
  /** Normalized email */
  normalizedEmail: string;
  /** Validation status */
  status: EmailValidationStatus;
  /** Confidence score (0-1) */
  confidence: number;
  /** Is deliverable */
  deliverable: boolean;
  /** Is valid format */
  validFormat: boolean;
  /** Has MX records */
  hasMxRecords: boolean;
  /** SMTP check result */
  smtpCheck?: SmtpCheckResult;
  /** Domain info */
  domain?: DomainInfo;
  /** Mailbox info */
  mailbox?: MailboxInfo;
  /** Quality score (0-100) */
  qualityScore: number;
  /** Risk factors */
  riskFactors: string[];
  /** Suggested corrections */
  suggestions?: string[];
  /** Validation timestamp */
  validatedAt: Date;
  /** Validation duration (ms) */
  durationMs: number;
}

/**
 * SMTP check result
 */
export interface SmtpCheckResult {
  /** SMTP connection successful */
  connected: boolean;
  /** Mailbox exists */
  mailboxExists: boolean;
  /** Catch-all domain */
  catchAll: boolean;
  /** Greylisted */
  greylisted: boolean;
  /** SMTP response code */
  responseCode?: number;
  /** SMTP response message */
  responseMessage?: string;
  /** TLS supported */
  tlsSupported: boolean;
  /** Check duration (ms) */
  durationMs: number;
}

/**
 * Domain information
 */
export interface DomainInfo {
  /** Domain name */
  domain: string;
  /** Has MX records */
  hasMxRecords: boolean;
  /** MX records */
  mxRecords: MxRecord[];
  /** Has SPF record */
  hasSpfRecord: boolean;
  /** SPF record */
  spfRecord?: string;
  /** Has DMARC record */
  hasDmarcRecord: boolean;
  /** DMARC record */
  dmarcRecord?: string;
  /** Domain age (days) */
  domainAge?: number;
  /** Domain registrar */
  registrar?: string;
  /** Is disposable domain */
  isDisposable: boolean;
  /** Is free email provider */
  isFreeProvider: boolean;
  /** Is role-based domain */
  isRoleBased: boolean;
  /** Reputation score (0-100) */
  reputationScore?: number;
}

/**
 * MX record
 */
export interface MxRecord {
  /** Hostname */
  host: string;
  /** Priority */
  priority: number;
  /** IP address */
  ip?: string;
  /** Response time (ms) */
  responseTime?: number;
}

/**
 * Mailbox information
 */
export interface MailboxInfo {
  /** Local part */
  localPart: string;
  /** Domain part */
  domain: string;
  /** Is role-based (admin@, info@, etc.) */
  isRoleBased: boolean;
  /** Is catch-all */
  isCatchAll: boolean;
  /** Is disposable */
  isDisposable: boolean;
  /** First name (if detectable) */
  firstName?: string;
  /** Last name (if detectable) */
  lastName?: string;
  /** Username pattern */
  usernamePattern?: string;
}

/**
 * Email validation options
 */
export interface EmailValidationOptions {
  /** Validate syntax only (skip SMTP) */
  syntaxOnly?: boolean;
  /** Skip DNS/MX check */
  skipDnsCheck?: boolean;
  /** Skip SMTP check */
  skipSmtpCheck?: boolean;
  /** Timeout for SMTP check (ms) */
  smtpTimeout?: number;
  /** Use specific proxy */
  proxy?: string;
  /** Validate catch-all domains */
  validateCatchAll?: boolean;
  /** Check for disposable domains */
  checkDisposable?: boolean;
  /** Check for role-based emails */
  checkRoleBased?: boolean;
  /** Check domain reputation */
  checkReputation?: boolean;
  /** Custom DNS servers */
  dnsServers?: string[];
  /** Follow redirects */
  followRedirects?: boolean;
}

/**
 * Batch email validation request
 */
export interface BatchEmailValidationRequest {
  /** Emails to validate */
  emails: string[];
  /** Options for validation */
  options?: EmailValidationOptions;
  /** Correlation ID */
  correlationId?: string;
  /** Callback URL for async results */
  callbackUrl?: string;
}

/**
 * Batch email validation result
 */
export interface BatchEmailValidationResult {
  /** Request ID */
  requestId: string;
  /** Total emails */
  total: number;
  /** Processed count */
  processed: number;
  /** Valid count */
  valid: number;
  /** Invalid count */
  invalid: number;
  /** Risky count */
  risky: number;
  /** Unknown count */
  unknown: number;
  /** Results */
  results: EmailValidationResult[];
  /** Started at */
  startedAt: Date;
  /** Completed at */
  completedAt?: Date;
  /** Status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * SMTP validator configuration
 */
export interface SmtpValidatorConfig {
  /** Default timeout (ms) */
  defaultTimeout: number;
  /** Max concurrent validations */
  maxConcurrency: number;
  /** Default SMTP port */
  defaultPort: number;
  /** Use TLS by default */
  useTls: boolean;
  /** Retry attempts */
  maxRetries: number;
  /** Retry delay (ms) */
  retryDelay: number;
  /** Greylist handling */
  greylistHandling: 'retry' | 'mark-risky' | 'fail';
  /** Catch-all handling */
  catchAllHandling: 'mark-risky' | 'mark-valid' | 'mark-unknown';
  /** Disposable domains list */
  disposableDomains: string[];
  /** Role-based patterns */
  roleBasedPatterns: string[];
  /** Custom DNS servers */
  dnsServers?: string[];
  /** Cache TTL (ms) */
  cacheTtl: number;
  /** Enable caching */
  enableCache: boolean;
}

/**
 * SMTP validator interface
 * Implementations: ZeroBounce, NeverBounce, Hunter, Abstract, Custom SMTP
 */
export interface ISmtpValidator {
  /** Validator unique identifier */
  readonly validatorId: string;
  /** Validator display name */
  readonly name: string;
  /** Supported validation types */
  readonly supportedValidations: ('syntax' | 'dns' | 'smtp' | 'catch-all' | 'disposable' | 'role-based' | 'reputation')[];
  /** Maximum concurrent validations */
  readonly maxConcurrency: number;
  /** Request timeout (ms) */
  readonly timeoutMs: number;

  /**
   * Check if validator is healthy
   */
  healthCheck(): Promise<ProviderHealthStatus>;

  /**
   * Validate a single email address
   */
  validateEmail(email: string, options?: EmailValidationOptions): Promise<EmailValidationResult>;

  /**
   * Validate multiple email addresses
   */
  validateEmails(emails: string[], options?: EmailValidationOptions): Promise<EmailValidationResult[]>;

  /**
   * Start async batch validation
   */
  startBatchValidation(request: BatchEmailValidationRequest): Promise<string>;

  /**
   * Get batch validation status
   */
  getBatchStatus(requestId: string): Promise<BatchEmailValidationResult>;

  /**
   * Get validator capabilities
   */
  getCapabilities(): ProviderCapabilities;

  /**
   * Check if email is disposable
   */
  isDisposable(email: string): Promise<boolean>;

  /**
   * Check if email is role-based
   */
  isRoleBased(email: string): Promise<boolean>;

  /**
   * Get domain info only
   */
  getDomainInfo(domain: string): Promise<DomainInfo>;

  /**
   * Verify SMTP connectivity for domain
   */
  verifySmtpConnectivity(domain: string, port?: number): Promise<SmtpCheckResult>;

  /**
   * Clear validation cache
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
 * ZeroBounce specific configuration
 */
export interface ZeroBounceConfig extends SmtpValidatorConfig {
  /** ZeroBounce API key */
  apiKey: string;
  /** API base URL */
  apiUrl?: string;
  /** Credits threshold for alerts */
  creditsThreshold?: number;
}

/**
 * NeverBounce specific configuration
 */
export interface NeverBounceConfig extends SmtpValidatorConfig {
  /** NeverBounce API key */
  apiKey: string;
  /** API base URL */
  apiUrl?: string;
  /** Webhook URL for async results */
  webhookUrl?: string;
}

/**
 * Hunter.io specific configuration
 */
export interface HunterConfig extends SmtpValidatorConfig {
  /** Hunter API key */
  apiKey: string;
  /** API base URL */
  apiUrl?: string;
  /** Confidence threshold */
  confidenceThreshold?: number;
}

/**
 * Abstract API specific configuration
 */
export interface AbstractConfig extends SmtpValidatorConfig {
  /** Abstract API key */
  apiKey: string;
  /** API base URL */
  apiUrl?: string;
  /** Auto-correct emails */
  autoCorrect?: boolean;
}

/**
 * Custom SMTP validator configuration
 */
export interface CustomSmtpConfig extends SmtpValidatorConfig {
  /** SMTP servers to use */
  smtpServers: SmtpServerConfig[];
  /** HELO hostname */
  heloHostname: string;
  /** From address for MAIL FROM */
  fromAddress: string;
  /** Use VRFY command */
  useVrfy: boolean;
  /** Use RCPT TO command */
  useRcptTo: boolean;
}

/**
 * SMTP server configuration
 */
export interface SmtpServerConfig {
  /** Host */
  host: string;
  /** Port */
  port: number;
  /** Use TLS */
  tls: boolean;
  /** Username */
  username?: string;
  /** Password */
  password?: string;
  /** Priority (lower = higher priority) */
  priority: number;
  /** Weight for load balancing */
  weight: number;
}

/**
 * Email validation webhook payload
 */
export interface EmailValidationWebhookPayload {
  /** Request ID */
  requestId: string;
  /** Status */
  status: 'completed' | 'failed';
  /** Results URL */
  resultsUrl?: string;
  /** Error if failed */
  error?: string;
  /** Completed at */
  completedAt: Date;
}