/**
 * Automatic Translation Service
 * Uses MyMemory Translation API (free, no API key required)
 * Fallback to original text on error
 */

// In-memory cache for translations
const translationCache = new Map<string, string>()

/**
 * Translate text from Arabic to English using MyMemory API
 * @param text - Arabic text to translate
 * @returns Translated English text or original text on error
 */
export async function translateToEnglish(text: string): Promise<string> {
  // Return empty for empty input
  if (!text || text.trim() === '') {
    return text
  }

  // Check cache first
  const cacheKey = `ar_en_${text}`
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  try {
    // MyMemory Translation API (free, 1000 requests/day)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Timeout after 5 seconds
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.warn('Translation API returned error:', response.status)
      return text // Fallback to original
    }

    const data = await response.json()
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      let translated = data.responseData.translatedText
      
      // SECURITY: Remove HTML/XML tags from translation
      // MyMemory API sometimes returns translations wrapped in HTML/XML tags
      translated = translated.replace(/<[^>]*>/g, ' ').trim()
      
      // CLEANUP: If translation contains multiple names/emails (from contaminated training data),
      // extract only the first valid name (2-3 words max, no @ or special chars)
      if (translated.includes('@') || translated.split(/\s+/).length > 4) {
        // Take text before first @ or special separator
        const beforeAt = translated.split('@')[0]
        // Extract words (letters only, 2+ chars), remove duplicates, take first 3
        const words = beforeAt.match(/[A-Za-z]{2,}/g) || []
        // Remove duplicate words (case-insensitive)
        const uniqueWords: string[] = []
        const seen = new Set<string>()
        for (const word of words) {
          const lower = word.toLowerCase()
          if (!seen.has(lower)) {
            seen.add(lower)
            uniqueWords.push(word)
          }
        }
        if (uniqueWords.length > 0) {
          translated = uniqueWords.slice(0, 3).join(' ')
        }
      }
      
      // Fix all-caps names: capitalize properly (first letter uppercase per word, rest lowercase)
      // Only apply to likely names (contains spaces and is all uppercase)
      if (/^[A-Z\s]+$/.test(translated) && translated.includes(' ')) {
        translated = translated
          .toLowerCase()
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }
      
      // Final cleanup: remove extra spaces
      translated = translated.replace(/\s+/g, ' ').trim()
      
      // Fallback: if result is empty or too short, return original text
      if (!translated || translated.length < 2) {
        translated = text
      }
      
      // Cache the translation
      translationCache.set(cacheKey, translated)
      
      return translated
    }

    // If API response is not valid, return original
    return text
  } catch (error) {
    // On any error (network, timeout, parsing), return original text
    console.warn('Translation failed, using original text:', error instanceof Error ? error.message : 'Unknown error')
    return text
  }
}

/**
 * Batch translate multiple texts
 * Useful for translating property name + neighborhood together
 */
export async function batchTranslate(texts: string[]): Promise<string[]> {
  const promises = texts.map(text => translateToEnglish(text))
  return Promise.all(promises)
}

/**
 * Check if text contains Arabic characters
 */
export function isArabicText(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/
  return arabicPattern.test(text)
}

/**
 * Clear translation cache (useful for testing)
 */
export function clearTranslationCache(): void {
  translationCache.clear()
}

/**
 * Clear specific translation from cache
 */
export function clearTranslation(text: string, langpair: string = 'ar|en'): void {
  const cacheKey = `${langpair.split('|')[0]}_${langpair.split('|')[1]}_${text}`
  translationCache.delete(cacheKey)
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: translationCache.size,
    entries: Array.from(translationCache.entries()).slice(0, 10), // First 10 for debugging
  }
}
