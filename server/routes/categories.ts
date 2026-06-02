import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireEntityAccess } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// 1. CATEGORIES ROUTES
// ==========================================

// Categories: Get detail (Public)
router.get('/categories/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        pairs: {
          include: {
            groups: true,
            bracketMatchesAsA: { include: { bracket: true } },
            bracketMatchesAsB: { include: { bracket: true } }
          }
        },
        groups: true,
        brackets: true
      }
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener la categoría' });
  }
});

// Categories: Add Pair (Protected)
router.post('/categories/:id/pairs', authenticateJWT, requireEntityAccess('category'), async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'El nombre del competidor es obligatorio' });
  }
  try {
    const pair = await prisma.pair.create({
      data: {
        name,
        categoryId: req.params.id
      }
    });
    res.json(pair);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear la pareja' });
  }
});

// Categories: Create Group (Protected)
router.post('/categories/:id/groups', authenticateJWT, requireEntityAccess('category'), async (req, res) => {
  const { name } = req.body;
  try {
    const group = await prisma.group.create({
      data: {
        name: name || 'Nuevo Grupo',
        categoryId: req.params.id
      }
    });
    res.json(group);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear el grupo' });
  }
});

// Categories: Create Bracket (Protected)
router.post('/categories/:id/brackets', authenticateJWT, requireEntityAccess('category'), async (req, res) => {
  const { name, size } = req.body;
  if (!size || isNaN(size) || (size & (size - 1)) !== 0) {
    return res.status(400).json({ success: false, message: 'El tamaño de la llave debe ser una potencia de 2 (ej. 2, 4, 8, 16)' });
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const bracket = await tx.bracket.create({
        data: {
          name: name || 'Eliminatorias',
          categoryId: req.params.id
        }
      });

      let round = Math.log2(size);
      const matchMap = new Map();

      for (let r = 1; r <= round; r++) {
        const matchesInRound = Math.pow(2, round - r);
        for (let i = 0; i < matchesInRound; i++) {
          const match = await tx.bracketMatch.create({
            data: {
              bracketId: bracket.id,
              round: r,
              matchIndex: i
            }
          });
          matchMap.set(`${r}-${i}`, match.id);
        }
      }

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
      return bracket;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear las eliminatorias' });
  }
});

// Categories: Reset (Protected)
router.post('/categories/:id/reset', authenticateJWT, requireEntityAccess('category'), async (req, res) => {
  const { id: categoryId } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Reset all groups in this category
      const groups = await tx.group.findMany({ where: { categoryId } });
      for (const group of groups) {
        const pairs = await tx.pair.findMany({ 
          where: { groups: { some: { id: group.id } } } 
        });
        for (const pair of pairs) {
          await tx.score.deleteMany({ where: { pairId: pair.id } });
          await tx.pair.update({
            where: { id: pair.id },
            data: { totalScore: 0 }
          });
        }
        await tx.match.updateMany({
          where: { groupId: group.id },
          data: { winnerId: null, pointsA: 0, pointsB: 0 }
        });
      }
      // 2. Delete all brackets in this category
      await tx.bracket.deleteMany({ where: { categoryId } });
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting category:', error);
    res.status(500).json({ success: false, message: 'Error al reiniciar la categoría' });
  }
});

// Categories: Delete (Protected)
router.delete('/categories/:id', authenticateJWT, requireEntityAccess('category'), async (req, res) => {
  const { id: categoryId } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete all brackets and their matches first
      await tx.bracket.deleteMany({ where: { categoryId } });
      // 2. Delete the category (cascades to groups, pairs, etc.)
      await tx.category.delete({ where: { id: categoryId } });
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la categoría' });
  }
});


// ==========================================
// 2. GROUPS ROUTES
// ==========================================

// Groups: Get detail (Public)
router.get('/groups/:id', async (req, res) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        category: { include: { tournament: true } },
        pairs: { include: { _count: { select: { scores: true } } } },
        matches: {
          include: {
            pairA: true,
            pairA2: true,
            pairB: true,
            pairB2: true
          }
        }
      }
    });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener el grupo' });
  }
});

