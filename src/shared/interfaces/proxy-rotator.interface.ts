/**
 * Vortex Pipeline - Proxy Rotator Interfaces
 * 
 * Interfaces for proxy rotation and management (Bright Data, Oxylabs, SmartProxy, etc.)
 * 
 * @module shared/interfaces
 * @version 1.0.0
 */

/**
 * Proxy health status
 */
export interface ProxyHealthStatus {
  /** Whether proxy is healthy */
  healthy: boolean;
  /** Current status message */
  message?: string;
  /** Last check timestamp */
  lastChecked: Date;
  /** Response time (ms) */
  responseTime?: number;
  /** HTTP status code from health check */
  statusCode?: number;
}

/**
 * Proxy protocol types
 */
export type ProxyProtocol = 'http' | 'https' | 'socks4' | 'socks5';

/**
 * Proxy authentication methods
 */
export type ProxyAuthMethod = 'none' | 'basic' | 'ip-whitelist' | 'token';

/**
 * Proxy endpoint configuration
 */
export interface ProxyEndpoint {
  /** Proxy host */
  host: string;
  /** Proxy port */
  port: number;
  /** Protocol */
  protocol: ProxyProtocol;
  /** Username (if basic auth) */
  username?: string;
  /** Password (if basic auth) */
  password?: string;
  /** Token (if token auth) */
  token?: string;
  /** Country code (ISO 3166-1 alpha-2) */
  country?: string;
  /** City */
  city?: string;
  /** ISP */
  isp?: string;
  /** Proxy type */
  type: 'datacenter' | 'residential' | 'mobile' | 'isp';
  /** Session ID for sticky sessions */
  sessionId?: string;
}

/**
 * Proxy pool configuration
 */
export interface ProxyPoolConfig {
  /** Pool name */
  name: string;
  /** Provider name */
  provider: string;
  /** Endpoints */
  endpoints: ProxyEndpoint[];
  /** Rotation strategy */
  rotationStrategy: 'round-robin' | 'random' | 'sticky-session' | 'least-used' | 'geo-based';
  /** Health check interval (ms) */
  healthCheckInterval: number;
  /** Maximum concurrent requests per proxy */
  maxConcurrentPerProxy: number;
  /** Request timeout (ms) */
  requestTimeout: number;
  /** Retry attempts */
  maxRetries: number;
  /** Retry delay (ms) */
  retryDelay: number;
  /** Cooldown period for failed proxies (ms) */
  cooldownPeriod: number;
  /** Countries to include */
  allowedCountries?: string[];
  /** Countries to exclude */
  excludedCountries?: string[];
  /** Required proxy types */
  requiredTypes?: ProxyEndpoint['type'][];
  /** Minimum success rate (0-1) */
  minSuccessRate: number;
  /** Maximum latency (ms) */
  maxLatency: number;
}

/**
 * Proxy usage statistics
 */
export interface ProxyStats {
  /** Proxy endpoint */
  endpoint: ProxyEndpoint;
  /** Total requests */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Current success rate */
  successRate: number;
  /** Average latency (ms) */
  avgLatency: number;
  /** Last used timestamp */
  lastUsed: Date;
  /** Last health check */
  lastHealthCheck: Date;
  /** Current status */
  status: 'healthy' | 'degraded' | 'unhealthy' | 'cooldown';
  /** Consecutive failures */
  consecutiveFailures: number;
  /** Current concurrent requests */
  currentConcurrent: number;
  /** Bandwidth used (bytes) */
  bandwidthUsed: number;
  /** Errors by type */
  errorsByType: Record<string, number>;
}

/**
 * Proxy acquisition result
 */
export interface ProxyAcquisitionResult {
  /** Acquired proxy */
  proxy: ProxyEndpoint;
  /** Session ID for sticky sessions */
  sessionId?: string;
  /** Estimated time until rotation (ms) */
  estimatedRotationTime?: number;
  /** Whether this is a new proxy (not previously used in session) */
  isNew: boolean;
}

/**
 * Proxy release result
 */
export interface ProxyReleaseResult {
  /** Whether release was successful */
  success: boolean;
  /** Reason if failed */
  reason?: string;
}

/**
 * Proxy rotator events
 */
export type ProxyRotatorEventType = 
  | 'proxy-acquired'
  | 'proxy-released'
  | 'proxy-rotated'
  | 'proxy-failed'
  | 'proxy-recovered'
  | 'pool-exhausted'
  | 'health-check-complete';

export interface ProxyRotatorEvent {
  type: ProxyRotatorEventType;
  timestamp: Date;
  proxy?: ProxyEndpoint;
  poolName?: string;
  details?: Record<string, unknown>;
}

/**
 * Proxy rotator configuration
 */
export interface ProxyRotatorConfig {
  /** Proxy pools */
  pools: ProxyPoolConfig[];
  /** Default pool name */
  defaultPool: string;
  /** Global rotation interval (ms) */
  rotationInterval: number;
  /** Enable sticky sessions by default */
  stickySessions: boolean;
  /** Session duration (ms) */
  sessionDuration: number;
  /** Event handlers */
  onEvent?: (event: ProxyRotatorEvent) => void;
  /** Custom proxy selector */
  customSelector?: (proxies: ProxyEndpoint[], options: ProxySelectionOptions) => ProxyEndpoint | null;
}

/**
 * Proxy selection options
 */
