import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export const optionalAuthenticate: RequestHandler = (
    request,
    response,
    next,
) => {
    const token = request.cookies.auth_token;

    if (!token) {
        return next();
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        return next();
    }

    try {
        const decoded = jwt.verify(
            token,
            jwtSecret,
        ) as JwtPayload;

        const userId = Number(decoded.sub);

        if (Number.isInteger(userId) && userId > 0) {
            response.locals.userId = userId;
        }
    } catch {
        response.clearCookie('auth_token', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
    }

    return next();
};