// Groups: Assign Single Pair to Group (Protected)
router.post('/groups/:id/pairs', authenticateJWT, requireEntityAccess('group'), async (req, res) => {
  const { pairId } = req.body;
  const groupId = req.params.id;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const updatedPair = await tx.pair.update({
        where: { id: pairId },
        data: { 
          groups: {
            connect: { id: groupId }
          }
        }
      });

      const existingPairs = await tx.pair.findMany({
        where: { 
          groups: { some: { id: groupId } },
          id: { not: pairId } 
        }
      });

      for (const p of existingPairs) {
        await tx.match.create({
          data: {
            groupId,
            pairAId: p.id,
            pairBId: pairId
          }
        });
      }
      return updatedPair;
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error al asignar la pareja' });
  }
});

// Groups: Assign Pairs (Batch) (Protected)
router.post('/groups/:id/pairs/batch', authenticateJWT, requireEntityAccess('group'), async (req, res) => {
  const { pairIds } = req.body;
  const groupId = req.params.id;
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Assign pairs to group
      for (const pairId of pairIds) {
        await tx.pair.update({
          where: { id: pairId },
          data: {
            groups: {
              connect: { id: groupId }
            }
          }
        });
      }

      // 2. Clear existing matches for this group
      await tx.match.deleteMany({
        where: { groupId }
      });

      // 3. Get all pairs in group
      const allPairs = await tx.pair.findMany({
        where: { groups: { some: { id: groupId } } }
      });

      const group = await tx.group.findUnique({
        where: { id: groupId },
        include: { category: { include: { tournament: true } } }
      });
      if (!group) throw new Error('Grupo no encontrado');
      const isPickleball = group.category.tournament.sport?.toLowerCase() === 'pickleball';

      if (isPickleball) {
        const N = allPairs.length;
        if (N < 2) return { success: true };

        const allPairings: [number, number][] = [];
        for (let i = 0; i < N; i++) {
          for (let j = i + 1; j < N; j++) {
            allPairings.push([i, j]);
          }
        }

        const playerMatchCount = new Array(N).fill(0);
        let availablePairings = [...allPairings];

        while (availablePairings.length > 0) {
          availablePairings.sort((a, b) => {
            const scoreA = playerMatchCount[a[0]] + playerMatchCount[a[1]];
            const scoreB = playerMatchCount[b[0]] + playerMatchCount[b[1]];
            return scoreA - scoreB;
          });

          const p1 = availablePairings.shift()!;
          let p2Idx = -1;
          let bestP2Score = Infinity;

          for (let i = 0; i < availablePairings.length; i++) {
            const candidate = availablePairings[i];
            if (p1[0] !== candidate[0] && p1[0] !== candidate[1] && p1[1] !== candidate[0] && p1[1] !== candidate[1]) {
              const score = playerMatchCount[candidate[0]] + playerMatchCount[candidate[1]];
              if (score < bestP2Score) {
                bestP2Score = score;
                p2Idx = i;
              }
            }
          }

          if (p2Idx !== -1) {
            const p2 = availablePairings.splice(p2Idx, 1)[0];
            await tx.match.create({
              data: {
                groupId,
                pairAId: allPairs[p1[0]].id,
                pairA2Id: allPairs[p1[1]].id,
                pairBId: allPairs[p2[0]].id,
                pairB2Id: allPairs[p2[1]].id
              }
            });
            playerMatchCount[p1[0]]++; playerMatchCount[p1[1]]++;
            playerMatchCount[p2[0]]++; playerMatchCount[p2[1]]++;
          } else {
            await tx.match.create({
              data: {
                groupId,
                pairAId: allPairs[p1[0]].id,
                pairA2Id: allPairs[p1[1]].id,
                pairBId: null,
                winnerId: 'SITOUT'
              }
            });
            playerMatchCount[p1[0]]++; playerMatchCount[p1[1]]++;
          }
        }
      } else {
        // Standard Round-robin
        for (let i = 0; i < allPairs.length; i++) {
          for (let j = i + 1; j < allPairs.length; j++) {
            const pairAId = allPairs[i].id;
            const pairBId = allPairs[j].id;

            const existingMatch = await tx.match.findFirst({
              where: {
                OR: [
                  { pairAId, pairBId, groupId },
                  { pairAId: pairBId, pairBId: pairAId, groupId }
                ]
              }
            });

            if (!existingMatch) {
              await tx.match.create({
                data: {
                  groupId,
                  pairAId,
                  pairBId
                }
              });
            }
          }
        }
      }
      return { success: true };
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error al asignar parejas' });
  }
});

