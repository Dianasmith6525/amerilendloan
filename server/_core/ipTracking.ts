/**
 * IP Tracking and Geolocation
 * Captures client IP address and looks up geographic location
 */

import { Request } from 'express';
import { logger } from './logging';

export interface IPLocation {
  ipAddress: string;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
}

/**
 * Extract client IP address from request
 * Handles proxies and load balancers
 */
export function getClientIP(req: Request): string {
  // Check various headers set by proxies/load balancers
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for may contain multiple IPs (client, proxy1, proxy2)
    // The first one is the original client
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP && typeof realIP === 'string') {
    return realIP;
  }

  // Fallback to socket address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Lookup geographic location from IP address
 * Uses ipapi.co free API (1000 requests/day, no auth required)
 */
export async function getIPLocation(ipAddress: string): Promise<IPLocation> {
  const location: IPLocation = {
    ipAddress,
    country: null,
    region: null,
    city: null,
    timezone: null,
  };

  // Skip lookup for localhost/private IPs
  if (
    ipAddress === 'unknown' ||
    ipAddress === '::1' ||
    ipAddress === '127.0.0.1' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.')
  ) {
    logger.info('Skipping IP lookup for local/private address', { ipAddress });
    location.country = 'Local/Private Network';
    return location;
  }

  try {
    // Use ipapi.co free tier (no API key needed)
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'AmeriLend-Application/1.0',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`IP lookup failed: ${response.status}`);
    }

    const data = await response.json();

    // ipapi.co response structure
    location.country = data.country_name || null;
    location.region = data.region || null;
    location.city = data.city || null;
    location.timezone = data.timezone || null;

    logger.info('IP location lookup successful', {
      ipAddress,
      country: location.country,
      city: location.city,
    });

    return location;
  } catch (error) {
    logger.error('Failed to lookup IP location', error as Error, { ipAddress });
    
    // Return basic info even if lookup fails
    location.country = 'Unknown';
    return location;
  }
}

/**
 * Get client IP and location in one call
 */
export async function trackIPLocation(req: Request): Promise<IPLocation> {
  const ipAddress = getClientIP(req);
  const location = await getIPLocation(ipAddress);
  return location;
}
