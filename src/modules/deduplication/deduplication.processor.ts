import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import type { VortexLogger } from '../../shared/logging/logger.module';
import { LOGGER_TOKEN } from '../../shared/logging/logger.config';
import { QueueName } from '../../shared/queue/queue.module';
import { NormalizedLeadDto } from '../normalization/dto/normalized-lead.dto';
import { MasterLeadDto, MasterLeadQuality } from './dto/master-lead.dto';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { createChildContext } from '../../shared/middleware/correlation-id.middleware';
import stringSimilarity from 'string-similarity';

/**
 * Job data for deduplication queue
 */
export interface DeduplicationJobData {
  rawLeadId: string;
  normalizedData: NormalizedLeadDto;
  correlationId: string;
}

/**
 * Candidate for fuzzy matching
 */
interface FuzzyCandidate {
  masterLeadId: string;
  normalizedName: string;
  city: string | null;
  phoneE164: string | null;
  qualityScore: number;
  createdAt: Date;
}

/**
 * Merge result
 */
interface MergeResult {
  masterLeadId: string;
  wasMerged: boolean;
  matchType: 'exact' | 'fuzzy';
  similarityScore?: number;
}

/**
 * Deduplication Processor
 * Consumes from 'deduplication' queue, performs exact/fuzzy matching,
 * merges leads, and enqueues to 'enrichment' queue
 */
