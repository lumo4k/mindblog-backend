import { AppError } from '../../errors/app-error';
import { prisma } from '../../lib/prisma';

interface CreateArticleInput {
    authorId: number;
    categoryId: number;
    title: string;
    summary: string;
    content: string;
    tags: string[];
    coverImage?: Buffer;
    coverImageMimeType?: string;
}

interface UpdateArticleInput {
    articleId: number;
    authorId: number;
    title: string;
    summary: string;
    content: string;
    categoryId: number;
    tags: string[];
    coverImage?: Buffer;
    coverImageMimeType?: string;
}

interface PreparedTag {
    name: string;
    normalizedName: string;
}

interface CreateArticleCommentInput {
    articleId: number;
    userId: number;
    content: string;
}

interface UpdateArticleCommentInput {
    commentId: number;
    userId: number;
    content: string;
}

function calculateReadingTime(content: string) {
    const wordCount = content
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

    return Math.max(1, Math.ceil(wordCount / 200));
}

function normalizeTagName(tag: string) {
    return tag.trim().replace(/\s+/g, ' ');
}

function createNormalizedTagName(tag: string) {
    return tag
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function prepareTags(tags: string[]): PreparedTag[] {
    if (!Array.isArray(tags)) {
        throw new AppError('As tags devem ser enviadas em uma lista', 400);
    }

    if (tags.length > 10) {
        throw new AppError(
            'O artigo pode possuir no máximo 10 tags',
            400,
        );
    }

    const uniqueTags = new Map<string, PreparedTag>();

    for (const tag of tags) {
        if (typeof tag !== 'string') {
            throw new AppError('Todas as tags devem ser textos', 400);
        }

        const name = normalizeTagName(tag);

        if (name.length < 2) {
            throw new AppError(
                'Cada tag deve possuir pelo menos 2 caracteres',
                400,
            );
        }

        if (name.length > 30) {
            throw new AppError(
                'Cada tag deve possuir no máximo 30 caracteres',
                400,
            );
        }

        const normalizedName = createNormalizedTagName(name);

        if (!uniqueTags.has(normalizedName)) {
            uniqueTags.set(normalizedName, {
                name,
                normalizedName,
            });
        }
    }

    return Array.from(uniqueTags.values());
}

export async function createArticle({
    authorId,
    categoryId,
    title,
    summary,
    content,
    tags,
    coverImage,
    coverImageMimeType,
}: CreateArticleInput) {
    const normalizedTitle = title.trim();
    const normalizedSummary = summary.trim();
    const normalizedContent = content.trim();

    if (!Number.isInteger(authorId) || authorId <= 0) {
        throw new AppError('Autor inválido', 400);
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new AppError('Categoria inválida', 400);
    }

    if (!normalizedTitle) {
        throw new AppError('Informe o título do artigo', 400);
    }

    if (normalizedTitle.length > 180) {
        throw new AppError(
            'O título deve possuir no máximo 180 caracteres',
            400,
        );
    }

    if (!normalizedSummary) {
        throw new AppError('Informe o resumo do artigo', 400);
    }

    if (normalizedSummary.length > 120) {
        throw new AppError(
            'O resumo deve possuir no máximo 120 caracteres',
            400,
        );
    }

    if (!normalizedContent) {
        throw new AppError('Informe o conteúdo do artigo', 400);
    }

    if (normalizedContent.length > 8000) {
        throw new AppError(
            'O conteúdo deve possuir no máximo 8.000 caracteres',
            400,
        );
    }

    if (!coverImage || !coverImageMimeType) {
        throw new AppError('Envie uma imagem de capa', 400);
    }

    const preparedTags = prepareTags(tags);

    const coverImageBytes: Uint8Array<ArrayBuffer> =
        Uint8Array.from(coverImage);

    const article = await prisma.$transaction(async (transaction) => {
        const category = await transaction.category.findFirst({
            where: {
                id: categoryId,
                isActive: true,
            },
            select: {
                id: true,
            },
        });

        if (!category) {
            throw new AppError(
                'Categoria não encontrada ou inativa',
                404,
            );
        }

        const createdArticle = await transaction.article.create({
            data: {
                title: normalizedTitle,
                summary: normalizedSummary,
                content: normalizedContent,
                coverImage: coverImageBytes,
                coverImageMimeType,
                authorId,
                categoryId,
            },
            select: {
                id: true,
            },
        });

        for (const [index, preparedTag] of preparedTags.entries()) {
            const tag = await transaction.tag.upsert({
                where: {
                    normalizedName: preparedTag.normalizedName,
                },
                update: {},
                create: {
                    name: preparedTag.name,
                    normalizedName: preparedTag.normalizedName,
                },
                select: {
                    id: true,
                },
            });

            await transaction.articleTag.create({
                data: {
                    articleId: createdArticle.id,
                    tagId: tag.id,
                    position: index + 1,
                },
            });
        }

        return transaction.article.findUniqueOrThrow({
            where: {
                id: createdArticle.id,
            },
            select: {
                id: true,
                title: true,
                summary: true,
                content: true,
                viewCount: true,
                coverImageMimeType: true,

                author: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },

                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },

                tags: {
                    orderBy: {
                        position: 'asc',
                    },
                    select: {
                        position: true,
                        tag: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },

                createdAt: true,
                updatedAt: true,
            },
        });
    });

    return {
        id: article.id,
        title: article.title,
        summary: article.summary,
        content: article.content,
        viewCount: article.viewCount,
        hasCoverImage: Boolean(article.coverImageMimeType),
        author: article.author,
        category: article.category,
        tags: article.tags.map(({ tag }) => tag),
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
    };
}

