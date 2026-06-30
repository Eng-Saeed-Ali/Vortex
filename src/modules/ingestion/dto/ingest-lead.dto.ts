import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsEmail, IsPhoneNumber, MinLength, MaxLength, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Address components for structured address input
 */
export class AddressComponentsDto {
  @ApiPropertyOptional({ example: 'King Fahd Road', description: 'Street name and number' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional({ example: 'Riyadh', description: 'City name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Riyadh Region', description: 'Region/Province/State' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  region?: string;

  @ApiPropertyOptional({ example: '12345', description: 'Postal/ZIP code' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'SA', description: 'ISO 3166-1 alpha-2 country code' })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{2}$/, { message: 'Country code must be ISO 3166-1 alpha-2 format' })
  country?: string;
}

/**
 * Social links for the lead
 */
export class SocialLinksDto {
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
 * DTO for ingesting a B2B lead
 * Validates incoming lead data before persisting to RawLead table
 */
export class IngestLeadDto {
  @ApiProperty({ 
    example: 'google_maps', 
    description: 'Source system identifier',
    enum: ['google_maps', 'linkedin', 'website_scraper', 'manual_entry', 'third_party_api', 'import']
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Source must contain only alphanumeric characters, underscores, or hyphens' })
  source!: string;

  @ApiProperty({ 
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4', 
    description: 'Unique identifier from the source system' 
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  sourceId!: string;

  @ApiProperty({ example: 'Acme Corporation', description: 'Business name' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @ApiPropertyOptional({ example: '+966501234567', description: 'Phone number in E.164 or local format' })
  @IsPhoneNumber(undefined, { message: 'Phone must be a valid phone number' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@acme.com', description: 'Business email address' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'https://acme.com', description: 'Business website URL' })
  @IsUrl({}, { message: 'Website must be a valid URL' })
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ type: AddressComponentsDto, description: 'Structured address components' })
  @ValidateNested()
  @Type(() => AddressComponentsDto)
  @IsOptional()
  address?: AddressComponentsDto;

  @ApiPropertyOptional({ type: SocialLinksDto, description: 'Social media profile links' })
  @ValidateNested()
  @Type(() => SocialLinksDto)
  @IsOptional()
  socialLinks?: SocialLinksDto;

  @ApiPropertyOptional({ example: 'Technology consulting firm', description: 'Business description' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: ['technology', 'consulting', 'saas'], description: 'Business categories/tags' })
  @IsString({ each: true })
  @IsOptional()
  @MaxLength(50, { each: true })
  categories?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata from source' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}