import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Save translations to database
 * This is called automatically when translations are generated
 * Requires authentication to prevent abuse
 */
export async function POST(request: Request) {
  // Require authentication
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { type, id, translations } = body

    // Validate required fields
    if (!type || !id || !translations) {
      return NextResponse.json(
        { error: 'Missing required fields: type, id, translations' },
        { status: 400 }
      )
    }

    // Validate type
    if (type !== 'property' && type !== 'unit') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "property" or "unit"' },
        { status: 400 }
      )
    }

    // Validate translations is an object
    if (typeof translations !== 'object' || Array.isArray(translations)) {
      return NextResponse.json(
        { error: 'Translations must be an object' },
        { status: 400 }
      )
    }

    // Update based on type
    if (type === 'property') {
      // Verify property exists
      const property = await prisma.property.findUnique({
        where: { id },
        select: { id: true }
      })

      if (!property) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        )
      }

      const updates: any = {}
      
      // Only accept valid translation fields
      if (typeof translations.nameEn === 'string') {
        updates.nameEn = translations.nameEn.substring(0, 500) // Limit length
      }
      
      if (typeof translations.neighborhoodEn === 'string') {
        updates.neighborhoodEn = translations.neighborhoodEn.substring(0, 200)
      }

      // Only update if there are translations to save
      if (Object.keys(updates).length > 0) {
        await prisma.property.update({
          where: { id },
          data: updates,
        })
      }
    } else if (type === 'unit') {
      // Verify unit exists
      const unit = await prisma.unit.findUnique({
        where: { id },
        select: { id: true }
      })

      if (!unit) {
        return NextResponse.json(
          { error: 'Unit not found' },
          { status: 404 }
        )
      }

      // Only accept valid translation field
      if (typeof translations.unitNumberEn === 'string') {
        await prisma.unit.update({
          where: { id },
          data: {
            unitNumberEn: translations.unitNumberEn.substring(0, 100),
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving translations:', error)
    // Return success even on error to not block the UI
    // Translation saving is a nice-to-have feature
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
