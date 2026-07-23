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
    createArticleCommentController,
    getArticleCommentsController,
    likeCommentController,
    unlikeCommentController,
    updateArticleCommentController,
    deleteArticleCommentController,
    getArticlesController,
    getArticleForEditController,
} from './article.controller';
import { optionalAuthenticate } from '../../middlewares/optional-authenticate';

export const articleRouter = Router();

articleRouter.get(
    '/',
    getArticlesController,
);

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
    '/:articleId/comments',
    optionalAuthenticate,
    createArticleCommentController,
);

articleRouter.get(
    '/:articleId/comments',
    getArticleCommentsController,
);

articleRouter.post(
    '/comments/:commentId/likes',
    authenticate,
    likeCommentController,
);

articleRouter.delete(
    '/comments/:commentId/likes',
    authenticate,
    unlikeCommentController,
);

articleRouter.patch(
    '/comments/:commentId',
    authenticate,
    updateArticleCommentController,
);

articleRouter.delete(
    '/comments/:commentId',
    authenticate,
    deleteArticleCommentController,
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

articleRouter.get(
    '/:articleId/edit',
    authenticate,
    getArticleForEditController,
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
    optionalAuthenticate,
    getArticleDetailsController,
);

