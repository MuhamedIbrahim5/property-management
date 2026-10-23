/**
 * Security Tests Runner - No external dependencies
 * Tests file validation, rate limiting, and input validation
 */

import { validateUploadedFile, validateUploadedFiles, estimateFormDataSize } from '../file-validation'
import { checkRateLimit, getRateLimitResetMinutes } from '../rate-limit'
import { getClientIP, getRateLimitIdentifier } from '../request-helpers'

// Simple test framework
type TestResult = {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn()
      results.push({ name, passed: true })
      console.log(`✅ PASS: ${name}`)
    } catch (error) {
      results.push({ name, passed: false, error: (error as Error).message })
      console.log(`❌ FAIL: ${name}`)
      console.log(`   Error: ${(error as Error).message}`)
    }
  }
}

function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`)
  }
}

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed: expected true')
  }
}

function assertFalse(condition: boolean, message?: string) {
  if (condition) {
    throw new Error(message || 'Assertion failed: expected false')
  }
}

function assertContains(text: string, substring: string, message?: string) {
  if (!text.includes(substring)) {
    throw new Error(message || `Expected "${text}" to contain "${substring}"`)
  }
}

// ============================================
// FILE VALIDATION TESTS
// ============================================

const fileValidationTests = [
  test('should reject non-File objects', async () => {
    const fakeFile = { name: 'test.jpg', size: 1000 } as any
    const result = await validateUploadedFile(fakeFile)
    assertFalse(result.valid, 'Should reject non-File object')
    assertContains(result.error || '', 'Invalid file object')
  }),

  test('should reject disallowed MIME types', async () => {
    const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' })
    const result = await validateUploadedFile(file)
    assertFalse(result.valid, 'Should reject .exe file')
    assertContains(result.error || '', 'Invalid file type')
  }),

  test('should reject files over 5MB', async () => {
    const largeData = new Uint8Array(6 * 1024 * 1024) // 6 MB
    const file = new File([largeData], 'large.jpg', { type: 'image/jpeg' })
    const result = await validateUploadedFile(file)
    assertFalse(result.valid, 'Should reject files over 5MB')
    assertContains(result.error || '', 'File too large')
  }),

  test('should reject empty files', async () => {
    const file = new File([], 'empty.jpg', { type: 'image/jpeg' })
    const result = await validateUploadedFile(file)
    assertFalse(result.valid, 'Should reject empty files')
    assertContains(result.error || '', 'File is empty')
  }),

  test('should reject file with mismatched magic bytes (spoofed)', async () => {
    // Fake JPEG with wrong magic bytes
    const fakeJpeg = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
    const file = new File([fakeJpeg], 'fake.jpg', { type: 'image/jpeg' })
    const result = await validateUploadedFile(file)
    assertFalse(result.valid, 'Should reject spoofed file')
    assertContains(result.error || '', 'File signature does not match')
  }),

  test('should accept valid JPEG with correct magic bytes', async () => {
    // JPEG magic bytes: FF D8 FF
    const validJpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01])
    const file = new File([validJpeg], 'valid.jpg', { type: 'image/jpeg' })
    const result = await validateUploadedFile(file)
    assertTrue(result.valid, 'Should accept valid JPEG')
    assertEqual(result.sizeInBytes, validJpeg.length)
  }),

  test('should accept valid PNG with correct magic bytes', async () => {
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const validPng = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D])
    const file = new File([validPng], 'valid.png', { type: 'image/png' })
    const result = await validateUploadedFile(file)
    assertTrue(result.valid, 'Should accept valid PNG')
  }),

  test('should accept valid WebP with correct magic bytes', async () => {
    // WebP magic bytes: RIFF .... WEBP
    const validWebp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // Size placeholder
      0x57, 0x45, 0x42, 0x50  // WEBP
    ])
    const file = new File([validWebp], 'valid.webp', { type: 'image/webp' })
    const result = await validateUploadedFile(file)
    assertTrue(result.valid, 'Should accept valid WebP')
  }),

  test('should reject more than 10 files', async () => {
    const files: File[] = []
    for (let i = 0; i < 11; i++) {
      const validJpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      files.push(new File([validJpeg], `file${i}.jpg`, { type: 'image/jpeg' }))
    }
    const result = await validateUploadedFiles(files)
    assertFalse(result.valid, 'Should reject more than 10 files')
    assertContains(result.error || '', 'Too many files')
  }),

  test('should reject if total size exceeds 30MB', async () => {
    const files: File[] = []
    // Create 10 files of 4MB each = 40MB total
    for (let i = 0; i < 10; i++) {
      const largeData = new Uint8Array(4 * 1024 * 1024) // 4 MB
      largeData[0] = 0xFF
      largeData[1] = 0xD8
      largeData[2] = 0xFF
      files.push(new File([largeData], `file${i}.jpg`, { type: 'image/jpeg' }))
    }
    const result = await validateUploadedFiles(files)
    assertFalse(result.valid, 'Should reject total size over 30MB')
    assertContains(result.error || '', 'Total files too large')
  }),

  test('should accept valid batch of files within limits', async () => {
    const files: File[] = []
    // Create 5 files of 1KB each
    for (let i = 0; i < 5; i++) {
      const validJpeg = new Uint8Array(1024) // 1 KB
      validJpeg[0] = 0xFF
      validJpeg[1] = 0xD8
      validJpeg[2] = 0xFF
      files.push(new File([validJpeg], `file${i}.jpg`, { type: 'image/jpeg' }))
    }
    const result = await validateUploadedFiles(files)
    assertTrue(result.valid, 'Should accept valid batch')
  }),

  test('estimateFormDataSize should calculate correctly', () => {
    const formData = new FormData()
    const file1 = new File([new Uint8Array(1000)], 'file1.jpg')
    const file2 = new File([new Uint8Array(2000)], 'file2.jpg')
    
    formData.append('image_1', file1)
    formData.append('image_2', file2)
    formData.append('notes', 'Hello World') // 11 chars * 2 = 22 bytes
    
    const size = estimateFormDataSize(formData)
    assertEqual(size, 3022) // 1000 + 2000 + 22
  }),
]

// ============================================
// RATE LIMITING TESTS
// ============================================

const rateLimitTests = [
  test('should allow first request', () => {
    const id = `test-first-${Date.now()}`
    const result = checkRateLimit(id, 3, 10000)
    assertTrue(result.allowed, 'First request should be allowed')
    assertEqual(result.remaining, 2, 'Should have 2 remaining')
  }),

  test('should track multiple requests from same identifier', () => {
    const id = `test-track-${Date.now()}`
    
    const result1 = checkRateLimit(id, 3, 10000)
    assertTrue(result1.allowed)
    assertEqual(result1.remaining, 2)

    const result2 = checkRateLimit(id, 3, 10000)
    assertTrue(result2.allowed)
    assertEqual(result2.remaining, 1)

    const result3 = checkRateLimit(id, 3, 10000)
    assertTrue(result3.allowed)
    assertEqual(result3.remaining, 0)
  }),

  test('should block after exceeding limit', () => {
    const id = `test-block-${Date.now()}`
    
    checkRateLimit(id, 3, 10000)
    checkRateLimit(id, 3, 10000)
    checkRateLimit(id, 3, 10000)

    const result = checkRateLimit(id, 3, 10000)
    assertFalse(result.allowed, 'Should block after limit')
    assertEqual(result.remaining, 0)
  }),

  test('should reset after window expires', async () => {
    const id = `test-reset-${Date.now()}`
    
    const result1 = checkRateLimit(id, 2, 100) // 100ms window
    assertTrue(result1.allowed)

    const result2 = checkRateLimit(id, 2, 100)
    assertTrue(result2.allowed)

    // Should be blocked now
    const result3 = checkRateLimit(id, 2, 100)
    assertFalse(result3.allowed)

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150))

    // Should be allowed again
    const result4 = checkRateLimit(id, 2, 100)
    assertTrue(result4.allowed, 'Should allow after window expires')
  }),

  test('should handle different identifiers independently', () => {
    const id1 = `test-a-${Date.now()}`
    const id2 = `test-b-${Date.now()}`
    
    checkRateLimit(id1, 2, 10000)
    checkRateLimit(id1, 2, 10000)
    
    const result1 = checkRateLimit(id1, 2, 10000)
    assertFalse(result1.allowed, 'id1 should be blocked')

    const result2 = checkRateLimit(id2, 2, 10000)
    assertTrue(result2.allowed, 'id2 should still work')
  }),

  test('getRateLimitResetMinutes should calculate correctly', () => {
    const now = Date.now()
    const resetAt = now + (10 * 60 * 1000) // 10 minutes from now
    
    const minutes = getRateLimitResetMinutes(resetAt)
    assertEqual(minutes, 10)
  }),
]

// ============================================
// REQUEST HELPERS TESTS
// ============================================

const requestHelpersTests = [
  test('getClientIP should extract from x-forwarded-for', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '203.0.113.1, 198.51.100.2'
      }
    })
    
    const ip = getClientIP(request)
    assertEqual(ip, '203.0.113.1', 'Should extract first IP')
  }),

  test('getClientIP should use x-real-ip as fallback', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-real-ip': '198.51.100.2'
      }
    })
    
    const ip = getClientIP(request)
    assertEqual(ip, '198.51.100.2')
  }),

  test('getClientIP should return unknown if no headers', () => {
    const request = new Request('https://example.com')
    const ip = getClientIP(request)
    assertEqual(ip, 'unknown')
  }),

  test('getRateLimitIdentifier should return prefixed identifier', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '203.0.113.1'
      }
    })
    
    const identifier = getRateLimitIdentifier(request, 'field-visit')
    assertEqual(identifier, 'field-visit:203.0.113.1')
  }),

  test('getRateLimitIdentifier should work without prefix', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-real-ip': '198.51.100.2'
      }
    })
    
    const identifier = getRateLimitIdentifier(request)
    assertEqual(identifier, '198.51.100.2')
  }),
]

// ============================================
// RUN ALL TESTS
// ============================================

async function runAllTests() {
  console.log('\n' + '='.repeat(60))
  console.log('RUNNING SECURITY TESTS')
  console.log('='.repeat(60) + '\n')

  console.log('📁 FILE VALIDATION TESTS')
  console.log('-'.repeat(60))
  for (const testFn of fileValidationTests) {
    await testFn()
  }

  console.log('\n⏱️  RATE LIMITING TESTS')
  console.log('-'.repeat(60))
  for (const testFn of rateLimitTests) {
    await testFn()
  }

  console.log('\n🌐 REQUEST HELPERS TESTS')
  console.log('-'.repeat(60))
  for (const testFn of requestHelpersTests) {
    await testFn()
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`\nTotal:  ${total}`)
  console.log(`Passed: ${passed} ✅`)
  console.log(`Failed: ${failed} ❌`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`)

  if (failed > 0) {
    console.log('FAILED TESTS:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}`)
      console.log(`     ${r.error}`)
    })
    console.log('')
  }

  // Exit code
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})
