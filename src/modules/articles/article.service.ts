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

interface PreparedTag {
    name: string;
    normalizedName: string;
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