/**
 * Clean HTML/XML tags from tenant names in database
 * Run with: node scripts/clean-tenant-names.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanTenantNames() {
  console.log('🔍 Finding units with HTML/XML in tenant names...\n')

  // Find all units with potential HTML/XML tags
  const units = await prisma.unit.findMany({
    where: {
      tenantName: {
        not: null,
      },
    },
    select: {
      id: true,
      unitNumber: true,
      tenantName: true,
      tenantPhone: true,
    },
  })

  const unitsToClean = units.filter(unit => 
    unit.tenantName && unit.tenantName.includes('<')
  )

  if (unitsToClean.length === 0) {
    console.log('✅ No units found with HTML/XML tags in tenant names')
    return
  }

  console.log(`Found ${unitsToClean.length} unit(s) with HTML/XML tags:\n`)

  for (const unit of unitsToClean) {
    console.log(`Unit: ${unit.unitNumber}`)
    console.log(`Original: ${unit.tenantName}`)
    
    // Extract first name from HTML (text between first set of tags)
    const match = unit.tenantName.match(/>([^<]+)</);
    const cleanedName = match ? match[1].trim() : unit.tenantName.replace(/<[^>]*>/g, '').trim()
    
    console.log(`Cleaned: ${cleanedName}`)
    console.log('---')

    // Update the database
    await prisma.unit.update({
      where: { id: unit.id },
      data: {
        tenantName: cleanedName,
      },
    })
  }

  console.log(`\n✅ Successfully cleaned ${unitsToClean.length} tenant name(s)`)
}

cleanTenantNames()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
