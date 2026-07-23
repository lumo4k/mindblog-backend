import type { RequestHandler } from 'express';

import {
    createUser,
    getUserProfileImage,
    updateUserProfile,
    getMyDashboardMetrics,
} from './user.service';

export const createUserController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const {
            fullName,
            email,
            password,
            confirmPassword,
        } = request.body ?? {};

        const user = await createUser({
            fullName: typeof fullName === 'string' ? fullName : '',
            email: typeof email === 'string' ? email : '',
            password: typeof password === 'string' ? password : '',
            confirmPassword:
                typeof confirmPassword === 'string' ? confirmPassword : '',
        });

        return response.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const updateUserProfileController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const userId = Number(response.locals.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            throw new Error(
                'ID do usuário não foi definido pelo middleware de autenticação',
            );
        }

        const { fullName, bio } = request.body ?? {};

        const user = await updateUserProfile({
            userId,

            fullName:
                typeof fullName === 'string'
                    ? fullName
                    : undefined,

            bio:
                typeof bio === 'string'
                    ? bio
                    : undefined,

            profileImage: request.file?.buffer,
            profileImageMimeType: request.file?.mimetype,
        });

        return response.status(200).json({
            message: 'Perfil atualizado com sucesso',
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const getUserProfileImageController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const userId = Number(request.params.userId);

        const { image, mimeType } = await getUserProfileImage(userId);

        const imageBuffer = Buffer.from(image);

        response.setHeader('Content-Type', mimeType);
        response.setHeader('Content-Length', imageBuffer.length);
        response.setHeader(
            'Cache-Control',
            'public, max-age=3600',
        );

        return response.status(200).send(imageBuffer);
    } catch (error) {
        next(error);
    }
};

export const getMyDashboardMetricsController: RequestHandler = async (
    _request,
    response,
    next,
) => {
    try {
        const userId = Number(response.locals.userId);

        const metrics = await getMyDashboardMetrics(userId);

        return response.status(200).json({
            metrics,
        });
    } catch (error) {
        next(error);
    }
};