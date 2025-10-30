import { Router } from 'express';

import adminPrivacyRoutes from './adminPrivacy';
import analyticsRoutes from './analytics';
import authRoutes from './auth';
import banRoutes from './bans';
import ipManagementRoutes from './ipManagement';
import monitoringRoutes from './monitoring';
import privacyRoutes from './privacy';
import publicApiRoutes from './publicApi';
import suspicionRoutes from './suspicion';
import timelineRoutes from './timeline';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public API documentation routes
router.use('/public', publicApiRoutes);

router.use('/auth', authRoutes);
router.use('/privacy', privacyRoutes);
router.use('/admin/privacy', adminPrivacyRoutes);
router.use('/admin/ip-management', ipManagementRoutes);
router.use('/admin/monitoring', monitoringRoutes);
router.use(analyticsRoutes);
router.use(suspicionRoutes);
router.use(banRoutes);
router.use(timelineRoutes);

export default router;
