import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireEntityAccess, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const MAX_TOURNAMENT_NAME_LENGTH = 100;
const MAX_TOURNAMENT_LOCATION_LENGTH = 150;

/**
 * Strip characters commonly used in SQL injection and XSS attacks.
 */
const sanitizeText = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/--/g, '').replace(/[;'"\\*<>]/g, '').trim();
};

// Tournaments: Get all (Publicly accessible)
router.get('/', async (req, res) => {
  const { sport, creatorId } = req.query;
  try {
    const tournaments = await prisma.tournament.findMany({
      where: {
        ...(sport ? { sport: sport as string } : {}),
        ...(creatorId ? { creatorId: parseInt(creatorId as string) } : {})
      },
      include: { 
        _count: { select: { categories: true } },
        creator: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener los torneos' });
  }
});

// Tournaments: Get detail (Publicly accessible)
router.get('/:id', async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, username: true } },
        categories: {
          include: {
            groups: {
              include: {
                pairs: true,
                _count: { select: { pairs: true, matches: true } }
              }
            },
            brackets: {
              include: {
                _count: { select: { matches: true } }
              }
            },
            pairs: {
              include: {
                groups: true
              }
            }
          }
        }
      }
    });
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Torneo no encontrado' });
    }
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener el torneo' });
  }
});

// Tournaments: Create (Protected)
router.post('/', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  const { 
    name: rawName, location: rawLocation, startDate, endDate, sport, description, 
    categories, creatorId: bodyCreatorId
  } = req.body;
  
  let creatorId = req.user!.id; // Derived securely from authenticated JWT token
  if ((req.user!.role === 'ADMIN' || req.user!.role === 'SUPERADMIN') && bodyCreatorId) {
    creatorId = parseInt(bodyCreatorId);
  }

  // Sanitise & validate free-text fields
  const name = sanitizeText(rawName);
  const location = sanitizeText(rawLocation);

  if (!name || name.length === 0) {
    return res.status(400).json({ success: false, message: 'El nombre del torneo es obligatorio.' });
  }
  if (name.length > MAX_TOURNAMENT_NAME_LENGTH) {
    return res.status(400).json({ success: false, message: `El nombre del torneo no puede exceder ${MAX_TOURNAMENT_NAME_LENGTH} caracteres.` });
  }
  if (location && location.length > MAX_TOURNAMENT_LOCATION_LENGTH) {
    return res.status(400).json({ success: false, message: `La ubicación no puede exceder ${MAX_TOURNAMENT_LOCATION_LENGTH} caracteres.` });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() - 1); // tolerance for client timezone offsets

  if (startDate) {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    if (start < today) {
      return res.status(400).json({ success: false, message: 'La fecha de inicio no puede ser anterior a la fecha actual.' });
    }
  }

  if (endDate) {
    const [ey, em, ed] = endDate.split('-').map(Number);
    const end = new Date(ey, em - 1, ed);
    if (end < today) {
      return res.status(400).json({ success: false, message: 'La fecha de fin no puede ser anterior a la fecha actual.' });
    }
    if (startDate) {
      const [sy, sm, sd] = startDate.split('-').map(Number);
      const start = new Date(sy, sm - 1, sd);
      if (end < start) {
        return res.status(400).json({ success: false, message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
      }
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tournament
      const [sy, sm, sd] = startDate.split('-').map(Number);
      const [ey, em, ed] = endDate.split('-').map(Number);
      
      const tournament = await tx.tournament.create({
        data: {
          name,
          location,
          startDate: startDate ? new Date(sy, sm - 1, sd) : null,
          endDate: endDate ? new Date(ey, em - 1, ed) : null,
          sport,
          description,
          creatorId
        }
      });

      // 2. Process each Category
      if (categories && Array.isArray(categories)) {
        for (const catData of categories) {
          const category = await tx.category.create({
            data: {
              name: catData.name,
              tournamentId: tournament.id
            }
          });

          // 3. Create Pairs for this category
          const pairMap = new Map();
          for (const pName of catData.participants) {
            const pair = await tx.pair.create({
              data: { 
                name: pName, 
                categoryId: category.id 
              }
            });
            pairMap.set(pName, pair.id);
          }

          // 4. Create Groups if requested
          if (catData.hasGroups) {
            for (let i = 0; i < catData.groupCount; i++) {
              await tx.group.create({
                data: {
                  name: `Grupo ${String.fromCharCode(65 + i)}`,
                  categoryId: category.id
                }
              });
            }
          }

          // 5. Create Bracket if requested
          if (catData.hasBrackets) {
            const bracket = await tx.bracket.create({
              data: {
                name: 'Eliminatorias',
                categoryId: category.id
              }
            });

            const size = catData.bracketSize;
            let round = Math.log2(size);
            const matchMap = new Map<string, string>(); // round-index -> matchId

            for (let r = 1; r <= round; r++) {
              const matchesInRound = Math.pow(2, round - r);
              for (let i = 0; i < matchesInRound; i++) {
                const match = await tx.bracketMatch.create({
                  data: {
                    bracketId: bracket.id,
                    round: r,
                    matchIndex: i,
                  }
                });
                matchMap.set(`${r}-${i}`, match.id);
              }
            }

            // Link nextMatchId
            for (let r = 1; r < round; r++) {
              const matchesInRound = Math.pow(2, round - r);
              for (let i = 0; i < matchesInRound; i++) {
                const currentId = matchMap.get(`${r}-${i}`);
                const nextId = matchMap.get(`${r + 1}-${Math.floor(i / 2)}`);
                if (currentId && nextId) {
                  await tx.bracketMatch.update({
                    where: { id: currentId },
                    data: { nextMatchId: nextId }
                  });
                }
              }
            }
          }
        }
      }

      return tournament;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al crear el torneo' });
  }
});

// Tournaments: Update (Protected, only creator or admin)
router.patch('/:id', authenticateJWT, requireEntityAccess('tournament'), async (req, res) => {
  const { name: rawName, location: rawLocation, startDate, endDate, sport, creatorId } = req.body;
  const name = rawName ? sanitizeText(rawName) : undefined;
  const location = rawLocation ? sanitizeText(rawLocation) : undefined;

  try {
    let creatorIdVal = undefined;
    if ((req.user!.role === 'ADMIN' || req.user!.role === 'SUPERADMIN') && creatorId !== undefined) {
      creatorIdVal = typeof creatorId === 'number' ? creatorId : parseInt(creatorId);
    }

    const tournament = await prisma.tournament.update({
      where: { id: req.params.id },
      data: {
        name,
        location,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sport,
        ...(creatorIdVal !== undefined ? { creatorId: creatorIdVal } : {})
      }
    });
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar el torneo' });
  }
});

// Tournaments: Delete (Protected, only system admin)
router.delete('/:id', authenticateJWT, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    await prisma.tournament.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar el torneo' });
  }
});

// Tournaments: Add Category (Protected, only creator or admin)
router.post('/:id/categories', authenticateJWT, requireEntityAccess('tournament'), async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'El nombre de la categoría es obligatorio' });
  }
  try {
    const category = await prisma.category.create({
      data: {
        name,
        tournamentId: req.params.id
      }
    });
    res.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Error al crear la categoría' });
  }
});

export default router;
