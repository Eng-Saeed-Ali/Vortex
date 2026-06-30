import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { QueueName } from '../../shared/queue/queue.module';

/**
 * Ingestion Module
 * Handles raw lead ingestion, validation, persistence, and queue publishing
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.CLEANSING,
    }),
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}