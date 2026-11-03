import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial administrator and sample data...');

  const email = process.env.INITIAL_ADMIN_EMAIL || 'admin@rockybusiness.com';
  const password = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!';
  const name = process.env.INITIAL_ADMIN_NAME || 'Rocky Freelancer';

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      businessName: 'Rocky Freelance Studio',
    },
    create: {
      email,
      name,
      passwordHash,
      businessName: 'Rocky Freelance Studio',
      defaultCurrency: 'USD',
      baseCurrency: 'USD',
      timezone: 'Asia/Dhaka',
    },
  });

  console.log(`User created or found: ${user.email} (${user.id})`);

  // Create default clients
  const client1 = await prisma.client.upsert({
    where: { id: `${user.id}-client-1` },
    update: {},
    create: {
      id: `${user.id}-client-1`,
      userId: user.id,
      name: 'Alex Johnson',
      companyName: 'Apex Tech Solutions',
      email: 'alex@apextech.io',
      country: 'United States',
      contactInfo: '+1 (555) 234-5678',
      profileLink: 'https://upwork.com',
      clientStatus: 'ACTIVE',
      notes: 'Long-term client. Prefers Next.js and Tailwind projects.',
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: `${user.id}-client-2` },
    update: {},
    create: {
      id: `${user.id}-client-2`,
      userId: user.id,
      name: 'Sarah Miller',
      companyName: 'Studio Bloom Media',
      email: 'sarah@bloommedia.co',
      country: 'United Kingdom',
      contactInfo: '+44 20 7946 0912',
      profileLink: 'https://fiverr.com',
      clientStatus: 'ACTIVE',
      notes: 'Repeat client on Fiverr for UI/UX & landing page conversions.',
    },
  });

  const client3 = await prisma.client.upsert({
    where: { id: `${user.id}-client-3` },
    update: {},
    create: {
      id: `${user.id}-client-3`,
      userId: user.id,
      name: 'David Chen',
      companyName: 'Nexus Global',
      email: 'david@nexusglobal.sg',
      country: 'Singapore',
      contactInfo: '+65 6789 0123',
      profileLink: 'https://linkedin.com',
      clientStatus: 'ACTIVE',
      notes: 'Enterprise contract via LinkedIn outreach.',
    },
  });

  // Seed Projects & Carry Forward demonstration
  const now = new Date();
  const currentYear = now.getFullYear();

  // Project 1: Started in Jan, carried forward to Feb
  const prj1 = await prisma.project.upsert({
    where: { userId_orderId: { userId: user.id, orderId: 'ORD-2026-101' } },
    update: {},
    create: {
      userId: user.id,
      clientId: client1.id,
      name: 'SaaS Customer Onboarding Portal',
      orderId: 'ORD-2026-101',
      projectDate: new Date(currentYear, 0, 10),
      category: 'Full Stack Development',
      profileName: 'Upwork',
      projectSource: 'Upwork',
      description: 'End-to-end customer onboarding flow with PostgreSQL and authentication.',
      value: 1200.0,
      currency: 'USD',
      advancePayment: 400.0,
      startDate: new Date(currentYear, 0, 10),
      deliveryStatementDate: new Date(currentYear, 0, 25),
      deadline: new Date(currentYear, 1, 15),
      salesType: 'NEW_ORDER',
      orderStatus: 'WIP',
      priority: 'HIGH',
      progressPercentage: 60,
      remark: 'Under active frontend integration. Carried to February.',
    },
  });

  // Assignments for prj1: January (ORIGINAL) and February (CARRY_FORWARD)
  await prisma.projectMonth.upsert({
    where: { projectId_month_year: { projectId: prj1.id, month: 1, year: currentYear } },
    update: {},
    create: {
      userId: user.id,
      projectId: prj1.id,
      month: 1,
      year: currentYear,
      assignmentType: 'ORIGINAL',
      remark: 'Original assignment for January.',
    },
  });

  await prisma.projectMonth.upsert({
    where: { projectId_month_year: { projectId: prj1.id, month: 2, year: currentYear } },
    update: {},
    create: {
      userId: user.id,
      projectId: prj1.id,
      month: 2,
      year: currentYear,
      assignmentType: 'CARRY_FORWARD',
      fromMonth: 1,
      fromYear: currentYear,
      toMonth: 2,
      toYear: currentYear,
      carryForwardDate: new Date(currentYear, 1, 1),
      carryForwardReason: 'Client requested additional analytics features.',
      previousStatus: 'WIP',
      remark: 'Carried forward from January to February.',
    },
  });

  // Project 2: Delivered in January
  const prj2 = await prisma.project.upsert({
    where: { userId_orderId: { userId: user.id, orderId: 'ORD-2026-102' } },
    update: {},
    create: {
      userId: user.id,
      clientId: client2.id,
      name: 'Creative Agency Portfolio Redesign',
      orderId: 'ORD-2026-102',
      projectDate: new Date(currentYear, 0, 5),
      category: 'UI/UX Design',
      profileName: 'Fiverr',
      projectSource: 'Fiverr',
      description: 'Figma to Next.js responsive website with smooth Framer animations.',
      value: 650.0,
      currency: 'USD',
      advancePayment: 650.0,
      startDate: new Date(currentYear, 0, 5),
      deliveryStatementDate: new Date(currentYear, 0, 18),
      deadline: new Date(currentYear, 0, 20),
      actualDeliveryDate: new Date(currentYear, 0, 19),
      salesType: 'REPEAT_ORDER',
      orderStatus: 'DELIVERED',
      priority: 'MEDIUM',
      progressPercentage: 100,
      remark: 'Delivered ahead of schedule. 5-star review received!',
    },
  });

  await prisma.projectMonth.upsert({
    where: { projectId_month_year: { projectId: prj2.id, month: 1, year: currentYear } },
    update: {},
    create: {
      userId: user.id,
      projectId: prj2.id,
      month: 1,
      year: currentYear,
      assignmentType: 'ORIGINAL',
      remark: 'Successfully completed in January.',
    },
  });

  // Project 3: Current Month Project
  const currentMonth = now.getMonth() + 1;
  const prj3 = await prisma.project.upsert({
    where: { userId_orderId: { userId: user.id, orderId: 'ORD-2026-103' } },
    update: {},
    create: {
      userId: user.id,
      clientId: client3.id,
      name: 'High-Converting B2B Landing Page',
      orderId: 'ORD-2026-103',
      projectDate: new Date(currentYear, currentMonth - 1, 2),
      category: 'Frontend Development',
      profileName: 'Direct Client',
      projectSource: 'LinkedIn',
      description: 'Clean modern B2B SaaS landing page with dark mode and lead capture.',
      value: 950.0,
      currency: 'USD',
      advancePayment: 300.0,
      startDate: new Date(currentYear, currentMonth - 1, 2),
      deliveryStatementDate: new Date(currentYear, currentMonth - 1, 15),
      deadline: new Date(currentYear, currentMonth - 1, 20),
      salesType: 'NEW_ORDER',
      orderStatus: 'WIP',
      priority: 'HIGH',
      progressPercentage: 40,
      remark: 'Design approved, starting Next.js implementation.',
    },
  });

  await prisma.projectMonth.upsert({
    where: { projectId_month_year: { projectId: prj3.id, month: currentMonth, year: currentYear } },
    update: {},
    create: {
      userId: user.id,
      projectId: prj3.id,
      month: currentMonth,
      year: currentYear,
      assignmentType: 'ORIGINAL',
      remark: 'Original assignment for current month.',
    },
  });

  // Seed sample payments
  await prisma.payment.createMany({
    data: [
      {
        userId: user.id,
        projectId: prj1.id,
        clientId: client1.id,
        amount: 400.0,
        currency: 'USD',
        paymentDate: new Date(currentYear, 0, 10),
        paymentMethod: 'UPWORK',
        transactionRef: 'UPW-TXN-8821',
        status: 'COMPLETED',
        remark: 'Upwork milestone 1 payment received.',
      },
      {
        userId: user.id,
        projectId: prj2.id,
        clientId: client2.id,
        amount: 650.0,
        currency: 'USD',
        paymentDate: new Date(currentYear, 0, 19),
        paymentMethod: 'PAYONEER',
        transactionRef: 'PAYO-99120',
        status: 'COMPLETED',
        remark: 'Full project payment cleared.',
      },
      {
        userId: user.id,
        projectId: prj3.id,
        clientId: client3.id,
        amount: 300.0,
        currency: 'USD',
        paymentDate: new Date(currentYear, currentMonth - 1, 3),
        paymentMethod: 'WISE',
        transactionRef: 'WISE-440192',
        status: 'COMPLETED',
        remark: 'Deposit received via Wise.',
      },
    ],
    skipDuplicates: true,
  });

  // Seed sample expenses
  await prisma.expense.createMany({
    data: [
      {
        userId: user.id,
        title: 'Vercel Pro Subscription',
        category: 'HOSTING',
        amount: 20.0,
        currency: 'USD',
        expenseDate: new Date(currentYear, 0, 15),
        paymentMethod: 'CREDIT_CARD',
        remark: 'Monthly Vercel team hosting.',
      },
      {
        userId: user.id,
        title: 'Cursor AI & GitHub Copilot',
        category: 'SOFTWARE',
        amount: 30.0,
        currency: 'USD',
        expenseDate: new Date(currentYear, 0, 20),
        paymentMethod: 'CREDIT_CARD',
        remark: 'Dev tooling subscriptions.',
      },
    ],
    skipDuplicates: true,
  });

  // Seed Monthly Target
  await prisma.target.upsert({
    where: {
      userId_targetType_year_month_metricType: {
        userId: user.id,
        targetType: 'MONTHLY_REVENUE',
        year: currentYear,
        month: currentMonth,
        metricType: 'RECEIVED_REVENUE',
      },
    },
    update: {},
    create: {
      userId: user.id,
      targetType: 'MONTHLY_REVENUE',
      targetAmount: 2500.0,
      currency: 'USD',
      year: currentYear,
      month: currentMonth,
      metricType: 'RECEIVED_REVENUE',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
