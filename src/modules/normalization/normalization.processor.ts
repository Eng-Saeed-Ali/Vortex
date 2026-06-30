import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import type { VortexLogger } from '../../shared/logging/logger.module';
import { LOGGER_TOKEN } from '../../shared/logging/logger.config';
import { QueueName } from '../../shared/queue/queue.module';
import { NormalizedLeadDto, NormalizedAddressComponentsDto } from './dto/normalized-lead.dto';
import { CleansedLeadDto } from '../cleansing/dto/cleansed-lead.dto';
import { Queue } from 'bullmq';
import { getCorrelationId, runWithCorrelationContext, createChildContext } from '../../shared/middleware/correlation-id.middleware';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

/**
 * Job data for normalization queue
 */
export interface NormalizationJobData {
  rawLeadId: string;
  cleansedData: CleansedLeadDto;
  correlationId: string;
}

// Phone number utility instance
const phoneUtil = PhoneNumberUtil.getInstance();

// Default regions for phone normalization when country code is missing
const DEFAULT_REGIONS = ['SA', 'AE', 'EG', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB'];

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(phone: string, defaultRegion: string = 'SA'): string | undefined {
  if (!phone || typeof phone !== 'string') {
    return undefined;
  }

  const cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned) {
    return undefined;
  }

  try {
    // Try parsing with default region first
    const number = phoneUtil.parse(cleaned, defaultRegion);
    
    if (phoneUtil.isValidNumber(number)) {
      return phoneUtil.format(number, PhoneNumberFormat.E164);
    }

    // If not valid, try other default regions
    for (const region of DEFAULT_REGIONS) {
      if (region === defaultRegion) continue;
      
      try {
        const altNumber = phoneUtil.parse(cleaned, region);
        if (phoneUtil.isValidNumber(altNumber)) {
          return phoneUtil.format(altNumber, PhoneNumberFormat.E164);
        }
      } catch {
        // Continue to next region to next region
      }
    }

    // Last resort: if it looks like an international number without +, try adding +
    if (cleaned.startsWith('00')) {
      const withPlus = '+' + cleaned.substring(2);
      try {
        const number = phoneUtil.parse(withPlus, 'ZZ');
        if (phoneUtil.isValidNumber(number)) {
          return phoneUtil.format(number, PhoneNumberFormat.E164);
        }
      } catch {
        // Ignore
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Normalize Arabic text: NFKC, remove Tatweel, strip diacritics/Tashkeel
 */
function normalizeArabicText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Step 1: Unicode NFKC normalization
  let normalized = text.normalize('NFKC');

  // Step 2: Remove Tatweel (kashida) - Arabic Tatweel character U+0640
  normalized = normalized.replace(/\u0640/g, '');

  // Step 3: Strip diacritics (Tashkeel) - Arabic diacritics range U+064B to U+065F
  normalized = normalized.replace(/[\u064B-\u065F]/g, '');

  // Step 4: Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Parse address into structured components
 */
function parseAddress(address: CleansedLeadDto['address']): NormalizedAddressComponentsDto {
  const result = new NormalizedAddressComponentsDto();
  
  if (!address || typeof address !== 'object') {
    return result;
  }

  result.street = typeof address.street === 'string' ? normalizeArabicText(address.street) : undefined;
  result.city = typeof address.city === 'string' ? normalizeArabicText(address.city) : undefined;
  result.region = typeof address.region === 'string' ? normalizeArabicText(address.region) : undefined;
  result.postalCode = typeof address.postalCode === 'string' ? address.postalCode : undefined;
  result.country = typeof address.country === 'string' ? address.country.toUpperCase() : undefined;
  result.googlePlaceId = typeof address.googlePlaceId === 'string' ? address.googlePlaceId : undefined;
  result.osmId = typeof address.osmId === 'string' ? address.osmId : undefined;

  // Build coordinates if lat/lng provided
  if (typeof (address as any).latitude === 'number' && typeof (address as any).longitude === 'number') {
    result.coordinates = `${(address as any).latitude}, ${(address as any).longitude}`;
  }

  return result;
}

/**
 * Build formatted address string from components
 */
function buildFormattedAddress(components: NormalizedAddressComponentsDto): string {
  const parts: string[] = [];
  
  if (components.street) parts.push(components.street);
  if (components.city) parts.push(components.city);
  if (components.region) parts.push(components.region);
  if (components.postalCode) parts.push(components.postalCode);
  if (components.country) parts.push(components.country);
  
  return parts.join(', ');
}

/**
 * Normalization Processor
 * Consumes from 'normalization' queue, normalizes phones, Arabic text, addresses
 * Enqueues to 'deduplication' queue
 */
@Processor(QueueName.NORMALIZATION, { concurrency: 30 })
@Injectable()
export class NormalizationProcessor extends WorkerHost {
  private readonly logger: Logger;

  constructor(
    @Inject(LOGGER_TOKEN) private readonly vortexLogger: VortexLogger,
    @Inject(QueueName.DEDUPLICATION) private readonly deduplicationQueue: Queue,
  ) {
    super();
    this.logger = new Logger('NormalizationProcessor');
  }

  async process(job: Job<NormalizationJobData, NormalizedLeadDto, string>): Promise<NormalizedLeadDto> {
    const { rawLeadId, cleansedData, correlationId } = job.data;
    
    // Set up correlation context for this job
    createChildContext({ correlationId, metadata: { rawLeadId } });
    
    this.vortexLogger.info('Starting normalization job', {
      correlationId,
      jobId: job.id,
      rawLeadId,
      queue: QueueName.NORMALIZATION,
    });

    try {
      // Detect country code for phone normalization
      const phoneCountryCode = this.detectCountryCode(cleansedData);

      // Normalize primary phone
      const phoneE164 = cleansedData.phone 
        ? normalizePhone(cleansedData.phone, phoneCountryCode.replace('+', ''))
        : undefined;

      // Normalize secondary phone if present (from socialLinks or metadata)
      const phone2 = (cleansedData.metadata?.phone2 as string) || (cleansedData.socialLinks?.googleMaps as string);
      const phone2E164 = phone2
        ? normalizePhone(phone2, phoneCountryCode.replace('+', ''))
        : undefined;

      // Normalize Arabic text fields
      const name = cleansedData.name ? normalizeArabicText(cleansedData.name) : '';
      const description = cleansedData.description ? normalizeArabicText(cleansedData.description) : undefined;

      // Normalize categories (lowercase, trim)
      const categories = cleansedData.categories
        ? cleansedData.categories.map(c => c.toLowerCase().trim()).filter(c => c.length > 0)
        : undefined;

      // Parse address components
      const addressComponents = parseAddress(cleansedData.address);
      const formattedAddress = buildFormattedAddress(addressComponents);

      // Build normalized lead DTO
      const normalizedLead = new NormalizedLeadDto();
      normalizedLead.rawLeadId = rawLeadId;
      normalizedLead.source = cleansedData.source;
      normalizedLead.sourceId = cleansedData.sourceId;
      normalizedLead.name = name;
      normalizedLead.phoneE164 = phoneE164;
      normalizedLead.phone2E164 = phone2E164;
      normalizedLead.email = cleansedData.email?.toLowerCase().trim();
      normalizedLead.website = cleansedData.website?.trim();
      normalizedLead.addressComponents = addressComponents;
      normalizedLead.formattedAddress = formattedAddress || undefined;
      normalizedLead.description = description;
      normalizedLead.categories = categories;
      normalizedLead.metadata = cleansedData.metadata;
      normalizedLead.normalizedAt = new Date().toISOString();
      normalizedLead.phoneCountryCode = phoneCountryCode;

      this.vortexLogger.info('Normalization completed', {
        correlationId,
        jobId: job.id,
        rawLeadId,
        phoneNormalized: !!phoneE164,
        arabicNormalized: name !== cleansedData.name,
        addressParsed: !!addressComponents.street || !!addressComponents.city,
      });

      // Enqueue to deduplication queue
      await this.deduplicationQueue.add('deduplicate', {
        rawLeadId,
        normalizedData: normalizedLead,
        correlationId,
      }, {
        removeOnComplete: 500,
        removeOnFail: 200,
      });

      this.vortexLogger.info('Deduplication job enqueued', {
        correlationId,
        jobId: job.id,
        rawLeadId,
        queue: QueueName.DEDUPLICATION,
      });

      return normalizedLead;
    } catch (error) {
      this.vortexLogger.error('Normalization failed', {
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
   * Detect country code from various signals
   */
  private detectCountryCode(data: CleansedLeadDto): string {
    // 1. Check address country
    if (data.address?.country) {
      const countryToCode: Record<string, string> = {
        'SA': '+966', 'SAUDI ARABIA': '+966',
        'AE': '+971', 'UAE': '+971', 'UNITED ARAB EMIRATES': '+971',
        'EG': '+20', 'EGYPT': '+20',
        'KW': '+965', 'KUWAIT': '+965',
        'QA': '+974', 'QATAR': '+974',
        'BH': '+973', 'BAHRAIN': '+973',
        'OM': '+968', 'OMAN': '+968',
        'JO': '+962', 'JORDAN': '+962',
        'LB': '+961', 'LEBANON': '+961',
      };
      const upper = data.address.country.toUpperCase();
      if (countryToCode[upper]) return countryToCode[upper];
    }

    // 2. Check phone number for existing country code
    if (data.phone?.startsWith('+')) {
      try {
        const number = phoneUtil.parse(data.phone, 'ZZ');
        const regionCode = phoneUtil.getRegionCodeForNumber(number);
        if (regionCode) {
          const countryCode = phoneUtil.getCountryCodeForRegion(regionCode);
          if (countryCode) return `+${countryCode}`;
        }
      } catch {
        // Ignore
      }
    }

    // 3. Check source for hints
    if (data.source.includes('sa') || data.source.includes('riyadh') || data.source.includes('jeddah')) {
      return '+966';
    }
    if (data.source.includes('ae') || data.source.includes('dubai') || data.source.includes('abu dhabi')) {
      return '+971';
    }

    // 4. Default to Saudi Arabia
    return '+966';
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<NormalizationJobData>, result: NormalizedLeadDto): Promise<void> {
    this.vortexLogger.debug('Normalization job completed', {
      correlationId: job.data.correlationId,
      jobId: job.id,
      rawLeadId: job.data.rawLeadId,
      duration: Date.now() - job.timestamp,
      attemptsMade: job.attemptsMade,
    });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<NormalizationJobData> | undefined, error: Error): Promise<void> {
    if (!job) return;
    
    this.vortexLogger.error('Normalization job failed', {
      correlationId: job.data.correlationId,
      jobId: job.id,
      rawLeadId: job.data.rawLeadId,
      error: error.message,
      stack: error.stack,
      attemptsMade: job.attemptsMade,
    });
  }

  @OnWorkerEvent('stalled')
  async onStalled(job: Job<NormalizationJobData>): Promise<void> {
    this.vortexLogger.warn('Normalization job stalled', {
      correlationId: job.data.correlationId,
      jobId: job.id,
      rawLeadId: job.data.rawLeadId,
      attemptsMade: job.attemptsMade,
    });
  }

  @OnWorkerEvent('progress')
  async onProgress(job: Job<NormalizationJobData>, progress: number | object): Promise<void> {
    this.vortexLogger.debug('Normalization job progress', {
      correlationId: job.data.correlationId,
      jobId: job.id,
      rawLeadId: job.data.rawLeadId,
      progress,
    });
  }
}
