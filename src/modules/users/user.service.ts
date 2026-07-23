import bcrypt from 'bcrypt';

import { AppError } from '../../errors/app-error';
import { prisma } from '../../lib/prisma';

interface CreateUserInput {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const SALT_ROUNDS = 10;

export async function createUser({
    fullName,
    email,
    password,
    confirmPassword,
}: CreateUserInput) {
    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedFullName || !normalizedEmail || !password) {
        throw new AppError('Preencha todos os campos obrigatórios', 400);
    }

    if (password !== confirmPassword) {
        throw new AppError('As senhas não coincidem', 400);
    }

    if (password.length < 8) {
        throw new AppError('A senha deve possuir pelo menos 8 caracteres', 400);
    }

    const userWithSameEmail = await prisma.user.findUnique({
        where: {
            email: normalizedEmail,
        },
    });

    if (userWithSameEmail) {
        throw new AppError('E-mail já cadastrado', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            fullName: normalizedFullName,
            email: normalizedEmail,
            passwordHash,
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
}

interface UpdateUserProfileInput {
    userId: number;
    fullName?: string;
    bio?: string;
    profileImage?: Buffer;
    profileImageMimeType?: string;
}

export async function updateUserProfile({
    userId,
    fullName,
    bio,
    profileImage,
    profileImageMimeType,
}: UpdateUserProfileInput) {
    const userExists = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
        },
    });

    if (!userExists) {
        throw new AppError('Usuário não encontrado', 404);
    }

    const normalizedFullName =
        typeof fullName === 'string' ? fullName.trim() : undefined;

    const normalizedBio =
        typeof bio === 'string' ? bio.trim() : undefined;

    const profileImageBytes:
        | Uint8Array<ArrayBuffer>
        | undefined = profileImage
            ? Uint8Array.from(profileImage)
            : undefined;

    if (fullName !== undefined && !normalizedFullName) {
        throw new AppError('O nome completo não pode ficar vazio', 400);
    }

    const hasProfileImage = Boolean(
        profileImageBytes && profileImageMimeType,
    );

    const hasChanges =
        normalizedFullName !== undefined ||
        normalizedBio !== undefined ||
        hasProfileImage;

    if (!hasChanges) {
        throw new AppError('Nenhuma alteração foi enviada', 400);
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            ...(normalizedFullName !== undefined && {
                fullName: normalizedFullName,
            }),

            ...(normalizedBio !== undefined && {
                bio: normalizedBio || null,
            }),

            ...(hasProfileImage && {
                profileImage: profileImageBytes,
                profileImageMimeType,
            }),
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            bio: true,
            profileImageMimeType: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        bio: updatedUser.bio,
        hasProfileImage: Boolean(
            updatedUser.profileImageMimeType,
        ),
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
    };
}

export async function getUserProfileImage(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError('Usuário inválido', 400);
    }

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            profileImage: true,
            profileImageMimeType: true,
        },
    });

    if (!user) {
        throw new AppError('Usuário não encontrado', 404);
    }

    if (!user.profileImage || !user.profileImageMimeType) {
        throw new AppError('Usuário não possui foto de perfil', 404);
    }

    return {
        image: user.profileImage,
        mimeType: user.profileImageMimeType,
    };
}

function calculateReadingTime(content: string) {
    const wordCount = content
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

    return Math.max(1, Math.ceil(wordCount / 200));
}

export async function getMyDashboardMetrics(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError('Usuário inválido', 400);
    }

    const [
        articles,
        likeCount,
        engagementCount,
    ] = await prisma.$transaction([
        prisma.article.findMany({
            where: {
                authorId: userId,
            },

            select: {
                content: true,
            },
        }),

        prisma.articleLike.count({
            where: {
                article: {
                    is: {
                        authorId: userId,
                    },
                },
            },
        }),

        prisma.articleComment.count({
            where: {
                article: {
                    is: {
                        authorId: userId,
                    },
                },
            },
        }),
    ]);

    const articleCount = articles.length;

    const totalReadingTime = articles.reduce(
        (total, article) =>
            total + calculateReadingTime(article.content),
        0,
    );

    const averageReadingTimeMinutes =
        articleCount === 0
            ? 0
            : Math.round(totalReadingTime / articleCount);

    return {
        articleCount,
        engagementCount,
        likeCount,
        averageReadingTimeMinutes,
    };
}