export async function getArticleCoverImage(articleId: number) {
    if (!Number.isInteger(articleId) || articleId <= 0) {
        throw new AppError('Artigo inválido', 400);
    }

    const article = await prisma.article.findUnique({
        where: {
            id: articleId,
        },
        select: {
            coverImage: true,
            coverImageMimeType: true,
        },
    });

    if (!article) {
        throw new AppError('Artigo não encontrado', 404);
    }

    return {
        image: article.coverImage,
        mimeType: article.coverImageMimeType,
    };
}

export async function getRecentArticles() {
    return prisma.article.findMany({
        take: 9,

        orderBy: {
            createdAt: 'desc',
        },

        select: {
            id: true,
            title: true,
            summary: true,
            createdAt: true,

            author: {
                select: {
                    id: true,
                    fullName: true,
                },
            },

            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
}

export async function likeArticle(
    userId: number,
    articleId: number,
) {
    if (!Number.isInteger(articleId) || articleId <= 0) {
        throw new AppError('Artigo inválido', 400);
    }

    const article = await prisma.article.findUnique({
        where: {
            id: articleId,
        },
        select: {
            id: true,
        },
    });

    if (!article) {
        throw new AppError('Artigo não encontrado', 404);
    }

    const existingLike = await prisma.articleLike.findUnique({
        where: {
            userId_articleId: {
                userId,
                articleId,
            },
        },
        select: {
            userId: true,
        },
    });

    if (existingLike) {
        throw new AppError('Você já curtiu este artigo', 409);
    }

    await prisma.articleLike.create({
        data: {
            userId,
            articleId,
        },
    });

    const likeCount = await prisma.articleLike.count({
        where: {
            articleId,
        },
    });

    return {
        articleId,
        liked: true,
        likeCount,
    };
}

export async function unlikeArticle(
    userId: number,
    articleId: number,
) {
    if (!Number.isInteger(articleId) || articleId <= 0) {
        throw new AppError('Artigo inválido', 400);
    }

    const existingLike = await prisma.articleLike.findUnique({
        where: {
            userId_articleId: {
                userId,
                articleId,
            },
        },
        select: {
            userId: true,
        },
    });

    if (!existingLike) {
        throw new AppError('Você ainda não curtiu este artigo', 404);
    }

    await prisma.articleLike.delete({
        where: {
            userId_articleId: {
                userId,
                articleId,
            },
        },
    });

    const likeCount = await prisma.articleLike.count({
        where: {
            articleId,
        },
    });

    return {
        articleId,
        liked: false,
        likeCount,
    };
}

export async function getMostLikedArticles() {
    const articles = await prisma.article.findMany({
        take: 6,

        where: {
            likes: {
                some: {},
            },
        },

        orderBy: [
            {
                likes: {
                    _count: 'desc',
                },
            },
            {
                createdAt: 'desc',
            },
        ],

        select: {
            id: true,
            title: true,
            summary: true,
            createdAt: true,

            author: {
                select: {
                    id: true,
                    fullName: true,
                },
            },

            category: {
                select: {
                    id: true,
                    name: true,
                },
            },

            _count: {
                select: {
                    likes: true,
                },
            },
        },
    });

    return articles.map((article) => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        createdAt: article.createdAt,
        author: article.author,
        category: article.category,
        likeCount: article._count.likes,
    }));
}

export async function getArticleDetails(articleId: number) {
    if (!Number.isInteger(articleId) || articleId <= 0) {
        throw new AppError('Artigo inválido', 400);
    }

    const existingArticle = await prisma.article.findUnique({
        where: {
            id: articleId,
        },
        select: {
            id: true,
        },
    });

    if (!existingArticle) {
        throw new AppError('Artigo não encontrado', 404);
    }

    const article = await prisma.article.update({
        where: {
            id: articleId,
        },

        data: {
            viewCount: {
                increment: 1,
            },
        },

        select: {
            id: true,
            title: true,
            summary: true,
            content: true,
            viewCount: true,
            coverImageMimeType: true,
            createdAt: true,
            updatedAt: true,

            author: {
                select: {
                    id: true,
                    fullName: true,
                    bio: true,
                    profileImageMimeType: true,
                },
            },

            category: {
                select: {
                    id: true,
                    name: true,
                },
            },

            tags: {
                orderBy: {
                    position: 'asc',
                },

                select: {
                    tag: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },

            _count: {
                select: {
                    likes: true,
                    comments: true,
                },
            },
        },
    });

    return {
        id: article.id,
        title: article.title,
        summary: article.summary,
        content: article.content,
        viewCount: article.viewCount,
        likeCount: article._count.likes,
        commentCount: article._count.comments,
        readingTimeMinutes: calculateReadingTime(article.content),

        coverImageUrl: article.coverImageMimeType
            ? `/api/articles/${article.id}/cover-image`
            : null,

        author: {
            id: article.author.id,
            fullName: article.author.fullName,
            bio: article.author.bio,

            profileImageUrl: article.author.profileImageMimeType
                ? `/api/users/${article.author.id}/profile-image`
                : null,
        },

        category: article.category,

        tags: article.tags.map(({ tag }) => tag),

        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
    };
}

export async function updateArticle({
    articleId,
    authorId,
    title,
    summary,
    content,
    categoryId,
    tags,
    coverImage,
    coverImageMimeType,
}: UpdateArticleInput) {
    if (!Number.isInteger(articleId) || articleId <= 0) {
        throw new AppError('Artigo inválido', 400);
    }

    if (!Number.isInteger(authorId) || authorId <= 0) {
        throw new AppError('Usuário inválido', 400);
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new AppError('Categoria inválida', 400);
    }

    const normalizedTitle = title.trim();
    const normalizedSummary = summary.trim();
    const normalizedContent = content.trim();

    if (!normalizedTitle) {
        throw new AppError('O título é obrigatório', 400);
    }

    if (normalizedTitle.length > 180) {
        throw new AppError(
            'O título deve possuir no máximo 180 caracteres',
            400,
        );
    }

    if (!normalizedSummary) {
        throw new AppError('O resumo é obrigatório', 400);
    }

    if (normalizedSummary.length > 120) {
        throw new AppError(
            'O resumo deve possuir no máximo 120 caracteres',
            400,
        );
    }

    if (!normalizedContent) {
        throw new AppError('O conteúdo é obrigatório', 400);
    }

    if (normalizedContent.length > 8000) {
        throw new AppError(
            'O conteúdo deve possuir no máximo 8000 caracteres',
            400,
        );
    }

    const preparedTags = prepareTags(tags);

    return prisma.$transaction(async (transaction) => {
        const existingArticle = await transaction.article.findUnique({
            where: {
                id: articleId,
            },
            select: {
                id: true,
                authorId: true,
            },
        });

        if (!existingArticle) {
            throw new AppError('Artigo não encontrado', 404);
        }

        if (existingArticle.authorId !== authorId) {
            throw new AppError(
                'Você não possui permissão para editar este artigo',
                403,
            );
        }

        const category = await transaction.category.findFirst({
            where: {
                id: categoryId,
                isActive: true,
            },
            select: {
                id: true,
            },
        });

        if (!category) {
            throw new AppError('Categoria não encontrada ou inativa', 400);
        }

        await transaction.article.update({
            where: {
                id: articleId,
            },

            data: {
                title: normalizedTitle,
                summary: normalizedSummary,
                content: normalizedContent,
                categoryId,

                ...(coverImage && coverImageMimeType
                    ? {
                        coverImage: Uint8Array.from(coverImage),
                        coverImageMimeType,
                    }
                    : {}),
            },
        });

        await transaction.articleTag.deleteMany({
            where: {
                articleId,
            },
        });

        for (const [position, tag] of preparedTags.entries()) {
            const savedTag = await transaction.tag.upsert({
                where: {
                    normalizedName: tag.normalizedName,
                },

                update: {
                    name: tag.name,
                },

                create: {
                    name: tag.name,
                    normalizedName: tag.normalizedName,
                },
            });

            await transaction.articleTag.create({
                data: {
                    articleId,
                    tagId: savedTag.id,
                    position,
                },
            });
        }

        const updatedArticle = await transaction.article.findUnique({
            where: {
                id: articleId,
            },

            select: {
                id: true,
                title: true,
                summary: true,
                content: true,
                viewCount: true,
                coverImageMimeType: true,
                createdAt: true,
                updatedAt: true,

                author: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },

                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },

                tags: {
                    orderBy: {
                        position: 'asc',
                    },

                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },

                _count: {
                    select: {
                        likes: true,
                    },
                },
            },
        });

        if (!updatedArticle) {
            throw new AppError('Artigo não encontrado', 404);
        }

        return {
            id: updatedArticle.id,
            title: updatedArticle.title,
            summary: updatedArticle.summary,
            content: updatedArticle.content,
            viewCount: updatedArticle.viewCount,
            likeCount: updatedArticle._count.likes,

            coverImageUrl: updatedArticle.coverImageMimeType
                ? `/api/articles/${updatedArticle.id}/cover-image`
                : null,

            author: updatedArticle.author,
            category: updatedArticle.category,

            tags: updatedArticle.tags.map(({ tag }) => tag),

            createdAt: updatedArticle.createdAt,
            updatedAt: updatedArticle.updatedAt,
        };
    });
}

