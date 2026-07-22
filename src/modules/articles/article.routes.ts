import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { uploadCoverImage } from '../../middlewares/upload-cover-image';
import {
    createArticleController,
    getArticleCoverImageController,
    getArticleDetailsController,
    getMostLikedArticlesController,
    getRecentArticlesController,
    likeArticleController,
    unlikeArticleController,
    updateArticleController,
    deleteArticleController,
} from './article.controller';

export const articleRouter = Router();

articleRouter.post(
    '/',
    authenticate,
    uploadCoverImage.single('coverImage'),
    createArticleController,
);

articleRouter.get(
    '/recent',
    getRecentArticlesController,
);

articleRouter.get(
    '/most-liked',
    getMostLikedArticlesController,
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
    '/:articleId/cover-image',
    getArticleCoverImageController,
);

articleRouter.patch(
    '/:articleId',
    authenticate,
    uploadCoverImage.single('coverImage'),
    updateArticleController,
);

articleRouter.delete(
    '/:articleId',
    authenticate,
    deleteArticleController,
);

articleRouter.get(
    '/:articleId',
    getArticleDetailsController,
);
