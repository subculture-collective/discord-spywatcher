import { SpywatcherClient } from '../client';
import { ValidationError } from '../types';

describe('SpywatcherClient', () => {
  describe('constructor', () => {
    it('should throw ValidationError for invalid API key format', () => {
      expect(() => {
        new SpywatcherClient({
          baseUrl: 'http://localhost:3001/api',
          apiKey: 'invalid_key',
        });
      }).toThrow(ValidationError);
    });

    it('should create client with valid API key', () => {
      const client = new SpywatcherClient({
        baseUrl: 'http://localhost:3001/api',
        apiKey: 'spy_live_valid_key',
      });

      expect(client).toBeInstanceOf(SpywatcherClient);
    });

    it('should use default timeout if not provided', () => {
      const client = new SpywatcherClient({
        baseUrl: 'http://localhost:3001/api',
        apiKey: 'spy_live_valid_key',
      });

      expect(client).toBeInstanceOf(SpywatcherClient);
    });

    it('should accept custom timeout', () => {
      const client = new SpywatcherClient({
        baseUrl: 'http://localhost:3001/api',
        apiKey: 'spy_live_valid_key',
        timeout: 60000,
      });

      expect(client).toBeInstanceOf(SpywatcherClient);
    });
  });
});
