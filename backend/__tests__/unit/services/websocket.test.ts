import { Server as HttpServer } from 'http';
import { AddressInfo } from 'net';

import ioClient from 'socket.io-client';

import { WebSocketService } from '../../../src/services/websocket';
import { generateAccessToken } from '../../../src/utils/auth';

type ClientSocket = any;

describe('WebSocketService', () => {
    let httpServer: HttpServer;
    let websocketService: WebSocketService;
    let clientSocket: ClientSocket;
    let serverPort: number;

    beforeAll((done) => {
        // Create HTTP server
        httpServer = new HttpServer();
        httpServer.listen(0, () => {
            serverPort = (httpServer.address() as AddressInfo).port;
            done();
        });
    });

    afterAll((done) => {
        httpServer.close(() => {
            done();
        });
    });

    beforeEach(() => {
        websocketService = new WebSocketService();
        websocketService.setupWebSocket(httpServer);
    });

    afterEach(async () => {
        if (clientSocket) {
            clientSocket.disconnect();
        }
        websocketService.close();
    });

    describe('setupWebSocket', () => {
        it('should initialize WebSocket server', () => {
            const io = websocketService.getIO();
            expect(io).toBeDefined();
            expect(io).not.toBeNull();
        });

        it('should accept authenticated connections', (done) => {
            const token = generateAccessToken({
                userId: 'test-user',
                discordId: '123456789',
                username: 'TestUser',
                role: 'USER',
                access: true,
            });

            clientSocket = ioClient(`http://localhost:${serverPort}`, {
                auth: { token },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                expect(clientSocket.connected).toBe(true);
                done();
            });

            clientSocket.on('connect_error', (error: Error) => {
                done(error);
            });
        });

        it('should reject unauthenticated connections', (done) => {
            clientSocket = ioClient(`http://localhost:${serverPort}`, {
                auth: { token: null },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                done(new Error('Should not connect without token'));
            });

            clientSocket.on('connect_error', (error: Error) => {
                expect(error.message).toContain('Authentication required');
                done();
            });
        });

        it('should reject invalid tokens', (done) => {
            clientSocket = ioClient(`http://localhost:${serverPort}`, {
                auth: { token: 'invalid-token' },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                done(new Error('Should not connect with invalid token'));
            });

            clientSocket.on('connect_error', (error: Error) => {
                expect(error.message).toContain('Invalid token');
                done();
            });
        });
    });

    describe('Room subscriptions', () => {
        let token: string;

        beforeEach((done) => {
            token = generateAccessToken({
                userId: 'test-user',
                discordId: '123456789',
                username: 'TestUser',
                role: 'USER',
                access: true,
            });

            clientSocket = ioClient(`http://localhost:${serverPort}`, {
                auth: { token },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                done();
            });
        });

        it('should allow subscribing to analytics room', (done) => {
            const guildId = 'test-guild-123';

            clientSocket.emit('subscribe:analytics', guildId);

            // Give some time for subscription to process
            setTimeout(() => {
                // Emit event to analytics room
                websocketService.emitAnalyticsUpdate(guildId, {
                    test: 'data',
                });

                clientSocket.on(
                    'analytics:update',

                    (data: any) => {
                        expect(data).toBeDefined();
                        expect(data.guildId).toBe(guildId);
                        done();
                    }
                );
            }, 100);
        });

        it('should allow subscribing to guild room', (done) => {
            const guildId = 'test-guild-123';

            clientSocket.emit('subscribe:guild', guildId);

            // Give some time for subscription to process
            setTimeout(() => {
                // Emit event to guild room
                websocketService.emitNewMessage(guildId, {
                    userId: 'user-1',
                    username: 'TestUser',
                    channelId: 'channel-1',
                    channelName: 'general',
                    timestamp: new Date(),
                });

                clientSocket.on(
                    'message:new',

                    (data: any) => {
                        expect(data).toBeDefined();
                        expect(data.username).toBe('TestUser');
                        done();
                    }
                );
            }, 100);
        });

        it('should allow unsubscribing from analytics room', (done) => {
            const guildId = 'test-guild-123';

            clientSocket.emit('subscribe:analytics', guildId);

            setTimeout(() => {
                clientSocket.emit('unsubscribe:analytics', guildId);

                setTimeout(() => {
                    // This event should not be received
                    let eventReceived = false;

                    clientSocket.on('analytics:update', () => {
                        eventReceived = true;
                    });

                    websocketService.emitAnalyticsUpdate(guildId, {
                        test: 'data',
                    });

                    setTimeout(() => {
                        expect(eventReceived).toBe(false);
                        done();
                    }, 100);
                }, 100);
            }, 100);
        });
    });

    describe('Event emissions', () => {
        it('should emit new message events', (done) => {
            const guildId = 'test-guild-123';
            const token = generateAccessToken({
                userId: 'test-user',
                discordId: '123456789',
                username: 'TestUser',
                role: 'USER',
                access: true,
            });

            clientSocket = ioClient(`http://localhost:${serverPort}`, {
                auth: { token },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('subscribe:guild', guildId);

                setTimeout(() => {
                    websocketService.emitNewMessage(guildId, {
                        userId: 'user-1',
                        username: 'TestUser',
                        channelId: 'channel-1',
                        channelName: 'general',
                        timestamp: new Date(),
                    });
                }, 100);
            });

            clientSocket.on(
                'message:new',

                (data: any) => {
                    expect(data.username).toBe('TestUser');
                    expect(data.channelName).toBe('general');
                    done();
                }
            );
        });

        it('should emit multi-client alerts', (done) => {
            const guildId = 'test-guild-123';
            const token = generateAccessToken({
                userId: 'test-user',
                discordId: '123456789',
                username: 'TestUser',
                role: 'USER',
                access: true,
            });

            clientSocket = ioClient(`http://localhost:${serverPort}`, {
                auth: { token },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('subscribe:guild', guildId);

                setTimeout(() => {
                    websocketService.emitMultiClientAlert(guildId, {
                        userId: 'user-1',
                        username: 'TestUser',
                        platforms: ['desktop', 'mobile'],
                        timestamp: new Date(),
                    });
                }, 100);
            });

            clientSocket.on(
                'alert:multiClient',

                (data: any) => {
                    expect(data.username).toBe('TestUser');
                    expect(data.platforms).toEqual(['desktop', 'mobile']);
                    done();
                }
            );
        });

        it('should emit role change events', (done) => {
            const guildId = 'test-guild-123';
            const token = generateAccessToken({
                userId: 'test-user',
                discordId: '123456789',
                username: 'TestUser',
                role: 'USER',
                access: true,
            });

            clientSocket = ioClient(`http://localhost:${serverPort}`, {
                auth: { token },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('subscribe:guild', guildId);

                setTimeout(() => {
                    websocketService.emitRoleChange(guildId, {
                        userId: 'user-1',
                        username: 'TestUser',
                        addedRoles: ['Moderator'],
                        timestamp: new Date(),
                    });
                }, 100);
            });

            clientSocket.on(
                'role:change',

                (data: any) => {
                    expect(data.username).toBe('TestUser');
                    expect(data.addedRoles).toEqual(['Moderator']);
                    done();
                }
            );
        });

        it('should emit user join events', (done) => {
            const guildId = 'test-guild-123';
            const token = generateAccessToken({
                userId: 'test-user',
                discordId: '123456789',
                username: 'TestUser',
                role: 'USER',
                access: true,
            });

            clientSocket = ioClient(`http://localhost:${serverPort}`, {
                auth: { token },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('subscribe:guild', guildId);

                setTimeout(() => {
                    websocketService.emitUserJoin(guildId, {
                        userId: 'user-1',
                        username: 'NewUser',
                        accountAgeDays: 30,
                        timestamp: new Date(),
                    });
                }, 100);
            });

            clientSocket.on(
                'user:join',

                (data: any) => {
                    expect(data.username).toBe('NewUser');
                    expect(data.accountAgeDays).toBe(30);
                    done();
                }
            );
        });
    });
});
