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