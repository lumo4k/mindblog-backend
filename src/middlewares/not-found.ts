import type { RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (
    request,
    response,
) => {
    return response.status(404).json({
        message: 'Rota não encontrada',
        method: request.method,
        path: request.originalUrl,
    });
};