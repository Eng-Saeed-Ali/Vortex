import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { IngestionService, IngestionResult } from './ingestion.service';
import { IngestLeadDto } from './dto/ingest-lead.dto';

/**
 * Ingestion Controller
 * Exposes REST endpoints for lead ingestion
 */
@ApiTags('Ingestion')
@Controller('leads')
@UseGuards(ThrottlerGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  /**
   * Ingest a new B2B lead
   * Validates input, checks idempotency, persists to RawLead, enqueues cleansing job
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Ingest a new B2B lead',
    description: `
      Ingests a new B2B lead into the pipeline. Performs idempotency check using (source, sourceId) unique constraint.
      If lead already exists, returns existing record without creating duplicate.
      On success, enqueues a cleansing job for further processing.
    `,
  })
  @ApiBody({
    type: IngestLeadDto,
    description: 'Lead data to ingest',
    examples: {
      googleMaps: {
        summary: 'Google Maps lead',
        value: {
          source: 'google_maps',
          sourceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          name: 'Acme Corporation',
          phone: '+966501234567',
          email: 'contact@acme.com',
          website: 'https://acme.com',
          address: {
            street: 'King Fahd Road',
            city: 'Riyadh',
            region: 'Riyadh Region',
            postalCode: '12345',
            country: 'SA',
          },
          socialLinks: {
            linkedin: 'https://linkedin.com/company/acme',
            twitter: 'https://twitter.com/acme',
            facebook: 'https://facebook.com/acme',
            instagram: 'https://instagram.com/acme',
            googleMaps: 'https://maps.google.com/?cid=123',
          },
          description: 'Technology consulting firm',
          categories: ['technology', 'consulting', 'saas'],
          metadata: {
            scrapedAt: '2024-01-15T10:30:00Z',
            sourceUrl: 'https://maps.google.com/place/...',
          },
        },
      },
      manualEntry: {
        summary: 'Manual entry lead',
        value: {
          source: 'manual_entry',
          sourceId: 'MAN-001',
          name: 'Al-Rajhi Trading',
          phone: '+966114601234',
          email: 'info@alrajhi-trading.com',
          website: 'https://alrajhi-trading.com',
          address: {
            street: 'Olaya Street',
            city: 'Riyadh',
            region: 'Riyadh Region',
            country: 'SA',
          },
          categories: ['trading', 'import-export'],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lead ingested successfully',
    schema: {
      type: 'object',
      properties: {
        rawLeadId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        isNew: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Lead ingested successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Lead already exists (idempotent)',
    schema: {
      type: 'object',
      properties: {
        rawLeadId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        isNew: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Lead already exists (idempotent)' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' }, example: ['source must contain only alphanumeric characters'] },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to persist lead',
  })
  async ingest(@Body() dto: IngestLeadDto): Promise<IngestionResult> {
    return this.ingestionService.ingest(dto);
  }

  /**
   * Get raw lead by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get raw lead by ID',
    description: 'Retrieves a raw lead by its UUID identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Raw lead UUID',
    type: 'string',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Raw lead found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Raw lead not found',
  })
  async getRawLead(@Param('id') id: string) {
    return this.ingestionService.getRawLead(id);
  }

  /**
   * Check if lead exists by source and sourceId
   */
  @Get('check/exists')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({
    summary: 'Check if lead exists by source and sourceId',
    description: 'Checks if a lead with the given source and sourceId already exists (idempotency check)',
  })
  @ApiQuery({
    name: 'source',
    description: 'Source identifier',
    type: 'string',
    example: 'google_maps',
  })
  @ApiQuery({
    name: 'sourceId',
    description: 'Source system ID',
    type: 'string',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Check result',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean', example: true },
        rawLeadId: { type: 'string', format: 'uuid', nullable: true, example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      },
    },
  })
  async checkExists(
    @Query('source') source: string,
    @Query('sourceId') sourceId: string,
  ) {
    const lead = await this.ingestionService.findBySource(source, sourceId);
    return {
      exists: !!lead,
      rawLeadId: lead?.id || null,
    };
  }
}