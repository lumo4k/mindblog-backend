import type { RequestHandler } from 'express';

import { AppError } from '../../errors/app-error';
import {
    createArticle,
    getArticleCoverImage,
    getRecentArticles,
    likeArticle,
    unlikeArticle,
    getMostLikedArticles,
    getArticleDetails,
    updateArticle,
    deleteArticle,
    createArticleComment,
    getArticleComments,
    likeComment,
    unlikeComment,
    updateArticleComment,
    deleteArticleComment,
} from './article.service';

function parseTags(value: unknown): string[] {
    if (Array.isArray(value)) {
        if (!value.every((tag) => typeof tag === 'string')) {
            throw new AppError('As tags enviadas são inválidas', 400);
        }

        return value;
    }

    if (typeof value !== 'string' || !value.trim()) {
        return [];
    }

    try {
        const parsedValue: unknown = JSON.parse(value);

        if (
            !Array.isArray(parsedValue) ||
            !parsedValue.every((tag) => typeof tag === 'string')
        ) {
            throw new AppError(
                'As tags devem ser enviadas como uma lista de textos',
                400,
            );
        }

        return parsedValue;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            'O formato das tags enviadas é inválido',
            400,
        );
    }
}

export const createArticleController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const authorId = Number(response.locals.userId);

        if (!Number.isInteger(authorId) || authorId <= 0) {
            throw new Error(
                'ID do usuário não foi definido pelo middleware de autenticação',
            );
        }

        const {
            title,
            summary,
            content,
            categoryId,
            tags,
        } = request.body ?? {};

        const article = await createArticle({
            authorId,

            categoryId: Number(categoryId),

            title:
                typeof title === 'string'
                    ? title
                    : '',

            summary:
                typeof summary === 'string'
                    ? summary
                    : '',

            content:
                typeof content === 'string'
                    ? content
                    : '',

            tags: parseTags(tags),

            coverImage: request.file?.buffer,
            coverImageMimeType: request.file?.mimetype,
        });

        return response.status(201).json({
            message: 'Artigo criado com sucesso',
            article,
        });
    } catch (error) {
        next(error);
    }
};

export const getArticleCoverImageController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const articleId = Number(request.params.articleId);

        const { image, mimeType } =
            await getArticleCoverImage(articleId);

        const imageBuffer = Buffer.from(image);

        response.setHeader('Content-Type', mimeType);
        response.setHeader(
            'Content-Length',
            imageBuffer.length,
        );

        response.setHeader(
            'Cache-Control',
            'public, max-age=3600',
        );

        return response
            .status(200)
            .send(imageBuffer);
    } catch (error) {
        next(error);
    }
};

export const getRecentArticlesController: RequestHandler = async (
    _request,
    response,
    next,
) => {
    try {
        const articles = await getRecentArticles();

        return response.status(200).json({
            articles,
        });
    } catch (error) {
        next(error);
    }
};

export const likeArticleController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const userId = Number(response.locals.userId);
        const articleId = Number(request.params.articleId);

        const result = await likeArticle(userId, articleId);

        return response.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const unlikeArticleController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const userId = Number(response.locals.userId);
        const articleId = Number(request.params.articleId);

        const result = await unlikeArticle(userId, articleId);

        return response.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const getMostLikedArticlesController: RequestHandler = async (
    _request,
    response,
    next,
) => {
    try {
        const articles = await getMostLikedArticles();

        return response.status(200).json({
            articles,
        });
    } catch (error) {
        next(error);
    }
};

export const getArticleDetailsController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const articleId = Number(request.params.articleId);

        const article = await getArticleDetails(articleId);

        return response.status(200).json({
            article,
        });
    } catch (error) {
        next(error);
    }
};

export const updateArticleController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const articleId = Number(request.params.articleId);
        const authorId = Number(response.locals.userId);

        const {
            title,
            summary,
            content,
            categoryId,
            tags,
        } = request.body;

        const article = await updateArticle({
            articleId,
            authorId,

            title:
                typeof title === 'string'
                    ? title
                    : '',

            summary:
                typeof summary === 'string'
                    ? summary
                    : '',

            content:
                typeof content === 'string'
                    ? content
                    : '',

            categoryId: Number(categoryId),
            tags: parseTags(tags),

            coverImage: request.file?.buffer,
            coverImageMimeType: request.file?.mimetype,
        });

        return response.status(200).json({
            article,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteArticleController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const articleId = Number(request.params.articleId);
        const authorId = Number(response.locals.userId);

        await deleteArticle(articleId, authorId);

        return response.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const createArticleCommentController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const articleId = Number(request.params.articleId);
        const userId = Number(response.locals.userId);

        const content =
            typeof request.body.content === 'string'
                ? request.body.content
                : '';

        const comment = await createArticleComment({
            articleId,
            userId,
            content,
        });

        return response.status(201).json({
            comment,
        });
    } catch (error) {
        next(error);
    }
};

export const getArticleCommentsController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const articleId = Number(request.params.articleId);

        const comments = await getArticleComments(articleId);

        return response.status(200).json({
            comments,
        });
    } catch (error) {
        next(error);
    }
};

export const likeCommentController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const userId = Number(response.locals.userId);
        const commentId = Number(request.params.commentId);

        const result = await likeComment(userId, commentId);

        return response.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const unlikeCommentController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const userId = Number(response.locals.userId);
        const commentId = Number(request.params.commentId);

        const result = await unlikeComment(userId, commentId);

        return response.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const updateArticleCommentController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const commentId = Number(request.params.commentId);
        const userId = Number(response.locals.userId);

        const content =
            typeof request.body.content === 'string'
                ? request.body.content
                : '';

        const comment = await updateArticleComment({
            commentId,
            userId,
            content,
        });

        return response.status(200).json({
            comment,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteArticleCommentController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const commentId = Number(request.params.commentId);
        const userId = Number(response.locals.userId);

        await deleteArticleComment(commentId, userId);

        return response.status(204).send();
    } catch (error) {
        next(error);
    }
};