import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { errorHandler } from './middlewares/error-handler';
import { notFoundHandler } from './middlewares/not-found';
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
app.use(cookieParser());

app.use('/api', router);

app.use(notFoundHandler);

app.use(errorHandler);