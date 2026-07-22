import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { uploadCoverImage } from '../../middlewares/upload-cover-image';
import {
    createArticleController,
    getArticleCoverImageController,
    getRecentArticlesController,
} from './article.controller';

export const articleRouter = Router();

articleRouter.post(
    '/',
    authenticate,
    uploadCoverImage.single('coverImage'),
    createArticleController,
);

articleRouter.get(
    '/:articleId/cover-image',
    getArticleCoverImageController,
);

articleRouter.get(
    '/recent',
    getRecentArticlesController,
);