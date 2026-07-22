import { Router } from 'express';

import { userRouter } from '../modules/users/user.routes';
import { authRouter } from '../modules/auth/auth.routes';

export const router = Router();

router.get('/health', (_request, response) => {
    return response.status(200).json({
        status: 'ok',
        message: 'API funcionando corretamente',
    });
});

router.use('/users', userRouter);

router.use('/auth', authRouter);