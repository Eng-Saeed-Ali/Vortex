import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Quality score enum for master lead
 */
export enum MasterLeadQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  PREMIUM = 'premium',
}

/**
 * Address components for master lead
 */
export class MasterLeadAddressDto {
  @ApiPropertyOptional({ example: 'King Fahd Road', description: 'Street name and number' })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ example: 'Riyadh', description: 'City name' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Riyadh Region', description: 'Region/Province/State' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ example: '12345', description: 'Postal/ZIP code' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'SA', description: 'ISO 3166-1 alpha-2 country code' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '24.7136, 46.6753', description: 'Latitude, longitude' })
  @IsString()
  @IsOptional()
  coordinates?: string;

  @ApiPropertyOptional({ example: 'ChIJN1t_tDeuEmsRUsoyG83frY4', description: 'Google Place ID' })
  @IsString()
  @IsOptional()
  googlePlaceId?: string;

  @ApiPropertyOptional({ example: '123456789', description: 'OpenStreetMap ID' })
  @IsString()
  @IsOptional()
  osmId?: string;
}

/**
 * DTO for Master Lead - deduplicated, merged lead record
 */
export class MasterLeadDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Master lead UUID' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Acme Corporation', description: 'Business name (merged/normalized)' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: '+966501234567', description: 'Primary phone in E.164 format' })
  @IsString()
  @IsOptional()
  phoneE164?: string;

  @ApiPropertyOptional({ example: '+966501234568', description: 'Secondary phone in E.164 format' })
  @IsString()
  @IsOptional()
  phone2E164?: string;

  @ApiPropertyOptional({ example: 'contact@acme.com', description: 'Business email (lowercased)' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'https://acme.com', description: 'Business website (normalized)' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ type: MasterLeadAddressDto, description: 'Structured address components' })
  @ValidateNested()
  @Type(() => MasterLeadAddressDto)
  @IsOptional()
  addressComponents?: MasterLeadAddressDto;

  @ApiPropertyOptional({ example: 'King Fahd Road, Riyadh, Riyadh Region, 12345, SA', description: 'Full formatted address string' })
  @IsString()
  @IsOptional()
  formattedAddress?: string;

  @ApiPropertyOptional({ example: 'Technology consulting firm', description: 'Business description (Arabic normalized)' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: ['technology', 'consulting', 'saas'], description: 'Business categories (normalized)' })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ example: ['linkedin.com/company/acme', 'twitter.com/acme'], description: 'Verified social links' })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  socialLinks?: string[];

  @ApiProperty({ example: 'high', description: 'Quality score tier', enum: MasterLeadQuality })
  @IsEnum(MasterLeadQuality)
  quality!: MasterLeadQuality;

  @ApiProperty({ example: 85, description: 'Quality score (0-100)' })
  @IsNumber()
  qualityScore!: number;

  @ApiProperty({ example: 'google_maps', description: 'Primary source' })
  @IsString()
  source!: string;

  @ApiProperty({ example: 'ChIJN1t_tDeuEmsRUsoyG83frY4', description: 'Primary source ID' })
  @IsString()
  sourceId!: string;

  @ApiPropertyOptional({ example: ['google_maps', 'manual_entry'], description: 'All merged source identifiers' })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  mergedSources?: string[];

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Original creation timestamp (earliest)' })
  @IsString()
  createdAt!: string;

  @ApiProperty({ example: '2024-01-15T14:45:00.000Z', description: 'Last update timestamp' })
  @IsString()
  updatedAt!: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Normalized lead ID that triggered this deduplication' })
  @IsString()
  @IsOptional()
  normalizedLeadId?: string;

  @ApiPropertyOptional({ example: 'exact', description: 'Match type: exact or fuzzy', enum: ['exact', 'fuzzy'] })
  @IsEnum(['exact', 'fuzzy'])
  @IsOptional()
  matchType?: 'exact' | 'fuzzy';

  @ApiPropertyOptional({ example: 0.92, description: 'Fuzzy match similarity score (0-1)' })
  @IsNumber()
  @IsOptional()
  similarityScore?: number;
}