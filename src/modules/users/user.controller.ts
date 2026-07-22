import type { RequestHandler } from 'express';

import { createUser } from './user.service';

export const createUserController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const {
            fullName,
            email,
            password,
            confirmPassword,
        } = request.body ?? {};

        const user = await createUser({
            fullName: typeof fullName === 'string' ? fullName : '',
            email: typeof email === 'string' ? email : '',
            password: typeof password === 'string' ? password : '',
            confirmPassword:
                typeof confirmPassword === 'string' ? confirmPassword : '',
        });

        return response.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            user,
        });
    } catch (error) {
        next(error);
    }
};