import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth-helpers'

export async function GET() {
  // Require admin authentication for reading settings
  const auth = await requireAdminAuth()
  
  console.log('Settings API GET - Auth result:', { 
    authorized: auth.authorized,
    user: auth.authorized ? auth.user : 'none'
  })
  
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const settings = await prisma.setting.findMany()
    console.log(`Settings API GET - Returning ${settings.length} settings`)
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  // Require admin authentication for updating settings
  const auth = await requireAdminAuth()
  
  console.log('Settings API PUT - Auth result:', { 
    authorized: auth.authorized,
    user: auth.authorized ? auth.user : 'none'
  })
  
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const body = await request.json()
    const { key, value } = body
    
    console.log('Settings API PUT - Updating:', { key, value })

    if (!key || value === undefined) {
      console.error('Settings API PUT - Missing key or value')
      return NextResponse.json(
        { error: 'Missing key or value' },
        { status: 400 }
      )
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
    
    console.log('Settings API PUT - Success:', setting)

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}
