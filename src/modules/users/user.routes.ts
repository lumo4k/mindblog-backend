import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { uploadProfileImage } from '../../middlewares/upload-profile-image';
import {
    createUserController,
    getUserProfileImageController,
    updateUserProfileController,
} from './user.controller';
import { getMyArticlesController } from '../articles/article.controller';

export const userRouter = Router();

userRouter.post('/', createUserController);

userRouter.patch(
    '/profile',
    authenticate,
    uploadProfileImage.single('profileImage'),
    updateUserProfileController,
);

userRouter.get(
    '/me/articles',
    authenticate,
    getMyArticlesController,
);

userRouter.get(
    '/:userId/profile-image',
    getUserProfileImageController,
);