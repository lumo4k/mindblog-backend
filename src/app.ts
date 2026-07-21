import cors from 'cors';
import express from 'express';

import { router } from './routes/index';

export const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
        credentials: true,
    }),
);

app.use(express.json());

app.use(router);