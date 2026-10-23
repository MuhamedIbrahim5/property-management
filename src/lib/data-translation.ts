/**
 * Translate database values to user's language
 * Uses automatic translation for dynamic content when English translation is missing
 */

import { Language } from './translations'
import { translateToEnglish, isArabicText } from './translation-service'

/**
 * Save translation to database in the background
 * This is a fire-and-forget operation - errors are silently ignored
 */
async function saveTranslationToDatabase(
  type: 'property' | 'unit',
  id: string,
  translations: Record<string, string>
): Promise<void> {
  try {
    // Fire and forget - don't wait for response
    fetch('/api/translations/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, translations }),
    }).catch(() => {
      // Silently ignore errors - translation saving is optional
    })
  } catch {
    // Silently ignore - translation saving is optional
  }
}

// Status translations - matching actual database values
const statusTranslations: Record<string, { ar: string; en: string }> = {
  'قيد_المتابعة': { ar: 'قيد المتابعة', en: 'Under Follow-up' },
  'قيد_متابعة': { ar: 'قيد المتابعة', en: 'Under Follow-up' },
  'قيد_التنفيذ': { ar: 'قيد التنفيذ', en: 'In Progress' },
  'قيد_تنفيذ': { ar: 'قيد التنفيذ', en: 'In Progress' },
  'مكتمل': { ar: 'مكتمل', en: 'Completed' },
  'مؤجل': { ar: 'مؤجل', en: 'Postponed' },
  'قيد_مرحل': { ar: 'قيد مرحل', en: 'Transferred' },
  'ملغي': { ar: 'ملغي', en: 'Cancelled' },
  // English patterns
  'pending': { ar: 'قيد الانتظار', en: 'Pending' },
  'in_progress': { ar: 'قيد التنفيذ', en: 'In Progress' },
  'completed': { ar: 'مكتمل', en: 'Completed' },
  'cancelled': { ar: 'ملغي', en: 'Cancelled' },
  'on_hold': { ar: 'معلق', en: 'On Hold' },
  'postponed': { ar: 'مؤجل', en: 'Postponed' },
  'transferred': { ar: 'قيد مرحل', en: 'Transferred' },
}

// Maintenance type translations - matching actual database values
const maintenanceTypeTranslations: Record<string, { ar: string; en: string }> = {
  // Arabic database values
  'بلاغ_صيانه_اخر': { ar: 'بلاغ صيانه اخر', en: 'Other Maintenance Report' },
  'بلاغ_صيانة_اخر': { ar: 'بلاغ صيانه اخر', en: 'Other Maintenance Report' },
  'جوال_الصيانه': { ar: 'جوال الصيانه', en: 'Maintenance Mobile' },
  'جوال_الصيانة': { ar: 'جوال الصيانه', en: 'Maintenance Mobile' },
  'حارس_العقار': { ar: 'حارس العقار', en: 'Property Guard' },
  'الشكاوي': { ar: 'الشكاوي', en: 'Complaints' },
  'شكاوي': { ar: 'الشكاوي', en: 'Complaints' },
  'شفط_صرف': { ar: 'شفط صرف', en: 'Drainage Suction' },
  'صرف': { ar: 'شفط صرف', en: 'Drainage Suction' },
  'خدمة_العملاء': { ar: 'خدمة العملاء', en: 'Customer Service' },
  'تحسينات': { ar: 'تحسينات', en: 'Improvements' },
  'المكتب': { ar: 'المكتب', en: 'Office' },
  'مكتب': { ar: 'المكتب', en: 'Office' },
  'اخلاء': { ar: 'اخلاء', en: 'Evacuation' },
  'إخلاء': { ar: 'اخلاء', en: 'Evacuation' },
  // English patterns
  'plumbing': { ar: 'سباكة', en: 'Plumbing' },
  'electrical': { ar: 'كهرباء', en: 'Electrical' },
  'ac': { ar: 'تكييف', en: 'Air Conditioning' },
  'air_conditioning': { ar: 'تكييف', en: 'Air Conditioning' },
  'carpentry': { ar: 'نجارة', en: 'Carpentry' },
  'painting': { ar: 'دهان', en: 'Painting' },
  'cleaning': { ar: 'تنظيف', en: 'Cleaning' },
  'other': { ar: 'أخرى', en: 'Other' },
  'complaints': { ar: 'الشكاوي', en: 'Complaints' },
  'improvements': { ar: 'تحسينات', en: 'Improvements' },
  'guard': { ar: 'حارس العقار', en: 'Property Guard' },
  'drainage': { ar: 'شفط صرف', en: 'Drainage' },
}

