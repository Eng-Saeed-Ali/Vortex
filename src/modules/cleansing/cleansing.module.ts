import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CleansingProcessor } from './cleansing.processor';
import { QueueName } from '../../shared/queue/queue.module';

/**
 * Cleansing Module
 * Handles data sanitization, XSS detection, and Unicode normalization
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.CLEANSING,
    }),
    BullModule.registerQueue({
      name: QueueName.NORMALIZATION,
    }),
  ],
  providers: [CleansingProcessor],
  exports: [CleansingProcessor],
})
export class CleansingModule {}