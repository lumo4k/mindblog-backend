import { Router } from 'express';

export const router = Router();

router.get('/health', (_request, response) => {
    return response.status(200).json({
        status: 'ok',
        message: 'API funcionando corretamente',
    });
});