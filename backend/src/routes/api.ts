import { Router } from 'express';

import analyticsRoutes from './analytics';
import authRoutes from './auth';
import banRoutes from './bans';
import suspicionRoutes from './suspicion';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use(analyticsRoutes);
router.use(suspicionRoutes);
router.use(banRoutes);

export default router;
