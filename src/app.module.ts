import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DatabaseModule } from './infrastructure/database/database.module';
import { ConfigModule as SharedConfigModule } from './shared/config/config.module';
import { LoggingModule } from './shared/logging/logger.module';
import { QueueModule } from './shared/queue/queue.module';
import { CryptoModule } from './shared/crypto/crypto.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { CleansingModule } from './modules/cleansing/cleansing.module';
import { NormalizationModule } from './modules/normalization/normalization.module';

@Module({
  imports: [
    // Core NestJS modules
    ConfigModule.forRoot({ isGlobal: true }),
    TerminusModule,
    ScheduleModule.forRoot(),
    
    // Shared modules (global)
    SharedConfigModule,
    LoggingModule,
    DatabaseModule,
    QueueModule.forRoot(),
    CryptoModule,
    
    // Feature modules
    IngestionModule,
    CleansingModule,
    NormalizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
