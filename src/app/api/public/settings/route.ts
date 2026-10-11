import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Public API endpoint for fetching public settings
 * This endpoint is accessible without authentication
 * Returns only public/safe settings (no sensitive data)
 */
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'company_name',
            'whatsapp_number',
            'whatsapp_enabled',
            'phone_number',
            'phone_number_2',
            'ext_numbers',
            'customer_service',
            'service_name'
          ]
        }
      },
      select: {
        key: true,
        value: true
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching public settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
