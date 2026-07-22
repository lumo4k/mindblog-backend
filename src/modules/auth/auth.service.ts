import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { AppError } from '../../errors/app-error';
import { prisma } from '../../lib/prisma';

interface LoginInput {
    email: string;
    password: string;
}

export async function loginUser({ email, password }: LoginInput) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
        throw new AppError('Informe o e-mail e a senha', 400);
    }

    const user = await prisma.user.findUnique({
        where: {
            email: normalizedEmail,
        },
    });

    if (!user) {
        throw new AppError('E-mail ou senha inválidos', 401);
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.passwordHash,
    );

    if (!passwordMatches) {
        throw new AppError('E-mail ou senha inválidos', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error('A variável JWT_SECRET não foi configurada');
    }

    const expiresIn = (
        process.env.JWT_EXPIRES_IN ?? '7d'
    ) as SignOptions['expiresIn'];

    const token = jwt.sign(
        {},
        jwtSecret,
        {
            subject: String(user.id),
            expiresIn,
        },
    );

    return {
        token,
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            bio: user.bio,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
    };
}

export async function getAuthenticatedUser(userId: number) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
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

    if (!user) {
        throw new AppError('Sessão inválida', 401);
    }

    return user;
}