export async function deleteArticle(
    articleId: number,
    authorId: number,
) {
    if (!Number.isInteger(articleId) || articleId <= 0) {
        throw new AppError('Artigo inválido', 400);
    }

    if (!Number.isInteger(authorId) || authorId <= 0) {
        throw new AppError('Usuário inválido', 400);
    }

    const article = await prisma.article.findUnique({
        where: {
            id: articleId,
        },
        select: {
            id: true,
            authorId: true,
        },
    });

    if (!article) {
        throw new AppError('Artigo não encontrado', 404);
    }

    if (article.authorId !== authorId) {
        throw new AppError(
            'Você não possui permissão para excluir este artigo',
            403,
        );
    }

    await prisma.article.delete({
        where: {
            id: articleId,
        },
    });
}

export async function createArticleComment({
    articleId,
    userId,
    content,
}: CreateArticleCommentInput) {
    if (!Number.isInteger(articleId) || articleId <= 0) {
        throw new AppError('Artigo inválido', 400);
    }

    if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError('Usuário inválido', 400);
    }

    const normalizedContent = content.trim();

    if (!normalizedContent) {
        throw new AppError('O comentário não pode estar vazio', 400);
    }

    if (normalizedContent.length > 1000) {
        throw new AppError(
            'O comentário deve possuir no máximo 1000 caracteres',
            400,
        );
    }

    const article = await prisma.article.findUnique({
        where: {
            id: articleId,
        },
        select: {
            id: true,
        },
    });

    if (!article) {
        throw new AppError('Artigo não encontrado', 404);
    }

    const comment = await prisma.articleComment.create({
        data: {
            articleId,
            userId,
            content: normalizedContent,
        },

        select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,

            user: {
                select: {
                    id: true,
                    fullName: true,
                    profileImageMimeType: true,
                },
            },

            _count: {
                select: {
                    likes: true,
                },
            },
        },
    });

    return {
        id: comment.id,
        content: comment.content,

        user: {
            id: comment.user.id,
            fullName: comment.user.fullName,

            profileImageUrl: comment.user.profileImageMimeType
                ? `/api/users/${comment.user.id}/profile-image`
                : null,
        },

        likeCount: comment._count.likes,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
    };
}

