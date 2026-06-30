import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Parsed address components
 */
export class NormalizedAddressComponentsDto {
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
 * DTO for normalized lead data after phone, Arabic text, and address normalization
 */
export class NormalizedLeadDto {
  @ApiProperty({ example: 'Acme Corporation', description: 'Business name (normalized)' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: '+966501234567', description: 'Phone number in E.164 format' })
  @IsString()
  @IsOptional()
  phoneE164?: string;

  @ApiPropertyOptional({ example: '+966501234567', description: 'Secondary phone in E.164 format' })
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

  @ApiPropertyOptional({ type: NormalizedAddressComponentsDto, description: 'Structured address components' })
  @ValidateNested()
  @Type(() => NormalizedAddressComponentsDto)
  @IsOptional()
  addressComponents?: NormalizedAddressComponentsDto;

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
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ description: 'Additional normalized metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Raw lead ID reference' })
  @IsString()
  rawLeadId!: string;

  @ApiProperty({ example: 'google_maps', description: 'Original source identifier' })
  @IsString()
  source!: string;

  @ApiProperty({ example: 'ChIJN1t_tDeuEmsRUsoyG83frY4', description: 'Original source system ID' })
  @IsString()
  sourceId!: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Timestamp when normalization completed' })
  normalizedAt!: string;

  @ApiProperty({ example: '+966', description: 'Detected/default country code for phone normalization' })
  @IsString()
  phoneCountryCode!: string;
}