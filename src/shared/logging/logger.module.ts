/**
 * Vortex Pipeline - Logging Module
 * 
 * Provides the Winston logger as a global NestJS provider.
 * Integrates with ConfigModule for configuration.
 * 
 * @module shared/logging
 * @version 1.0.0
 */

import { Module, Global, Provider, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createLogger, LOGGER_TOKEN } from './logger.config';
import { AppConfiguration } from '../config/configuration';

/**
 * Logger provider factory
 * Creates a Winston logger instance with configuration from ConfigService
 */
export const loggerProvider: Provider = {
  provide: LOGGER_TOKEN,
  useFactory: (configService: ConfigService<AppConfiguration>) => {
    return createLogger(configService);
  },
  inject: [ConfigService],
};

/**
 * Type-safe logger interface for dependency injection
 */
export interface VortexLogger {
  log(level: string, message: string, meta?: Record<string, any>): VortexLogger;
  error(message: string, meta?: Record<string, any>): VortexLogger;
  warn(message: string, meta?: Record<string, any>): VortexLogger;
  info(message: string, meta?: Record<string, any>): VortexLogger;
  http(message: string, meta?: Record<string, any>): VortexLogger;
  verbose(message: string, meta?: Record<string, any>): VortexLogger;
  debug(message: string, meta?: Record<string, any>): VortexLogger;
  silly(message: string, meta?: Record<string, any>): VortexLogger;
  child(context: Record<string, any>): VortexLogger;
}

/**
 * Global Logging Module
 * Provides configured Winston logger to entire application
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [LoggingModule],
 * })
 * export class AppModule {}
 * 
 * // In any service:
 * @Injectable()
 * export class MyService {
 *   constructor(@Inject(LOGGER_TOKEN) private logger: VortexLogger) {}
 *   
 *   doSomething() {
 *     this.logger.info('Doing something', { correlationId: 'abc-123' });
 *   }
 * }
 * ```
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [loggerProvider],
  exports: [LOGGER_TOKEN],
})
export class LoggingModule {
  /**
   * Registers the logging module with custom configuration
   * 
   * @param options - Optional configuration overrides
   * @returns Dynamic module configuration
   */
  static forRoot(options?: { serviceName?: string }): DynamicModule {
    return {
      module: LoggingModule,
      global: true,
      providers: [
        {
          provide: LOGGER_TOKEN,
          useFactory: (configService: ConfigService<AppConfiguration>) => {
            return createLogger(configService, options?.serviceName || 'vortex-pipeline');
          },
          inject: [ConfigService],
        },
      ],
      exports: [LOGGER_TOKEN],
    };
  }
}