// Groups: Reset scores and matches (Protected)
router.post('/groups/:id/reset', authenticateJWT, requireEntityAccess('group'), async (req, res) => {
  const groupId = req.params.id;
  try {
    const pairs = await prisma.pair.findMany({ 
      where: { groups: { some: { id: groupId } } } 
    });
    await prisma.$transaction(async (tx) => {
      for (const pair of pairs) {
        await tx.score.deleteMany({ where: { pairId: pair.id } });
        await tx.pair.update({
          where: { id: pair.id },
          data: { totalScore: 0 }
        });
      }
      await tx.match.updateMany({
        where: { groupId },
        data: { winnerId: null, pointsA: 0, pointsB: 0 }
      });
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al reiniciar el grupo' });
  }
});

// Groups: Delete (Protected)
router.delete('/groups/:id', authenticateJWT, requireEntityAccess('group'), async (req, res) => {
  try {
    await prisma.group.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar el grupo' });
  }
});


// ==========================================
// 3. BRACKETS ROUTES
// ==========================================

// Brackets: Get detail (Public)
router.get('/brackets/:id', async (req, res) => {
  try {
    const bracket = await prisma.bracket.findUnique({
      where: { id: req.params.id },
      include: {
        category: {
          include: {
            tournament: true
          }
        },
        matches: {
          include: {
            pairA: true,
            pairB: true
          }
        }
      }
    });
    if (!bracket) {
      return res.status(404).json({ success: false, message: 'Llaves no encontradas' });
    }
    res.json(bracket);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener la estructura de llaves' });
  }
});

// Brackets: Update Match Result (Protected)
router.post('/bracket-matches/:id/result', authenticateJWT, requireEntityAccess('bracketMatch'), async (req, res) => {
  const { 
    winnerId, pointsA, pointsB, nextMatchId, nextMatchPos,
    set1A, set1B, set2A, set2B, set3A, set3B, set4A, set4B, set5A, set5B
  } = req.body;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.bracketMatch.update({
        where: { id: req.params.id },
        data: { 
          winnerId, pointsA, pointsB,
          set1A: set1A || 0,
          set1B: set1B || 0,
          set2A: set2A || 0,
          set2B: set2B || 0,
          set3A: set3A || 0,
          set3B: set3B || 0,
          set4A: set4A || 0,
          set4B: set4B || 0,
          set5A: set5A || 0,
          set5B: set5B || 0
        }
      });

      if (nextMatchId && winnerId) {
        await tx.bracketMatch.update({
          where: { id: nextMatchId },
          data: { [nextMatchPos]: winnerId }
        });
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al guardar el resultado de la llave' });
  }
});

// Brackets: Update Match Pairs (Manual) (Protected)
router.patch('/bracket-matches/:id', authenticateJWT, requireEntityAccess('bracketMatch'), async (req, res) => {
  const { pairAId, pairBId } = req.body;
  try {
    const match = await prisma.bracketMatch.update({
      where: { id: req.params.id },
      data: { 
        pairAId: pairAId === null ? null : pairAId,
        pairBId: pairBId === null ? null : pairBId
      }
    });
    res.json(match);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar competidores de la llave' });
  }
});

// Brackets: Reset all matches in a bracket (Protected)
router.post('/brackets/:id/reset', authenticateJWT, requireEntityAccess('bracket'), async (req, res) => {
  const bracketId = req.params.id;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.bracketMatch.updateMany({
        where: { bracketId },
        data: {
          pointsA: 0,
          pointsB: 0,
          winnerId: null
        }
      });

      await tx.bracketMatch.updateMany({
        where: { 
          bracketId,
          round: { gt: 1 }
        },
        data: {
          pairAId: null,
          pairBId: null
        }
      });
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting bracket:', error);
    res.status(500).json({ success: false, message: 'Error al reiniciar las eliminatorias' });
  }
});

// Brackets: Random Seed (Protected)
router.post('/brackets/:id/seed', authenticateJWT, requireEntityAccess('bracket'), async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const bracket = await tx.bracket.findUnique({
        where: { id: req.params.id },
        include: { matches: true }
      });

      if (!bracket) throw new Error('Eliminatorias no encontradas');

      // Get pairs in category NOT in any group
      const pairs = await tx.pair.findMany({
        where: { 
          categoryId: bracket.categoryId,
          groups: { none: {} }
        }
      });

      // Find the first round matches (Always Round 1)
      const firstRoundMatches = await tx.bracketMatch.findMany({
        where: { bracketId: bracket.id, round: 1 },
        orderBy: { matchIndex: 'asc' }
      });

      // Shuffle pairs
      const shuffledPairs = [...pairs].sort(() => Math.random() - 0.5);

      // Assign to matches
      for (let i = 0; i < firstRoundMatches.length; i++) {
        const match = firstRoundMatches[i];
        const pA = shuffledPairs[i * 2] || null;
        const pB = shuffledPairs[i * 2 + 1] || null;

        await tx.bracketMatch.update({
          where: { id: match.id },
          data: {
            pairAId: pA?.id || null,
            pairBId: pB?.id || null
          }
        });
      }

      return { success: true };
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al realizar el sorteo' });
  }
});