export async function getArticleComments(articleId: number) {
    if (!Number.isInteger(articleId) || articleId <= 0) {
        throw new AppError('Artigo inválido', 400);
    }

    const article = await prisma.article.findUnique({
        where: {
            id: articleId,
        },
        select: {
            id: true,
        },
    });

    if (!article) {
        throw new AppError('Artigo não encontrado', 404);
    }

    const comments = await prisma.articleComment.findMany({
        where: {
            articleId,
        },

        orderBy: {
            createdAt: 'desc',
        },

        select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,

            user: {
                select: {
                    id: true,
                    fullName: true,
                    profileImageMimeType: true,
                },
            },

            _count: {
                select: {
                    likes: true,
                },
            },
        },
    });

    return comments.map((comment) => ({
        id: comment.id,
        content: comment.content,

        user: {
            id: comment.user.id,
            fullName: comment.user.fullName,

            profileImageUrl: comment.user.profileImageMimeType
                ? `/api/users/${comment.user.id}/profile-image`
                : null,
        },

        likeCount: comment._count.likes,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
    }));
}

export async function likeComment(
    userId: number,
    commentId: number,
) {
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError('Usuário inválido', 400);
    }

    if (!Number.isInteger(commentId) || commentId <= 0) {
        throw new AppError('Comentário inválido', 400);
    }

    const comment = await prisma.articleComment.findUnique({
        where: {
            id: commentId,
        },
        select: {
            id: true,
        },
    });

    if (!comment) {
        throw new AppError('Comentário não encontrado', 404);
    }

    const existingLike = await prisma.commentLike.findUnique({
        where: {
            userId_commentId: {
                userId,
                commentId,
            },
        },
        select: {
            userId: true,
        },
    });

    if (existingLike) {
        throw new AppError(
            'Você já curtiu este comentário',
            409,
        );
    }

    await prisma.commentLike.create({
        data: {
            userId,
            commentId,
        },
    });

    const likeCount = await prisma.commentLike.count({
        where: {
            commentId,
        },
    });

    return {
        commentId,
        liked: true,
        likeCount,
    };
}

