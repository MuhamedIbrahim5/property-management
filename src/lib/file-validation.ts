/**
 * File upload validation for FormData files (Field Visit system)
 * Validates MIME types, file signatures (magic bytes), size, and count
 */

export interface FileValidationResult {
  valid: boolean
  error?: string
  sizeInBytes?: number
}

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const

// Maximum file size: 5 MB per file
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Maximum number of files per visit
const MAX_FILES_PER_VISIT = 10

/**
 * Validate a single uploaded file
 */
export async function validateUploadedFile(file: File): Promise<FileValidationResult> {
  try {
    // 1. Check file object
    if (!(file instanceof File)) {
      return { valid: false, error: 'Invalid file object' }
    }

    // 2. Check MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.`
      }
    }

    // 3. Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2)
      return {
        valid: false,
        error: `File too large: ${sizeMB}MB. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }
    }

    // 4. Check file is not empty
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' }
    }

    // 5. Verify magic bytes (file signature) - Read only first 12 bytes for efficiency
    const slice = file.slice(0, 12)
    const buffer = await slice.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    if (!checkImageMagicBytes(bytes, file.type)) {
      return {
        valid: false,
        error: 'File signature does not match declared type. Possible file spoofing detected.'
      }
    }

    return { valid: true, sizeInBytes: file.size }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate file: ' + (error as Error).message
    }
  }
}

/**
 * Validate multiple files from FormData
 */
export async function validateUploadedFiles(files: File[]): Promise<{
  valid: boolean
  error?: string
  totalSize?: number
}> {
  // Check file count
  if (files.length > MAX_FILES_PER_VISIT) {
    return {
      valid: false,
      error: `Too many files: ${files.length}. Maximum allowed: ${MAX_FILES_PER_VISIT}`
    }
  }

  let totalSize = 0

  // Validate each file
  for (let i = 0; i < files.length; i++) {
    const result = await validateUploadedFile(files[i])
    if (!result.valid) {
      return {
        valid: false,
        error: `File ${i + 1} validation failed: ${result.error}`
      }
    }
    totalSize += result.sizeInBytes || 0
  }

  // Check total size (30 MB total for all files)
  const MAX_TOTAL_SIZE = 30 * 1024 * 1024
  if (totalSize > MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: `Total files too large: ${(totalSize / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${MAX_TOTAL_SIZE / 1024 / 1024}MB`
    }
  }

  return { valid: true, totalSize }
}

/**
 * Check if file content matches the declared image format using magic bytes
 */
function checkImageMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  if (bytes.length < 12) {
    return false
  }

  const type = mimeType.toLowerCase()

  if (type === 'image/jpeg' || type === 'image/jpg') {
    // JPEG: FF D8 FF
    return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF
  }

  if (type === 'image/png') {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    return bytes[0] === 0x89 && bytes[1] === 0x50 &&
           bytes[2] === 0x4E && bytes[3] === 0x47 &&
           bytes[4] === 0x0D && bytes[5] === 0x0A &&
           bytes[6] === 0x1A && bytes[7] === 0x0A
  }

  if (type === 'image/webp') {
    // WebP: RIFF .... WEBP
    const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
    const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
    return riff === 'RIFF' && webp === 'WEBP'
  }

  return false
}

/**
 * Check FormData size to prevent memory exhaustion
 * This is an approximate check before processing
 */
export function estimateFormDataSize(formData: FormData): number {
  let estimatedSize = 0

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      estimatedSize += value.size
    } else if (typeof value === 'string') {
      // Approximate string size in bytes (UTF-8)
      estimatedSize += value.length * 2
    }
  }

  return estimatedSize
}

/**
 * Get validation constants for client-side use
 */
export const FILE_VALIDATION_CONSTANTS = {
  ALLOWED_TYPES: ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_PER_VISIT,
  MAX_FILE_SIZE_MB: MAX_FILE_SIZE / 1024 / 1024,
  MAX_TOTAL_SIZE_MB: 30,
} as const
