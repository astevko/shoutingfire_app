/**
 * URL Validation and Sanitization Utility
 * Implements OWASP URL validation best practices
 */

// Allowed URL schemes for the app
const ALLOWED_SCHEMES = ['https:', 'http:'];

// Allowed domains for the app
const ALLOWED_DOMAINS = [
  'shoutingfire.com',
  'www.shoutingfire.com',
  'shoutingfire-ice.streamguys1.com',
  'open.spotify.com',
  'minnit.chat',
  'calendar.google.com',
  'www.patreon.com',
  'soundcloud.com',
  'www.instagram.com',
  'www.facebook.com',
  'www.iheart.com',
  'www.streamguys.com',
];

/**
 * Validate URL format and security
 * @param url - URL to validate
 * @returns Validation result
 */
export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  error?: string;
}

export function validateUrl(url: string): UrlValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  // Trim whitespace
  const trimmedUrl = url.trim();
  
  if (trimmedUrl.length === 0) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  // Check length
  if (trimmedUrl.length > 2048) {
    return { isValid: false, error: 'URL too long' };
  }

  try {
    const parsed = new URL(trimmedUrl);
    
    // Check scheme
    if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
      return { isValid: false, error: 'Invalid URL scheme' };
    }

    // Check domain
    const domain = parsed.hostname.toLowerCase();
    const isAllowedDomain = ALLOWED_DOMAINS.some(allowed => 
      domain === allowed || domain.endsWith('.' + allowed)
    );

    if (!isAllowedDomain) {
      return { isValid: false, error: 'Domain not allowed' };
    }

    // Additional security checks
    if (parsed.username || parsed.password) {
      return { isValid: false, error: 'URL contains credentials' };
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /javascript:/i,
      /vbscript:/i,
      /data:/i,
      /file:/i,
      /ftp:/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmedUrl)) {
        return { isValid: false, error: 'URL contains dangerous protocol' };
      }
    }

    // Return sanitized URL
    return { 
      isValid: true, 
      sanitizedUrl: parsed.toString() 
    };

  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Safely open URL with validation
 * @param url - URL to open
 * @param linking - React Native Linking object
 * @returns Promise that resolves to success status
 */
export async function safeOpenUrl(
  url: string, 
  linking: any
): Promise<{ success: boolean; error?: string }> {
  const validation = validateUrl(url);
  
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  try {
    await linking.openURL(validation.sanitizedUrl!);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Validate and sanitize search query for external services
 * @param query - Search query
 * @returns Sanitized query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Remove dangerous characters
  let sanitized = query
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/vbscript:/gi, '') // Remove vbscript protocol
    .replace(/data:/gi, '') // Remove data protocol
    .trim();

  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }

  return sanitized;
}

/**
 * Build safe search URL
 * @param baseUrl - Base URL for search
 * @param query - Search query
 * @returns Safe search URL or null if invalid
 */
export function buildSafeSearchUrl(baseUrl: string, query: string): string | null {
  const sanitizedQuery = sanitizeSearchQuery(query);
  
  if (!sanitizedQuery) {
    return null;
  }

  const searchUrl = `${baseUrl}${encodeURIComponent(sanitizedQuery)}`;
  const validation = validateUrl(searchUrl);
  
  return validation.isValid ? validation.sanitizedUrl! : null;
} 