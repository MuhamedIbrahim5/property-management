// Utility to update isDelayed flag for maintenance requests older than 30 days
import { prisma } from '@/lib/prisma'

export async function updateDelayedRequests() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Find non-completed requests older than 30 days
    const result = await prisma.maintenanceRequest.updateMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
        isDelayed: false,
        status: {
          isCompleted: false,
        },
      },
      data: {
        isDelayed: true,
      },
    })

    console.log(`Updated ${result.count} requests to delayed status`)
    return { success: true, count: result.count }
  } catch (error) {
    console.error('Error updating delayed requests:', error)
    return { success: false, error }
  }
}

// Function to check if a specific request should be marked as delayed
export async function checkAndMarkDelayed(requestId: string) {
  try {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: { status: true },
    })

    if (!request || request.status.isCompleted) {
      return { updated: false, reason: 'completed or not found' }
    }

    const daysSinceCreated = Math.floor(
      (Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceCreated > 30 && !request.isDelayed) {
      await prisma.maintenanceRequest.update({
        where: { id: requestId },
        data: { isDelayed: true },
      })
      return { updated: true, days: daysSinceCreated }
    }

    return { updated: false, days: daysSinceCreated }
  } catch (error) {
    console.error('Error checking delayed status:', error)
    return { updated: false, error }
  }
}
