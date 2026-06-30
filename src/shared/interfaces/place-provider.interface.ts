/**
 * Vortex Pipeline - Place Provider Interfaces
 * 
 * Interfaces for place/location data providers (Google Places, Yelp, Foursquare, etc.)
 * 
 * @module shared/interfaces
 * @version 1.0.0
 */

import { 
  EnrichmentJobInput, 
  EnrichmentJobResult, 
  ProviderHealthStatus,
  ProviderCapabilities,
  Address,
  GeoCoordinates,
  EnrichmentPriority,
} from './provider.interface';

/**
 * Place search query
 */
export interface PlaceSearchQuery {
  /** Search query text */
  query: string;
  /** Location bias (lat/lng) */
  locationBias?: GeoCoordinates;
  /** Search radius in meters */
  radius?: number;
  /** Place types to filter */
  types?: PlaceType[];
  /** Maximum results */
  maxResults?: number;
  /** Language code */
  language?: string;
  /** Region code */
  region?: string;
}

/**
 * Place type categories (Google Places compatible)
 */
export type PlaceType = 
  | 'accounting'
  | 'airport'
  | 'amusement_park'
  | 'aquarium'
  | 'art_gallery'
  | 'atm'
  | 'bakery'
  | 'bank'
  | 'bar'
  | 'beauty_salon'
  | 'bicycle_store'
  | 'book_store'
  | 'bowling_alley'
  | 'bus_station'
  | 'cafe'
  | 'campground'
  | 'car_dealer'
  | 'car_rental'
  | 'car_repair'
  | 'car_wash'
  | 'casino'
  | 'cemetery'
  | 'church'
  | 'city_hall'
  | 'clothing_store'
  | 'convenience_store'
  | 'courthouse'
  | 'dentist'
  | 'department_store'
  | 'doctor'
  | 'drugstore'
  | 'electrician'
  | 'electronics_store'
  | 'embassy'
  | 'fire_station'
  | 'florist'
  | 'funeral_home'
  | 'furniture_store'
  | 'gas_station'
  | 'gym'
  | 'hair_care'
  | 'hardware_store'
  | 'hindu_temple'
  | 'home_goods_store'
  | 'hospital'
  | 'insurance_agency'
  | 'jewelry_store'
  | 'laundry'
  | 'lawyer'
  | 'library'
  | 'light_rail_station'
  | 'liquor_store'
  | 'local_government_office'
  | 'locksmith'
  | 'lodging'
  | 'meal_delivery'
  | 'meal_takeaway'
  | 'mosque'
  | 'movie_rental'
  | 'movie_theater'
  | 'moving_company'
  | 'museum'
  | 'night_club'
  | 'painter'
  | 'park'
  | 'parking'
  | 'pet_store'
  | 'pharmacy'
  | 'physiotherapist'
  | 'plumber'
  | 'police'
  | 'post_office'
  | 'primary_school'
  | 'real_estate_agency'
  | 'restaurant'
  | 'roofing_contractor'
  | 'rv_park'
  | 'school'
  | 'secondary_school'
  | 'shoe_store'
  | 'shopping_mall'
  | 'spa'
  | 'stadium'
  | 'storage'
  | 'store'
  | 'subway_station'
  | 'supermarket'
  | 'synagogue'
  | 'taxi_stand'
  | 'tourist_attraction'
  | 'train_station'
  | 'transit_station'
  | 'travel_agency'
  | 'university'
  | 'veterinary_care'
  | 'zoo'
  | string; // Allow custom types

/**
 * Place search result
 */
export interface PlaceSearchResult {
  /** Place ID */
  placeId: string;
  /** Place name */
  name: string;
  /** Address */
  address?: Address;
  /** Coordinates */
  coordinates?: GeoCoordinates;
  /** Place types */
  types: PlaceType[];
  /** Rating (1-5) */
  rating?: number;
  /** User ratings total */
  userRatingsTotal?: number;
  /** Price level (0-4) */
  priceLevel?: number;
  /** Business status */
  businessStatus?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
  /** Place is open now */
  openNow?: boolean;
  /** Photos */
  photos?: PlacePhoto[];
  /** Plus code */
  plusCode?: PlusCode;
  /** Distance from search location in meters */
  distanceMeters?: number;
}

/**
 * Place photo
 */
export interface PlacePhoto {
  /** Photo reference ID */
  photoReference: string;
  /** Photo width */
  width: number;
  /** Photo height */
  height: number;
  /** Attributions */
  attributions?: string[];
}

/**
 * Plus code (Open Location Code)
 */
export interface PlusCode {
  /** Global code */
  globalCode: string;
  /** Compound code */
  compoundCode?: string;
}

/**
 * Place details (comprehensive)
 */
