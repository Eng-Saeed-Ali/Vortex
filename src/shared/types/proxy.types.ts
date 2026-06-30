/**
 * Vortex Pipeline - Proxy Types
 *
 * Shared type definitions for proxy management and rotation.
 *
 * @module shared/types
 * @version 1.0.0
 */

/**
 * Proxy configuration
 */
export interface ProxyConfig {
  /** Unique proxy identifier */
  id: string;

  /** Proxy host */
  host: string;

  /** Proxy port */
  port: number;

  /** Proxy protocol */
  protocol: 'http' | 'https' | 'socks4' | 'socks5';

  /** Username for authentication */
  username?: string;

  /** Password for authentication */
  password?: string;

  /** Country code (ISO 3166-1 alpha-2) */
  country?: string;

  /** Region/state */
  region?: string;

  /** City */
  city?: string;

  /** ISP/Provider name */
  provider?: string;

  /** Anonymity level */
  anonymityLevel: 'transparent' | 'anonymous' | 'elite';

  /** Proxy type */
  type: 'datacenter' | 'residential' | 'mobile' | 'isp';

  /** Whether proxy is enabled */
  enabled: boolean;

  /** Tags for categorization */
  tags?: string[];

  /** Metadata */
  metadata?: Record<string, any>;

  /** Created timestamp */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;

  /** Last health check timestamp */
  lastHealthCheck?: Date;

  /** Health score (0-1) */
  healthScore?: number;

  /** Proxy URL (computed) */
  url?: string;
}

/**
 * Proxy health status
 */
export interface ProxyHealth {
  /** Proxy ID */
  proxyId: string;

  /** Whether proxy is healthy */
  healthy: boolean;

  /** Health score (0-1) */
  score: number;

  /** Response time in milliseconds */
  responseTimeMs: number;

  /** HTTP status code from health check */
  statusCode?: number;

  /** Error message if unhealthy */
  error?: string;

  /** Timestamp of health check */
  checkedAt: Date;

  /** Consecutive failures */
  consecutiveFailures: number;

  /** Consecutive successes */
  consecutiveSuccesses: number;

  /** Bandwidth test result (Mbps) */
  bandwidthMbps?: number;

  /** Latency in milliseconds */
  latencyMs?: number;

  /** Whether proxy supports HTTPS */
  supportsHttps?: boolean;

  /** Whether proxy supports CONNECT method */
  supportsConnect?: boolean;

  /** Detected IP address */
  detectedIp?: string;

  /** Detected location */
  detectedLocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * Proxy metrics
 */
export interface ProxyMetrics {
  /** Total requests across all proxies */
  totalRequests: number;

  /** Successful requests */
  successfulRequests: number;

  /** Failed requests */
  failedRequests: number;

  /** Average response time in milliseconds */
  averageResponseTimeMs: number;

  /** Total bandwidth used (bytes) */
  totalBandwidthBytes: number;

  /** Number of healthy proxies */
  healthyProxies: number;

  /** Number of unhealthy proxies */
  unhealthyProxies: number;

  /** Number of disabled proxies */
  disabledProxies: number;

  /** Proxies by country */
  byCountry: Record<string, number>;

  /** Proxies by provider */
  byProvider: Record<string, number>;

  /** Proxies by type */
  byType: Record<string, number>;

  /** Requests per minute (current rate) */
  requestsPerMinute: number;

  /** Error rate (0-1) */
  errorRate: number;

  /** Uptime percentage (0-100) */
  uptimePercentage: number;

  /** Timestamp of metrics */
  timestamp: Date;
}

/**
 * Proxy usage statistics
 */
export interface ProxyUsageStats {
  /** Proxy ID */
  proxyId: string;

  /** Total requests */
  totalRequests: number;

  /** Successful requests */
  successfulRequests: number;

  /** Failed requests */
  failedRequests: number;

  /** Average response time in milliseconds */
  averageResponseTimeMs: number;

  /** Median response time in milliseconds */
  medianResponseTimeMs: number;

  /** P95 response time in milliseconds */
  p95ResponseTimeMs: number;

  /** P99 response time in milliseconds */
  p99ResponseTimeMs: number;

  /** Total bandwidth uploaded (bytes) */
  bandwidthUploadedBytes: number;

