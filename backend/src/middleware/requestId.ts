import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function attachRequestId(
    req: Request,
    res: Response,
    next: NextFunction
) {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
}