export interface PlaceDetails {
  /** Place ID */
  placeId: string;
  /** Place name */
  name: string;
  /** Formatted address */
  formattedAddress?: string;
  /** Address components */
  address?: Address;
  /** Coordinates */
  coordinates?: GeoCoordinates;
  /** Place types */
  types: PlaceType[];
  /** Phone number */
  formattedPhoneNumber?: string;
  /** International phone number */
  internationalPhoneNumber?: string;
  /** Website */
  website?: string;
  /** Rating */
  rating?: number;
  /** User ratings total */
  userRatingsTotal?: number;
  /** Price level */
  priceLevel?: number;
  /** Business status */
  businessStatus?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
  /** Opening hours */
  openingHours?: OpeningHoursDetail;
  /** Current opening hours */
  currentOpeningHours?: OpeningHoursDetail;
  /** Photos */
  photos?: PlacePhoto[];
  /** Reviews */
  reviews?: PlaceReview[];
  /** Plus code */
  plusCode?: PlusCode;
  /** URL to place on Google Maps */
  url?: string;
  /** UTC offset in minutes */
  utcOffsetMinutes?: number;
  /** Timezone ID */
  timezone?: string;
  /** Vicinity (neighborhood) */
  vicinity?: string;
  /** Adr format address */
  adrAddress?: string;
  /** Editorially placed */
  editoriallyPlaced?: boolean;
  /** Wheelchair accessible */
  wheelchairAccessibleEntrance?: boolean;
  /** Serves beer */
  servesBeer?: boolean;
  /** Serves breakfast */
  servesBreakfast?: boolean;
  /** Serves brunch */
  servesBrunch?: boolean;
  /** Serves dinner */
  servesDinner?: boolean;
  /** Serves lunch */
  servesLunch?: boolean;
  /** Serves vegetarian food */
  servesVegetarianFood?: boolean;
  /** Serves wine */
  servesWine?: boolean;
  /** Takeout */
  takeout?: boolean;
  /** Delivery */
  delivery?: boolean;
  /** Dine in */
  dineIn?: boolean;
  /** Curbside pickup */
  curbsidePickup?: boolean;
  /** Reservable */
  reservable?: boolean;
  /** Good for children */
  goodForChildren?: boolean;
  /** Good for groups */
  goodForGroups?: boolean;
  /** Good for watching sports */
  goodForWatchingSports?: boolean;
  /** Live music */
  liveMusic?: boolean;
  /** Menu URL */
  menuUrl?: string;
  /** Outdoor seating */
  outdoorSeating?: boolean;
}

/**
 * Detailed opening hours
 */
export interface OpeningHoursDetail {
  /** Open now */
  openNow: boolean;
  /** Periods */
  periods: OpeningHoursPeriod[];
  /** Weekday text */
  weekdayText: string[];
  /** Secondary hours (e.g., drive-through, takeout) */
  secondaryHours?: Record<string, OpeningHoursDetail>;
}

/**
 * Opening hours period
 */
export interface OpeningHoursPeriod {
  /** Open time */
  open: OpeningHoursTime;
  /** Close time */
  close?: OpeningHoursTime;
}

/**
 * Opening hours time
 */
export interface OpeningHoursTime {
  /** Day of week (0 = Sunday) */
  day: number;
  /** Time (HHmm) */
  time: string;
  /** Date (YYYY-MM-DD) for exceptional hours */
  date?: string;
  /** Truncated */
  truncated?: boolean;
}

/**
 * Place review
 */
export interface PlaceReview {
  /** Author name */
  authorName: string;
  /** Author URL */
  authorUrl?: string;
  /** Language code */
  language: string;
  /** Original language */
  originalLanguage?: string;
  /** Profile photo URL */
  profilePhotoUrl?: string;
  /** Rating (1-5) */
  rating: number;
  /** Relative time description */
  relativeTimeDescription: string;
  /** Text */
  text: string;
  /** Time (Unix timestamp) */
  time: number;
  /** Translated */
  translated?: boolean;
}

/**
 * Place provider interface
 * Implementations: Google Places API, Yelp Fusion, Foursquare, Mapbox, etc.
 */
export interface IPlaceProvider {
  /** Provider unique identifier */
  readonly providerId: string;
  /** Provider display name */
  readonly name: string;
  /** Supported place types */
  readonly supportedTypes: PlaceType[];
  /** Maximum concurrent requests */
  readonly maxConcurrency: number;
  /** Request timeout in ms */
  readonly timeoutMs: number;

  /**
   * Check if provider is healthy
   */
  healthCheck(): Promise<ProviderHealthStatus>;

  /**
   * Search for places
   */
  searchPlaces(query: PlaceSearchQuery): Promise<PlaceSearchResult[]>;

  /**
   * Get detailed place information
   */
  getPlaceDetails(placeId: string, fields?: string[]): Promise<PlaceDetails>;

  /**
   * Get place photos
   */
  getPlacePhotos(photoReference: string, maxWidth?: number, maxHeight?: number): Promise<Buffer>;

  /**
   * Autocomplete place predictions
   */
  autocomplete(input: string, options?: AutocompleteOptions): Promise<PlacePrediction[]>;

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities;
}

/**
 * Autocomplete options
 */
export interface AutocompleteOptions {
  /** Location bias */
  locationBias?: GeoCoordinates;
  /** Search radius */
  radius?: number;
  /** Place types */
  types?: PlaceType[];
  /** Language */
  language?: string;
  /** Region */
  region?: string;
  /** Session token */
  sessionToken?: string;
  /** Components filter */
  components?: Record<string, string>;
}

/**
 * Place prediction (autocomplete)
 */
export interface PlacePrediction {
  /** Place ID */
  placeId: string;
  /** Description */
  description: string;
  /** Structured formatting */
  structuredFormatting: {
    mainText: string;
    secondaryText?: string;
    mainTextMatchedSubstrings?: { offset: number; length: number }[];
    secondaryTextMatchedSubstrings?: { offset: number; length: number }[];
  };
  /** Types */
  types: PlaceType[];
  /** Terms */
  terms: { value: string; offset: number }[];
  /** Distance in meters */
  distanceMeters?: number;
}

/**
 * Place provider options for enrichment
 */
export interface PlaceProviderEnrichmentOptions {
  /** Include photos */
  includePhotos?: boolean;
  /** Include reviews */
  includeReviews?: boolean;
  /** Maximum photos */
  maxPhotos?: number;
  /** Maximum reviews */
  maxReviews?: number;
  /** Fields to retrieve */
  fields?: string[];
}