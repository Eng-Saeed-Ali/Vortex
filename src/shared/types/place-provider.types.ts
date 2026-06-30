/**
 * Vortex Pipeline - Place Provider Types
 *
 * Shared type definitions for place data providers.
 *
 * @module shared/types
 * @version 1.0.0
 */

import { BusinessHours } from './enrichment.types';

/**
 * Raw place data from place providers
 */
export interface PlaceData {
  /** Unique identifier for the place (provider-specific) */
  placeId: string;

  /** Source system identifier */
  sourceId: string;

  /** Provider that returned this data */
  providerId: string;

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
    addressComponents?: AddressComponent[];
  };

  /** Geographic coordinates */
  location?: {
    latitude: number;
    longitude: number;
    viewport?: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };

  /** Contact information */
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };

  /** Business categories */
  categories?: Category[];

  /** Business hours */
  hours?: BusinessHours;

  /** Place types (provider-specific) */
  types?: string[];

  /** Photos */
  photos?: PlacePhoto[];

  /** Reviews summary */
  reviews?: PlaceReviews;

  /** Additional attributes */
  attributes?: Record<string, any>;

  /** Place features */
  features?: PlaceFeature[];

  /** Popular times */
  popularTimes?: PopularTime[];

  /** Price level (0-4) */
  priceLevel?: number;

  /** Rating (1-5) */
  rating?: number;

  /** Review count */
  reviewCount?: number;

  /** Permanently closed flag */
  permanentlyClosed?: boolean;

  /** Temporarily closed flag */
  temporarilyClosed?: boolean;

  /** Plus code / Open Location Code */
  plusCode?: string;

  /** Timezone ID */
  timezone?: string;

  /** UTC offset in minutes */
  utcOffset?: number;

  /** Last updated timestamp */
  lastUpdated: Date | string;

  /** Data quality score (0-1) */
  qualityScore?: number;

  /** Raw provider response for debugging */
  rawResponse?: Record<string, any>;
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
 * Category with hierarchy
 */
export interface Category {
  id: string;
  name: string;
  parentId?: string;
  confidence?: number;
}

/**
 * Place photo
 */
export interface PlacePhoto {
  /** Photo reference ID */
  photoReference: string;

  /** Photo URL */
  url: string;

  /** Width in pixels */
  width: number;

  /** Height in pixels */
  height: number;

  /** Attribution HTML */
  attribution?: string;

  /** Author name */
  authorName?: string;
}

/**
 * Place reviews
 */
export interface PlaceReviews {
  /** Average rating */
  rating: number;

  /** Total review count */
  totalReviews: number;

  /** Rating histogram (rating -> count) */
  ratingHistogram?: Record<number, number>;

  /** Individual reviews */
  reviews: PlaceReview[];
}

/**
 * Individual place review
 */
export interface PlaceReview {
  /** Review ID */
  id: string;

  /** Author name */
  authorName: string;

  /** Rating (1-5) */
  rating: number;

  /** Review text */
  text: string;

  /** Review time */
  time: Date | string;

  /** Language */
  language?: string;

  /** Profile photo URL */
  profilePhotoUrl?: string;

  /** Relative time description */
  relativeTimeDescription?: string;
}

/**
 * Place feature
 */
export interface PlaceFeature {
  id: string;
  name: string;
  category: string;
  value: boolean | string | number;
  confidence?: number;
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
 * Search result with pagination
 */
export interface PlaceSearchResult {
  places: PlaceData[];
  nextPageToken?: string;
  totalResults?: number;
}

/**
 * Nearby search options
 */
export interface NearbySearchOptions {
  /** Location center */
  location: { lat: number; lng: number };

  /** Radius in meters */
  radius: number;

  /** Place type */
  type?: string;

  /** Keyword */
  keyword?: string;

  /** Language */
  language?: string;

  /** Minimum price level (0-4) */
  minPrice?: number;

  /** Maximum price level (0-4) */
  maxPrice?: number;

  /** Open now */
  openNow?: boolean;

  /** Page token */
  pageToken?: string;
}

/**
 * Text search options
 */
export interface TextSearchOptions {
  /** Search query */
  query: string;

  /** Location bias */
  location?: { lat: number; lng: number };

  /** Radius in meters */
  radius?: number;

  /** Language */
  language?: string;

  /** Region */
  region?: string;

  /** Minimum price level */
  minPrice?: number;

  /** Maximum price level */
  maxPrice?: number;

  /** Open now */
  openNow?: boolean;

  /** Page token */
  pageToken?: string;
}

/**
 * Radar search options (deprecated in some APIs)
 */
export interface RadarSearchOptions {
  /** Location center */
  location: { lat: number; lng: number };

  /** Radius in meters */
  radius: number;

  /** Place type */
  type?: string;

  /** Keyword */
  keyword?: string;
}