/**
 * Vortex Pipeline - Prisma Service
 * 
 * Prisma client wrapper with lifecycle hooks for NestJS integration.
 * Handles connection management, graceful shutdown, and query logging.
 * 
 * @module infrastructure/database
 * @version 1.0.0
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from '../../shared/config/configuration';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService<AppConfiguration>) {
    super({
      log: configService.get('app.nodeEnv', { infer: true }) === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error', 'warn'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to database...');
    
    // Add query logging middleware for development
    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore - $on is available at runtime but not in types
      this.$on('query', (e: any) => {
        this.logger.debug(`Query: ${e.query}`, {
          duration: `${e.duration}ms`,
          params: e.params,
        });
      });
    }

    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Enable graceful shutdown hooks for the Prisma client
   * This ensures connections are properly closed on SIGTERM/SIGINT
   */
  async enableShutdownHooks(app: any): Promise<void> {
    const shutdown = async (signal: string) => {
      this.logger.log(`Received ${signal}, closing database connections...`);
      await this.$disconnect();
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Health check for database connectivity
   * Used by Terminus health indicator
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error: unknown) {
      this.logger.error('Database health check failed', error as Error);
      return false;
    }
  }

  /**
   * Clean up soft-deleted records older than specified days
   * Can be used by scheduled cleanup jobs
   */
  async cleanupSoftDeleted(days = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const models = [
      'rawLead',
      'cleansedLead',
      'normalizedLead',
      'masterLead',
      'enrichedLead',
      'enrichmentJob',
      'validationResult',
      'webhookSubscription',
      'webhookDelivery',
      'auditLog',
      'reEnrichmentSchedule',
    ];

    for (const model of models) {
      try {
        // @ts-ignore - dynamic model access
        const result = await this[model].deleteMany({
          where: {
            deletedAt: {
              lt: cutoffDate,
            },
          },
        });
        if (result.count > 0) {
          this.logger.log(`Cleaned up ${result.count} soft-deleted ${model} records`);
        }
      } catch (error) {
        // Model might not have deletedAt or might not exist
        this.logger.debug(`Skipping cleanup for ${model}: ${error.message}`);
      }
    }
  }
}