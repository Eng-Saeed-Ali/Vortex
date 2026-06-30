/**
 * Vortex Pipeline - Shared Interfaces
 * 
 * Strictly typed interfaces for all external providers and services.
 * Enables dependency inversion and testability across the pipeline.
 * 
 * @module shared/interfaces
 * @version 1.0.0
 */

/**
 * Enrichment job input data
 */
export interface EnrichmentJobInput {
  /** Unique job identifier */
  jobId: string;
  /** Business entity to enrich */
  entity: EnrichmentEntity;
  /** Enrichment priority */
  priority: EnrichmentPriority;
  /** Requested enrichment fields */
  requestedFields: string[];
  /** Correlation ID for tracing */
  correlationId: string;
  /** Job metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Business entity to be enriched
 */
export interface EnrichmentEntity {
  /** Entity type */
  type: 'business' | 'place' | 'venue' | 'organization';
  /** External identifier (Google Place ID, Yelp ID, etc.) */
  externalId?: string;
  /** Business name */
  name: string;
  /** Physical address */
  address?: Address;
  /** Phone number */
  phone?: string;
  /** Website URL */
  website?: string;
  /** Geographic coordinates */
  coordinates?: GeoCoordinates;
  /** Existing enrichment data to merge */
  existingData?: Record<string, unknown>;
}

/**
 * Physical address structure
 */
export interface Address {
  /** Street address line 1 */
  line1: string;
  /** Street address line 2 */
  line2?: string;
  /** City */
  city: string;
  /** State/Province */
  state: string;
  /** Postal/ZIP code */
  postalCode: string;
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string;
  /** Formatted address string */
  formatted?: string;
}

/**
 * Geographic coordinates
 */
export interface GeoCoordinates {
  /** Latitude in decimal degrees */
  latitude: number;
  /** Longitude in decimal degrees */
  longitude: number;
  /** Accuracy in meters */
  accuracy?: number;
}

/**
 * Enrichment priority levels
 */
export enum EnrichmentPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Enrichment job result
 */
export interface EnrichmentJobResult {
  /** Job ID this result belongs to */
  jobId: string;
  /** Whether enrichment was successful */
  success: boolean;
  /** Enriched data fields */
  data?: EnrichedData;
  /** Quality score (0-100) */
  qualityScore?: number;
  /** Source of the enrichment data */
  source: EnrichmentSource;
  /** Errors if any */
  errors?: EnrichmentError[];
  /** Processing duration in ms */
  durationMs: number;
  /** Timestamp of completion */
  completedAt: Date;
}

/**
 * Enriched data structure
 */
export interface EnrichedData {
  /** Business details */
  business?: BusinessDetails;
  /** Contact information */
  contacts?: ContactInfo[];
  /** Social media profiles */
  socialProfiles?: SocialProfile[];
  /** Operating hours */
  hours?: OpeningHours[];
  /** Reviews and ratings */
  reviews?: ReviewSummary;
  /** Photos */
  photos?: Photo[];
  /** Categories/tags */
  categories?: string[];
  /** Attributes */
  attributes?: Record<string, unknown>;
  /** Custom fields */
  customFields?: Record<string, unknown>;
}

/**
 * Business details
 */
export interface BusinessDetails {
  /** Legal business name */
  legalName?: string;
  /** Doing business as name */
  dbaName?: string;
  /** Business description */
  description?: string;
  /** Year established */
  yearEstablished?: number;
  /** Employee count range */
  employeeCountRange?: string;
  /** Annual revenue range */
  annualRevenueRange?: string;
  /** Business status */
  status?: 'active' | 'closed' | 'temporarily_closed' | 'relocated';
  /** Tax ID / EIN (encrypted) */
  taxIdEncrypted?: string;
}

/**
 * Contact information
 */
export interface ContactInfo {
  /** Contact type */
  type: 'phone' | 'email' | 'fax' | 'website' | 'social';
  /** Contact value */
  value: string;
  /** Whether this is primary contact */
  isPrimary: boolean;
  /** Verification status */
  verified: boolean;
  /** Last verified timestamp */
  lastVerified?: Date;
}

/**
 * Social media profile
 */
export interface SocialProfile {
  /** Platform name */
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'other';
  /** Profile URL */
  url: string;
  /** Handle/username */
  handle?: string;
  /** Follower count */
  followers?: number;
  /** Verification status */
  verified: boolean;
}

/**
 * Opening hours
 */
export interface OpeningHours {
  /** Day of week (0 = Sunday, 6 = Saturday) */
  dayOfWeek: number;
  /** Open time (HH:mm 24-hour format) */
  openTime: string;
  /** Close time (HH:mm 24-hour format) */
  closeTime: string;
  /** Whether closed all day */
  isClosed: boolean;
  /** Whether 24 hours */
  is24Hours: boolean;
}

/**
 * Review summary
 */
export interface ReviewSummary {
  /** Average rating (1-5) */
  averageRating: number;
  /** Total review count */
  totalReviews: number;
  /** Rating distribution (1-5 stars) */
  ratingDistribution: Record<number, number>;
  /** Review sources */
  sources: ReviewSource[];
  /** Last updated */
  lastUpdated: Date;
}

/**
 * Review source
 */
export interface ReviewSource {
  /** Source platform */
  platform: string;
  /** Average rating on this platform */
  averageRating: number;
  /** Review count on this platform */
  reviewCount: number;
  /** Source URL */
  url?: string;
}

/**
 * Photo
 */
export interface Photo {
  /** Photo URL */
  url: string;
  /** Photo caption */
  caption?: string;
  /** Photo type */
  type: 'exterior' | 'interior' | 'menu' | 'product' | 'team' | 'other';
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Attribution */
  attribution?: string;
}

/**
 * Enrichment source
 */
export interface EnrichmentSource {
  /** Provider name */
  provider: string;
  /** Provider version */
  version: string;
  /** Source URL if applicable */
  sourceUrl?: string;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Enrichment error
 */
export interface EnrichmentError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Field that caused error */
  field?: string;
  /** Recoverable error */
  recoverable: boolean;
}

/**
 * Enrichment provider interface
 * Implementations: Google Places, Yelp, Manual, Mock, etc.
 */
export interface IEnrichmentProvider {
  /** Provider unique identifier */
  readonly providerId: string;
  /** Provider display name */
  readonly name: string;
  /** Supported entity types */
  readonly supportedEntityTypes: string[];
  /** Maximum concurrent requests */
  readonly maxConcurrency: number;
  /** Request timeout in ms */
  readonly timeoutMs: number;

  /**
   * Check if provider is healthy and available
   */
  healthCheck(): Promise<ProviderHealthStatus>;

  /**
   * Enrich a single entity
   */
  enrich(input: EnrichmentJobInput): Promise<EnrichmentJobResult>;

  /**
   * Enrich multiple entities in batch
   */
  enrichBatch(inputs: EnrichmentJobInput[]): Promise<EnrichmentJobResult[]>;

  /**
   * Get provider capabilities and rate limits
   */
  getCapabilities(): ProviderCapabilities;
}

/**
 * Provider health status
 */
export interface ProviderHealthStatus {
  /** Whether provider is healthy */
  healthy: boolean;
  /** Current status message */
  message?: string;
  /** Last check timestamp */
  lastChecked: Date;
  /** Current rate limit remaining */
  rateLimitRemaining?: number;
  /** Rate limit reset timestamp */
  rateLimitReset?: Date;
}

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  /** Supported data fields */
  supportedFields: string[];
  /** Rate limits */
  rateLimits: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  /** Pricing model */
  pricing: 'free' | 'freemium' | 'paid' | 'enterprise';
  /** Geographic coverage */
  coverage: string[];
  /** Data freshness */
  dataFreshness: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}