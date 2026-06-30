/**
 * Vortex Pipeline - Configuration Module
 * 
 * Global ConfigModule with validation schema.
 * Application refuses to start if required environment variables are missing.
 * 
 * @module shared/config
 * @version 1.0.0
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigModuleOptions, ConfigService } from '@nestjs/config';
import { configuration, ConfigurationSchema, AppConfiguration } from './configuration';

/**
 * Validation options for ConfigModule
 * - forbidNonWhitelisted: throws on unknown env vars (strict mode)
 * - whitelist: only allow env vars defined in the schema
 * - transform: apply class-transformer decorators
 * - validate: run class-validator on the merged config object
 */
export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  load: [configuration],
  validationSchema: undefined, // We use class-validator via validate() instead
  validationOptions: {
    forbidNonWhitelisted: true,
    whitelist: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  },
  envFilePath: [
    `.env.${process.env.NODE_ENV || 'development'}.local`,
    `.env.${process.env.NODE_ENV || 'development'}`,
    '.env.local',
    '.env',
  ],
  expandVariables: true,
  cache: true,
};

/**
 * Configuration validation function
 * Runs class-validator on the merged configuration object
 * Throws detailed error if validation fails
 * 
 * @param config - Raw configuration object from ConfigModule
 * @returns Validated configuration object
 * @throws Error with detailed validation messages
 */
export function validateConfig(config: Record<string, any>): AppConfiguration {
  const schema = new ConfigurationSchema();
  
  // Manually assign and validate each section
  // This is needed because ConfigModule merges flat env vars into nested objects
  Object.assign(schema, config);
  
  // We'll use class-validator directly
  // Import here to avoid circular dependency
  const { validateSync } = require('class-validator');
  
  const errors = validateSync(schema, {
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false, value: false },
  });
  
  if (errors.length > 0) {
    const messages = errors.flatMap((err: any) => 
      Object.values(err.constraints || {}).map((msg: unknown) => `${err.property}: ${String(msg)}`)
    );
    
    const errorMessage = [
      '❌ Configuration validation failed:',
      ...messages.map((msg: string) => `  - ${msg}`),
      '',
      'Please check your environment variables and .env files.',
      'Required variables: DATABASE_URL, REDIS_URL, JWT_SECRET, ENCRYPTION_KEY',
    ].join('\n');
    
    throw new Error(errorMessage);
  }
  
  return config as AppConfiguration;
}

/**
 * Type-safe ConfigService for dependency injection
 */
export type VortexConfigService = ConfigService<AppConfiguration>;

/**
 * Global Configuration Module
 * Provides validated, type-safe configuration to the entire application
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [ConfigModule],
 * })
 * export class AppModule {}
 * 
 * // In any service:
 * @Injectable()
 * export class MyService {
 *   constructor(private config: VortexConfigService) {}
 *   
 *   getDbUrl() {
 *     return this.config.get('database.url', { infer: true });
 *   }
 * }
 * ```
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      ...configModuleOptions,
      validate: validateConfig,
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
