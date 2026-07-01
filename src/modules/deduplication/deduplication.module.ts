import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '../../shared/queue/queue.module';
import { DeduplicationProcessor } from './deduplication.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QueueName.DEDUPLICATION },
      { name: QueueName.ENRICHMENT },
    ),
  ],
  providers: [DeduplicationProcessor],
  exports: [DeduplicationProcessor],
})
export class DeduplicationModule {}