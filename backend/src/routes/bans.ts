import { Router } from 'express';
import { db } from '../db';
import { banIP, requireAuth, unbanIP } from '../middleware';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
    const list = await db.blockedIP.findMany({
        orderBy: { createdAt: 'desc' },
    });
    res.json(list);
});

router.post('/ban', async (req, res): Promise<void> => {
    const { ip, reason } = req.body;
    if (!ip) res.status(400).json({ error: 'Missing IP' });

    await banIP(ip, reason);
    res.json({ message: `Banned ${ip}` });
});

router.post('/unban', async (req, res): Promise<void> => {
    const { ip } = req.body;
    if (!ip) res.status(400).json({ error: 'Missing IP' });

    await unbanIP(ip);
    res.json({ message: `Unbanned ${ip}` });
});

router.get('/userbans', async (req, res): Promise<void> => {
    const list = await db.bannedUser.findMany({
        orderBy: { createdAt: 'desc' },
    });
    res.json(list);
});

router.post('/userban', async (req, res): Promise<void> => {
    const { userId, username, reason } = req.body;
    if (!userId || !username) {
        res.status(400).json({ error: 'Missing userId or username' });
    }

    await db.bannedUser.upsert({
        where: { userId },
        update: { reason, username },
        create: { userId, username, reason },
    });

    res.json({ message: `Banned ${username}` });
});

router.post('/userunban', async (req, res): Promise<void> => {
    const { userId } = req.body;
    if (!userId) res.status(400).json({ error: 'Missing userId' });

    await db.bannedUser.delete({ where: { userId } }).catch(() => {});
    res.json({ message: `Unbanned user ${userId}` });
});

export default router;
