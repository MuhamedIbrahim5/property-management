import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { decryptToken } from '@/lib/auth-helpers'
import WorkOrderClient from './WorkOrderClient'

// Force dynamic rendering - this page requires database access at request time
export const dynamic = 'force-dynamic'

export default async function WorkOrderPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: params.id },
    include: {
      property: true,
      unit: true,
      type: true,
      status: true,
      assignee: {
        select: {
          id: true,
          name: true,
        },
      },
      attachments: {
        select: {
          id: true,
          fileName: true,
          filePath: true,
          fileType: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!request) {
    notFound()
  }

  // Decrypt completion token on server-side for QR code generation
  let decryptedToken: string | null = null
  if (request.completionTokenPlain) {
    decryptedToken = decryptToken(request.completionTokenPlain)
  }

  // Get company settings
  const companyPhone = await prisma.setting.findUnique({
    where: { key: 'company_phone' },
  })

  const companyName = await prisma.setting.findUnique({
    where: { key: 'company_name' },
  })

  return (
    <WorkOrderClient
      request={request}
      completionToken={decryptedToken}
      companyPhone={companyPhone?.value || ''}
      companyName={companyName?.value || ''}
    />
  )
}
