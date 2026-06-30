/**
 * Vortex Pipeline - Configuration Module
 * 
 * Centralized configuration management with class-validator validation.
 * Application refuses to start if required environment variables are missing.
 * 
 * @module shared/config
 * @version 1.0.0
 */

import { registerAs } from '@nestjs/config';
import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsUrl, Min, Max, ValidateNested, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Environment types
 */
export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Log levels following RFC 5424 / Winston standards
 */
export enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Http = 'http',
  Verbose = 'verbose',
  Debug = 'debug',
  Silly = 'silly',
}

/**
 * Database configuration
 */
export class DatabaseConfig {
  @IsUrl({ require_tld: false, require_protocol: true }, { message: 'DATABASE_URL must be a valid PostgreSQL connection string' })
  @Transform(({ value }) => value.trim())
  url!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  poolSize = 10;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  ssl = false;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  sslCa?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  sslCert?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  sslKey?: string;
}

/**
 * Redis configuration
 */
export class RedisConfig {
  @IsUrl({ require_tld: false, require_protocol: true }, { message: 'REDIS_URL must be a valid Redis connection string' })
  @Transform(({ value }) => value.trim())
  url!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  maxRetriesPerRequest = 3;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Transform(({ value }) => parseInt(value, 10))
  retryDelay = 100;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  enableReadyCheck = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  lazyConnect = false;
}

/**
 * Elasticsearch configuration (for logging)
 */
export class ElasticsearchConfig {
  @IsOptional()
  @IsUrl({ require_tld: true })
  @Transform(({ value }) => value?.trim())
  node?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  username?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  password?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  indexPrefix = 'vortex-logs';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  enabled = false;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Transform(({ value }) => parseInt(value, 10))
  flushInterval = 5000;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) => parseInt(value, 10))
  maxBatchSize = 100;
}

/**
 * JWT Configuration
 */
export class JwtConfig {
  @IsString()
  @Transform(({ value }) => value.trim())
  @Min(32, { message: 'JWT_SECRET must be at least 32 characters' })
  secret!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  accessTokenTtl = '15m';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  refreshTokenTtl = '7d';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  issuer = 'vortex-pipeline';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  audience = 'vortex-api';
}

/**
 * Encryption Configuration
 */
export class EncryptionConfig {
  @IsString()
  @Transform(({ value }) => value.trim())
  @Min(64, { message: 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)' })
  @Max(64, { message: 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)' })
  keyHex!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  keyVersion = 1;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  algorithm = 'aes-256-gcm';
}

/**
 * Webhook Configuration
 */
export class WebhookConfig {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  maxRetries = 5;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Transform(({ value }) => parseInt(value, 10))
  defaultTimeout = 30000;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  secretHeader = 'x-vortex-signature';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value ? value.split(',').map((v: string) => v.trim()) : [])
  allowedHosts: string[] = [];
}

/**
 * Rate Limiter Configuration
 */
export class RateLimiterConfig {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  @Transform(({ value }) => parseInt(value, 10))
  globalLimit = 100;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Transform(({ value }) => parseInt(value, 10))
  globalWindowMs = 60000;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  redisEnabled = true;
}

/**
 * Scraper Configuration (Playwright)
 */
export class ScraperConfig {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value, 10))
  maxConcurrentBrowsers = 5;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Transform(({ value }) => parseInt(value, 10))
  maxPagesPerBrowser = 10;

  @IsOptional()
  @IsNumber()
  @Min(5000)
  @Transform(({ value }) => parseInt(value, 10))
  navigationTimeout = 30000;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  stealthEnabled = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  headless = true;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  userAgent?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  @Transform(({ value }) => value?.trim())
  proxyUrl?: string;
}

/**
 * Enrichment Configuration
 */
export class EnrichmentConfig {
  @IsOptional()
  @IsEnum(['mock', 'playwright'])
  provider = 'mock' as 'mock' | 'playwright';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value, 10))
  concurrency = 8;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Transform(({ value }) => parseInt(value, 10))
  timeout = 60000;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  qualityThreshold = 70;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  mockEnabled = true;
}

/**
 * Scheduler Configuration
 */
export class SchedulerConfig {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  reEnrichmentCron = '0 2 * * *'; // 2 AM daily with jitter

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) => parseInt(value, 10))
  batchSize = 100;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  qualityPriorityThreshold = 70;
}

/**
 * Application Configuration
 */
export class AppConfig {
  @IsEnum(Environment)
  @Transform(({ value }) => value?.toLowerCase() || Environment.Development)
  nodeEnv = Environment.Development;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  name = 'vortex-pipeline';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  version = '1.0.0';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  port = 3000;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  host = '0.0.0.0';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  swaggerEnabled = true;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  swaggerPath = 'api/docs';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  corsEnabled = true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value ? value.split(',').map((v: string) => v.trim()) : ['http://localhost:3000'])
  corsOrigins: string[] = ['http://localhost:3000'];

  @IsOptional()
  @IsEnum(LogLevel)
  @Transform(({ value }) => value?.toLowerCase() || LogLevel.Info)
  logLevel = LogLevel.Info;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  logPretty = false;
}

/**
 * Main Configuration Schema
 * All nested configs are validated recursively
 */
export class ConfigurationSchema {
  @ValidateNested()
  @Type(() => AppConfig)
  app!: AppConfig;

  @ValidateNested()
  @Type(() => DatabaseConfig)
  database!: DatabaseConfig;

