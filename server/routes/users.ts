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
        createdAt: true
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

export default router;
