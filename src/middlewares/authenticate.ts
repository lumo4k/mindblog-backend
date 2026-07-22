import type { RequestHandler } from 'express';
import {
    JsonWebTokenError,
    TokenExpiredError,
    verify,
} from 'jsonwebtoken';

import { AppError } from '../errors/app-error';

export const authenticate: RequestHandler = (
    request,
    response,
    next,
) => {
    try {
        const token = request.cookies?.auth_token;

        if (typeof token !== 'string' || !token) {
            throw new AppError('Usuário não autenticado', 401);
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error('A variável JWT_SECRET não foi configurada');
        }

        const payload = verify(token, jwtSecret);

        if (typeof payload === 'string' || !payload.sub) {
            throw new AppError('Token de autenticação inválido', 401);
        }

        const userId = Number(payload.sub);

        if (!Number.isInteger(userId) || userId <= 0) {
            throw new AppError('Token de autenticação inválido', 401);
        }

        response.locals.userId = userId;

        return next();
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }

        if (
            error instanceof TokenExpiredError ||
            error instanceof JsonWebTokenError
        ) {
            return next(
                new AppError('Sessão inválida ou expirada', 401),
            );
        }

        return next(error);
    }
};