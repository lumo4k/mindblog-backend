import type { RequestHandler } from 'express';

import { getAuthenticatedUser, loginUser } from './auth.service';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const loginController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const { email, password } = request.body ?? {};

        const { token, user } = await loginUser({
            email: typeof email === 'string' ? email : '',
            password: typeof password === 'string' ? password : '',
        });

        response.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
            path: '/',
        });

        return response.status(200).json({
            message: 'Login realizado com sucesso',
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const authenticatedUserController: RequestHandler = async (
    _request,
    response,
    next,
) => {
    try {
        const userId = Number(response.locals.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            throw new Error(
                'ID do usuário não foi definido pelo middleware de autenticação',
            );
        }

        const user = await getAuthenticatedUser(userId);

        return response.status(200).json({
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const logoutController: RequestHandler = (
    _request,
    response,
) => {
    response.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    return response.status(200).json({
        message: 'Logout realizado com sucesso',
    });
};