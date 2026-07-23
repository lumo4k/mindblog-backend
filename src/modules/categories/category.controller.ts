import type { RequestHandler } from 'express';

import { getActiveCategories } from './category.service';

export const getActiveCategoriesController: RequestHandler = async (
    _request,
    response,
    next,
) => {
    try {
        const categories = await getActiveCategories();

        return response.status(200).json({
            categories,
        });
    } catch (error) {
        next(error);
    }
};