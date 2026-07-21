import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { errorHandler } from './middlewares/error-handler';
import { router } from './routes/index';

export const app = express();

app.use(helmet());

app.use(
    cors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
        credentials: true,
    }),
);

app.use(express.json());

app.use(router);

app.use(errorHandler);