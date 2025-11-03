import { Router } from 'express';
import redoc from 'redoc-express';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from '../config/openapi';
import adminPrivacyRoutes from './adminPrivacy';
import analyticsRoutes from './analytics';
import analyticsRulesRoutes from './analyticsRules';
import authRoutes from './auth';
import banRoutes from './bans';
import incidentsRoutes from './incidents';
import ipManagementRoutes from './ipManagement';
import metricsAnalyticsRoutes from './metricsAnalytics';
import monitoringRoutes from './monitoring';
import pluginsRoutes from './plugins';
import privacyRoutes from './privacy';
import publicApiRoutes from './publicApi';
import quotaManagementRoutes from './quotaManagement';
import statusRoutes from './status';
import suspicionRoutes from './suspicion';
import timelineRoutes from './timeline';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// OpenAPI/Swagger documentation endpoints
router.use('/docs', swaggerUi.serve);
router.get(
    '/docs',
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'Spywatcher API Documentation',
        customCss: '.swagger-ui .topbar { display: none }',
    })
);

// Serve OpenAPI spec as JSON
router.get('/openapi.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// ReDoc documentation - alternative clean view
router.get(
    '/redoc',
    redoc({
        title: 'Spywatcher API Documentation',
        specUrl: '/api/openapi.json',
        redocOptions: {
            theme: {
                colors: {
                    primary: {
                        main: '#5865F2', // Discord blue
                    },
                },
            },
        },
    })
);

// Public API documentation routes
router.use('/public', publicApiRoutes);

// Public status page routes
router.use('/status', statusRoutes);

router.use('/auth', authRoutes);
router.use('/privacy', privacyRoutes);
router.use('/admin/privacy', adminPrivacyRoutes);
router.use('/admin/ip-management', ipManagementRoutes);
router.use('/admin/monitoring', monitoringRoutes);
router.use('/admin/incidents', incidentsRoutes);
router.use('/quota', quotaManagementRoutes);
router.use('/metrics', metricsAnalyticsRoutes);
router.use('/plugins', pluginsRoutes);
router.use('/analytics', analyticsRulesRoutes);
router.use(analyticsRoutes);
router.use(suspicionRoutes);
router.use(banRoutes);
router.use(timelineRoutes);

export default router;
