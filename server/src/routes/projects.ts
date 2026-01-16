import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

const createProjectSchema = z.object({
  name: z.string().min(1),
  data: z.string(), // JSON string of project data
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  data: z.string().optional(),
});

// GET /api/projects - List user's projects
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        // Include minimal data for listing (parse and extract overview)
        data: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Parse data to extract overview info for listing
    const projectList = projects.map((p) => {
      try {
        const parsed = JSON.parse(p.data);
        return {
          id: p.id,
          name: p.name,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          overview: parsed.overview || {},
        };
      } catch {
        return {
          id: p.id,
          name: p.name,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          overview: {},
        };
      }
    });

    return res.json({ projects: projectList });
  } catch (error) {
    console.error('List projects error:', error);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req, res) => {
  try {
    const { name, data } = createProjectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        userId: req.user!.id,
        name,
        data,
      },
    });

    return res.status(201).json({
      project: {
        id: project.id,
        name: project.name,
        data: JSON.parse(project.data),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create project error:', error);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json({
      project: {
        id: project.id,
        name: project.name,
        data: JSON.parse(project.data),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
  try {
    const updates = updateProjectSchema.parse(req.body);

    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: updates,
    });

    return res.json({
      project: {
        id: project.id,
        name: project.name,
        data: JSON.parse(project.data),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update project error:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
  try {
    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({
      where: { id: req.params.id },
    });

    return res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

// POST /api/projects/:id/duplicate - Duplicate project
router.post('/:id/duplicate', async (req, res) => {
  try {
    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Parse and modify the data to update timestamps
    const data = JSON.parse(existing.data);
    const now = new Date().toISOString();
    data.createdAt = now;
    data.updatedAt = now;

    const project = await prisma.project.create({
      data: {
        userId: req.user!.id,
        name: `${existing.name} (Copy)`,
        data: JSON.stringify(data),
      },
    });

    return res.status(201).json({
      project: {
        id: project.id,
        name: project.name,
        data: JSON.parse(project.data),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error('Duplicate project error:', error);
    return res.status(500).json({ error: 'Failed to duplicate project' });
  }
});

export default router;