export interface ProxySelectionOptions {
  /** Preferred country */
  country?: string;
  /** Preferred proxy type */
  type?: ProxyEndpoint['type'];
  /** Require sticky session */
  sticky?: boolean;
  /** Session ID for sticky session */
  sessionId?: string;
  /** Target URL for geo-based selection */
  targetUrl?: string;
  /** Priority (higher = more important) */
  priority?: number;
  /** Exclude specific proxies */
  excludeProxies?: string[];
  /** Maximum latency (ms) */
  maxLatency?: number;
  /** Minimum success rate (0-1) */
  minSuccessRate?: number;
}

/**
 * Proxy rotator interface
 * Implementations: Bright Data, Oxylabs, SmartProxy, Custom rotation logic
 */
export interface IProxyRotator {
  /** Rotator unique identifier */
  readonly rotatorId: string;
  /** Current configuration */
  readonly config: ProxyRotatorConfig;
  /** Whether rotator is initialized */
  readonly initialized: boolean;

  /**
   * Initialize the proxy rotator
   */
  initialize(): Promise<void>;

  /**
   * Acquire a proxy for use
   */
  acquireProxy(options?: ProxySelectionOptions): Promise<ProxyAcquisitionResult>;

  /**
   * Release a proxy after use
   */
  releaseProxy(proxy: ProxyEndpoint, success: boolean, latency?: number): Promise<ProxyReleaseResult>;

  /**
   * Force rotate to a new proxy
   */
  rotateProxy(options?: ProxySelectionOptions): Promise<ProxyAcquisitionResult>;

  /**
   * Get current proxy stats
   */
  getProxyStats(proxy?: ProxyEndpoint): ProxyStats | ProxyStats[];

  /**
   * Get pool statistics
   */
  getPoolStats(poolName?: string): PoolStats | PoolStats[];

  /**
   * Perform health check on all proxies
   */
  healthCheckAll(): Promise<ProxyHealthStatus[]>;

  /**
   * Add a new proxy pool
   */
  addPool(config: ProxyPoolConfig): Promise<void>;

  /**
   * Remove a proxy pool
   */
  removePool(poolName: string): Promise<void>;

  /**
   * Enable/disable a proxy pool
   */
  setPoolEnabled(poolName: string, enabled: boolean): Promise<void>;

  /**
   * Get available proxy count
   */
  getAvailableProxyCount(options?: ProxySelectionOptions): number;

  /**
   * Shutdown rotator gracefully
   */
  shutdown(): Promise<void>;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  /** Pool name */
  name: string;
  /** Provider */
  provider: string;
  /** Total proxies in pool */
  totalProxies: number;
  /** Healthy proxies */
  healthyProxies: number;
  /** Degraded proxies */
  degradedProxies: number;
  /** Unhealthy proxies */
  unhealthyProxies: number;
  /** Proxies in cooldown */
  cooldownProxies: number;
  /** Total requests */
  totalRequests: number;
  /** Success rate */
  successRate: number;
  /** Average latency (ms) */
  avgLatency: number;
  /** Current concurrent requests */
  currentConcurrent: number;
  /** Max concurrent allowed */
  maxConcurrent: number;
}

/**
 * Bright Data specific configuration
 */
export interface BrightDataConfig extends ProxyPoolConfig {
  /** Bright Data customer ID */
  customerId: string;
  /** Bright Data zone */
  zone: string;
  /** Use super proxy */
  useSuperProxy: boolean;
  /** Super proxy host */
  superProxyHost?: string;
  /** Session persistence */
  sessionPersistence: boolean;
  /** DNS resolution */
  dnsResolution: 'remote' | 'local';
}

/**
 * Oxylabs specific configuration
 */
export interface OxylabsConfig extends ProxyPoolConfig {
  /** Oxylabs username */
  username: string;
  /** Oxylabs password */
  password: string;
  /** Use dedicated datacenter proxies */
  useDedicated: boolean;
  /** Proxy type */
  proxyType: 'residential' | 'datacenter' | 'mobile';
  /** Country targeting */
  country?: string;
  /** City targeting */
  city?: string;
  /** ASN targeting */
  asn?: string;
}

/**
 * SmartProxy specific configuration
 */
export interface SmartProxyConfig extends ProxyPoolConfig {
  /** SmartProxy username */
  username: string;
  /** SmartProxy password */
  password: string;
  /** Proxy type */
  proxyType: 'residential' | 'datacenter' | 'mobile' | 'isp';
  /** Rotation type */
  rotationType: 'sticky' | 'random' | 'per-request';
  /** Sticky session duration (minutes) */
  stickySessionDuration?: number;
}

/**
 * Custom proxy configuration
 */
export interface CustomProxyConfig extends ProxyPoolConfig {
  /** Static proxy list */
  proxies: ProxyEndpoint[];
  /** Auto-rotate on failure */
  autoRotateOnFailure: boolean;
  /** Health check URL */
  healthCheckUrl?: string;
  /** Health check expected status */
  healthCheckExpectedStatus?: number;
  /** Custom headers for health check */
  healthCheckHeaders?: Record<string, string>;
}

/**
 * Proxy rotation strategy interface
 */
export interface IProxyRotationStrategy {
  /** Strategy name */
  readonly name: string;
  /** Select next proxy */
  select(proxies: ProxyEndpoint[], options: ProxySelectionOptions, stats: ProxyStats[]): ProxyEndpoint | null;
  /** Update strategy state after request */
  onRequestComplete(proxy: ProxyEndpoint, success: boolean, latency: number): void;
  /** Reset strategy state */
  reset(): void;
}