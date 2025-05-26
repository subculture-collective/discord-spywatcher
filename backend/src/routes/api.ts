import { Router } from 'express';

import analyticsRoutes from './analytics';
import authRoutes from './auth';
import banRoutes from './bans';
import suspicionRoutes from './suspicion';

const router = Router();

router.use('/auth', authRoutes);
router.use(analyticsRoutes);
router.use(suspicionRoutes);
router.use(banRoutes);

export default router;
