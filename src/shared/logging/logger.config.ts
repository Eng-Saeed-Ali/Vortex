/**
 * Vortex Pipeline - Winston Logger Configuration with ECS Format
 * 
 * Centralized logging configuration with:
 * - Winston logger with multiple transports
 * - ECS (Elastic Common Schema) format for Elasticsearch integration
 * - Console pretty printing in development
 * - Structured JSON logging in production
 * - Correlation ID support for distributed tracing
 * - Log level configuration via environment variables
 * 
 * @module shared/logging
 * @version 1.0.0
 */

import { format, transports, Logger } from 'winston';
import ECSLogger from '@elastic/ecs-winston-format';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration, LogLevel } from '../config/configuration';

/**
 * Custom log levels matching RFC 5424 / Winston standards
 * Numeric values determine priority (higher = more severe)
 */
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
} as const;

/**
 * Custom log format for development console output
 * Human-readable with colors and structured metadata
 */
const developmentFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, correlationId, context, ...metadata }) => {
    const meta = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
    const corr = correlationId ? ` [${correlationId}]` : '';
    const ctx = context ? ` [${context}]` : '';
    return `${timestamp} [${level.toUpperCase()}]${corr}${ctx}: ${message} ${meta}`;
  })
);

/**
 * Custom log format for production JSON output
 * Structured logging without ECS formatter (fallback)
 */
const productionJsonFormat = format.combine(
  format.timestamp({ format: 'ISO' }),
  format.errors({ stack: true }),
  format.json()
);

/**
 * Creates a Winston logger instance with ECS formatting
 * 
 * @param config - NestJS ConfigService for environment configuration
 * @param serviceName - Service identifier for log context
 * @returns Configured Winston Logger instance
 */
export function createLogger(config: ConfigService<AppConfiguration>, serviceName = 'vortex-pipeline'): Logger {
  const nodeEnv = config.get('app.nodeEnv', { infer: true }) || 'development';
  const logLevel = config.get('app.logLevel', { infer: true }) || 'info';
  const logPretty = config.get('app.logPretty', { infer: true }) || false;
  const elasticsearchEnabled = config.get('elasticsearch.enabled', { infer: true }) || false;
  const elasticsearchNode = config.get('elasticsearch.node', { infer: true });
  const elasticsearchIndexPrefix = config.get('elasticsearch.indexPrefix', { infer: true }) || 'vortex-logs';

  // Determine if we're in production
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';
  const isTest = nodeEnv === 'test';

  // Determine log format
  const useEcsFormat = elasticsearchEnabled && elasticsearchNode && !isTest;
  const usePrettyPrint = logPretty && isDevelopment && !isTest;

  // Build transports array
  const loggerTransports: Array<transports.ConsoleTransportInstance | transports.FileTransportInstance> = [];

  // Console transport (always present, format varies by environment)
  loggerTransports.push(
    new transports.Console({
      level: isTest ? 'silent' : logLevel,
      format: usePrettyPrint
        ? developmentFormat
        : useEcsFormat
          ? format.combine(
              ECSLogger({ serviceName }),
              format.timestamp({ format: 'ISO' }),
              format.errors({ stack: true }),
            )
          : productionJsonFormat,
      handleExceptions: true,
      handleRejections: true,
    })
  );

  // Elasticsearch transport (production only, when configured)
  if (useEcsFormat && elasticsearchNode) {
    try {
      // Dynamic import to avoid hard dependency when not used
      const { ElasticsearchTransport } = require('winston-elasticsearch');
      
      loggerTransports.push(
        new ElasticsearchTransport({
          level: logLevel,
          clientOpts: {
            node: elasticsearchNode,
            auth: config.get('elasticsearch.username', { infer: true }) && config.get('elasticsearch.password', { infer: true })
              ? {
                  username: config.get('elasticsearch.username', { infer: true })!,
                  password: config.get('elasticsearch.password', { infer: true })!,
                }
              : undefined,
            ssl: elasticsearchNode.startsWith('https://'),
          },
          indexPrefix: elasticsearchIndexPrefix,
          ecsTransform: ECSLogger({ serviceName }),
          buffer: true,
          flushInterval: config.get('elasticsearch.flushInterval', { infer: true }) || 5000,
          maxBatchSize: config.get('elasticsearch.maxBatchSize', { infer: true }) || 100,
        })
      );
    } catch (error) {
      // Elasticsearch transport not available, fall back to console only
      console.warn('[Logger] winston-elasticsearch not installed, Elasticsearch transport disabled');
    }
  }

  // Create logger instance
  const logger = format.combine(
    format.timestamp({ format: 'ISO' }),
    format.errors({ stack: true }),
    useEcsFormat ? ECSLogger({ serviceName }) : format.json()
  );

  const winstonLogger = new Logger({
    levels: LOG_LEVELS,
    level: isTest ? 'silent' : logLevel,
    defaultMeta: {
      service: serviceName,
      environment: nodeEnv,
    },
    transports: loggerTransports,
    exitOnError: false,
    silent: isTest,
  });

  return winstonLogger;
}

/**
 * Logger token for dependency injection
 */
export const LOGGER_TOKEN = 'VORTEX_LOGGER';

/**
 * Creates a child logger with additional context
 * 
 * @param logger - Parent Winston logger
 * @param context - Context object to include in all logs
 * @returns Child logger with bound context
 */
export function createChildLogger(logger: Logger, context: Record<string, any>): Logger {
  return logger.child(context);
}

/**
 * Extracts correlation ID from request/context for distributed tracing
 * 
 * @param context - Request context or headers object
 * @returns Correlation ID string or generated UUID
 */
export function getCorrelationId(context?: Record<string, any>): string {
  if (!context) {
    return generateCorrelationId();
  }
  
  return (
    context.correlationId ||
    context['x-correlation-id'] ||
    context['x-request-id'] ||
    context['traceparent']?.split('-')[1] ||
    generateCorrelationId()
  );
}

/**
 * Generates a UUID v4 for correlation ID
 */
function generateCorrelationId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sanitizes log metadata to remove sensitive data
 * Removes PII, secrets, and large objects
 * 
 * @param meta - Metadata object to sanitize
 * @returns Sanitized metadata object
 */
export function sanitizeLogMeta(meta: Record<string, any>): Record<string, any> {
  const sanitized = { ...meta };
  const sensitiveKeys = [
    'password',
    'secret',
    'token',
    'authorization',
    'cookie',
    'creditCard',
    'ssn',
    'email',
    'phone',
    'address',
    'apiKey',
    'privateKey',
    'accessToken',
    'refreshToken',
  ];

  function sanitize(obj: any, path = ''): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      if (obj.length > 100) return `[Array(${obj.length})]`;
      return obj.map((item, i) => sanitize(item, `${path}[${i}]`));
    }

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((s) => lowerKey.includes(s));
      
      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitize(value, `${path}.${key}`);
      } else if (typeof value === 'string' && value.length > 1000) {
        result[key] = `${value.substring(0, 1000)}... [TRUNCATED ${value.length} chars]`;
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return sanitize(sanitized);
}