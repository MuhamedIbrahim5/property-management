/**
 * Validate image content with size, format and magic bytes checking
 */
export interface ImageValidationResult {
  valid: boolean
  error?: string
  sizeInBytes?: number
}

export function validateImageContent(base64: string): ImageValidationResult {
  try {
    // 1. Check base64 format
    const matches = base64.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/)
    if (!matches) {
      return { valid: false, error: 'Invalid image format. Only JPEG, PNG, and WebP are supported.' }
    }
    
    const [, mimeType, base64Data] = matches
    
    // 2. Calculate actual file size
    const padding = (base64Data.match(/=/g) || []).length
    const sizeInBytes = (base64Data.length * 3) / 4 - padding
    
    // 3. Check size limit (3 MB to be safe with Vercel limits)
    const MAX_SIZE = 3 * 1024 * 1024 // 3 MB
    if (sizeInBytes > MAX_SIZE) {
      const sizeMB = (sizeInBytes / 1024 / 1024).toFixed(2)
      return { 
        valid: false, 
        error: `Image too large: ${sizeMB}MB. Maximum allowed: 3MB` 
      }
    }
    
    // 4. Decode and check magic bytes (file signature)
    let decoded: Buffer
    try {
      decoded = Buffer.from(base64Data, 'base64')
    } catch (e) {
      return { valid: false, error: 'Invalid base64 encoding' }
    }
    
    if (!checkImageMagicBytes(decoded, mimeType)) {
      return { valid: false, error: 'Invalid image file. File signature does not match the declared format.' }
    }
    
    return { valid: true, sizeInBytes }
    
  } catch (error) {
    return { valid: false, error: 'Failed to validate image: ' + (error as Error).message }
  }
}

/**
 * Check if file content matches the declared image format using magic bytes
 */
function checkImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) {
    return false
  }
  
  switch (mimeType.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      // JPEG: FF D8 FF
      return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
      
    case 'png':
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      return buffer[0] === 0x89 && buffer[1] === 0x50 && 
             buffer[2] === 0x4E && buffer[3] === 0x47 &&
             buffer[4] === 0x0D && buffer[5] === 0x0A && 
             buffer[6] === 0x1A && buffer[7] === 0x0A
             
    case 'webp':
      // WebP: RIFF .... WEBP
      return buffer.toString('ascii', 0, 4) === 'RIFF' && 
             buffer.toString('ascii', 8, 12) === 'WEBP'
             
    default:
      return false
  }
}

/**
 * Check total request size to ensure it fits within Vercel limits
 * Vercel Hobby: 4.5 MB, Pro: 6 MB
 */
export function checkRequestSizeLimit(imageBase64?: string, otherDataSize = 1024): {
  withinLimit: boolean
  estimatedSize: number
  maxAllowed: number
} {
  // Conservative estimate for Vercel Hobby plan
  const MAX_REQUEST_SIZE = 4 * 1024 * 1024 // 4 MB (leaving 0.5 MB buffer)
  
  let totalSize = otherDataSize // JSON overhead, other fields
  
  if (imageBase64) {
    // Base64 image size
    totalSize += imageBase64.length
  }
  
  return {
    withinLimit: totalSize <= MAX_REQUEST_SIZE,
    estimatedSize: totalSize,
    maxAllowed: MAX_REQUEST_SIZE
  }
}
