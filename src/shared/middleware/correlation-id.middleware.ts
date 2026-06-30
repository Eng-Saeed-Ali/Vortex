/**
 * Vortex Pipeline - Correlation ID Middleware
 * 
 * AsyncLocalStorage-based middleware for request-scoped correlation IDs.
 * Ensures every request and its child operations are traceable via correlation ID.
 * 
 * @module shared/middleware
 * @version 1.0.0
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

/**
 * Correlation ID context type
 */
export interface CorrelationContext {
  correlationId: string;
  requestId?: string;
  userId?: string;
  tenantId?: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

/**
 * AsyncLocalStorage instance for correlation ID context
 * This provides request-scoped storage that works across async boundaries
 */
export const correlationContext = new AsyncLocalStorage<CorrelationContext>();

/**
 * Correlation ID header names
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';
export const USER_ID_HEADER = 'x-user-id';
export const TENANT_ID_HEADER = 'x-tenant-id';

/**
 * Extract correlation ID from request headers or generate new one
 */
function extractCorrelationId(req: Request): string {
  return (
    (req.headers[CORRELATION_ID_HEADER] as string) ||
    (req.headers[REQUEST_ID_HEADER] as string) ||
    uuidv4()
  );
}

/**
 * Get the current correlation context
 * Returns undefined if called outside of a request context
 */
export function getCorrelationContext(): CorrelationContext | undefined {
  return correlationContext.getStore();
}

/**
 * Get the current correlation ID
 * Returns a generated UUID if no context exists (for background jobs)
 */
export function getCorrelationId(): string {
  const context = getCorrelationContext();
  return context?.correlationId ?? uuidv4();
}

/**
 * Get the current request ID
 */
export function getRequestId(): string | undefined {
  const context = getCorrelationContext();
  return context?.requestId;
}

/**
 * Get the current user ID from context
 */
export function getUserId(): string | undefined {
  const context = getCorrelationContext();
  return context?.userId;
}

/**
 * Get the current tenant ID from context
 */
export function getTenantId(): string | undefined {
  const context = getCorrelationContext();
  return context?.tenantId;
}

/**
 * Run a function within a correlation context
 * Useful for background jobs or when creating child contexts
 */
export function runWithCorrelationContext<T>(
  context: Partial<CorrelationContext>,
  fn: () => T
): T {
  const fullContext: CorrelationContext = {
    correlationId: context.correlationId ?? uuidv4(),
    requestId: context.requestId,
    userId: context.userId,
    tenantId: context.tenantId,
    startTime: context.startTime ?? Date.now(),
    metadata: context.metadata,
  };

  return correlationContext.run(fullContext, fn);
}

/**
 * Update the current correlation context with additional metadata
 */
export function updateCorrelationContext(metadata: Record<string, unknown>): void {
  const context = getCorrelationContext();
  if (context) {
    context.metadata = { ...context.metadata, ...metadata };
  }
}

/**
 * Add custom metadata to current correlation context
 */
export function addCorrelationMetadata(key: string, value: unknown): void {
  const context = getCorrelationContext();
  if (context) {
    context.metadata = { ...context.metadata, [key]: value };
  }
}

/**
 * Get custom metadata from current correlation context
 */
export function getCorrelationMetadata<T = unknown>(key: string): T | undefined {
  const context = getCorrelationContext();
  return context?.metadata?.[key] as T | undefined;
}

/**
 * NestJS Middleware for Correlation ID propagation
 * 
 * Extracts or generates correlation ID from request headers
 * Stores it in AsyncLocalStorage for the request lifecycle
 * Adds correlation ID to response headers for tracing
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorrelationIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = extractCorrelationId(req);
    const requestId = (req.headers[REQUEST_ID_HEADER] as string) || uuidv4();
    const userId = req.headers[USER_ID_HEADER] as string | undefined;
    const tenantId = req.headers[TENANT_ID_HEADER] as string | undefined;

    const context: CorrelationContext = {
      correlationId,
      requestId,
      userId,
      tenantId,
      startTime: Date.now(),
      metadata: {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    };

    // Set correlation ID on response headers for client-side tracing
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    res.setHeader(REQUEST_ID_HEADER, requestId);

    // Run the request handler within the correlation context
    correlationContext.run(context, () => {
      // Add correlation ID to request for easy access in controllers
      (req as any).correlationId = correlationId;
      (req as any).requestId = requestId;

      // Log request start
      this.logger.debug(`Request started`, {
        correlationId,
        requestId,
        method: req.method,
        url: req.url,
        userId,
        tenantId,
      });

      // Track response finish for logging
      const originalEnd = res.end.bind(res);
      res.end = (chunk?: any, encoding?: any, callback?: any): any => {
        const duration = Date.now() - context.startTime;
        
        this.logger.debug(`Request completed`, {
          correlationId,
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userId,
          tenantId,
        });

        return originalEnd(chunk, encoding, callback);
      };

      next();
    });
  }
}

/**
 * Decorator to inject correlation ID into controller methods
 */
export const CorrelationId = () => (
  target: object,
  propertyKey: string | symbol,
  parameterIndex: number
) => {
  // This is a placeholder for a custom parameter decorator
  // In practice, you'd use createParamDecorator from @nestjs/common
};

/**
 * Helper to create a child context for background jobs
 * Inherits correlation ID but creates new request ID
 */
export function createChildContext(overrides: Partial<CorrelationContext> = {}): CorrelationContext {
  const parentContext = getCorrelationContext();
  
  return {
    correlationId: parentContext?.correlationId ?? uuidv4(),
    requestId: uuidv4(),
    userId: parentContext?.userId,
    tenantId: parentContext?.tenantId,
    startTime: Date.now(),
    metadata: {
      ...parentContext?.metadata,
      ...overrides.metadata,
      parentCorrelationId: parentContext?.correlationId,
    },
    ...overrides,
  };
}