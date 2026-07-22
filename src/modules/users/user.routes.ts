import { Router } from 'express';

import { createUserController } from './user.controller';

export const userRouter = Router();

userRouter.post('/', createUserController);