export async function unlikeComment(
    userId: number,
    commentId: number,
) {
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError('Usuário inválido', 400);
    }

    if (!Number.isInteger(commentId) || commentId <= 0) {
        throw new AppError('Comentário inválido', 400);
    }

    const comment = await prisma.articleComment.findUnique({
        where: {
            id: commentId,
        },
        select: {
            id: true,
        },
    });

    if (!comment) {
        throw new AppError('Comentário não encontrado', 404);
    }

    const existingLike = await prisma.commentLike.findUnique({
        where: {
            userId_commentId: {
                userId,
                commentId,
            },
        },
        select: {
            userId: true,
        },
    });

    if (!existingLike) {
        throw new AppError(
            'Você ainda não curtiu este comentário',
            404,
        );
    }

    await prisma.commentLike.delete({
        where: {
            userId_commentId: {
                userId,
                commentId,
            },
        },
    });

    const likeCount = await prisma.commentLike.count({
        where: {
            commentId,
        },
    });

    return {
        commentId,
        liked: false,
        likeCount,
    };
}

export async function updateArticleComment({
    commentId,
    userId,
    content,
}: UpdateArticleCommentInput) {
    if (!Number.isInteger(commentId) || commentId <= 0) {
        throw new AppError('Comentário inválido', 400);
    }

    if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError('Usuário inválido', 400);
    }

    const normalizedContent = content.trim();

    if (!normalizedContent) {
        throw new AppError('O comentário não pode estar vazio', 400);
    }

    if (normalizedContent.length > 1000) {
        throw new AppError(
            'O comentário deve possuir no máximo 1000 caracteres',
            400,
        );
    }

    const existingComment =
        await prisma.articleComment.findUnique({
            where: {
                id: commentId,
            },
            select: {
                id: true,
                userId: true,
            },
        });

    if (!existingComment) {
        throw new AppError('Comentário não encontrado', 404);
    }

    if (existingComment.userId !== userId) {
        throw new AppError(
            'Você não possui permissão para editar este comentário',
            403,
        );
    }

    const comment = await prisma.articleComment.update({
        where: {
            id: commentId,
        },

        data: {
            content: normalizedContent,
        },

        select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,

            user: {
                select: {
                    id: true,
                    fullName: true,
                    profileImageMimeType: true,
                },
            },

            _count: {
                select: {
                    likes: true,
                },
            },
        },
    });

    return {
        id: comment.id,
        content: comment.content,

        user: {
            id: comment.user.id,
            fullName: comment.user.fullName,

            profileImageUrl: comment.user.profileImageMimeType
                ? `/api/users/${comment.user.id}/profile-image`
                : null,
        },

        likeCount: comment._count.likes,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
    };
}

