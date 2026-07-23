import { Router } from 'express';

import { getActiveCategoriesController } from './category.controller';

export const categoryRouter = Router();

categoryRouter.get(
    '/',
    getActiveCategoriesController,
);