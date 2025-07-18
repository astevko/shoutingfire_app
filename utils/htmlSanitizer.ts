/**
 * OWASP HTML Sanitizer for React Native
 * Implements secure HTML entity decoding and content sanitization
 */

// Allowed HTML entities for safe decoding
const ALLOWED_ENTITIES: { [key: string]: string } = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
  '&#39;': "'",
  '&nbsp;': ' ',
  '&apos;': "'",
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&hellip;': '…',
  '&mdash;': '—',
  '&ndash;': '–',
  '&lsquo;': "'",
  '&rsquo;': "'",
  '&ldquo;': '"',
  '&rdquo;': '"',
};

// Allowed HTML tags for content sanitization
const ALLOWED_TAGS: { [key: string]: string[] } = {
  'p': ['class'],
  'div': ['class'],
  'span': ['class'],
  'strong': [],
  'b': [],
  'em': [],
  'i': [],
  'u': [],
  'br': [],
  'a': ['href', 'target', 'rel'],
  'img': ['src', 'alt', 'width', 'height'],
  'h1': ['class'],
  'h2': ['class'],
  'h3': ['class'],
  'h4': ['class'],
  'h5': ['class'],
  'h6': ['class'],
  'ul': ['class'],
  'ol': ['class'],
  'li': ['class'],
  'blockquote': ['class'],
  'code': ['class'],
  'pre': ['class'],
};

// Allowed URL schemes
const ALLOWED_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Safely decode HTML entities without using innerHTML
 * @param text - Text containing HTML entities
 * @returns Decoded text
 */
export function decodeHtmlEntities(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Use regex-based decoding instead of innerHTML
  return text.replace(/&[#\w]+;/g, (entity) => {
    const decoded = ALLOWED_ENTITIES[entity];
    if (decoded) {
      return decoded;
    }
    
    // Handle numeric entities like &#123;
    const numericMatch = entity.match(/^&#(\d+);$/);
    if (numericMatch) {
      const code = parseInt(numericMatch[1], 10);
      // Only allow safe ASCII and Unicode ranges
      if (code >= 32 && code <= 126 || code >= 160 && code <= 65535) {
        return String.fromCharCode(code);
      }
    }
    
    // Handle hex entities like &#x1F;
    const hexMatch = entity.match(/^&#x([0-9a-fA-F]+);$/);
    if (hexMatch) {
      const code = parseInt(hexMatch[1], 16);
      if (code >= 32 && code <= 126 || code >= 160 && code <= 65535) {
        return String.fromCharCode(code);
      }
    }
    
    // Return original entity if not recognized
    return entity;
  });
}

/**
 * Validate URL for security
 * @param url - URL to validate
 * @returns True if URL is safe
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    return ALLOWED_SCHEMES.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML content by removing dangerous tags and attributes
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove script tags and event handlers
  let sanitized = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<script[^>]*\/?>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '');

  // Remove dangerous CSS
  sanitized = sanitized.replace(/<style[^>]*>.*?<\/style>/gi, '');
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*["']/gi, '');

  // Remove iframe and object tags
  sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object[^>]*>.*?<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed[^>]*\/?>/gi, '');

  // Remove form tags
  sanitized = sanitized.replace(/<form[^>]*>.*?<\/form>/gi, '');
  sanitized = sanitized.replace(/<input[^>]*\/?>/gi, '');
  sanitized = sanitized.replace(/<textarea[^>]*>.*?<\/textarea>/gi, '');

  // Remove meta refresh
  sanitized = sanitized.replace(/<meta[^>]*http-equiv\s*=\s*["']refresh["'][^>]*>/gi, '');

  return sanitized;
}

/**
 * Extract text content from HTML safely
 * @param html - HTML content
 * @returns Plain text content
 */
export function extractTextFromHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // First sanitize the HTML
  const sanitized = sanitizeHtml(html);
  
  // Then decode entities
  const decoded = decodeHtmlEntities(sanitized);
  
  // Remove all HTML tags
  const textOnly = decoded.replace(/<[^>]*>/g, '');
  
  // Clean up whitespace
  return textOnly.replace(/\s+/g, ' ').trim();
}

/**
 * Validate and sanitize external content
 * @param content - Content from external source
 * @returns Sanitized content
 */
export function sanitizeExternalContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Limit content length to prevent DoS
  if (content.length > 10000) {
    content = content.substring(0, 10000);
  }

  // Decode entities first
  let sanitized = decodeHtmlEntities(content);
  
  // Then sanitize HTML
  sanitized = sanitizeHtml(sanitized);
  
  return sanitized;
}

/**
 * Safe regex extraction with validation
 * @param text - Text to search in
 * @param pattern - Regex pattern
 * @param maxLength - Maximum length for extracted content
 * @returns Extracted content or null
 */
export function safeRegexExtract(
  text: string, 
  pattern: RegExp, 
  maxLength: number = 1000
): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  try {
    const match = text.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      // Limit length to prevent DoS
      if (extracted.length <= maxLength) {
        return decodeHtmlEntities(extracted);
      }
    }
    return null;
  } catch (error) {
    console.warn('Regex extraction failed:', error);
    return null;
  }
} 