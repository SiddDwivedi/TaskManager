const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskmanager.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@taskmanager.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      avatarColor: '#7c3aed',
    },
  });

  // Create member users
  const memberHash = await bcrypt.hash('member123', 12);
  const alice = await prisma.user.upsert({
    where: { email: 'alice@taskmanager.com' },
    update: {},
    create: {
      name: 'Alice Johnson',
      email: 'alice@taskmanager.com',
      passwordHash: memberHash,
      role: 'MEMBER',
      avatarColor: '#06b6d4',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@taskmanager.com' },
    update: {},
    create: {
      name: 'Bob Smith',
      email: 'bob@taskmanager.com',
      passwordHash: memberHash,
      role: 'MEMBER',
      avatarColor: '#10b981',
    },
  });

  // Create a sample project
  const existingProject = await prisma.project.findFirst({
    where: { name: 'Website Redesign', ownerId: admin.id },
  });

  if (!existingProject) {
    const project = await prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Complete overhaul of the company website with new branding and improved UX',
        status: 'ACTIVE',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ownerId: admin.id,
        members: {
          create: [
            { userId: admin.id, role: 'ADMIN' },
            { userId: alice.id, role: 'MEMBER' },
            { userId: bob.id, role: 'MEMBER' },
          ],
        },
      },
    });

    // Create sample tasks
    await prisma.task.createMany({
      data: [
        {
          title: 'Design new homepage mockups',
          description: 'Create Figma mockups for the new homepage design',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          projectId: project.id,
          assigneeId: alice.id,
          creatorId: admin.id,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Set up CI/CD pipeline',
          description: 'Configure GitHub Actions for automated deployments',
          status: 'TODO',
          priority: 'CRITICAL',
          projectId: project.id,
          assigneeId: bob.id,
          creatorId: admin.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Update content and copy',
          description: 'Rewrite all website copy to match new brand voice',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: project.id,
          assigneeId: alice.id,
          creatorId: admin.id,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Performance audit',
          description: 'Run Lighthouse audits and fix all performance issues',
          status: 'DONE',
          priority: 'HIGH',
          projectId: project.id,
          assigneeId: bob.id,
          creatorId: admin.id,
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Legacy API migration',
          description: 'Migrate from old API endpoints to new GraphQL',
          status: 'OVERDUE',
          priority: 'CRITICAL',
          projectId: project.id,
          assigneeId: bob.id,
          creatorId: admin.id,
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    console.log('✅ Sample project and tasks created');
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Test accounts:');
  console.log('  Admin:  admin@taskmanager.com / admin123');
  console.log('  Member: alice@taskmanager.com / member123');
  console.log('  Member: bob@taskmanager.com   / member123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
