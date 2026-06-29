import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  const adminPassword = await bcrypt.hash("admin123", 12)

  const admin = await prisma.admin.upsert({
    where: { email: "admin@gymflow.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@gymflow.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "9876543210",
    },
  })

  await prisma.admin.upsert({
    where: { email: "receptionist@gymflow.com" },
    update: {},
    create: {
      name: "Receptionist User",
      email: "receptionist@gymflow.com",
      password: adminPassword,
      role: "RECEPTIONIST",
      phone: "9876543211",
    },
  })

  const membersData = [
    { firstName: "Aarav", lastName: "Sharma", phone: "9876543001", plan: "MONTHLY" },
    { firstName: "Priya", lastName: "Verma", phone: "9876543002", plan: "QUARTERLY" },
    { firstName: "Rohit", lastName: "Singh", phone: "9876543003", plan: "YEARLY" },
    { firstName: "Sneha", lastName: "Patel", phone: "9876543004", plan: "HALF_YEARLY" },
    { firstName: "Vikram", lastName: "Reddy", phone: "9876543005", plan: "MONTHLY" },
    { firstName: "Ananya", lastName: "Gupta", phone: "9876543006", plan: "QUARTERLY" },
    { firstName: "Karan", lastName: "Joshi", phone: "9876543007", plan: "MONTHLY" },
    { firstName: "Neha", lastName: "Kapoor", phone: "9876543008", plan: "YEARLY" },
    { firstName: "Rahul", lastName: "Kumar", phone: "9876543009", plan: "MONTHLY" },
    { firstName: "Isha", lastName: "Agarwal", phone: "9876543010", plan: "HALF_YEARLY" },
    { firstName: "Arjun", lastName: "Mehta", phone: "9876543011", plan: "QUARTERLY" },
    { firstName: "Kavya", lastName: "Nair", phone: "9876543012", plan: "MONTHLY" },
    { firstName: "Dhruv", lastName: "Desai", phone: "9876543013", plan: "YEARLY" },
    { firstName: "Riya", lastName: "Chaturvedi", phone: "9876543014", plan: "MONTHLY" },
    { firstName: "Amit", lastName: "Yadav", phone: "9876543015", plan: "HALF_YEARLY" },
  ]

  const memberPassword = await bcrypt.hash("member123", 12)

  const planAmounts: Record<string, number> = {
    MONTHLY: 999,
    QUARTERLY: 2499,
    HALF_YEARLY: 4499,
    YEARLY: 7999,
  }

  let memberCounter = 1
  for (const m of membersData) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 3))
    startDate.setDate(1)

    const endDate = new Date(startDate)
    switch (m.plan) {
      case "MONTHLY": endDate.setMonth(endDate.getMonth() + 1); break
      case "QUARTERLY": endDate.setMonth(endDate.getMonth() + 3); break
      case "HALF_YEARLY": endDate.setMonth(endDate.getMonth() + 6); break
      case "YEARLY": endDate.setFullYear(endDate.getFullYear() + 1); break
    }

    const amount = planAmounts[m.plan]
    const status = endDate > new Date() ? "ACTIVE" : "EXPIRED"
    const memberId = `GF-${String(memberCounter++).padStart(6, "0")}`

    const member = await prisma.member.create({
      data: {
        memberId,
        firstName: m.firstName,
        lastName: m.lastName,
        email: `${m.firstName.toLowerCase()}.${m.lastName.toLowerCase()}@email.com`,
        phone: m.phone,
        password: memberPassword,
        gender: Math.random() > 0.5 ? "Male" : "Female",
        status: status as any,
        joinDate: startDate,
        isActive: status === "ACTIVE",
        weight: 65 + Math.floor(Math.random() * 30),
        height: 160 + Math.floor(Math.random() * 30),
        goal: "GENERAL_FITNESS",
        memberships: {
          create: {
            plan: m.plan as any,
            startDate,
            endDate,
            status: status as any,
            amount,
            totalAmount: amount,
            paymentStatus: "PAID",
          },
        },
      },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (status === "ACTIVE" && Math.random() > 0.5) {
      await prisma.attendance.create({
        data: {
          memberId: member.id,
          date: today,
          checkIn: new Date(today.getTime() + Math.random() * 4 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        },
      })
    }

    if (Math.random() > 0.3) {
      const daysAgo = Math.floor(Math.random() * 7)
      const pastDate = new Date(today)
      pastDate.setDate(pastDate.getDate() - daysAgo - 1)
      await prisma.attendance.create({
        data: {
          memberId: member.id,
          date: pastDate,
          checkIn: new Date(pastDate.getTime() + 8 * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000),
        },
      })
    }
  }

  await prisma.setting.create({
    data: {
      id: "gym",
      name: "GymFlow Fitness",
      address: "123 Fitness Street, Sports Complex, Mumbai - 400001",
      phone: "+91 98765 43210",
      email: "info@gymflow.com",
      currency: "INR",
      timezone: "Asia/Kolkata",
    },
  })

  const faqs = [
    { question: "What are your operating hours?", answer: "We are open from 6:00 AM to 10:00 PM, Monday through Saturday. Sundays we are open from 8:00 AM to 2:00 PM.", order: 1 },
    { question: "Can I freeze my membership?", answer: "Yes, you can freeze your membership for up to 30 days. Please contact the front desk or submit a support ticket to request a freeze.", order: 2 },
    { question: "How do I renew my membership?", answer: "You can renew your membership through the member portal by visiting the Membership section and clicking 'Renew Now'. Online payments are processed securely through Razorpay.", order: 3 },
    { question: "Is there a cancellation fee?", answer: "Cancellation fees depend on your membership plan. Please refer to your membership agreement or contact support for details specific to your plan.", order: 4 },
    { question: "Can I upgrade my membership plan?", answer: "Yes, you can upgrade your plan at any time. The remaining value of your current plan will be adjusted towards the new plan.", order: 5 },
    { question: "Do you offer personal training?", answer: "Yes, we have certified personal trainers available. Please contact the front desk or submit a support ticket to schedule a session.", order: 6 },
  ]

  for (const faq of faqs) {
    await prisma.fAQ.create({ data: faq })
  }

  await prisma.activityLog.create({
    data: {
      adminId: admin.id,
      action: "CREATED",
      entity: "SYSTEM",
      details: "Database seeded with initial data",
    },
  })

  console.log("Seed complete!")
  console.log("Admin login: admin@gymflow.com / admin123")
  console.log("Receptionist: receptionist@gymflow.com / admin123")
  console.log("Member login: Use any member phone number (9876543001-9876543015) / member123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
