import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  approved: z.boolean().optional(),
});

// GET /api/admin/users - List all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const userList = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      approved: u.approved,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      projectCount: u._count.projects,
    }));

    return res.json({ users: userList });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users - Create new user
router.post('/users', async (req, res) => {
  try {
    const { email, password, name, role } = createUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        approved: true, // Admin-created users are auto-approved
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', async (req, res) => {
  try {
    const updates = updateUserSchema.parse(req.body);

    // Prevent admin from removing their own admin role
    if (req.params.id === req.user!.id && updates.role === 'USER') {
      return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }

    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash password if being updated
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({
      where: { id: req.params.id },
    });

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/admin/backup - Export all users and projects as JSON
router.get('/backup', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const projects = await prisma.project.findMany({
      select: {
        id: true,
        userId: true,
        name: true,
        data: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      users,
      projects,
    };

    const filename = `prelude-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.json(backup);
  } catch (error) {
    console.error('Backup error:', error);
    return res.status(500).json({ error: 'Failed to create backup' });
  }
});

const restoreSchema = z.object({
  version: z.number(),
  users: z.array(
    z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      role: z.enum(['USER', 'ADMIN']),
      approved: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      userId: z.string(),
      name: z.string(),
      data: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
});

// POST /api/admin/restore - Import users and projects from backup JSON
router.post('/restore', async (req, res) => {
  try {
    const backup = restoreSchema.parse(req.body);

    // Track what was imported
    let usersImported = 0;
    let usersSkipped = 0;
    let projectsImported = 0;
    let projectsSkipped = 0;

    // Map old user IDs to new user IDs (in case of conflicts)
    const userIdMap = new Map<string, string>();

    // Import users
    for (const user of backup.users) {
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existing) {
        // User exists - map old ID to existing ID
        userIdMap.set(user.id, existing.id);
        usersSkipped++;
      } else {
        // Create user with a temporary password (they'll need to reset)
        const tempPassword = await bcrypt.hash(crypto.randomUUID(), 10);
        const newUser = await prisma.user.create({
          data: {
            email: user.email,
            password: tempPassword,
            name: user.name,
            role: user.role,
            approved: user.approved,
          },
        });
        userIdMap.set(user.id, newUser.id);
        usersImported++;
      }
    }

    // Import projects
    for (const project of backup.projects) {
      const mappedUserId = userIdMap.get(project.userId);
      if (!mappedUserId) {
        projectsSkipped++;
        continue;
      }

      // Check if project with same name exists for this user
      const existing = await prisma.project.findFirst({
        where: {
          userId: mappedUserId,
          name: project.name,
        },
      });

      if (existing) {
        projectsSkipped++;
      } else {
        await prisma.project.create({
          data: {
            userId: mappedUserId,
            name: project.name,
            data: project.data,
          },
        });
        projectsImported++;
      }
    }

    return res.json({
      message: 'Restore completed',
      usersImported,
      usersSkipped,
      projectsImported,
      projectsSkipped,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid backup format', details: error.errors });
    }
    console.error('Restore error:', error);
    return res.status(500).json({ error: 'Failed to restore backup' });
  }
});

export default router;
