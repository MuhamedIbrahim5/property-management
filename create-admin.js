/**
 * Create Admin User Script
 * Creates a default admin user for initial system setup
 * 
 * Usage: node create-admin.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  console.log('🔐 Creating admin user...\n')

  const adminEmail = 'admin@example.com'
  const adminPassword = 'Admin@123'
  const adminName = 'System Administrator'

  try {
    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existing) {
      console.log('ℹ️  Admin user already exists')
      console.log(`   Email: ${adminEmail}`)
      console.log('   No changes made.\n')
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'admin',
        isActive: true,
      },
    })

    console.log('✅ Admin user created successfully!\n')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Password:', adminPassword)
    console.log('👤 Name:', adminName)
    console.log('🎭 Role: admin')
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n')
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