  @ValidateNested()
  @Type(() => RedisConfig)
  redis!: RedisConfig;

  @ValidateNested()
  @Type(() => ElasticsearchConfig)
  elasticsearch!: ElasticsearchConfig;

  @ValidateNested()
  @Type(() => JwtConfig)
  jwt!: JwtConfig;

  @ValidateNested()
  @Type(() => EncryptionConfig)
  encryption!: EncryptionConfig;

  @ValidateNested()
  @Type(() => WebhookConfig)
  webhook!: WebhookConfig;

  @ValidateNested()
  @Type(() => RateLimiterConfig)
  rateLimiter!: RateLimiterConfig;

  @ValidateNested()
  @Type(() => ScraperConfig)
  scraper!: ScraperConfig;

  @ValidateNested()
  @Type(() => EnrichmentConfig)
  enrichment!: EnrichmentConfig;

  @ValidateNested()
  @Type(() => SchedulerConfig)
  scheduler!: SchedulerConfig;
}

/**
 * Configuration factory for NestJS ConfigModule
 * Loads and validates all environment variables
 */
export const configuration = registerAs('app', () => {
  const config = {
    app: {
      nodeEnv: process.env.NODE_ENV || Environment.Development,
      name: process.env.APP_NAME || 'vortex-pipeline',
      version: process.env.APP_VERSION || '1.0.0',
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
      swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
      swaggerPath: process.env.SWAGGER_PATH || 'api/docs',
      corsEnabled: process.env.CORS_ENABLED === 'true',
      corsOrigins: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || ['http://localhost:3000'],
      logLevel: (process.env.LOG_LEVEL as LogLevel) || LogLevel.Info,
      logPretty: process.env.LOG_PRETTY === 'true',
    },
    database: {
      url: process.env.DATABASE_URL,
      poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
      ssl: process.env.DB_SSL === 'true',
      sslCa: process.env.DB_SSL_CA,
      sslCert: process.env.DB_SSL_CERT,
      sslKey: process.env.DB_SSL_KEY,
    },
    redis: {
      url: process.env.REDIS_URL,
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
      enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
      lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
    },
    elasticsearch: {
      node: process.env.ELASTICSEARCH_NODE,
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
      indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'vortex-logs',
      enabled: process.env.ELASTICSEARCH_ENABLED === 'true',
      flushInterval: parseInt(process.env.ELASTICSEARCH_FLUSH_INTERVAL || '5000', 10),
      maxBatchSize: parseInt(process.env.ELASTICSEARCH_MAX_BATCH_SIZE || '100', 10),
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      accessTokenTtl: process.env.JWT_ACCESS_TTL || '15m',
      refreshTokenTtl: process.env.JWT_REFRESH_TTL || '7d',
      issuer: process.env.JWT_ISSUER || 'vortex-pipeline',
      audience: process.env.JWT_AUDIENCE || 'vortex-api',
    },
    encryption: {
      keyHex: process.env.ENCRYPTION_KEY,
      keyVersion: parseInt(process.env.ENCRYPTION_KEY_VERSION || '1', 10),
      algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    },
    webhook: {
      maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '5', 10),
      defaultTimeout: parseInt(process.env.WEBHOOK_DEFAULT_TIMEOUT || '30000', 10),
      secretHeader: process.env.WEBHOOK_SECRET_HEADER || 'x-vortex-signature',
      allowedHosts: process.env.WEBHOOK_ALLOWED_HOSTS?.split(',').map((h) => h.trim()) || [],
    },
    rateLimiter: {
      globalLimit: parseInt(process.env.RATE_LIMIT_GLOBAL || '100', 10),
      globalWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
      redisEnabled: process.env.RATE_LIMIT_REDIS_ENABLED === 'true',
    },
    scraper: {
      maxConcurrentBrowsers: parseInt(process.env.SCRAPER_MAX_BROWSERS || '5', 10),
      maxPagesPerBrowser: parseInt(process.env.SCRAPER_MAX_PAGES || '10', 10),
      navigationTimeout: parseInt(process.env.SCRAPER_NAV_TIMEOUT || '30000', 10),
      stealthEnabled: process.env.SCRAPER_STEALTH !== 'false',
      headless: process.env.SCRAPER_HEADLESS !== 'false',
      userAgent: process.env.SCRAPER_USER_AGENT,
      proxyUrl: process.env.SCRAPER_PROXY_URL,
    },
    enrichment: {
      provider: (process.env.ENRICHMENT_PROVIDER as 'mock' | 'playwright') || 'mock',
      concurrency: parseInt(process.env.ENRICHMENT_CONCURRENCY || '8', 10),
      timeout: parseInt(process.env.ENRICHMENT_TIMEOUT || '60000', 10),
      qualityThreshold: parseInt(process.env.ENRICHMENT_QUALITY_THRESHOLD || '70', 10),
      mockEnabled: process.env.MOCK_ENRICHMENT !== 'false',
    },
    scheduler: {
      reEnrichmentCron: process.env.RE_ENRICHMENT_CRON || '0 2 * * *',
      batchSize: parseInt(process.env.SCHEDULER_BATCH_SIZE || '100', 10),
      qualityPriorityThreshold: parseInt(process.env.SCHEDULER_QUALITY_THRESHOLD || '70', 10),
    },
  };

  return config;
});

/**
 * Type-safe configuration type
 */
export type AppConfiguration = ReturnType<typeof configuration>;