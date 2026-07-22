import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import {
    authenticatedUserController,
    loginController,
    logoutController,
} from './auth.controller';

export const authRouter = Router();

authRouter.post('/login', loginController);

authRouter.get(
    '/me',
    authenticate,
    authenticatedUserController,
);

authRouter.post('/logout', logoutController);