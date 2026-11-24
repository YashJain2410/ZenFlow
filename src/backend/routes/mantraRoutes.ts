import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { 
  createSession, 
  getSessions, 
  getSessionById, 
  updateSession 
} from '../controllers/mantraController';

const router = Router();

// Apply authentication middleware to all mantra routes
router.use(requireAuth);

router.post('/', createSession);
router.get('/', getSessions);
router.get('/:id', getSessionById);
router.patch('/:id', updateSession);

export default router;
