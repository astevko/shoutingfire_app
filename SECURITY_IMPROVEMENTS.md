# OWASP HTML Cleaner Security Improvements

## Overview

This document outlines the security improvements implemented to address potential exploits and vulnerabilities in the ShoutingFire React Native app, following OWASP (Open Web Application Security Project) best practices.

## 🔴 Critical Security Issues Fixed

### 1. HTML Entity Decoding Vulnerability

**Before (Vulnerable):**
```typescript
const decodeHtmlEntities = (text: string): string => {
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;  // ⚠️ DANGEROUS: Direct innerHTML assignment
    return textarea.value;
  }
  // Fallback for React Native
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
};
```

**After (Secure):**
```typescript
// utils/htmlSanitizer.ts
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
    
    // Return original entity if not recognized
    return entity;
  });
}
```

### 2. Unvalidated External Data Processing

**Before (Vulnerable):**
```typescript
const response = await fetch('https://shoutingfire.com/');
const html = await response.text();
const titleMatch = html.match(/<h1 class="qt-title qt-capfont">\s*<a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
```

**After (Secure):**
```typescript
const response = await fetch('https://shoutingfire.com/');
const html = await response.text();
const sanitizedHtml = sanitizeExternalContent(html);
const titleText = safeRegexExtract(sanitizedHtml, /<h1 class="qt-title qt-capfont">\s*<a href="[^"]+"[^>]*>([^<]+)<\/a>/, 200);
```

### 3. Unsafe URL Opening

**Before (Vulnerable):**
```typescript
const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(song)}`;
await Linking.openURL(searchUrl);
```

**After (Secure):**
```typescript
const searchUrl = buildSafeSearchUrl('https://open.spotify.com/search/', song);
if (searchUrl) {
  const result = await safeOpenUrl(searchUrl, Linking);
  if (!result.success) {
    console.warn('Failed to open Spotify:', result.error);
  }
}
```

## 🛡️ Security Utilities Implemented

### 1. HTML Sanitizer (`utils/htmlSanitizer.ts`)

**Features:**
- Safe HTML entity decoding without innerHTML
- Content sanitization with allowed tags/attributes
- Text extraction from HTML
- Safe regex extraction with length limits
- External content sanitization

**Key Functions:**
- `decodeHtmlEntities()` - Safe entity decoding
- `sanitizeHtml()` - Remove dangerous HTML
- `extractTextFromHtml()` - Safe text extraction
- `sanitizeExternalContent()` - Sanitize external data
- `safeRegexExtract()` - Safe regex with validation

### 2. URL Validator (`utils/urlValidator.ts`)

**Features:**
- URL format validation
- Domain whitelisting
- Scheme validation (https/http only)
- Dangerous protocol detection
- Safe URL opening

**Key Functions:**
- `validateUrl()` - Comprehensive URL validation
- `safeOpenUrl()` - Safe URL opening with validation
- `sanitizeSearchQuery()` - Query sanitization
- `buildSafeSearchUrl()` - Safe search URL building

## 🔒 Security Measures Implemented

### 1. Input Validation
- All external data is validated before processing
- Length limits on extracted content
- Type checking for all inputs
- Null/undefined handling

### 2. Content Sanitization
- HTML tag filtering
- Attribute whitelisting
- Script tag removal
- Event handler removal
- Dangerous CSS removal

### 3. URL Security
- Domain whitelisting for allowed sites
- Protocol validation (https/http only)
- Credential removal from URLs
- Dangerous protocol detection
- Length limits on URLs

### 4. Error Handling
- Graceful error handling without exposing internals
- Logging of security violations
- Fallback mechanisms for failed operations
- User-friendly error messages

## 📋 Allowed Domains

The app now only allows connections to these trusted domains:
- `shoutingfire.com`
- `www.shoutingfire.com`
- `shoutingfire-ice.streamguys1.com`
- `open.spotify.com`
- `minnit.chat`
- `calendar.google.com`
- `www.patreon.com`
- `soundcloud.com`
- `www.instagram.com`
- `www.facebook.com`
- `www.iheart.com`
- `www.streamguys.com`

## 🔧 Implementation Details

### File Structure
```
utils/
├── htmlSanitizer.ts    # HTML sanitization utilities
└── urlValidator.ts     # URL validation utilities
```

### Integration Points
- Audio metadata fetching
- "Now On Air" data extraction
- External link handling
- Search functionality
- RSS feed processing

### Performance Considerations
- Efficient regex patterns
- Length limits to prevent DoS
- Minimal processing overhead
- Caching of validation results

## 🧪 Testing Recommendations

### Security Testing
1. **XSS Testing**: Test with malicious HTML entities
2. **URL Injection**: Test with dangerous protocols
3. **Content Length**: Test with extremely long content
4. **Domain Validation**: Test with unauthorized domains
5. **Input Validation**: Test with various input types

### Functional Testing
1. **Audio Streaming**: Verify metadata still works
2. **External Links**: Verify safe URL opening
3. **Search Functionality**: Verify Spotify search works
4. **Content Display**: Verify sanitized content displays correctly

## 📚 OWASP Compliance

This implementation addresses several OWASP Top 10 vulnerabilities:

1. **A03:2021 - Injection**: HTML entity injection prevention
2. **A05:2021 - Security Misconfiguration**: Proper input validation
3. **A06:2021 - Vulnerable Components**: Safe external data handling
4. **A07:2021 - Identification and Authentication Failures**: URL validation

## 🔄 Maintenance

### Regular Updates
- Monitor OWASP guidelines for new threats
- Update allowed domains list as needed
- Review and update sanitization rules
- Keep dependencies updated

### Monitoring
- Log security violations
- Monitor for unusual patterns
- Track failed URL validations
- Review error logs regularly

## 🎯 Benefits

1. **Eliminated XSS Vulnerabilities**: No more innerHTML usage
2. **Secure External Data**: All external content is sanitized
3. **URL Security**: Only trusted domains are allowed
4. **Input Validation**: All inputs are properly validated
5. **Error Handling**: Graceful handling of security violations
6. **Maintainability**: Clean, modular security utilities
7. **Performance**: Efficient security checks with minimal overhead

## 🚀 Next Steps

1. **Certificate Pinning**: Implement for critical endpoints
2. **Content Security Policy**: Add CSP headers for web
3. **Runtime Protection**: Consider RASP implementation
4. **Security Headers**: Add security headers for web platform
5. **Regular Audits**: Schedule periodic security reviews 