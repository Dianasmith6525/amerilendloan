import { Request, Response, NextFunction } from 'express';
import { TRPCError } from '@trpc/server';

/**
 * Enhanced error handling with user-friendly messages
 */

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Convert technical errors to user-friendly messages
 */
export function getUserFriendlyErrorMessage(error: AppError | TRPCError): string {
  // TRPC errors
  if ('code' in error && error.code) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'Please log in to access this resource.';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'BAD_REQUEST':
        return error.message || 'Invalid request. Please check your input.';
      case 'TIMEOUT':
        return 'Request timed out. Please try again.';
      case 'CONFLICT':
        return 'A conflict occurred. This resource may already exist.';
      case 'PRECONDITION_FAILED':
        return 'Request preconditions were not met.';
      case 'PAYLOAD_TOO_LARGE':
        return 'The uploaded file is too large.';
      case 'TOO_MANY_REQUESTS':
        return 'Too many requests. Please slow down and try again later.';
      case 'INTERNAL_SERVER_ERROR':
        return 'An unexpected error occurred. Please try again later.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }

  // Database errors
  if (error.message?.includes('duplicate key') || error.message?.includes('UNIQUE constraint')) {
    return 'This record already exists. Please use different values.';
  }

  if (error.message?.includes('foreign key constraint')) {
    return 'Cannot perform this action due to related data dependencies.';
  }

  if (error.message?.includes('Database not available')) {
    return 'Database is temporarily unavailable. Please try again shortly.';
  }

  // Validation errors
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return error.message;
  }

  // Network errors
  if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ETIMEDOUT')) {
    return 'Connection error. Please check your internet connection and try again.';
  }

  // Payment errors
  if (error.message?.includes('payment') || error.message?.includes('charge')) {
    return 'Payment processing error. Please verify your payment details and try again.';
  }

  // Default
  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Express error handler middleware
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error for debugging
  console.error('[Error Handler]', {
    url: req.url,
    method: req.method,
    error: err.message,
    stack: err.stack,
    code: err.code,
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Send user-friendly error response
  res.status(statusCode).json({
    error: true,
    message: getUserFriendlyErrorMessage(err),
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      debug: {
        originalMessage: err.message,
        stack: err.stack,
      },
    }),
  });
}

/**
 * Async route handler wrapper to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation helpers
 */
export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email address');
  }
}

export function validatePhone(phone: string): void {
  const phoneRegex = /^\d{10,}$/;
  const cleaned = phone.replace(/[^\d]/g, '');
  if (!phoneRegex.test(cleaned)) {
    throw new ValidationError('Invalid phone number. Please enter at least 10 digits.');
  }
}

export function validateSSN(ssn: string): void {
  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  if (!ssnRegex.test(ssn)) {
    throw new ValidationError('Invalid SSN format. Use XXX-XX-XXXX format.');
  }
}

export function validateAmount(amount: number, min?: number, max?: number): void {
  if (amount <= 0) {
    throw new ValidationError('Amount must be greater than zero');
  }
  if (min !== undefined && amount < min) {
    throw new ValidationError(`Amount must be at least $${(min / 100).toFixed(2)}`);
  }
  if (max !== undefined && amount > max) {
    throw new ValidationError(`Amount cannot exceed $${(max / 100).toFixed(2)}`);
  }
}

/**
 * Input sanitization
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers like onclick=
}

export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  // Basic HTML escaping
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Rate limiting store (in-memory, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Clean up expired rate limit records
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute
