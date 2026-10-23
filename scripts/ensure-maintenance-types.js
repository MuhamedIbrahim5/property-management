/**
 * Script to ensure required maintenance types exist in the database
 * Required types: أعمال سباكة, أعمال كهرباء, انقطاع مياه, انقطاع كهرباء, أخرى
 * Auto-urgent: انقطاع مياه, انقطاع كهرباء
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const REQUIRED_TYPES = [
  {
    name: 'أعمال سباكة',
    nameEn: 'Plumbing Work',
    color: '#3E7859',
    autoUrgent: false,
  },
  {
    name: 'أعمال كهرباء',
    nameEn: 'Electrical Work',
    color: '#F59E0B',
    autoUrgent: false,
  },
  {
    name: 'انقطاع مياه',
    nameEn: 'Water Outage',
    color: '#EF4444',
    autoUrgent: true,
  },
  {
    name: 'انقطاع كهرباء',
    nameEn: 'Power Outage',
    color: '#DC2626',
    autoUrgent: true,
  },
  {
    name: 'أخرى',
    nameEn: 'Other',
    color: '#6B7280',
    autoUrgent: false,
  },
]

async function ensureMaintenanceTypes() {
  console.log('🔍 Checking maintenance types...\n')

  try {
    const existing = await prisma.maintenanceType.findMany({
      select: { name: true, autoUrgent: true },
    })

    console.log(`Found ${existing.length} existing type(s)`)

    for (const type of REQUIRED_TYPES) {
      const exists = existing.find((e) => e.name === type.name)

      if (!exists) {
        console.log(`➕ Creating: ${type.name} (autoUrgent: ${type.autoUrgent})`)
        await prisma.maintenanceType.create({
          data: {
            name: type.name,
            color: type.color,
            autoUrgent: type.autoUrgent,
            isActive: true,
          },
        })
      } else {
        // Update autoUrgent if needed
        if (exists.autoUrgent !== type.autoUrgent) {
          console.log(`🔄 Updating ${type.name}: autoUrgent ${exists.autoUrgent} → ${type.autoUrgent}`)
          await prisma.maintenanceType.updateMany({
            where: { name: type.name },
            data: { autoUrgent: type.autoUrgent },
          })
        } else {
          console.log(`✓ ${type.name} (autoUrgent: ${type.autoUrgent})`)
        }
      }
    }

    console.log('\n✅ All required maintenance types are configured')

    const final = await prisma.maintenanceType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    console.log(`\n📋 Active types (${final.length}):`)
    final.forEach((t) => {
      const urgent = t.autoUrgent ? '🚨' : '  '
      console.log(`${urgent} ${t.name}`)
    })
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

ensureMaintenanceTypes()
