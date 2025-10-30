import express, { Application } from 'express';
import request from 'supertest';

import publicApiRoutes from '../../../src/routes/publicApi';

// Mock the middleware
jest.mock('../../../src/middleware/rateLimiter', () => ({
  publicApiLimiter: jest.fn((req, res, next) => next()),
}));

// Mock the apiKey middleware
jest.mock('../../../src/middleware/apiKey', () => ({
  requireApiKey: jest.fn((req, res, next) => {
    req.user = {
      userId: 'test-user-id',
      discordId: '123456789',
      username: 'testuser#1234',
      role: 'USER',
      access: true,
    };
    next();
  }),
}));

describe('Public API Routes', () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/public', publicApiRoutes);
  });

  describe('GET /api/public/docs', () => {
    it('should return API documentation', async () => {
      const response = await request(app).get('/api/public/docs');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('authentication');
      expect(response.body).toHaveProperty('rateLimits');
      expect(response.body).toHaveProperty('types');
    });

    it('should include SDK information', async () => {
      const response = await request(app).get('/api/public/docs');

      expect(response.body).toHaveProperty('sdk');
      expect(response.body.sdk).toHaveProperty('name');
      expect(response.body.sdk.name).toBe('@spywatcher/sdk');
    });

    it('should include all major endpoint categories', async () => {
      const response = await request(app).get('/api/public/docs');

      const endpoints = response.body.endpoints;
      expect(endpoints).toHaveProperty('health');
      expect(endpoints).toHaveProperty('analytics');
      expect(endpoints).toHaveProperty('suspicion');
      expect(endpoints).toHaveProperty('timeline');
      expect(endpoints).toHaveProperty('bans');
      expect(endpoints).toHaveProperty('auth');
    });

    it('should include code examples', async () => {
      const response = await request(app).get('/api/public/docs');

      expect(response.body).toHaveProperty('examples');
      expect(response.body.examples).toHaveProperty('curl');
      expect(response.body.examples).toHaveProperty('javascript');
      expect(response.body.examples).toHaveProperty('python');
    });
  });

  describe('GET /api/public/openapi', () => {
    it('should return OpenAPI specification', async () => {
      const response = await request(app).get('/api/public/openapi');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('openapi');
      expect(response.body.openapi).toBe('3.0.0');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
      expect(response.body).toHaveProperty('components');
    });

    it('should include security schemes', async () => {
      const response = await request(app).get('/api/public/openapi');

      expect(response.body.components).toHaveProperty('securitySchemes');
      expect(response.body.components.securitySchemes).toHaveProperty('ApiKeyAuth');
    });

    it('should define health check endpoint', async () => {
      const response = await request(app).get('/api/public/openapi');

      expect(response.body.paths).toHaveProperty('/health');
      expect(response.body.paths['/health']).toHaveProperty('get');
    });
  });
});