// Brackets: Delete (Protected)
router.delete('/brackets/:id', authenticateJWT, requireEntityAccess('bracket'), async (req, res) => {
  try {
    await prisma.bracket.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar las eliminatorias' });
  }
});


// ==========================================
// 4. MATCHES ROUTES
// ==========================================

// Matches: Update Result (Protected)
router.post('/matches/:id/result', authenticateJWT, requireEntityAccess('match'), async (req, res) => {
  const { 
    winnerId, pointsA, pointsB, pairAId, pairBId,
    set1A, set1B, set2A, set2B, set3A, set3B, set4A, set4B, set5A, set5B
  } = req.body;
  const matchId = req.params.id;

  try {
    await prisma.$transaction(async (tx) => {
      const match = await tx.match.update({
        where: { id: matchId },
        data: { 
          winnerId, pointsA, pointsB,
          set1A: set1A || 0,
          set1B: set1B || 0,
          set2A: set2A || 0,
          set2B: set2B || 0,
          set3A: set3A || 0,
          set3B: set3B || 0,
          set4A: set4A || 0,
          set4B: set4B || 0,
          set5A: set5A || 0,
          set5B: set5B || 0
        },
        include: { 
          group: { 
            include: { 
              category: { 
                include: { 
                  tournament: true 
                } 
              } 
            } 
          },
          pairA: true,
          pairA2: true,
          pairB: true,
          pairB2: true
        }
      });

      const sport = match.group.category.tournament.sport?.toLowerCase();

      const calculateStats = (matches: any[], targetPairId: string, currentSport: string | undefined) => {
        return matches.reduce((total, m) => {
          const isPlayed = !!m.winnerId;
          const isSitOut = !m.pairBId;
          if (isSitOut) return total;
          if (!isPlayed && m.pointsA === 0 && m.pointsB === 0) return total;

          const isSideA = m.pairAId === targetPairId || m.pairA2Id === targetPairId;
          const isSideB = m.pairBId === targetPairId || m.pairB2Id === targetPairId;
          if (!isSideA && !isSideB) return total;

          if (currentSport === 'futbol') {
            const myPoints = isSideA ? m.pointsA : m.pointsB;
            const opponentPoints = isSideA ? m.pointsB : m.pointsA;
            if (myPoints > opponentPoints) return total + 3;
            if (myPoints === opponentPoints) return total + 1;
            return total;
          } else if (currentSport === 'basquetball') {
            const myPoints = isSideA ? m.pointsA : m.pointsB;
            const opponentPoints = isSideA ? m.pointsB : m.pointsA;
            if (myPoints > opponentPoints) return total + 2;
            return total;
          } else if (currentSport === 'racquetball') {
            const myPoints = isSideA ? m.pointsA : m.pointsB;
            const opponentPoints = isSideA ? m.pointsB : m.pointsA;
            return total + (myPoints - opponentPoints);
          } else if (currentSport === 'pickleball') {
            const myPoints = isSideA ? m.pointsA : m.pointsB;
            return total + myPoints;
          } else {
            return total + (isSideA ? m.pointsA : m.pointsB);
          }
        }, 0);
      };

      const involvedIds = [pairAId, match.pairA2Id, pairBId, match.pairB2Id].filter(id => !!id) as string[];

      for (const pId of involvedIds) {
        const matches_all = await tx.match.findMany({
          where: { 
            OR: [
              { pairAId: pId }, { pairA2Id: pId },
              { pairBId: pId }, { pairB2Id: pId }
            ] 
          }
        });
        const total = calculateStats(matches_all, pId, sport);
        await tx.pair.update({
          where: { id: pId },
          data: { totalScore: total }
        });
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar el marcador del partido' });
  }
});


// ==========================================
// 5. PAIRS ROUTES
// ==========================================

// Pairs: Delete (Protected)
router.delete('/pairs/:id', authenticateJWT, requireEntityAccess('pair'), async (req, res) => {
  try {
    await prisma.pair.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar el competidor' });
  }
});

export default router;
