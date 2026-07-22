import { Router } from 'express';

import { userRouter } from '../modules/users/user.routes';

export const router = Router();

router.get('/health', (_request, response) => {
    return response.status(200).json({
        status: 'ok',
        message: 'API funcionando corretamente',
    });
});

router.use('/users', userRouter);