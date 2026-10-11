import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import WorkOrderClient from './WorkOrderClient'

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
      companyPhone={companyPhone?.value || ''}
      companyName={companyName?.value || ''}
    />
  )
}
