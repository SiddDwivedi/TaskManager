const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard — comprehensive stats
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';
  const now = new Date();

  // Auto-mark overdue tasks
  await prisma.task.updateMany({
    where: {
      dueDate: { lt: now },
      status: { in: ['TODO', 'IN_PROGRESS'] },
    },
    data: { status: 'OVERDUE' },
  });

  try {
    // Base filter for tasks visible to user
    const taskAccessFilter = isAdmin
      ? {}
      : {
          project: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } },
            ],
          },
        };

    const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
      myTasks,
      upcomingTasks,
      recentTasks,
      projectCount,
      myProjects,
    ] = await Promise.all([
      prisma.task.count({ where: taskAccessFilter }),
      prisma.task.count({ where: { ...taskAccessFilter, status: 'TODO' } }),
      prisma.task.count({ where: { ...taskAccessFilter, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...taskAccessFilter, status: 'DONE' } }),
      prisma.task.count({ where: { ...taskAccessFilter, status: 'OVERDUE' } }),
      prisma.task.count({ where: { ...taskAccessFilter, assigneeId: userId } }),
      prisma.task.findMany({
        where: {
          ...taskAccessFilter,
          dueDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
          status: { in: ['TODO', 'IN_PROGRESS'] },
        },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, avatarColor: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      prisma.task.findMany({
        where: { ...taskAccessFilter },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, avatarColor: true } },
          creator: { select: { id: true, name: true, avatarColor: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.project.count({
        where: isAdmin
          ? {}
          : {
              OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
              ],
            },
      }),
      prisma.project.findMany({
        where: isAdmin
          ? {}
          : {
              OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
              ],
            },
        include: {
          _count: { select: { tasks: true, members: true } },
          members: {
            include: { user: { select: { id: true, name: true, avatarColor: true } } },
            take: 4,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
    ]);

    res.json({
      stats: {
        totalTasks,
        todoTasks,
        inProgressTasks,
        doneTasks,
        overdueTasks,
        myTasks,
        projectCount,
        completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      },
      upcomingTasks,
      recentTasks,
      myProjects,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Dashboard fetch failed' });
  }
});

module.exports = router;