/**
 * Try to translate a status name
 * Returns original if no translation found
 */
export function translateStatus(statusName: string, language: Language): string {
  // Try exact match first
  const exactKey = statusName.toLowerCase().trim()
  if (statusTranslations[exactKey]) {
    return statusTranslations[exactKey][language]
  }
  
  // Try normalized match
  const normalized = statusName.toLowerCase().replace(/\s+/g, '_').trim()
  return statusTranslations[normalized]?.[language] || statusName
}

/**
 * Try to translate a maintenance type name
 * Returns original if no translation found
 */
export function translateMaintenanceType(typeName: string, language: Language): string {
  // Try exact match first
  const exactKey = typeName.toLowerCase().trim()
  if (maintenanceTypeTranslations[exactKey]) {
    return maintenanceTypeTranslations[exactKey][language]
  }
  
  // Try normalized match
  const normalized = typeName.toLowerCase().replace(/\s+/g, '_').trim()
  return maintenanceTypeTranslations[normalized]?.[language] || typeName
}

/**
 * Get localized property name with automatic translation
 * If nameEn exists, use it. Otherwise, translate Arabic text automatically when language is English.
 * Saves translation to database for future use.
 */
export async function getLocalizedPropertyNameWithId(
  id: string,
  name: string,
  nameEn: string | null | undefined,
  language: Language
): Promise<string> {
  // If Arabic or translation exists, use it
  if (language === 'ar' || nameEn) {
    return language === 'en' && nameEn ? nameEn : name
  }
  
  // Language is English and no translation - auto-translate if Arabic
  if (isArabicText(name)) {
    const translated = await translateToEnglish(name)
    
    // Save to database in background (fire and forget)
    if (translated !== name) {
      saveTranslationToDatabase('property', id, { nameEn: translated })
    }
    
    return translated
  }
  
  return name
}

/**
 * Get localized neighborhood with automatic translation
 * Saves translation to database for future use.
 */
export async function getLocalizedNeighborhoodWithId(
  id: string,
  neighborhood: string,
  neighborhoodEn: string | null | undefined,
  language: Language
): Promise<string> {
  if (language === 'ar' || neighborhoodEn) {
    return language === 'en' && neighborhoodEn ? neighborhoodEn : neighborhood
  }
  
  if (isArabicText(neighborhood)) {
    const translated = await translateToEnglish(neighborhood)
    
    // Save to database in background
    if (translated !== neighborhood) {
      saveTranslationToDatabase('property', id, { neighborhoodEn: translated })
    }
    
    return translated
  }
  
  return neighborhood
}

/**
 * Legacy functions without ID (no database saving)
 * Used for backward compatibility
 */
export async function getLocalizedPropertyName(
  name: string,
  nameEn: string | null | undefined,
  language: Language
): Promise<string> {
  if (language === 'ar' || nameEn) {
    return language === 'en' && nameEn ? nameEn : name
  }
  
  if (isArabicText(name)) {
    return await translateToEnglish(name)
  }
  
  return name
}

/**
 * Get localized neighborhood with automatic translation
 */
export async function getLocalizedNeighborhood(
  neighborhood: string,
  neighborhoodEn: string | null | undefined,
  language: Language
): Promise<string> {
  if (language === 'ar' || neighborhoodEn) {
    return language === 'en' && neighborhoodEn ? neighborhoodEn : neighborhood
  }
  
  if (isArabicText(neighborhood)) {
    return await translateToEnglish(neighborhood)
  }
  
  return neighborhood
}

/**
 * Get localized unit number with automatic translation
 * Saves translation to database for future use.
 */