  /** Total bandwidth downloaded (bytes) */
  bandwidthDownloadedBytes: number;

  /** Last used timestamp */
  lastUsed: Date | null;

  /** First used timestamp */
  firstUsed: Date | null;

  /** Consecutive failures */
  consecutiveFailures: number;

  /** Consecutive successes */
  consecutiveSuccesses: number;

  /** Errors by type */
  errorsByType: Record<string, number>;

  /** Success rate (0-1) */
  successRate: number;

  /** Availability percentage (0-100) */
  availabilityPercentage: number;
}

/**
 * Proxy pool statistics
 */
export interface ProxyPoolStats {
  /** Total proxies in pool */
  totalProxies: number;

  /** Healthy proxies */
  healthyProxies: number;

  /** Unhealthy proxies */
  unhealthyProxies: number;

  /** Disabled proxies */
  disabledProxies: number;

  /** Proxies by country */
  byCountry: Record<string, number>;

  /** Proxies by provider */
  byProvider: Record<string, number>;

  /** Proxies by type */
  byType: Record<string, number>;

  /** Proxies by anonymity level */
  byAnonymityLevel: Record<string, number>;

  /** Proxies by protocol */
  byProtocol: Record<string, number>;

  /** Average health score */
  averageHealthScore: number;

  /** Pool utilization (0-1) */
  utilization: number;
}

/**
 * Proxy test result
 */
export interface ProxyTestResult {
  /** Proxy ID */
  proxyId: string;

  /** Whether test passed */
  success: boolean;

  /** Response time in milliseconds */
  responseTimeMs: number;

  /** HTTP status code */
  statusCode?: number;

  /** Response headers */
  headers?: Record<string, string>;

  /** Response body (truncated) */
  body?: string;

  /** Error if failed */
  error?: string;

  /** Test timestamp */
  testedAt: Date;

  /** Test URL used */
  testUrl: string;

  /** Detected IP */
  detectedIp?: string;

  /** Detected location */
  detectedLocation?: {
    country?: string;
    region?: string;
    city?: string;
    isp?: string;
  };

  /** Supports HTTPS */
  supportsHttps: boolean;

  /** Supports CONNECT */
  supportsConnect: boolean;
}

/**
 * Proxy authentication
 */
export interface ProxyAuth {
  username: string;
  password: string;
}

/**
 * Proxy chain/hop configuration
 */
export interface ProxyChain {
  /** Chain ID */
  id: string;

  /** Chain name */
  name: string;

  /** Proxies in chain (ordered) */
  proxies: ProxyConfig[];

  /** Whether chain is enabled */
  enabled: boolean;

  /** Created timestamp */
  createdAt: Date;
}

/**
 * Proxy rotation strategy configuration
 */
export interface RotationStrategyConfig {
  /** Strategy name */
  strategy: 'round-robin' | 'weighted-round-robin' | 'least-used' | 'fastest-response' | 'random' | 'sticky-session' | 'geographic';

  /** Strategy-specific options */
  options: Record<string, any>;
}

/**
 * Geographic proxy selection
 */
export interface GeoProxySelection {
  /** Target country code */
  country: string;

  /** Target region/state */
  region?: string;

  /** Target city */
  city?: string;

  /** Maximum distance in km */
  maxDistanceKm?: number;

  /** Fallback to nearby countries */
  fallbackNearby?: boolean;
}

/**
 * Proxy validation result
 */
export interface ProxyValidationResult {
  /** Whether proxy is valid */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];

  /** Detected configuration */
  detectedConfig?: Partial<ProxyConfig>;
}

/**
 * Proxy provider interface (for external proxy services)
 */
export interface ProxyProvider {
  /** Provider ID */
  id: string;

  /** Provider name */
  name: string;

  /** Provider API endpoint */
  apiEndpoint?: string;

  /** Authentication configuration */
  auth?: {
    type: 'api-key' | 'username-password' | 'token';
    credentials: Record<string, string>;
  };

  /** Supported proxy types */
  supportedTypes: ('datacenter' | 'residential' | 'mobile' | 'isp')[];

  /** Supported protocols */
  supportedProtocols: ('http' | 'https' | 'socks4' | 'socks5')[];

  /** Rate limits */
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };

  /** Whether provider is enabled */
  enabled: boolean;
}