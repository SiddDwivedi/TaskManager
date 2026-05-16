const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper: check if user is project admin or global admin
const isProjectAdmin = async (projectId, userId, globalRole) => {
  if (globalRole === 'ADMIN') return true;
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return member && member.role === 'ADMIN';
};

// GET /api/projects — all projects user is member of
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarColor: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects — create project
router.post(
  '/',
  authenticate,
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Project name required'),
    body('description').optional().isString(),
    body('deadline').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description, deadline } = req.body;
    try {
      const project = await prisma.project.create({
        data: {
          name,
          description,
          deadline: deadline ? new Date(deadline) : null,
          ownerId: req.user.id,
          members: {
            create: { userId: req.user.id, role: 'ADMIN' },
          },
        },
        include: {
          owner: { select: { id: true, name: true, email: true, avatarColor: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
          },
          _count: { select: { tasks: true } },
        },
      });
      res.status(201).json({ project });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// GET /api/projects/:id — project detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarColor: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatarColor: true } },
            creator: { select: { id: true, name: true, avatarColor: true } },
            _count: { select: { comments: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) return res.status(404).json({ error: 'Project not found or access denied' });
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PUT /api/projects/:id — update project
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 1 }),
    body('description').optional().isString(),
    body('status').optional().isIn(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED']),
    body('deadline').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const admin = await isProjectAdmin(req.params.id, req.user.id, req.user.role);
    if (!admin) return res.status(403).json({ error: 'Project admin access required' });

    const { name, description, status, deadline } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

    try {
      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          owner: { select: { id: true, name: true, email: true, avatarColor: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
          },
          _count: { select: { tasks: true } },
        },
      });
      res.json({ project });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Update failed' });
    }
  }
);

// DELETE /api/projects/:id
router.delete('/:id', authenticate, async (req, res) => {
  const admin = await isProjectAdmin(req.params.id, req.user.id, req.user.role);
  if (!admin) return res.status(403).json({ error: 'Project admin access required' });

  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// POST /api/projects/:id/members — add member
router.post(
  '/:id/members',
  authenticate,
  [
    body('userId').notEmpty().withMessage('userId required'),
    body('role').optional().isIn(['ADMIN', 'MEMBER']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const admin = await isProjectAdmin(req.params.id, req.user.id, req.user.role);
    if (!admin) return res.status(403).json({ error: 'Project admin access required' });

    const { userId, role } = req.body;
    try {
      const member = await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: req.params.id, userId } },
        update: { role: role || 'MEMBER' },
        create: { projectId: req.params.id, userId, role: role || 'MEMBER' },
        include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
      });
      res.status(201).json({ member });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add member' });
    }
  }
);

// DELETE /api/projects/:id/members/:userId — remove member
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  const admin = await isProjectAdmin(req.params.id, req.user.id, req.user.role);
  if (!admin) return res.status(403).json({ error: 'Project admin access required' });

  if (req.params.userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot remove yourself' });
  }

  try {
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
