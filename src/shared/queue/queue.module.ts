/**
 * Vortex Pipeline - Queue Module
 * 
 * Global BullMQ module configuration with Redis connection.
 * Registers all queue processors and provides queue tokens for injection.
 * 
 * @module shared/queue
 * @version 1.0.0
 */

import { Module, Global, DynamicModule } from '@nestjs/common';
import { BullModule, BullRootModuleOptions } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfiguration } from '../config/configuration';
import { Queue, Worker, Job, JobsOptions } from 'bullmq';

/**
 * Queue names used throughout the pipeline
 */
export enum QueueName {
  ENRICHMENT = 'enrichment',
  VALIDATION = 'validation',
  NORMALIZATION = 'normalization',
  SCRAPING = 'scraping',
  WEBHOOK_DELIVERY = 'webhook-delivery',
  RE_ENRICHMENT = 're-enrichment',
  CLEANUP = 'cleanup',
}

/**
 * Queue configuration options per queue
 */
export interface QueueOptions {
  name: QueueName;
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
  };
}

/**
 * Default queue configurations based on QUEUE_AND_SECURITY.md topology
 */
export const QUEUE_CONFIGURATIONS: QueueOptions[] = [
  {
    name: QueueName.ENRICHMENT,
    concurrency: 8,
    limiter: { max: 100, duration: 60000 },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  },
  {
    name: QueueName.VALIDATION,
    concurrency: 10,
    limiter: { max: 200, duration: 60000 },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 200,
      removeOnFail: 100,
    },
  },
  {
    name: QueueName.NORMALIZATION,
    concurrency: 10,
    limiter: { max: 200, duration: 60000 },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 200,
      removeOnFail: 100,
    },
  },
  {
    name: QueueName.SCRAPING,
    concurrency: 5,
    limiter: { max: 50, duration: 60000 },
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 10000 },
      removeOnComplete: 50,
      removeOnFail: 25,
    },
  },
  {
    name: QueueName.WEBHOOK_DELIVERY,
    concurrency: 20,
    limiter: { max: 500, duration: 60000 },
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 30000 },
      removeOnComplete: 500,
      removeOnFail: 200,
    },
  },
  {
    name: QueueName.RE_ENRICHMENT,
    concurrency: 4,
    limiter: { max: 50, duration: 60000 },
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 60000 },
      removeOnComplete: 50,
      removeOnFail: 25,
    },
  },
  {
    name: QueueName.CLEANUP,
    concurrency: 2,
    limiter: { max: 10, duration: 60000 },
    defaultJobOptions: {
      attempts: 1,
      backoff: { type: 'fixed', delay: 0 },
      removeOnComplete: 10,
      removeOnFail: 5,
    },
  },
];

@Global()
@Module({})
export class QueueModule {
  /**
   * Register the BullMQ module with all queue configurations
   * Uses Redis connection from configuration
   */
  static forRoot(): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService<AppConfiguration>) => {
            const redisConfig = configService.get('redis', { infer: true });
            const redisUrl = redisConfig?.url || 'redis://localhost:6379';

            const options: BullRootModuleOptions = {
              connection: {
                url: redisUrl,
                maxRetriesPerRequest: redisConfig?.maxRetriesPerRequest ?? 3,
                retryStrategy: (times: number) => {
                  const delay = Math.min(times * (redisConfig?.retryDelay ?? 100), 2000);
                  return delay;
                },
                enableReadyCheck: redisConfig?.enableReadyCheck ?? true,
                lazyConnect: redisConfig?.lazyConnect ?? false,
              },
              defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 50,
              },
            };

            return options;
          },
          inject: [ConfigService],
        }),
        BullModule.registerQueue(
          ...QUEUE_CONFIGURATIONS.map((q) => ({
            name: q.name,
            defaultJobOptions: q.defaultJobOptions,
            limiter: q.limiter,
          }))
        ),
      ],
      exports: [BullModule],
    };
  }
}

/**
 * Abstract base class for all queue processors
 * Provides common functionality for job processing, error handling, and logging
 * 
 * @abstract
 * @template T - Job data type
 * @template R - Job return type
 */
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

export abstract class QueueProcessor<T = unknown, R = unknown> extends WorkerHost {
  protected readonly logger: Logger;

  constructor(protected readonly queueName: QueueName) {
    super();
    this.logger = new Logger(`${queueName}-processor`);
  }

  /**
   * Main job processing logic - must be implemented by subclasses
   * @param job - BullMQ job instance containing data and metadata
   * @returns Promise resolving to job result
   */
  abstract process(job: Job<T, R, string>): Promise<R>;

  /**
   * Called when job is completed successfully
   */
  @OnWorkerEvent('completed')
  async onCompleted(job: Job<T, R, string>, result: R): Promise<void> {
    this.logger.debug(`Job ${job.id} completed`, {
      jobId: job.id,
      queue: this.queueName,
      duration: Date.now() - job.timestamp,
      attemptsMade: job.attemptsMade,
    });
  }

  /**
   * Called when job fails
   * Implement retry logic, dead letter queue, or alerting here
   */
  @OnWorkerEvent('failed')
  async onFailed(job: Job<T, R, string> | undefined, error: Error): Promise<void> {
    if (!job) return;
    
    this.logger.error(`Job ${job.id} failed`, {
      jobId: job.id,
      queue: this.queueName,
      error: error.message,
      stack: error.stack,
      attemptsMade: job.attemptsMade,
      data: job.data,
    });
  }

  /**
   * Called when job is stalled (stalled worker)
   */
  @OnWorkerEvent('stalled')
  async onStalled(job: Job<T, R, string>): Promise<void> {
    this.logger.warn(`Job ${job.id} stalled`, {
      jobId: job.id,
      queue: this.queueName,
      attemptsMade: job.attemptsMade,
    });
  }

  /**
   * Called when job progress is updated
   */
  @OnWorkerEvent('progress')
  async onProgress(job: Job<T, R, string>, progress: number | object): Promise<void> {
    this.logger.debug(`Job ${job.id} progress: ${JSON.stringify(progress)}`, {
      jobId: job.id,
      queue: this.queueName,
      progress,
    });
  }

  /**
   * Helper method to add jobs to the same or other queues
   * Useful for chaining jobs or creating follow-up tasks
   * 
   * @param queue - The BullMQ Queue instance (injected via @InjectQueue)
   * @param jobName - Name of the job
   * @param data - Job data payload
   * @param options - Optional job options
   * @returns Created job instance
   */
  protected async addJob<TJobData>(
    queue: Queue,
    jobName: string,
    data: TJobData,
    options?: JobsOptions
  ): Promise<Job<TJobData, unknown, string>> {
    return queue.add(jobName, data, options);
  }
}