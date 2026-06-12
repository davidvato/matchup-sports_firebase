import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Users: Get all (Admin only)
router.get('/', authenticateJWT, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        tournaments: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el listado de usuarios' });
  }
});

// Users: Create new user (Admin only)
router.post('/', authenticateJWT, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Nombre de usuario y contraseña son requeridos' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El nombre de usuario ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'ORGANIZER'
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Error al crear el nuevo usuario' });
  }
});

// Users: Delete user (Admin only)
router.delete('/:id', authenticateJWT, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
  }

  try {
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (userToDelete.username === 'admin') {
      return res.status(400).json({ success: false, message: 'No es posible eliminar el usuario administrador principal' });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el usuario' });
  }
});

const sanitizeText = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/--/g, '').replace(/[;'"\\*<>]/g, '').trim();
};

// Users: Update user (Admin only)
router.patch('/:id', authenticateJWT, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
  }

  const { username, password, tournamentId } = req.body;

  try {
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Prepare update data
    const updateData: any = {};
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId }
        }
      });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'El nombre de usuario ya está en uso' });
      }
      updateData.username = sanitizeText(username);
    }

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: updateData
        });
      }

      // Handle tournament assignment
      if (tournamentId !== undefined) {
        // Reassign all currently managed tournaments of this user to the admin performing the action
        const currentTournaments = await tx.tournament.findMany({
          where: { creatorId: userId }
        });

        const adminId = req.user!.id;
        for (const t of currentTournaments) {
          await tx.tournament.update({
            where: { id: t.id },
            data: { creatorId: adminId }
          });
        }

        // If a valid tournament is specified
        if (tournamentId && tournamentId !== 'none') {
          await tx.tournament.update({
            where: { id: tournamentId },
            data: { creatorId: userId }
          });
        }
      }
    });

    res.json({ success: true, message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el usuario' });
  }
});

export default router;
