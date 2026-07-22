import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { uploadCoverImage } from '../../middlewares/upload-cover-image';
import {
    createArticleController,
    getArticleCoverImageController,
    getRecentArticlesController,
    likeArticleController,
    unlikeArticleController,
    getMostLikedArticlesController,
    getArticleDetailsController,
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

articleRouter.post(
    '/:articleId/likes',
    authenticate,
    likeArticleController,
);

articleRouter.delete(
    '/:articleId/likes',
    authenticate,
    unlikeArticleController,
);

articleRouter.get(
    '/most-liked',
    getMostLikedArticlesController,
);

articleRouter.get(
    '/:articleId',
    getArticleDetailsController,
);