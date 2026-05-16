const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper: check project membership
const checkProjectAccess = async (projectId, userId, globalRole) => {
  if (globalRole === 'ADMIN') return true;
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!member;
};

const isProjectAdmin = async (projectId, userId, globalRole) => {
  if (globalRole === 'ADMIN') return true;
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return member && member.role === 'ADMIN';
};

// Auto-update overdue tasks helper
const updateOverdueTasks = async () => {
  await prisma.task.updateMany({
    where: {
      dueDate: { lt: new Date() },
      status: { in: ['TODO', 'IN_PROGRESS'] },
    },
    data: { status: 'OVERDUE' },
  });
};

// GET /api/tasks — tasks visible to me
router.get('/', authenticate, async (req, res) => {
  await updateOverdueTasks();

  const { status, priority, projectId, assigneeId, search } = req.query;

  const where = {
    AND: [],
  };

  // Access filter: global admin sees all, others see project-member tasks
  if (req.user.role !== 'ADMIN') {
    where.AND.push({
      project: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
    });
  }

  if (status) where.AND.push({ status });
  if (priority) where.AND.push({ priority });
  if (projectId) where.AND.push({ projectId });
  if (assigneeId) where.AND.push({ assigneeId });
  if (search) where.AND.push({ title: { contains: search, mode: 'insensitive' } });

  try {
    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarColor: true } },
        creator: { select: { id: true, name: true, avatarColor: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks — create task
router.post(
  '/',
  authenticate,
  [
    body('title').trim().isLength({ min: 1 }).withMessage('Title required'),
    body('projectId').notEmpty().withMessage('projectId required'),
    body('description').optional().isString(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('assigneeId').optional().isString(),
    body('dueDate').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, status, priority, projectId, assigneeId, dueDate } = req.body;

    const hasAccess = await checkProjectAccess(projectId, req.user.id, req.user.role);
    if (!hasAccess) return res.status(403).json({ error: 'No access to this project' });

    try {
      const task = await prisma.task.create({
        data: {
          title,
          description,
          status: status || 'TODO',
          priority: priority || 'MEDIUM',
          projectId,
          assigneeId: assigneeId || null,
          creatorId: req.user.id,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, avatarColor: true } },
          creator: { select: { id: true, name: true, avatarColor: true } },
          _count: { select: { comments: true } },
        },
      });
      res.status(201).json({ task });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

// GET /api/tasks/:id — task detail
router.get('/:id', authenticate, async (req, res) => {
  await updateOverdueTasks();
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarColor: true } },
        creator: { select: { id: true, name: true, avatarColor: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatarColor: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const hasAccess = await checkProjectAccess(task.projectId, req.user.id, req.user.role);
    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// PUT /api/tasks/:id — update task
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().trim().isLength({ min: 1 }),
    body('description').optional().isString(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('assigneeId').optional(),
    body('dueDate').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
      if (!existing) return res.status(404).json({ error: 'Task not found' });

      const hasAccess = await checkProjectAccess(existing.projectId, req.user.id, req.user.role);
      if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

      const { title, description, status, priority, assigneeId, dueDate } = req.body;
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

      const task = await prisma.task.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, avatarColor: true } },
          creator: { select: { id: true, name: true, avatarColor: true } },
          _count: { select: { comments: true } },
        },
      });
      res.json({ task });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Update failed' });
    }
  }
);

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const admin = await isProjectAdmin(task.projectId, req.user.id, req.user.role);
    const isCreator = task.creatorId === req.user.id;
    if (!admin && !isCreator) return res.status(403).json({ error: 'Cannot delete this task' });

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// POST /api/tasks/:id/comments — add comment
router.post(
  '/:id/comments',
  authenticate,
  [body('content').trim().isLength({ min: 1 }).withMessage('Comment cannot be empty')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const task = await prisma.task.findUnique({ where: { id: req.params.id } });
      if (!task) return res.status(404).json({ error: 'Task not found' });

      const hasAccess = await checkProjectAccess(task.projectId, req.user.id, req.user.role);
      if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

      const comment = await prisma.comment.create({
        data: {
          content: req.body.content,
          taskId: req.params.id,
          userId: req.user.id,
        },
        include: { user: { select: { id: true, name: true, avatarColor: true } } },
      });
      res.status(201).json({ comment });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }
);

module.exports = router;
