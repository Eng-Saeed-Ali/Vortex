import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Address components for cleansed lead
 */
export class CleansedAddressComponentsDto {
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
 * Social links for the cleansed lead
 */
export class CleansedSocialLinksDto {
  @ApiPropertyOptional({ example: 'https://linkedin.com/company/example', description: 'LinkedIn profile/page URL' })
  @IsUrl({}, { message: 'LinkedIn must be a valid URL' })
  @IsOptional()
  linkedin?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/example', description: 'Twitter/X profile URL' })
  @IsUrl({}, { message: 'Twitter must be a valid URL' })
  @IsOptional()
  twitter?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/example', description: 'Facebook page URL' })
  @IsUrl({}, { message: 'Facebook must be a valid URL' })
  @IsOptional()
  facebook?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/example', description: 'Instagram profile URL' })
  @IsUrl({}, { message: 'Instagram must be a valid URL' })
  @IsOptional()
  instagram?: string;

  @ApiPropertyOptional({ example: 'https://maps.google.com/?cid=123', description: 'Google Maps place URL' })
  @IsUrl({}, { message: 'Google Maps must be a valid URL' })
  @IsOptional()
  googleMaps?: string;
}

/**
 * DTO for cleansed lead data after sanitization
 */
export class CleansedLeadDto {
  @ApiProperty({ example: 'Acme Corporation', description: 'Business name (sanitized)' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: '+966501234567', description: 'Phone number (sanitized)' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@acme.com', description: 'Business email address (sanitized)' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'https://acme.com', description: 'Business website URL (sanitized)' })
  @IsUrl({}, { message: 'Website must be a valid URL' })
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ type: CleansedAddressComponentsDto, description: 'Structured address components (sanitized)' })
  @ValidateNested()
  @Type(() => CleansedAddressComponentsDto)
  @IsOptional()
  address?: CleansedAddressComponentsDto;

  @ApiPropertyOptional({ type: CleansedSocialLinksDto, description: 'Social media profile links (sanitized)' })
  @ValidateNested()
  @Type(() => CleansedSocialLinksDto)
  @IsOptional()
  socialLinks?: CleansedSocialLinksDto;

  @ApiPropertyOptional({ example: 'Technology consulting firm', description: 'Business description (sanitized)' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: ['technology', 'consulting', 'saas'], description: 'Business categories/tags (sanitized)' })
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata from source (sanitized)' })
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

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Timestamp when cleansing completed' })
  cleansedAt!: string;
}