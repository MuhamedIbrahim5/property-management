import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-helpers'
import {
  validateBeforeCompletion,
  getCompletionChecklist,
} from '@/lib/maintenance-validations'

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const auth = await requireAdminAuth()
  if (!auth.authorized) {
    return auth.response
  }

  const { params } = context
  
  try {
    const [validation, checklist] = await Promise.all([
      validateBeforeCompletion(params.id),
      getCompletionChecklist(params.id),
    ])

    return NextResponse.json({
      validation,
      checklist,
      canComplete: validation.errors.length === 0,
    })
  } catch (error) {
    console.error('Error validating completion:', error)
    return NextResponse.json(
      { error: 'Failed to validate completion' },
      { status: 500 }
    )
  }
}
