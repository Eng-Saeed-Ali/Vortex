import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { VortexLogger } from '../../shared/logging/logger.module';
import { LOGGER_TOKEN } from '../../shared/logging/logger.config';
import { IngestLeadDto } from './dto/ingest-lead.dto';
import { getCorrelationId } from '../../shared/middleware/correlation-id.middleware';
import { QueueName } from '../../shared/queue/queue.module';

/**
 * Response DTO for ingestion result
 */
export interface IngestionResult {
  rawLeadId: string;
  isNew: boolean;
  message: string;
}

/**
 * Ingestion Service
 * Handles raw lead ingestion, idempotency checks, and queue publishing
 */
@Injectable()
export class IngestionService {
  private readonly logger: VortexLogger;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(QueueName.CLEANSING) private readonly cleansingQueue: Queue,
    @Inject(LOGGER_TOKEN) logger: VortexLogger,
  ) {
    this.logger = logger;
  }

  /**
   * Ingest a new lead with idempotency check
   * @param dto - Validated lead data
   * @returns Ingestion result with raw lead ID and whether it's new
   */
  async ingest(dto: IngestLeadDto): Promise<IngestionResult> {
    const correlationId = getCorrelationId();
    
    this.logger.info('Ingesting lead', {
      correlationId,
      source: dto.source,
      sourceId: dto.sourceId,
      name: dto.name,
    });

    // Idempotency check: try to create RawLead with unique constraint (source, sourceId)
    let rawLead;
    try {
      rawLead = await this.prisma.rawLead.create({
        data: {
          source: dto.source,
          sourceId: dto.sourceId,
          payload: JSON.parse(JSON.stringify(dto)),
          metadata: dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : null,
        },
      });

      this.logger.info('Raw lead created', {
        correlationId,
        rawLeadId: rawLead.id,
        source: dto.source,
        sourceId: dto.sourceId,
      });
    } catch (error: unknown) {
      // Check if it's a unique constraint violation (P2002)
      const prismaError = error as { code?: string; meta?: { target?: string[] } };
      if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('source') && prismaError.meta?.target?.includes('sourceId')) {
        // Lead already exists - return existing record
        const existing = await this.prisma.rawLead.findFirst({
          where: {
            source: dto.source,
            sourceId: dto.sourceId,
            deletedAt: null,
          },
          select: { id: true },
        });

        this.logger.warn('Duplicate lead ingestion attempt', {
          correlationId,
          source: dto.source,
          sourceId: dto.sourceId,
          existingRawLeadId: existing?.id,
        });

        return {
          rawLeadId: existing!.id,
          isNew: false,
          message: 'Lead already exists (idempotent)',
        };
      }

      this.logger.error('Failed to create raw lead', {
        correlationId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        source: dto.source,
        sourceId: dto.sourceId,
      });

      throw new InternalServerErrorException('Failed to persist lead');
    }

    // Enqueue cleansing job
    try {
      await this.cleansingQueue.add('cleanse', {
        rawLeadId: rawLead.id,
        payload: dto,
        metadata: dto.metadata || {},
        correlationId,
      }, {
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      this.logger.info('Cleansing job enqueued', {
        correlationId,
        rawLeadId: rawLead.id,
        queue: QueueName.CLEANSING,
      });
    } catch (error: unknown) {
      // Log but don't fail the ingestion - job can be retried
      this.logger.error('Failed to enqueue cleansing job', {
        correlationId,
        rawLeadId: rawLead.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - lead is persisted, job can be retried via admin or scheduled retry
    }

    return {
      rawLeadId: rawLead.id,
      isNew: true,
      message: 'Lead ingested successfully',
    };
  }

  /**
   * Get raw lead by ID
   * @param id - Raw lead UUID
   * @returns Raw lead or null
   */
  async getRawLead(id: string) {
    return this.prisma.rawLead.findUnique({
      where: { id },
    });
  }

  /**
   * Check if lead exists by source and sourceId
   * @param source - Source identifier
   * @param sourceId - Source system ID
   * @returns Raw lead or null
   */
  async findBySource(source: string, sourceId: string) {
    return this.prisma.rawLead.findFirst({
      where: {
        source,
        sourceId,
        deletedAt: null,
      },
    });
  }
}