@Processor(QueueName.DEDUPLICATION, { concurrency: 5 })
@Injectable()
export class DeduplicationProcessor extends WorkerHost {
  constructor(
    @Inject(LOGGER_TOKEN) private readonly vortexLogger: VortexLogger,
    private readonly prisma: PrismaService,
    @InjectQueue(QueueName.ENRICHMENT) private readonly enrichmentQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<DeduplicationJobData, MasterLeadDto, string>): Promise<MasterLeadDto> {
    const { rawLeadId, normalizedData, correlationId } = job.data;

    // Set up correlation context for this job
    createChildContext({ correlationId, metadata: { rawLeadId } });

    this.vortexLogger.info('Starting deduplication job', {
      correlationId,
      jobId: job.id,
      rawLeadId,
      queue: QueueName.DEDUPLICATION,
      phoneE164: normalizedData.phoneE164,
      googlePlaceId: normalizedData.addressComponents?.googlePlaceId,
      osmId: normalizedData.addressComponents?.osmId,
    });

    try {
      // Find or create master lead
      const mergeResult = await this.findOrCreateMasterLead(normalizedData, correlationId);

      // Build MasterLeadDto from merged/created record
      const masterLeadDto = await this.buildMasterLeadDto(mergeResult.masterLeadId, mergeResult, normalizedData);

      this.vortexLogger.info('Deduplication completed', {
        correlationId,
        jobId: job.id,
        rawLeadId,
        masterLeadId: mergeResult.masterLeadId,
        wasMerged: mergeResult.wasMerged,
        matchType: mergeResult.matchType,
        similarityScore: mergeResult.similarityScore,
      });

      // Enqueue to enrichment queue
      await this.enrichmentQueue.add('enrich', {
        masterLeadId: mergeResult.masterLeadId,
        normalizedLeadId: normalizedData.rawLeadId,
        correlationId,
      }, {
        removeOnComplete: 50,
        removeOnFail: 25,
        priority: 10,
      });

      this.vortexLogger.info('Enrichment job enqueued', {
        correlationId,
        jobId: job.id,
        masterLeadId: mergeResult.masterLeadId,
        queue: QueueName.ENRICHMENT,
      });

      return masterLeadDto;
    } catch (error) {
      this.vortexLogger.error('Deduplication failed', {
        correlationId,
        jobId: job.id,
        rawLeadId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Find existing master lead or create new one
   * Uses exact match first (google_place_id, osm_id), then fuzzy match
   */
  private async findOrCreateMasterLead(
    normalizedData: NormalizedLeadDto,
    correlationId: string,
  ): Promise<MergeResult> {
    // 1. Exact match by Google Place ID (primary)
    if (normalizedData.addressComponents?.googlePlaceId) {
      const exactMatch = await this.prisma.masterLead.findUnique({
        where: { googlePlaceId: normalizedData.addressComponents.googlePlaceId },
      });

      if (exactMatch) {
        return this.mergeIntoMasterLead(exactMatch.id, normalizedData, correlationId, 'exact');
      }
    }

    // 2. Exact match by OSM ID (fallback)
    if (normalizedData.addressComponents?.osmId) {
      const exactMatch = await this.prisma.masterLead.findUnique({
        where: { osmId: normalizedData.addressComponents.osmId },
      });

      if (exactMatch) {
        return this.mergeIntoMasterLead(exactMatch.id, normalizedData, correlationId, 'exact');
      }
    }

    // 3. Exact match by phone + email combination (if both present)
    if (normalizedData.phoneE164 && normalizedData.email) {
      const exactMatch = await this.prisma.masterLead.findFirst({
        where: {
          phoneE164: normalizedData.phoneE164,
          email: normalizedData.email,
        },
      });

      if (exactMatch) {
        return this.mergeIntoMasterLead(exactMatch.id, normalizedData, correlationId, 'exact');
      }
    }

    // 4. Exact match by source + sourceId (idempotency)
    const exactMatchSource = await this.prisma.masterLead.findFirst({
      where: {
        source: normalizedData.source,
        sourceId: normalizedData.sourceId,
      },
    });

    if (exactMatchSource) {
      return this.mergeIntoMasterLead(exactMatchSource.id, normalizedData, correlationId, 'exact');
    }

    // 5. No exact match - perform fuzzy matching
    const fuzzyResult = await this.findFuzzyMatch(normalizedData);
    
    if (fuzzyResult) {
      return this.mergeIntoMasterLead(fuzzyResult.masterLeadId, normalizedData, correlationId, 'fuzzy', fuzzyResult.similarityScore);
    }

    // 6. No match found - create new master lead
    return this.createNewMasterLead(normalizedData, correlationId);
  }

  /**
   * Find fuzzy match using blocking strategy + string similarity
   * Blocking: first 3 chars of phoneE164 + city
   * Similarity: string-similarity (Jaro-Winkler) > 0.85 on name + city
   */
  private async findFuzzyMatch(normalizedData: NormalizedLeadDto): Promise<{ masterLeadId: string; similarityScore: number } | null> {
    const phonePrefix = normalizedData.phoneE164?.substring(0, 3);
    const city = normalizedData.addressComponents?.city;

    if (!phonePrefix || !city) {
      return null; // Cannot apply blocking strategy
    }

    // Block candidates by phone prefix + city
    const candidates: FuzzyCandidate[] = await this.prisma.$queryRaw`
      SELECT id as "masterLeadId", "normalizedName", city, "phoneE164", "qualityScore", "createdAt"
      FROM "MasterLead"
      WHERE "phoneE164" LIKE ${phonePrefix + '%'}
        AND "addressComponents"->>'city' = ${city}
        AND "deletedAt" IS NULL
      LIMIT 50
    ` as FuzzyCandidate[];

    if (candidates.length === 0) {
      return null;
    }

    // Prepare comparison strings
    const targetName = normalizedData.name.toLowerCase().trim();
    const targetCity = city.toLowerCase().trim();
    const targetString = `${targetName} ${targetCity}`;

    // Compare using string-similarity (Jaro-Winkler)
    let bestMatch: { masterLeadId: string; similarityScore: number } | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      if (!candidate.normalizedName) continue;

      const candidateString = `${candidate.normalizedName.toLowerCase().trim()} ${(candidate.city || '').toLowerCase().trim()}`;
      
      const similarity = stringSimilarity.compareTwoStrings(targetString, candidateString);
      
      if (similarity > 0.85 && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = {
          masterLeadId: candidate.masterLeadId,
          similarityScore: similarity,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Merge incoming normalized lead into existing master lead
   * Uses Prisma transaction for atomicity
   */
  private async mergeIntoMasterLead(
    masterLeadId: string,
    normalizedData: NormalizedLeadDto,
    correlationId: string,
    matchType: 'exact' | 'fuzzy',
    similarityScore?: number,
  ): Promise<MergeResult> {
    return this.prisma.$transaction(async (tx) => {
      // Fetch existing master lead with lock
      const existing = await tx.masterLead.findUnique({
        where: { id: masterLeadId },
      });

      if (!existing) {
        throw new Error(`Master lead ${masterLeadId} not found during merge`);
      }

      // Prepare merged data - coalesce non-null fields from incoming
      const mergedData = this.coalesceFields(existing, normalizedData);

      // Keep earliest createdAt
      const earliestCreatedAt = existing.createdAt < new Date(normalizedData.normalizedAt) 
        ? existing.createdAt 
        : new Date(normalizedData.normalizedAt);

      // Update master lead - append to mergedSources array
      const updated = await tx.masterLead.update({
        where: { id: masterLeadId },
        data: {
          ...mergedData,
          createdAt: earliestCreatedAt,
          updatedAt: new Date(),
          mergedSources: {
            push: normalizedData.source,
          },
        },
      });

      // Log audit entry
      await tx.auditLog.create({
        data: {
          entityId: masterLeadId,
          entityType: 'MasterLead',
          action: 'MERGE',
          correlationId,
          beforeState: {
            name: existing.normalizedName,
            phoneE164: existing.phoneE164,
            email: existing.email,
            qualityScore: existing.qualityScore,
          },
          afterState: {
            name: updated.normalizedName,
            phoneE164: updated.phoneE164,
            email: updated.email,
            qualityScore: updated.qualityScore,
          },
        },
      });

      return {
        masterLeadId,
        wasMerged: true,
        matchType,
        similarityScore,
      };
    });
  }

  /**
   * Create new master lead from normalized data
   */
  private async createNewMasterLead(
    normalizedData: NormalizedLeadDto,
    correlationId: string,
  ): Promise<MergeResult> {
    return this.prisma.$transaction(async (tx) => {
      const masterLead = await tx.masterLead.create({
        data: {
          normalizedName: normalizedData.name,
          phoneE164: normalizedData.phoneE164,
          phone2E164: normalizedData.phone2E164,
          email: normalizedData.email,
          website: normalizedData.website,
          addressComponents: normalizedData.addressComponents as any,
          formattedAddress: normalizedData.formattedAddress,
          description: normalizedData.description,
          categories: normalizedData.categories,
          googlePlaceId: normalizedData.addressComponents?.googlePlaceId,
          osmId: normalizedData.addressComponents?.osmId,
          source: normalizedData.source,
          sourceId: normalizedData.sourceId,
          mergedSources: [normalizedData.source],
          qualityScore: this.calculateQualityScore(normalizedData),
          quality: this.getQualityTier(this.calculateQualityScore(normalizedData)),
          createdAt: new Date(normalizedData.normalizedAt),
          updatedAt: new Date(),
        },
      });

      // Log audit entry
      await tx.auditLog.create({
        data: {
          entityId: masterLead.id,
          entityType: 'MasterLead',
          action: 'CREATE',
          correlationId,
          afterState: {
            name: masterLead.normalizedName,
            phoneE164: masterLead.phoneE164,
            email: masterLead.email,
            qualityScore: masterLead.qualityScore,
          },
        },
      });

      return {
        masterLeadId: masterLead.id,
        wasMerged: false,
        matchType: 'exact', // new record is "exact" match to itself
      };
    });
  }

  /**
   * Coalesce non-null fields from incoming normalized data into existing master lead
   */
  private coalesceFields(existing: any, incoming: NormalizedLeadDto): Partial<any> {
    const merged: Partial<any> = {};

    // Only update if incoming has value and existing doesn't, or if incoming is "better"
    if (incoming.name && incoming.name.length > (existing.normalizedName?.length || 0)) {
      merged.normalizedName = incoming.name;
    }

    if (incoming.phoneE164 && !existing.phoneE164) {
      merged.phoneE164 = incoming.phoneE164;
    }

    if (incoming.phone2E164 && !existing.phone2E164) {
      merged.phone2E164 = incoming.phone2E164;
    }

    if (incoming.email && !existing.email) {
      merged.email = incoming.email;
    }

    if (incoming.website && !existing.website) {
      merged.website = incoming.website;
    }

    if (incoming.formattedAddress && !existing.formattedAddress) {
      merged.formattedAddress = incoming.formattedAddress;
    }

    if (incoming.addressComponents) {
      merged.addressComponents = this.mergeAddressComponents(existing.addressComponents, incoming.addressComponents);
    }

    if (incoming.description && !existing.description) {
      merged.description = incoming.description;
    }

    if (incoming.categories && incoming.categories.length > 0) {
      const existingCats = existing.categories || [];
      const newCats = incoming.categories.filter(c => !existingCats.includes(c));
      if (newCats.length > 0) {
        merged.categories = [...existingCats, ...newCats];
      }
    }

    if (incoming.addressComponents?.googlePlaceId && !existing.googlePlaceId) {
      merged.googlePlaceId = incoming.addressComponents.googlePlaceId;
    }

    if (incoming.addressComponents?.osmId && !existing.osmId) {
      merged.osmId = incoming.addressComponents.osmId;
    }

    // Recalculate quality score based on merged data
    const hypotheticalMerged = { ...existing, ...merged };
    merged.qualityScore = this.calculateQualityScoreFromMasterLead(hypotheticalMerged);
    merged.quality = this.getQualityTier(merged.qualityScore);

    return merged;
  }

  /**
   * Merge address components deeply
   */
  private mergeAddressComponents(existing: any, incoming: any): any {
    const merged = { ...existing };
    
    for (const key of ['street', 'city', 'region', 'postalCode', 'country', 'coordinates', 'googlePlaceId', 'osmId']) {
      if (incoming[key] && !merged[key]) {
        merged[key] = incoming[key];
      }
    }

    return merged;
  }

  /**
   * Calculate quality score from normalized lead data
   */
  private calculateQualityScore(data: NormalizedLeadDto): number {
    let score = 0;
    
    if (data.name) score += 10;
    if (data.phoneE164) score += 20;
    if (data.email) score += 25;
    if (data.website) score += 10;
    if (data.formattedAddress) score += 15;
    if (data.addressComponents?.googlePlaceId) score += 10;
    if (data.addressComponents?.coordinates) score += 5;
    if (data.categories && data.categories.length > 0) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate quality score from master lead record
   */
  private calculateQualityScoreFromMasterLead(lead: any): number {
    let score = 0;
    
    if (lead.normalizedName) score += 10;
    if (lead.phoneE164) score += 20;
    if (lead.email) score += 25;
    if (lead.website) score += 10;
    if (lead.formattedAddress) score += 15;
    if (lead.addressComponents?.googlePlaceId) score += 10;
    if (lead.addressComponents?.coordinates) score += 5;
    if (lead.categories && lead.categories.length > 0) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Get quality tier from score
   */
  private getQualityTier(score: number): MasterLeadQuality {
    if (score >= 80) return MasterLeadQuality.PREMIUM;
    if (score >= 60) return MasterLeadQuality.HIGH;
    if (score >= 40) return MasterLeadQuality.MEDIUM;
    return MasterLeadQuality.LOW;
  }

  /**
   * Build MasterLeadDto from master lead ID and merge result
   */
  private async buildMasterLeadDto(
    masterLeadId: string,
    mergeResult: MergeResult,
    normalizedData: NormalizedLeadDto,
  ): Promise<MasterLeadDto> {
    const masterLead = await this.prisma.masterLead.findUnique({
      where: { id: masterLeadId },
    });

    if (!masterLead) {
      throw new Error(`Master lead ${masterLeadId} not found after merge`);
    }

    const dto = new MasterLeadDto();
    dto.id = masterLead.id;
    dto.name = masterLead.normalizedName;
    dto.phoneE164 = masterLead.phoneE164 || undefined;
    dto.phone2E164 = masterLead.phone2E164 || undefined;
    dto.email = masterLead.email || undefined;
    dto.website = masterLead.website || undefined;
    dto.addressComponents = masterLead.addressComponents as any;
    dto.formattedAddress = masterLead.formattedAddress || undefined;
    dto.description = masterLead.description || undefined;
    dto.categories = masterLead.categories || undefined;
    dto.socialLinks = masterLead.socialLinks as string[] | undefined;
    dto.quality = masterLead.quality as MasterLeadQuality;
    dto.qualityScore = masterLead.qualityScore;
    dto.source = masterLead.source;
    dto.sourceId = masterLead.sourceId;
    dto.mergedSources = masterLead.mergedSources as string[] | undefined;
    dto.createdAt = masterLead.createdAt.toISOString();
    dto.updatedAt = masterLead.updatedAt.toISOString();
    dto.normalizedLeadId = normalizedData.rawLeadId;
    dto.matchType = mergeResult.matchType;
    dto.similarityScore = mergeResult.similarityScore;

    return dto;
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<DeduplicationJobData>, result: MasterLeadDto): Promise<void> {
    this.vortexLogger.debug('Deduplication job completed', {
      correlationId: job.data.correlationId,
      jobId: job.id,
      rawLeadId: job.data.rawLeadId,
      masterLeadId: result.id,
      duration: Date.now() - job.timestamp,
      attemptsMade: job.attemptsMade,
    });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<DeduplicationJobData> | undefined, error: Error): Promise<void> {
    if (!job) return;

    this.vortexLogger.error('Deduplication job failed', {
      correlationId: job.data.correlationId,
      jobId: job.id,
      rawLeadId: job.data.rawLeadId,
      error: error.message,
      stack: error.stack,
      attemptsMade: job.attemptsMade,
    });
  }

  @OnWorkerEvent('stalled')
  async onStalled(job: Job<DeduplicationJobData>): Promise<void> {
    this.vortexLogger.warn('Deduplication job stalled', {
      correlationId: job.data.correlationId,
      jobId: job.id,
      rawLeadId: job.data.rawLeadId,
      attemptsMade: job.attemptsMade,
    });
  }

  @OnWorkerEvent('progress')
  async onProgress(job: Job<DeduplicationJobData>, progress: number | object): Promise<void> {
    this.vortexLogger.debug('Deduplication job progress', {
      correlationId: job.data.correlationId,
      jobId: job.id,
      rawLeadId: job.data.rawLeadId,
      progress,
    });
  }
}
