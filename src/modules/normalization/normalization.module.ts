import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NormalizationProcessor } from './normalization.processor';
import { QueueName } from '../../shared/queue/queue.module';

/**
 * Normalization Module
 * Handles phone normalization (E.164), Arabic text normalization, address parsing
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.NORMALIZATION,
    }),
    BullModule.registerQueue({
      name: QueueName.DEDUPLICATION,
    }),
  ],
  providers: [NormalizationProcessor],
  exports: [NormalizationProcessor],
})
export class NormalizationModule {}