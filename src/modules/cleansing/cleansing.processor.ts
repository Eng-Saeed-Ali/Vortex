import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import type { VortexLogger } from '../../shared/logging/logger.module';
import { LOGGER_TOKEN } from '../../shared/logging/logger.config';
import { QueueName } from '../../shared/queue/queue.module';
import { CleansedLeadDto } from './dto/cleansed-lead.dto';
import { Queue } from 'bullmq';
import { getCorrelationId, runWithCorrelationContext, createChildContext } from '../../shared/middleware/correlation-id.middleware';

/**
 * Job data for cleansing queue
 */
export interface CleansingJobData {
  rawLeadId: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  correlationId: string;
}

/**
 * XSS detection patterns
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<link/gi,
  /<meta/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
];

/**
 * HTML tag stripping regex
 */
const HTML_TAG_REGEX = /<[^>]*>/g;

/**
 * Multiple whitespace normalization
 */
const WHITESPACE_REGEX = /\s+/g;

/**
 * Unicode NFC normalization
 */
function normalizeUnicode(str: string): string {
  return str.normalize('NFC');
}

/**
 * Strip HTML/JS tags from string
 */
function stripHtmlTags(str: string): string {
  return str.replace(HTML_TAG_REGEX, ' ').replace(WHITESPACE_REGEX, ' ').trim();
}

/**
 * Detect XSS payloads in string
 */
function detectXss(str: string): string[] {
  const detected: string[] = [];
  for (const pattern of XSS_PATTERNS) {
    const matches = str.match(pattern);
    if (matches) {
      detected.push(...matches);
    }
  }
  return detected;
}

/**
 * Deep sanitize object recursively
 */
function sanitizeObject(obj: unknown, correlationId: string, logger: VortexLogger): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Detect XSS
    const xssMatches = detectXss(obj);
    if (xssMatches.length > 0) {
      logger.warn('XSS payload detected during cleansing', {
        correlationId,
        patterns: xssMatches,
        sample: obj.substring(0, 200),
      });
    }

    // Strip HTML tags and normalize
    return normalizeUnicode(stripHtmlTags(obj));
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, correlationId, logger)).filter((item) => item !== null && item !== undefined && item !== '');
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitized = sanitizeObject(value, correlationId, logger);
      if (sanitized !== null && sanitized !== undefined && sanitized !== '') {
        result[key] = sanitized;
      }
    }
    return result;
  }

  return obj;
}

/**
 * Cleansing Processor
 * Consumes from 'cleansing' queue, sanitizes data, enqueues to 'normalization'
 */
@Processor(QueueName.CLEANSING, { concurrency: 50 })
@Injectable()
export class CleansingProcessor extends WorkerHost {
  private readonly logger: Logger;

  constructor(
    @Inject(LOGGER_TOKEN) private readonly vortexLogger: VortexLogger,
    @Inject(QueueName.NORMALIZATION) private readonly normalizationQueue: Queue,
  ) {
    super();
    this.logger = new Logger('CleansingProcessor');
  }

  async process(job: Job<CleansingJobData, CleansedLeadDto, string>): Promise<CleansedLeadDto> {
    const { rawLeadId, payload, metadata, correlationId } = job.data;
    
    // Set up correlation context for this job
    createChildContext({ correlationId, metadata: { rawLeadId } });
    
    this.vortexLogger.info('Starting cleansing job', {
      correlationId,
      jobId: job.id,
      rawLeadId,
      queue: QueueName.CLEANSING,
    });

    try {
      // Sanitize the payload
      const sanitizedPayload = sanitizeObject(payload, correlationId, this.vortexLogger) as Record<string, unknown>;
      const sanitizedMetadata = sanitizeObject(metadata, correlationId, this.vortexLogger) as Record<string, unknown>;

      // Build cleansed lead DTO
      const cleansedLead = new CleansedLeadDto();
      cleansedLead.rawLeadId = rawLeadId;
      cleansedLead.source = sanitizedPayload.source as string || '';
      cleansedLead.sourceId = sanitizedPayload.sourceId as string || '';
      cleansedLead.name = sanitizedPayload.name as string || '';
      cleansedLead.phone = sanitizedPayload.phone as string | undefined;
      cleansedLead.email = sanitizedPayload.email as string | undefined;
      cleansedLead.website = sanitizedPayload.website as string | undefined;
      cleansedLead.address = sanitizedPayload.address as CleansedLeadDto['address'];
      cleansedLead.socialLinks = sanitizedPayload.socialLinks as CleansedLeadDto['socialLinks'];
      cleansedLead.description = sanitizedPayload.description as string | undefined;
      cleansedLead.categories = sanitizedPayload.categories as string[] | undefined;
      cleansedLead.metadata = sanitizedMetadata;
      cleansedLead.cleansedAt = new Date().toISOString();

      this.vortexLogger.info('Cleansing completed', {
        correlationId,
        jobId: job.id,
        rawLeadId,
        fieldsCleaned: Object.keys(sanitizedPayload).length,
      });

      // Enqueue to normalization queue
      await this.normalizationQueue.add('normalize', {
        rawLeadId,
        cleansedData: cleansedLead,
        correlationId,
      }, {
        removeOnComplete: 200,
        removeOnFail: 100,
      });

      this.vortexLogger.info('Normalization job enqueued', {
        correlationId,
        jobId: job.id,
        rawLeadId,
        queue: QueueName.NORMALIZATION,
      });

      return cleansedLead;
    } catch (error) {
      this.vortexLogger.error('Cleansing failed', {
        correlationId,
        jobId: job.id,
        rawLeadId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<CleansingJobData>, result: CleansedLeadDto): Promise<void> {
    this.vortexLogger.debug('Cleansing job completed', {
      correlationId: job.data.correlationId,
      jobId: job.id,
      rawLeadId: job.data.rawLeadId,
      duration: Date.now() - job.timestamp,
      attemptsMade: job.attemptsMade,
    });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<CleansingJobData> | undefined, error: Error): Promise<void> {
    if (!job) return;
    
    this.vortexLogger.error('Cleansing job failed', {
      correlationId: job.data.correlationId,
      jobId: job.id,
      rawLeadId: job.data.rawLeadId,
      error: error.message,
      stack: error.stack,
      attemptsMade: job.attemptsMade,
    });
  }

  @OnWorkerEvent('stalled')
  async onStalled(job: Job<CleansingJobData>): Promise<void> {
    this.vortexLogger.warn('Cleansing job stalled', {
      correlationId: job.data.correlationId,
      jobId: job.id,
      rawLeadId: job.data.rawLeadId,
      attemptsMade: job.attemptsMade,
    });
  }

  @OnWorkerEvent('progress')
  async onProgress(job: Job<CleansingJobData>, progress: number | object): Promise<void> {
    this.vortexLogger.debug('Cleansing job progress', {
      correlationId: job.data.correlationId,
      jobId: job.id,
      rawLeadId: job.data.rawLeadId,
      progress,
    });
  }
}