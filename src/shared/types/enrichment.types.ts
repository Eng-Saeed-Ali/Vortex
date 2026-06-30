/**
 * Vortex Pipeline - Enrichment Types
 *
 * Shared type definitions for data enrichment pipeline.
 *
 * @module shared/types
 * @version 1.0.0
 */

/**
 * Raw place data from source systems
 */
export interface PlaceData {
  /** Unique identifier for the place */
  placeId: string;

  /** Source system identifier */
  sourceId: string;

  /** Place name */
  name: string;

  /** Address components */
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    formattedAddress?: string;
  };

  /** Geographic coordinates */
  location?: {
    latitude: number;
    longitude: number;
  };

  /** Contact information */
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };

  /** Business categories */
  categories?: string[];

  /** Business hours */
  hours?: BusinessHours;

  /** Raw attributes from source */
  attributes?: Record<string, any>;

  /** Source-specific metadata */
  metadata?: Record<string, any>;

  /** Last updated timestamp */
  lastUpdated: Date | string;

  /** Data quality score (0-1) */
  qualityScore?: number;
}

/**
 * Business hours structure
 */
export interface BusinessHours {
  /** Day of week (0 = Sunday, 6 = Saturday) */
  [day: number]: {
    open?: string;  // HH:mm format
    close?: string; // HH:mm format
    closed?: boolean;
  }[];
}

/**
 * Enrichment options
 */
export interface EnrichmentOptions {
  /** Fields to include in enrichment */
  fields?: string[];

  /** Language for results (ISO 639-1) */
  language?: string;

  /** Country for localization (ISO 3166-1 alpha-2) */
  country?: string;

  /** Include photos */
  includePhotos?: boolean;

  /** Include reviews */
  includeReviews?: boolean;

  /** Maximum number of photos */
  maxPhotos?: number;

  /** Maximum number of reviews */
  maxReviews?: number;

  /** Custom provider-specific options */
  providerOptions?: Record<string, any>;
}

/**
 * Enrichment result
 */
export interface EnrichmentResult {
  /** Original place ID */
  placeId: string;

  /** Provider that performed enrichment */
  providerId: string;

  /** Enriched data */
  data: EnrichedPlaceData;

  /** Enrichment metadata */
  metadata: EnrichmentMetadata;

  /** Errors if any */
  errors?: EnrichmentError[];

  /** Processing time in milliseconds */
  processingTimeMs: number;

  /** Timestamp of enrichment */
  enrichedAt: Date;
}

/**
 * Enriched place data
 */
export interface EnrichedPlaceData {
  /** Enriched name */
  name?: string;

  /** Enriched address */
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    formattedAddress?: string;
    addressComponents?: AddressComponent[];
  };

  /** Enriched location */
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number; // meters
  };

  /** Enriched contact */
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: SocialMediaLink[];
  };

  /** Enriched categories */
  categories?: Category[];

  /** Enriched hours */
  hours?: BusinessHours;

  /** Photos */
  photos?: Photo[];

  /** Reviews summary */
  reviews?: ReviewsSummary;

  /** Additional attributes */
  attributes?: Record<string, any>;

  /** Place features */
  features?: PlaceFeature[];

  /** Popular times */
  popularTimes?: PopularTime[];

  /** Price level */
  priceLevel?: number; // 0-4

  /** Rating */
  rating?: number;

  /** Review count */
  reviewCount?: number;

  /** Permanently closed flag */
  permanentlyClosed?: boolean;

  /** Temporarily closed flag */
  temporarilyClosed?: boolean;
}

/**
 * Address component (structured)
 */
export interface AddressComponent {
  longName: string;
  shortName: string;
  types: string[];
}

/**
 * Social media link
 */
export interface SocialMediaLink {
  platform: string;
  url: string;
  handle?: string;
}

/**
 * Category with hierarchy
 */
export interface Category {
  id: string;
  name: string;
  parentId?: string;
  confidence?: number;
}

/**
 * Photo
 */
export interface Photo {
  id: string;
  url: string;
  width: number;
  height: number;
  attribution?: string;
  author?: string;
}

/**
 * Reviews summary
 */
export interface ReviewsSummary {
  averageRating: number;
  totalReviews: number;
  ratingHistogram?: Record<number, number>; // rating -> count
  topReviews?: Review[];
  aspects?: ReviewAspect[];
}

/**
 * Individual review
 */
export interface Review {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  time: Date | string;
  language?: string;
}

/**
 * Review aspect
 */
export interface ReviewAspect {
  type: string;
  rating: number;
}

/**
 * Place feature
 */
export interface PlaceFeature {
  id: string;
  name: string;
  category: string;
  value: boolean | string | number;
}

/**
 * Popular time
 */
export interface PopularTime {
  day: number; // 0-6
  hour: number; // 0-23
  occupancyPercent: number;
}

/**
 * Enrichment metadata
 */
export interface EnrichmentMetadata {
  /** Request ID for tracing */
  requestId: string;

  /** Provider version used */
  providerVersion: string;

  /** Data freshness */
  dataFreshness: string;

  /** Fields that were enriched */
  enrichedFields: string[];

  /** Fields that failed enrichment */
  failedFields?: string[];

  /** Cache hit */
  cached?: boolean;

  /** Confidence scores per field */
  confidenceScores?: Record<string, number>;
}

/**
 * Enrichment error
 */
export interface EnrichmentError {
  field: string;
  code: string;
  message: string;
  recoverable: boolean;
}

/**
 * Batch enrichment result
 */
export interface BatchEnrichmentResult {
  results: EnrichmentResult[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    partial: number;
  };
  processingTimeMs: number;
}