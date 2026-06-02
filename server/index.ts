import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Import modular routes
import authRouter from './routes/auth';
import tournamentRouter from './routes/tournaments';
import categoriesRouter from './routes/categories';
import usersRouter from './routes/users';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Seed admin user securely on startup
const seedAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: { 
        password: hashedPassword,
        role: 'ADMIN'
      },
      create: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log('Secure admin user seeded');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};
seedAdmin();

app.use(cors());
app.use(express.json());

// Setup API routes
app.use('/api', authRouter);
app.use('/api/tournaments', tournamentRouter);
app.use('/api', categoriesRouter);
app.use('/api/users', usersRouter);

// Admin setup utility route (with bcrypt hash)
app.get('/api/admin-setup', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
      where: { username: 'admin' },
      update: { password: hashedPassword, role: 'ADMIN' },
      create: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