export async function getLocalizedUnitNumberWithId(
  id: string,
  unitNumber: string,
  unitNumberEn: string | null | undefined,
  language: Language
): Promise<string> {
  if (language === 'ar' || unitNumberEn) {
    return language === 'en' && unitNumberEn ? unitNumberEn : unitNumber
  }
  
  if (isArabicText(unitNumber)) {
    const translated = await translateToEnglish(unitNumber)
    
    // Save to database in background
    if (translated !== unitNumber) {
      saveTranslationToDatabase('unit', id, { unitNumberEn: translated })
    }
    
    return translated
  }
  
  return unitNumber
}

/**
 * Get localized unit number with automatic translation
 */
export async function getLocalizedUnitNumber(
  unitNumber: string,
  unitNumberEn: string | null | undefined,
  language: Language
): Promise<string> {
  if (language === 'ar' || unitNumberEn) {
    return language === 'en' && unitNumberEn ? unitNumberEn : unitNumber
  }
  
  if (isArabicText(unitNumber)) {
    return await translateToEnglish(unitNumber)
  }
  
  return unitNumber
}

/**
 * Helper to get localized property data with automatic translation
 * Returns an object with all localized property fields
 */
export async function getLocalizedProperty<T extends {
  name: string
  nameEn?: string | null
  neighborhood: string
  neighborhoodEn?: string | null
}>(property: T, language: Language) {
  const [displayName, displayNeighborhood] = await Promise.all([
    getLocalizedPropertyName(property.name, property.nameEn, language),
    getLocalizedNeighborhood(property.neighborhood, property.neighborhoodEn, language),
  ])
  
  return {
    ...property,
    displayName,
    displayNeighborhood,
  }
}

/**
 * Helper to get localized unit data with automatic translation
 * Returns an object with all localized unit fields
 */
export async function getLocalizedUnit<T extends {
  unitNumber: string
  unitNumberEn?: string | null
}>(unit: T, language: Language) {
  const displayUnitNumber = await getLocalizedUnitNumber(unit.unitNumber, unit.unitNumberEn, language)
  
  return {
    ...unit,
    displayUnitNumber,
  }
}

/**
 * Translate maintenance request issue description
 */
export async function getLocalizedIssueDescription(
  description: string,
  language: Language
): Promise<string> {
  if (language === 'ar' || !description) {
    return description
  }
  
  if (isArabicText(description)) {
    return await translateToEnglish(description)
  }
  
  return description
}

/**
 * Translate maintenance request notes
 */
export async function getLocalizedNotes(
  notes: string | null | undefined,
  language: Language
): Promise<string> {
  if (!notes || language === 'ar') {
    return notes || ''
  }
  
  if (isArabicText(notes)) {
    return await translateToEnglish(notes)
  }
  
  return notes
}

/**
 * Translate requester name
 */
export async function getLocalizedRequesterName(
  name: string,
  language: Language
): Promise<string> {
  if (language === 'ar' || !name) {
    return name
  }
  
  // Only translate if it contains Arabic
  if (isArabicText(name)) {
    return await translateToEnglish(name)
  }
  
  return name
}

/**
 * Translate tenant name
 */
export async function getLocalizedTenantName(
  name: string | null | undefined,
  language: Language
): Promise<string> {
  if (!name || language === 'ar') {
    return name || ''
  }
  
  if (isArabicText(name)) {
    return await translateToEnglish(name)
  }
  
  return name
}

/**
 * Translate any generic text field
 * Useful for dynamic content that doesn't have a dedicated translation field
 */
export async function getLocalizedText(
  text: string | null | undefined,
  language: Language
): Promise<string> {
  if (!text || language === 'ar') {
    return text || ''
  }
  
  if (isArabicText(text)) {
    return await translateToEnglish(text)
  }
  
  return text
}

/**
 * @deprecated Use getLocalizedPropertyName instead
 */
export function translatePropertyName(name: string, language: Language): string {
  return name
}

/**
 * @deprecated Use getLocalizedUnitNumber instead
 */
export function translateUnitNumber(unitNumber: string, language: Language): string {
  return unitNumber
}
