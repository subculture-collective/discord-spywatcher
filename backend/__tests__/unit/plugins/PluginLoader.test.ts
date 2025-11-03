import { PluginLoader } from '../../../src/plugins/PluginLoader';
import { PluginHookType } from '../../../src/plugins/types';

// Mock dependencies
jest.mock('../../../src/db', () => ({
    db: {},
}));
jest.mock('../../../src/utils/redis', () => ({
    getRedisClient: jest.fn(() => null),
}));
jest.mock('../../../src/services/websocket', () => ({
    websocketService: {},
}));

// Mock fs module
jest.mock('fs', () => ({
    existsSync: jest.fn(() => true),
    mkdirSync: jest.fn(),
    readdirSync: jest.fn(() => []),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    appendFileSync: jest.fn(),
}));

describe('PluginLoader', () => {
    let pluginLoader: PluginLoader;

    beforeEach(() => {
        jest.clearAllMocks();

        pluginLoader = new PluginLoader({
            pluginDir: '/test/plugins',
            dataDir: '/test/data',
            autoStart: false,
        });
    });

    describe('constructor', () => {
        it('should create plugin loader with config', () => {
            expect(pluginLoader).toBeDefined();
        });
    });

    describe('executeHooks', () => {
        it('should execute hooks and return data', async () => {
            const testData = { value: 'test' };
            const result = await pluginLoader.executeHooks(PluginHookType.DISCORD_READY, testData);
            expect(result).toEqual(testData);
        });
    });

    describe('getLoadedPlugins', () => {
        it('should return all loaded plugins', async () => {
            const plugins = pluginLoader.getLoadedPlugins();
            expect(Array.isArray(plugins)).toBe(true);
        });
    });

    describe('getPlugin', () => {
        it('should return undefined for non-existent plugin', () => {
            const plugin = pluginLoader.getPlugin('non-existent');
            expect(plugin).toBeUndefined();
        });
    });
});