export async function deleteArticleComment(
    commentId: number,
    userId: number,
) {
    if (!Number.isInteger(commentId) || commentId <= 0) {
        throw new AppError('Comentário inválido', 400);
    }

    if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError('Usuário inválido', 400);
    }

    const comment = await prisma.articleComment.findUnique({
        where: {
            id: commentId,
        },
        select: {
            id: true,
            userId: true,
        },
    });

    if (!comment) {
        throw new AppError('Comentário não encontrado', 404);
    }

    if (comment.userId !== userId) {
        throw new AppError(
            'Você não possui permissão para excluir este comentário',
            403,
        );
    }

    await prisma.articleComment.delete({
        where: {
            id: commentId,
        },
    });
}

export async function getMyArticles(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError('Usuário inválido', 400);
    }

    const articles = await prisma.article.findMany({
        where: {
            authorId: userId,
        },

        orderBy: {
            createdAt: 'desc',
        },

        select: {
            id: true,
            title: true,
            summary: true,
            viewCount: true,
            coverImageMimeType: true,
            createdAt: true,
            updatedAt: true,

            category: {
                select: {
                    id: true,
                    name: true,
                },
            },

            _count: {
                select: {
                    likes: true,
                    comments: true,
                },
            },
        },
    });

    return articles.map((article) => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        viewCount: article.viewCount,
        likeCount: article._count.likes,
        commentCount: article._count.comments,

        coverImageUrl: article.coverImageMimeType
            ? `/api/articles/${article.id}/cover-image`
            : null,

        category: article.category,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
    }));
}