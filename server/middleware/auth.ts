import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const JWT_SECRET = process.env.JWT_SECRET || 'matchup_default_secret_key_change_me_in_prod';

export interface UserPayload {
  id: number;
  username: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

// Middleware to verify JWT token
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer <token>
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ success: false, message: 'Token inválido o expirado' });
      }
      req.user = decoded as UserPayload;
      next();
    });
  } else {
    res.status(401).json({ success: false, message: 'Token de autenticación requerido' });
  }
};

// Middleware to enforce specific roles
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Permiso denegado para este rol' });
    }
    next();
  };
};

// Helper to resolve parent tournamentId from various sub-entity types
export const getTournamentIdFromEntity = async (entityType: string, id: string): Promise<string | null> => {
  try {
    if (entityType === 'tournament') return id;
    
    if (entityType === 'category') {
      const cat = await prisma.category.findUnique({ where: { id }, select: { tournamentId: true } });
      return cat?.tournamentId || null;
    }
    
    if (entityType === 'group') {
      const grp = await prisma.group.findUnique({ 
        where: { id }, 
        select: { category: { select: { tournamentId: true } } } 
      });
      return grp?.category?.tournamentId || null;
    }
    
    if (entityType === 'bracket') {
      const brk = await prisma.bracket.findUnique({
        where: { id },
        select: { category: { select: { tournamentId: true } } }
      });
      return brk?.category?.tournamentId || null;
    }
    
    if (entityType === 'pair') {
      const pair = await prisma.pair.findUnique({
        where: { id },
        select: { category: { select: { tournamentId: true } } }
      });
      return pair?.category?.tournamentId || null;
    }
    
    if (entityType === 'match') {
      const mtc = await prisma.match.findUnique({
        where: { id },
        select: { group: { select: { category: { select: { tournamentId: true } } } } }
      });
      return mtc?.group?.category?.tournamentId || null;
    }
    
    if (entityType === 'bracketMatch') {
      const bm = await prisma.bracketMatch.findUnique({
        where: { id },
        select: { bracket: { select: { category: { select: { tournamentId: true } } } } }
      });
      return bm?.bracket?.category?.tournamentId || null;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

// Middleware to enforce that only the tournament creator (or an admin) can mutate an entity
export const requireEntityAccess = (entityType: string, idParamName = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    const { role, id: userId } = req.user;
    // Admins or Superadmins have global access
    if (role === 'ADMIN' || role === 'SUPERADMIN') {
      return next();
    }

    // Attempt to extract entity ID from params, body, or query
    const entityId = req.params[idParamName] || req.body[idParamName] || req.query[idParamName] as string;
    if (!entityId) {
      return res.status(400).json({ success: false, message: `ID de ${entityType} requerido` });
    }

    const tournamentId = await getTournamentIdFromEntity(entityType, entityId);
    if (!tournamentId) {
      return res.status(404).json({ success: false, message: `Recurso de ${entityType} o torneo asociado no encontrado` });
    }

    try {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { creatorId: true }
      });

      if (!tournament) {
        return res.status(404).json({ success: false, message: 'Torneo no encontrado' });
      }

      if (tournament.creatorId !== userId) {
        return res.status(403).json({ success: false, message: 'No tienes permiso para gestionar este torneo' });
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error de servidor al verificar permisos de acceso' });
    }
  };
};
