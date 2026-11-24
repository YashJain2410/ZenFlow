import { Response } from 'express';
import { MantraSession } from '../models/MantraSession';
import { AuthRequest } from '../middleware/auth';

// Utility for consistent error responses
const handleError = (res: Response, error: any, message: string = 'Internal Server Error') => {
  console.error(message, error);
  if (error && error.name === 'ValidationError') {
    res.status(400).json({ error: 'Validation Error', details: error.message });
  } else {
    res.status(500).json({ error: message });
  }
};

// Sanitization utility
const sanitizeText = (text: string) => {
  if (!text) return text;
  // Very basic sanitization, stripping null bytes and limiting script tags
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/\0/g, '');
};

export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { 
      mantraId, 
      customMantra, 
      duration, 
      actualDuration, 
      status, 
      moodBefore, 
      moodAfter, 
      reflection, 
      audioMode 
    } = req.body;

    // Validate required fields
    if (!mantraId || typeof duration !== 'number' || !status) {
      res.status(400).json({ error: 'Missing required fields: mantraId, duration, status' });
      return;
    }

    // Validate status enum
    const validStatuses = ['completed', 'interrupted', 'abandoned'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const session = new MantraSession({
      userId,
      mantraId,
      customMantra: sanitizeText(customMantra),
      duration,
      actualDuration: actualDuration || 0,
      status,
      moodBefore: sanitizeText(moodBefore),
      moodAfter: sanitizeText(moodAfter),
      reflection: sanitizeText(reflection),
      audioMode: audioMode || 'silent',
      completedAt: status === 'completed' ? new Date() : undefined
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    handleError(res, error, 'Failed to create session');
  }
};

export const getSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const skip = parseInt(req.query.skip as string) || 0;

    // Ensure we only fetch sessions for the authenticated user
    const sessions = await MantraSession.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await MantraSession.countDocuments({ userId });

    res.json({
      sessions,
      pagination: {
        total,
        limit,
        skip
      }
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch sessions');
  }
};

export const getSessionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessionId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const session = await MantraSession.findById(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Authorization: verify the session belongs to the requesting user
    if (session.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this session' });
      return;
    }

    res.json(session);
  } catch (error) {
    handleError(res, error, 'Failed to fetch session');
  }
};

export const updateSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessionId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const session = await MantraSession.findById(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Authorization: verify ownership
    if (session.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this session' });
      return;
    }

    // Fields allowed to be updated after creation (e.g., adding reflection, updating status if interrupted)
    const { actualDuration, status, moodAfter, reflection } = req.body;

    if (actualDuration !== undefined) session.actualDuration = actualDuration;
    if (status !== undefined) {
      const validStatuses = ['completed', 'interrupted', 'abandoned'];
      if (validStatuses.includes(status)) {
        session.status = status;
        if (status === 'completed' && !session.completedAt) {
          session.completedAt = new Date();
        }
      } else {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
    }
    
    if (moodAfter !== undefined) session.moodAfter = sanitizeText(moodAfter);
    if (reflection !== undefined) session.reflection = sanitizeText(reflection);

    await session.save();
    res.json(session);
  } catch (error) {
    handleError(res, error, 'Failed to update session');
  }
};
