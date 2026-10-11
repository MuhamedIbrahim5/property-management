/**
 * Translate database values to user's language
 * This doesn't modify the database, only translates known values for display
 */

import { Language } from './translations'

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
 * Check if text is Arabic
 */
export function isArabicText(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF]/
  return arabicPattern.test(text)
}

/**
 * Translate property/unit names if they match known patterns
 * Does NOT translate user-provided custom names
 */
export function translatePropertyName(name: string, language: Language): string {
  // Don't translate - these are custom names from users
  return name
}

/**
 * Translate unit number if it contains translatable parts
 * Example: "Unit 101" -> "وحدة 101" in Arabic
 */
export function translateUnitNumber(unitNumber: string, language: Language): string {
  // Don't translate unit numbers - they are identifiers
  return unitNumber
}
