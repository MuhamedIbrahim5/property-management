// Validation functions for maintenance requests
import { prisma } from '@/lib/prisma'

export interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
  suggestions: string[]
}

/**
 * Validate maintenance request before marking as complete
 */
export async function validateBeforeCompletion(
  requestId: string
): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    warnings: [],
    errors: [],
    suggestions: [],
  }

  try {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        attachments: {
          select: {
            id: true,
            category: true,
            createdAt: true,
          },
        },
        status: true,
        type: true,
        fieldVisits: {
          select: {
            id: true,
            visitDate: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    })

    if (!request) {
      result.valid = false
      result.errors.push('Maintenance request not found')
      return result
    }

    // Check for before/after images
    const beforeImages = request.attachments.filter((a) => a.category === 'before')
    const afterImages = request.attachments.filter((a) => a.category === 'after')

    if (beforeImages.length === 0) {
      result.warnings.push('No "before" images attached')
      result.suggestions.push('Consider adding before images for documentation')
    }

    if (afterImages.length === 0) {
      result.warnings.push('No "after" images attached')
      result.suggestions.push('Adding after images helps verify work completion')
    }

    // Check for field visits
    if (request.fieldVisits.length === 0) {
      result.warnings.push('No field visits recorded')
      result.suggestions.push('Consider recording field visit for tracking')
    } else {
      // Check if any visit has GPS location
      const visitsWithGPS = request.fieldVisits.filter(
        (v) => v.latitude && v.longitude
      )
      if (visitsWithGPS.length === 0) {
        result.warnings.push('No GPS location recorded for field visits')
        result.suggestions.push('GPS tracking helps verify on-site work')
      }
    }

    // Check if delayed
    if (request.isDelayed) {
      result.warnings.push(
        'This request is marked as delayed (>30 days old)'
      )
    }

    // Check if already completed
    if (request.status.isCompleted) {
      result.errors.push('Request is already marked as completed')
      result.valid = false
    }

    // For urgent requests, ensure quick response
    if (request.priority === 'urgent') {
      const daysSinceCreated = Math.floor(
        (Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceCreated > 1 && !request.startedAt) {
        result.warnings.push(
          `Urgent request created ${daysSinceCreated} days ago but not started yet`
        )
      }
    }

    return result
  } catch (error) {
    console.error('Error validating maintenance request:', error)
    result.valid = false
    result.errors.push('Validation error occurred')
    return result
  }
}

/**
 * Check if request needs photos based on type
 */
export async function requiresPhotos(typeId: string): Promise<boolean> {
  try {
    // Types that typically require photo documentation
    const photoRequiredTypes = [
      'plumbing',
      'electrical',
      'structural',
      'renovation',
      'damage',
    ]

    const type = await prisma.maintenanceType.findUnique({
      where: { id: typeId },
      select: { name: true },
    })

    if (!type) return false

    return photoRequiredTypes.some((keyword) =>
      type.name.toLowerCase().includes(keyword)
    )
  } catch (error) {
    console.error('Error checking photo requirement:', error)
    return false
  }
}

/**
 * Get completion checklist for a maintenance request
 */
export async function getCompletionChecklist(
  requestId: string
): Promise<{
  item: string
  completed: boolean
  required: boolean
}[]> {
  const checklist: {
    item: string
    completed: boolean
    required: boolean
  }[] = []

  try {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        attachments: true,
        fieldVisits: true,
        assignee: true,
        status: true,
      },
    })

    if (!request) return checklist

    // Check technician assigned
    checklist.push({
      item: 'Technician assigned',
      completed: !!request.assigneeId,
      required: true,
    })

    // Check work started
    checklist.push({
      item: 'Work started',
      completed: !!request.startedAt,
      required: true,
    })

    // Check before images
    const beforeImages = request.attachments.filter((a) => a.category === 'before')
    checklist.push({
      item: 'Before images uploaded',
      completed: beforeImages.length > 0,
      required: false,
    })

    // Check field visit
    checklist.push({
      item: 'Field visit recorded',
      completed: request.fieldVisits.length > 0,
      required: false,
    })

    // Check after images
    const afterImages = request.attachments.filter((a) => a.category === 'after')
    checklist.push({
      item: 'After images uploaded',
      completed: afterImages.length > 0,
      required: false,
    })

    // Check completion details
    checklist.push({
      item: 'Technician details provided',
      completed: !!(request.technicianName && request.technicianPhone),
      required: true,
    })

    return checklist
  } catch (error) {
    console.error('Error getting completion checklist:', error)
    return checklist
  }
}
