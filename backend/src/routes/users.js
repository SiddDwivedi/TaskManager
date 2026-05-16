const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users — list all users (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        avatarColor: true, createdAt: true,
        _count: { select: { assignedTasks: true, createdTasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/search?q=name — search users (for adding members)
router.get('/search', authenticate, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ users: [] });
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, email: true, role: true, avatarColor: true },
      take: 10,
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// PUT /api/users/:id — update own profile (or admin can update any)
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('avatarColor').optional().isString(),
    body('password').optional().isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // Only own profile or admin
    if (req.params.id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, avatarColor, password, role } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (avatarColor) updateData.avatarColor = avatarColor;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
    // Only global admin can change roles
    if (role && req.user.role === 'ADMIN') updateData.role = role;

    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
        select: { id: true, name: true, email: true, role: true, avatarColor: true },
      });
      res.json({ user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Update failed' });
    }
  }
);

// DELETE /api/users/:id — admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
