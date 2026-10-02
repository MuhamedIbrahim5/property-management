import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  await prisma.activityHistory.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.maintenanceRequest.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.property.deleteMany()
  await prisma.maintenanceType.deleteMany()
  await prisma.maintenanceStatus.deleteMany()
  await prisma.user.deleteMany()
  await prisma.setting.deleteMany()

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'مدير النظام',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      phone: '0501234567',
    },
  })

  const manager = await prisma.user.create({
    data: {
      name: 'محمود فريد',
      email: 'manager@example.com',
      password: hashedPassword,
      role: 'manager',
      phone: '0507654321',
    },
  })

  const technician = await prisma.user.create({
    data: {
      name: 'ياسر الحامضي',
      email: 'tech@example.com',
      password: hashedPassword,
      role: 'technician',
      phone: '0509876543',
    },
  })

  console.log('✅ Users created')

  // Create Maintenance Statuses
  const statusWaiting = await prisma.maintenanceStatus.create({
    data: {
      name: 'قيد المتابعة',
      color: '#2C5D7A',
      icon: '⏳',
      order: 1,
      isDefault: true,
      isCompleted: false,
    },
  })

  const statusInProgress = await prisma.maintenanceStatus.create({
    data: {
      name: 'قيد التنفيذ',
      color: '#C99A2E',
      icon: '🔧',
      order: 2,
      isCompleted: false,
    },
  })

  const statusCompleted = await prisma.maintenanceStatus.create({
    data: {
      name: 'مكتمل',
      color: '#3E7859',
      icon: '✅',
      order: 3,
      isCompleted: true,
    },
  })

  const statusPostponed = await prisma.maintenanceStatus.create({
    data: {
      name: 'مؤجل',
      color: '#B24435',
      icon: '⏸️',
      order: 4,
      isCompleted: false,
    },
  })

  const statusTransferred = await prisma.maintenanceStatus.create({
    data: {
      name: 'قيد مرحل',
      color: '#6B7A80',
      icon: '↪️',
      order: 5,
      isCompleted: false,
    },
  })

  console.log('✅ Statuses created')

  // Create Maintenance Types
  const types = [
    { name: 'بلاغ صيانه اخر', color: '#3E7859' },
    { name: 'جوال الصيانه', color: '#2C5D7A' },
    { name: 'حارس العقار', color: '#C97A3B' },
    { name: 'الشكاوي', color: '#B24435' },
    { name: 'شفط صرف', color: '#C99A2E' },
    { name: 'المكتب', color: '#17415A' },
    { name: 'اخلاء', color: '#6B7A80' },
    { name: 'خدمة العملاء', color: '#2C5D7A' },
    { name: 'تحسينات', color: '#3E7859' },
  ]

  for (const type of types) {
    await prisma.maintenanceType.create({ data: type })
  }

  console.log('✅ Maintenance types created')

  // Create Properties
  const property1 = await prisma.property.create({
    data: {
      name: 'عمارة السويف 26',
      neighborhood: 'حي لبن الأحمدية / الشفا / الجرادية',
      address: 'شارع السويف',
      type: 'residential',
    },
  })

  const property2 = await prisma.property.create({
    data: {
      name: 'برج اجا 56',
      neighborhood: 'حي المربع',
      address: 'شارع اجا',
      type: 'mixed',
    },
  })

  const property3 = await prisma.property.create({
    data: {
      name: 'المحمدية 28',
      neighborhood: 'حي العليا/الوزارات',
      type: 'commercial',
    },
  })

  console.log('✅ Properties created')

  // Create Units
  await prisma.unit.createMany({
    data: [
      {
        propertyId: property1.id,
        unitNumber: 'وحدة 12',
        type: 'residential',
        status: 'occupied',
        tenantName: 'أحمد محمد',
        tenantPhone: '0501111111',
      },
      {
        propertyId: property1.id,
        unitNumber: 'وحدة 15',
        type: 'residential',
        status: 'occupied',
      },
      {
        propertyId: property1.id,
        unitNumber: 'خدمات',
        type: 'services',
        status: 'occupied',
      },
      {
        propertyId: property2.id,
        unitNumber: 'وحدة 803',
        type: 'residential',
        status: 'vacant',
      },
      {
        propertyId: property2.id,
        unitNumber: 'مكتب 103',
        type: 'office',
        status: 'occupied',
      },
      {
        propertyId: property3.id,
        unitNumber: 'مكتب 33',
        type: 'office',
        status: 'occupied',
      },
    ],
  })

  console.log('✅ Units created')

  // Create Settings
  await prisma.setting.createMany({
    data: [
      { key: 'company_name', value: 'شركة إدارة الأملاك' },
      { key: 'whatsapp_number', value: '966501234567' },
      { key: 'whatsapp_enabled', value: 'true' },
    ],
  })

  console.log('✅ Settings created')

  // Create sample maintenance requests
  const units = await prisma.unit.findMany({ take: 3 })
  const type1 = await prisma.maintenanceType.findFirst()

  if (units.length > 0 && type1) {
    await prisma.maintenanceRequest.create({
      data: {
        requestNumber: 'REQ-2026-001',
        trackingCode: 'ABC123',
        propertyId: property1.id,
        unitId: units[0].id,
        issueDescription: 'تسريب مياه في الحمام',
        typeId: type1.id,
        statusId: statusInProgress.id,
        priority: 'urgent',
        requesterName: 'أحمد محمد',
        requesterPhone: '0501111111',
        assigneeId: technician.id,
      },
    })

    await prisma.maintenanceRequest.create({
      data: {
        requestNumber: 'REQ-2026-002',
        trackingCode: 'XYZ789',
        propertyId: property2.id,
        unitId: units[1].id,
        issueDescription: 'عطل في المكيف',
        typeId: type1.id,
        statusId: statusWaiting.id,
        priority: 'normal',
        requesterName: 'فاطمة أحمد',
        requesterPhone: '0502222222',
      },
    })

    console.log('✅ Sample requests created')
  }

  console.log('🎉 Seed completed!')
  console.log('\n📝 Login credentials:')
  console.log('Admin: admin@example.com / password123')
  console.log('Manager: manager@example.com / password123')
  console.log('Technician: tech@example.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
